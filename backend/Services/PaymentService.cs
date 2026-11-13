using System.Globalization;
using System.Net;
using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using backend.Data;
using backend.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.WebUtilities;
using MongoDB.Driver;

namespace backend.Services;

public sealed class PaymentService(
    HttpClient httpClient,
    IConfiguration configuration,
    MongoStoreDatabase database,
    ILogger<PaymentService> logger) : IPaymentService
{
    private static readonly TimeSpan VietnamOffset = TimeSpan.FromHours(7);
    private const string VnPayMethod = "vnpay";
    private const string ZaloPayMethod = "zalopay";

    public PaymentOptionsResponse GetOptions()
    {
        var bankTransfer = GetBankTransferDetails();
        return new PaymentOptionsResponse(
        [
            new("cod", "Thanh toán khi nhận hàng", "Thanh toán tiền mặt sau khi nhận sản phẩm.", true, null),
            new("bank_transfer", "Chuyển khoản ngân hàng", "Chuyển khoản theo thông tin và nội dung đơn hàng.", bankTransfer is not null,
                bankTransfer is null ? "Cửa hàng chưa cấu hình tài khoản nhận chuyển khoản." : null),
            new(VnPayMethod, "VNPay", "Thanh toán trực tuyến qua cổng VNPay.", IsVnPayConfigured(),
                IsVnPayConfigured() ? null : "Cổng VNPay chưa được cấu hình đầy đủ."),
            new(ZaloPayMethod, "ZaloPay", "Thanh toán trực tuyến qua cổng ZaloPay.", IsZaloPayConfigured(),
                IsZaloPayConfigured() ? null : "Cổng ZaloPay chưa được cấu hình đầy đủ.")
        ],
        bankTransfer);
    }

    public bool IsMethodEnabled(string method) =>
        GetOptions().Methods.Any(option => option.Code == method && option.Enabled);

    public async Task<PaymentCheckoutResponse> CreateCheckoutAsync(
        OrderDocument order,
        string? clientIpAddress,
        CancellationToken cancellationToken)
    {
        if (order.PaymentStatus == "paid" || order.Status is "cancelled" or "completed")
        {
            throw new PaymentUnavailableException("Đơn hàng không còn ở trạng thái có thể thanh toán.");
        }

        return order.PaymentMethod switch
        {
            VnPayMethod => await CreateVnPayCheckoutAsync(order, clientIpAddress, cancellationToken),
            ZaloPayMethod => await CreateZaloPayCheckoutAsync(order, cancellationToken),
            _ => throw new PaymentUnavailableException("Đơn hàng không sử dụng cổng thanh toán trực tuyến.")
        };
    }

    public async Task<VnPayProcessResult> ProcessVnPayCallbackAsync(
        IQueryCollection query,
        CancellationToken cancellationToken)
    {
        var secret = configuration["Payments:VnPay:HashSecret"];
        var suppliedHash = query["vnp_SecureHash"].ToString();
        if (string.IsNullOrWhiteSpace(secret) || !VerifyVnPayHash(query, secret, suppliedHash))
        {
            return new("97", "Invalid signature", null, "failed");
        }

        if (!string.Equals(query["vnp_TmnCode"].ToString(), configuration["Payments:VnPay:TmnCode"], StringComparison.Ordinal))
        {
            return new("97", "Invalid merchant", null, "failed");
        }

        var transactionReference = query["vnp_TxnRef"].ToString();
        var order = await database.Orders.Find(current => current.Id == transactionReference)
            .FirstOrDefaultAsync(cancellationToken);
        if (order is null || order.PaymentMethod != VnPayMethod)
        {
            return new("01", "Order not found", null, "failed");
        }

        if (query["vnp_CurrCode"] != "VND"
            || !TryGetVnPayAmount(query, out var paidAmount)
            || paidAmount != order.Total * 100)
        {
            return new("04", "Invalid amount", order.OrderNumber, "failed");
        }

        var succeeded = query["vnp_ResponseCode"] == "00" && query["vnp_TransactionStatus"] == "00";
        if (order.PaymentStatus == "paid")
        {
            return new("00", "Confirm Success", order.OrderNumber, "success");
        }

        var status = succeeded ? "paid" : "failed";
        var providerTransactionId = query["vnp_TransactionNo"].ToString();
        var update = Builders<OrderDocument>.Update
            .Set(current => current.PaymentStatus, status)
            .Set(current => current.UpdatedAt, DateTime.UtcNow);
        if (!string.IsNullOrWhiteSpace(providerTransactionId))
        {
            update = update.Set(current => current.PaymentProviderTransactionId, providerTransactionId);
        }

        await database.Orders.UpdateOneAsync(
            current => current.Id == order.Id
                && current.PaymentMethod == VnPayMethod
                && current.PaymentStatus != "paid",
            update,
            cancellationToken: cancellationToken);

        return succeeded
            ? new("00", "Confirm Success", order.OrderNumber, "success")
            : new("00", "Confirm Success", order.OrderNumber, "failed");
    }

    public async Task<ZaloPayCallbackResponse> ProcessZaloPayCallbackAsync(
        ZaloPayCallbackRequest callback,
        CancellationToken cancellationToken)
    {
        var key2 = configuration["Payments:ZaloPay:Key2"];
        if (callback.Type != 1
            || string.IsNullOrWhiteSpace(key2)
            || !VerifyHmac("SHA256", key2, callback.Data, callback.Mac))
        {
            return new(2, "Invalid callback");
        }

        ZaloPayOrderCallback? data;
        try
        {
            data = JsonSerializer.Deserialize<ZaloPayOrderCallback>(callback.Data);
        }
        catch (JsonException)
        {
            return new(2, "Invalid callback data");
        }

        if (data is null
            || string.IsNullOrWhiteSpace(data.AppTransId)
            || data.Amount <= 0
            || data.ZpTransId <= 0
            || !int.TryParse(configuration["Payments:ZaloPay:AppId"], out var appId)
            || data.AppId != appId)
        {
            return new(2, "Invalid merchant");
        }

        var order = await database.Orders.Find(current =>
                current.PaymentTransactionId == data.AppTransId
                && current.PaymentMethod == ZaloPayMethod)
            .FirstOrDefaultAsync(cancellationToken);
        if (order is null || data.Amount != order.Total)
        {
            return new(2, "Order not found or amount mismatch");
        }
        if (order.PaymentStatus == "paid")
        {
            return new(1, "Success");
        }

        await database.Orders.UpdateOneAsync(
            current => current.Id == order.Id
                && current.PaymentTransactionId == data.AppTransId
                && current.PaymentMethod == ZaloPayMethod
                && current.PaymentStatus != "paid",
            Builders<OrderDocument>.Update
                .Set(current => current.PaymentStatus, "paid")
                .Set(current => current.PaymentProviderTransactionId, data.ZpTransId.ToString(CultureInfo.InvariantCulture))
                .Set(current => current.UpdatedAt, DateTime.UtcNow),
            cancellationToken: cancellationToken);

        return new(1, "Success");
    }

    private async Task<PaymentCheckoutResponse> CreateVnPayCheckoutAsync(
        OrderDocument order,
        string? clientIpAddress,
        CancellationToken cancellationToken)
    {
        if (!IsVnPayConfigured())
        {
            throw new PaymentUnavailableException("Cổng VNPay chưa được cấu hình đầy đủ.");
        }

        if (order.Total <= 0 || decimal.Truncate(order.Total) != order.Total)
        {
            throw new PaymentUnavailableException("Tổng tiền đơn hàng không hợp lệ để thanh toán VNPay.");
        }

        var now = DateTimeOffset.UtcNow.ToOffset(VietnamOffset);
        var publicApiUrl = configuration["Payments:PublicApiBaseUrl"]!.TrimEnd('/');
        var parameters = new SortedDictionary<string, string>(StringComparer.Ordinal)
        {
            ["vnp_Version"] = "2.1.0",
            ["vnp_Command"] = "pay",
            ["vnp_TmnCode"] = configuration["Payments:VnPay:TmnCode"]!,
            ["vnp_Amount"] = (order.Total * 100).ToString("0", CultureInfo.InvariantCulture),
            ["vnp_CreateDate"] = now.ToString("yyyyMMddHHmmss", CultureInfo.InvariantCulture),
            ["vnp_CurrCode"] = "VND",
            ["vnp_IpAddr"] = NormalizeIpAddress(clientIpAddress),
            ["vnp_Locale"] = "vn",
            ["vnp_OrderInfo"] = $"Thanh toan don hang {order.OrderNumber}",
            ["vnp_OrderType"] = "other",
            ["vnp_ReturnUrl"] = $"{publicApiUrl}/api/payments/vnpay/return",
            ["vnp_TxnRef"] = order.Id,
            ["vnp_ExpireDate"] = now.AddMinutes(15).ToString("yyyyMMddHHmmss", CultureInfo.InvariantCulture)
        };
        var canonical = string.Join("&", parameters.Select(pair => $"{FormEncode(pair.Key)}={FormEncode(pair.Value)}"));
        var signature = ComputeHmac("SHA512", configuration["Payments:VnPay:HashSecret"]!, canonical);
        var query = string.Join("&", parameters.Select(pair => $"{FormEncode(pair.Key)}={FormEncode(pair.Value)}"));
        var paymentUrl = $"{configuration["Payments:VnPay:PaymentUrl"]}?{query}&vnp_SecureHash={signature}";

        var updateResult = await database.Orders.UpdateOneAsync(
            current => current.Id == order.Id
                && current.PaymentStatus != "paid"
                && current.Status != "cancelled"
                && current.Status != "completed",
            Builders<OrderDocument>.Update
                .Set(current => current.PaymentTransactionId, order.Id)
                .Set(current => current.PaymentStatus, "pending")
                .Set(current => current.UpdatedAt, DateTime.UtcNow),
            cancellationToken: cancellationToken);
        if (updateResult.MatchedCount == 0)
        {
            throw new PaymentUnavailableException("Đơn hàng vừa thay đổi trạng thái và không thể thanh toán.");
        }

        return new PaymentCheckoutResponse(paymentUrl);
    }

    private async Task<PaymentCheckoutResponse> CreateZaloPayCheckoutAsync(
        OrderDocument order,
        CancellationToken cancellationToken)
    {
        if (!IsZaloPayConfigured())
        {
            throw new PaymentUnavailableException("Cổng ZaloPay chưa được cấu hình đầy đủ.");
        }
        if (order.Total <= 0 || decimal.Truncate(order.Total) != order.Total)
        {
            throw new PaymentUnavailableException("Tổng tiền đơn hàng không hợp lệ để thanh toán ZaloPay.");
        }

        var now = DateTimeOffset.UtcNow.ToOffset(VietnamOffset);
        var datePrefix = now.ToString("yyMMdd", CultureInfo.InvariantCulture);
        var transactionId = order.PaymentTransactionId?.StartsWith($"{datePrefix}_", StringComparison.Ordinal) == true
            ? order.PaymentTransactionId
            : $"{datePrefix}_{order.Id}";
        var appUser = order.UserId ?? "web-eshop";
        var appTime = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        var embedData = JsonSerializer.Serialize(new
        {
            redirecturl = AddReturnQuery(order.OrderNumber, "pending", ZaloPayMethod)
        });
        const string item = "[]";
        var amount = decimal.ToInt64(order.Total);
        var appId = int.Parse(configuration["Payments:ZaloPay:AppId"]!, CultureInfo.InvariantCulture);
        var signingData = string.Join("|",
            appId.ToString(CultureInfo.InvariantCulture),
            transactionId,
            appUser,
            amount.ToString(CultureInfo.InvariantCulture),
            appTime.ToString(CultureInfo.InvariantCulture),
            embedData,
            item);
        var request = new ZaloPayCreateOrderRequest(
            appId,
            appUser,
            transactionId,
            appTime,
            amount,
            $"Thanh toan don hang {order.OrderNumber}",
            $"{configuration["Payments:PublicApiBaseUrl"]!.TrimEnd('/')}/api/payments/zalopay/callback",
            item,
            embedData,
            ComputeHmac("SHA256", configuration["Payments:ZaloPay:Key1"]!, signingData));

        var updateResult = await database.Orders.UpdateOneAsync(
            current => current.Id == order.Id
                && current.PaymentStatus != "paid"
                && current.Status != "cancelled"
                && current.Status != "completed",
            Builders<OrderDocument>.Update
                .Set(current => current.PaymentTransactionId, transactionId)
                .Set(current => current.PaymentStatus, "pending")
                .Set(current => current.UpdatedAt, DateTime.UtcNow),
            cancellationToken: cancellationToken);
        if (updateResult.MatchedCount == 0)
        {
            throw new PaymentUnavailableException("Đơn hàng vừa thay đổi trạng thái và không thể thanh toán.");
        }

        ZaloPayCreateOrderResponse? response;
        try
        {
            using var providerResponse = await httpClient.PostAsJsonAsync(
                configuration["Payments:ZaloPay:CreateOrderUrl"],
                request,
                cancellationToken);
            if (!providerResponse.IsSuccessStatusCode)
            {
                logger.LogWarning("ZaloPay create-order request failed with HTTP {StatusCode}.", (int)providerResponse.StatusCode);
                throw new PaymentProviderException("Không thể khởi tạo giao dịch ZaloPay. Vui lòng thử lại.");
            }
            response = await providerResponse.Content.ReadFromJsonAsync<ZaloPayCreateOrderResponse>(
                cancellationToken: cancellationToken);
        }
        catch (HttpRequestException exception)
        {
            logger.LogWarning(exception, "ZaloPay create-order request could not reach the provider.");
            throw new PaymentProviderException("Không thể kết nối cổng ZaloPay. Vui lòng thử lại.");
        }
        catch (JsonException exception)
        {
            logger.LogWarning(exception, "ZaloPay returned an invalid create-order response.");
            throw new PaymentProviderException("Cổng ZaloPay trả về phản hồi không hợp lệ.");
        }

        if (response is null
            || response.ReturnCode != 1
            || !Uri.TryCreate(response.OrderUrl, UriKind.Absolute, out var orderUri)
            || orderUri.Scheme != Uri.UriSchemeHttps)
        {
            logger.LogWarning("ZaloPay rejected a create-order request with return code {ReturnCode}.", response?.ReturnCode);
            throw new PaymentProviderException("ZaloPay không chấp nhận tạo giao dịch. Vui lòng thử lại.");
        }

        return new PaymentCheckoutResponse(response.OrderUrl);
    }

    private bool VerifyVnPayHash(IQueryCollection query, string secret, string suppliedHash)
    {
        if (string.IsNullOrWhiteSpace(suppliedHash))
        {
            return false;
        }
        var parameters = query
            .Where(pair => pair.Key.StartsWith("vnp_", StringComparison.Ordinal)
                && pair.Key is not "vnp_SecureHash" and not "vnp_SecureHashType")
            .OrderBy(pair => pair.Key, StringComparer.Ordinal)
            .Select(pair => $"{FormEncode(pair.Key)}={FormEncode(pair.Value.ToString())}");
        var canonical = string.Join("&", parameters);
        return VerifyHmac("SHA512", secret, canonical, suppliedHash);
    }

    private static bool TryGetVnPayAmount(IQueryCollection query, out decimal amount)
    {
        var rawAmount = query["vnp_Amount"].ToString();
        return decimal.TryParse(rawAmount, NumberStyles.None, CultureInfo.InvariantCulture, out amount)
            && amount >= 0;
    }

    private BankTransferDetails? GetBankTransferDetails()
    {
        var bankName = configuration["Payments:BankTransfer:BankName"]?.Trim();
        var accountName = configuration["Payments:BankTransfer:AccountName"]?.Trim();
        var accountNumber = configuration["Payments:BankTransfer:AccountNumber"]?.Trim();
        if (string.IsNullOrWhiteSpace(bankName)
            || string.IsNullOrWhiteSpace(accountName)
            || string.IsNullOrWhiteSpace(accountNumber))
        {
            return null;
        }
        return new BankTransferDetails(
            bankName,
            accountName,
            accountNumber,
            configuration["Payments:BankTransfer:Branch"]);
    }

    private bool IsVnPayConfigured() =>
        IsAbsoluteUrl(configuration["Payments:VnPay:PaymentUrl"])
        && !string.IsNullOrWhiteSpace(configuration["Payments:VnPay:TmnCode"])
        && !string.IsNullOrWhiteSpace(configuration["Payments:VnPay:HashSecret"])
        && IsAbsoluteUrl(configuration["Payments:PublicApiBaseUrl"])
        && IsAbsoluteUrl(configuration["Payments:FrontendReturnUrl"]);

    private bool IsZaloPayConfigured() =>
        IsAbsoluteUrl(configuration["Payments:ZaloPay:CreateOrderUrl"])
        && int.TryParse(configuration["Payments:ZaloPay:AppId"], out _)
        && !string.IsNullOrWhiteSpace(configuration["Payments:ZaloPay:Key1"])
        && !string.IsNullOrWhiteSpace(configuration["Payments:ZaloPay:Key2"])
        && IsAbsoluteUrl(configuration["Payments:PublicApiBaseUrl"])
        && IsAbsoluteUrl(configuration["Payments:FrontendReturnUrl"]);

    private string AddReturnQuery(string orderNumber, string status, string method)
    {
        var returnUrl = configuration["Payments:FrontendReturnUrl"]!;
        return QueryHelpers.AddQueryString(returnUrl, new Dictionary<string, string?>
        {
            ["orderNumber"] = orderNumber,
            ["status"] = status,
            ["paymentMethod"] = method
        });
    }

    private static string NormalizeIpAddress(string? ipAddress)
    {
        var normalized = ipAddress?.Trim();
        if (IPAddress.TryParse(normalized, out var address) && address.IsIPv4MappedToIPv6)
        {
            return address.MapToIPv4().ToString();
        }
        return IPAddress.TryParse(normalized, out _) ? normalized! : "127.0.0.1";
    }

    private static bool IsAbsoluteUrl(string? value) =>
        Uri.TryCreate(value, UriKind.Absolute, out var uri)
        && uri.Scheme == Uri.UriSchemeHttps;

    private static string FormEncode(string value) => WebUtility.UrlEncode(value);

    private static string ComputeHmac(string algorithm, string key, string data)
    {
        var keyBytes = Encoding.UTF8.GetBytes(key);
        var dataBytes = Encoding.UTF8.GetBytes(data);
        var hash = algorithm == "SHA512"
            ? HMACSHA512.HashData(keyBytes, dataBytes)
            : HMACSHA256.HashData(keyBytes, dataBytes);
        return Convert.ToHexString(hash).ToLowerInvariant();
    }

    private static bool VerifyHmac(string algorithm, string key, string data, string suppliedHash)
    {
        try
        {
            var expectedBytes = Convert.FromHexString(ComputeHmac(algorithm, key, data));
            var suppliedBytes = Convert.FromHexString(suppliedHash);
            return expectedBytes.Length == suppliedBytes.Length
                && CryptographicOperations.FixedTimeEquals(expectedBytes, suppliedBytes);
        }
        catch (FormatException)
        {
            return false;
        }
    }

    private sealed record ZaloPayCreateOrderRequest(
        [property: JsonPropertyName("app_id")] int AppId,
        [property: JsonPropertyName("app_user")] string AppUser,
        [property: JsonPropertyName("app_trans_id")] string AppTransId,
        [property: JsonPropertyName("app_time")] long AppTime,
        [property: JsonPropertyName("amount")] long Amount,
        [property: JsonPropertyName("description")] string Description,
        [property: JsonPropertyName("callback_url")] string CallbackUrl,
        [property: JsonPropertyName("item")] string Item,
        [property: JsonPropertyName("embed_data")] string EmbedData,
        [property: JsonPropertyName("mac")] string Mac);

    private sealed record ZaloPayCreateOrderResponse(
        [property: JsonPropertyName("return_code")] int ReturnCode,
        [property: JsonPropertyName("order_url")] string? OrderUrl);

    private sealed record ZaloPayOrderCallback(
        [property: JsonPropertyName("app_id")] int AppId,
        [property: JsonPropertyName("app_trans_id")] string AppTransId,
        [property: JsonPropertyName("amount")] long Amount,
        [property: JsonPropertyName("zp_trans_id")] long ZpTransId);
}
