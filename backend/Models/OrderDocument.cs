using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace backend.Models;

public sealed class OrderDocument
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

    public string OrderNumber { get; set; } = "";
    public string Customer { get; set; } = "";
    public string Phone { get; set; } = "";
    public string Address { get; set; } = "";
    public string? UserId { get; set; }
    public List<OrderItemDocument> Items { get; set; } = [];
    public int TotalQuantity { get; set; }

    [BsonRepresentation(BsonType.Decimal128)]
    public decimal Total { get; set; }

    public string Status { get; set; } = "pending";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public sealed class OrderItemDocument
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";

    [BsonRepresentation(BsonType.Decimal128)]
    public decimal Price { get; set; }

    public int Quantity { get; set; }
    public string Images { get; set; } = "";
    public string? Image { get; set; }
    public string? Color { get; set; }
}
