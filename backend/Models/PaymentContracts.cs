using System.Text.Json.Serialization;

namespace backend.Models;

/// <summary>Describes a payment method currently available at checkout.</summary>
public sealed record PaymentMethodOption(
    string Code,
    string Name,
    string Description,
    bool Enabled,
    string? DisabledReason);

/// <summary>Public bank account details for manual bank transfers.</summary>
public sealed record BankTransferDetails(
    string BankName,
    string AccountName,
    string AccountNumber,
    string? Branch);

/// <summary>Checkout payment choices and bank transfer instructions.</summary>
public sealed record PaymentOptionsResponse(
    IReadOnlyList<PaymentMethodOption> Methods,
    BankTransferDetails? BankTransfer);

/// <summary>Hosted checkout URL returned after creating a gateway transaction.</summary>
public sealed record PaymentCheckoutResponse(string Url);

/// <summary>Callback payload sent by ZaloPay.</summary>
public sealed record ZaloPayCallbackRequest(string Data, string Mac, int Type);

/// <summary>Result returned to ZaloPay after validating a callback.</summary>
public sealed record ZaloPayCallbackResponse(
    [property: JsonPropertyName("return_code")] int ReturnCode,
    [property: JsonPropertyName("return_message")] string ReturnMessage);

/// <summary>Result returned to VNPay after validating an IPN.</summary>
public sealed record VnPayIpnResponse(
    [property: JsonPropertyName("RspCode")] string RspCode,
    [property: JsonPropertyName("Message")] string Message);
