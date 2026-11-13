using backend.Models;
using Microsoft.AspNetCore.Http;

namespace backend.Services;

public interface IPaymentService
{
    PaymentOptionsResponse GetOptions();
    bool IsMethodEnabled(string method);
    Task<PaymentCheckoutResponse> CreateCheckoutAsync(
        OrderDocument order,
        string? clientIpAddress,
        CancellationToken cancellationToken);
    Task<VnPayProcessResult> ProcessVnPayCallbackAsync(
        IQueryCollection query,
        CancellationToken cancellationToken);
    Task<ZaloPayCallbackResponse> ProcessZaloPayCallbackAsync(
        ZaloPayCallbackRequest callback,
        CancellationToken cancellationToken);
}

public sealed record VnPayProcessResult(string RspCode, string Message, string? OrderNumber, string Status);

public sealed class PaymentUnavailableException(string message) : Exception(message);

public sealed class PaymentProviderException(string message) : Exception(message);
