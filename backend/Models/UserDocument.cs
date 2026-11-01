using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace backend.Models;

public sealed class UserDocument
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

    public string Username { get; set; } = "";
    public string Phone { get; set; } = "";
    public string PasswordHash { get; set; } = "";
    public string Status { get; set; } = "active";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public List<PasswordChangeRecord> PasswordChanges { get; set; } = [];
}

public sealed class PasswordChangeRecord
{
    public string AdminId { get; set; } = "";
    public string AdminName { get; set; } = "";
    public DateTime ChangedAt { get; set; } = DateTime.UtcNow;
}
