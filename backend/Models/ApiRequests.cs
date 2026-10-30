using System.Text.Json;

namespace backend.Models;

public sealed record AdminLoginRequest(string Username, string Password);
public sealed record RegisterRequest(string Username, string Phone, string Password);
public sealed record UserLoginRequest(string Phone, string Password);
public sealed record UserCreateRequest(string Username, string Phone, string Password);
public sealed record UserStatusRequest(string Status);
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
    string? UserId,
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
