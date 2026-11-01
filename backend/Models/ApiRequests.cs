using System.Text.Json;

namespace backend.Models;

public sealed record AdminLoginRequest(string Username, string Password);
public sealed record RegisterRequest(string Username, string Phone, string Password);
public sealed record UserLoginRequest(string Phone, string Password);
public sealed record UserCreateRequest(string Username, string Phone, string Password);
public sealed record UserStatusRequest(string Status);
/// <summary>Customer phone number requesting administrator-assisted account recovery.</summary>
public sealed record PasswordRecoveryRequest(string Phone);
/// <summary>New password set by an administrator after verifying the customer.</summary>
public sealed record ResetCustomerPasswordRequest(string Password);
/// <summary>Creates an individual administrator account for a staff member.</summary>
public sealed record CreateAdminStaffRequest(string Username, string DisplayName, string Password);
/// <summary>Changes whether an administrator staff account may sign in.</summary>
public sealed record AdminStaffStatusRequest(string Status);
/// <summary>Resolves or dismisses a customer password recovery request.</summary>
public sealed record PasswordRecoveryStatusRequest(string Status);
public sealed record ProductInput(
    string Name,
    string Sku,
    string Brand,
    string Category,
    decimal Price,
    int Stock,
    string Images,
    string Description,
    string Status);
public sealed record OrderItemInput(
    string Id,
    string Name,
    decimal Price,
    int Quantity,
    string Images,
    string? Image,
    string? Color);
public sealed record CreateOrderRequest(
    string Customer,
    string Phone,
    string Address,
    List<OrderItemInput> Items);
public sealed record OrderStatusRequest(string Status);
public sealed record LegacyOrderItemInput(
    string? Id,
    string? Name,
    decimal Price,
    int Quantity,
    string? Images,
    string? Image,
    string? Color);
public sealed record LegacyOrderInput(
    string? Id,
    string? Customer,
    string? Phone,
    string? Address,
    JsonElement? UserId,
    List<LegacyOrderItemInput>? Items,
    int TotalQuantity,
    decimal Total,
    string? Status,
    DateTime? CreatedAt,
    DateTime? UpdatedAt);
