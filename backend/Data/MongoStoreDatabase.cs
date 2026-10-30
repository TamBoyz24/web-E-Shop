using backend.Models;
using MongoDB.Driver;

namespace backend.Data;

public sealed class MongoStoreDatabase
{
    public MongoStoreDatabase(IConfiguration configuration)
    {
        var connectionString = configuration["MongoDB:ConnectionString"]
            ?? throw new InvalidOperationException("MongoDB:ConnectionString is not configured.");
        var databaseName = configuration["MongoDB:DatabaseName"]
            ?? throw new InvalidOperationException("MongoDB:DatabaseName is not configured.");

        var client = new MongoClient(connectionString);
        Database = client.GetDatabase(databaseName);
        Products = Database.GetCollection<ProductDocument>("products");
        Users = Database.GetCollection<UserDocument>("users");
        Orders = Database.GetCollection<OrderDocument>("orders");
    }

    public IMongoDatabase Database { get; }
    public IMongoCollection<ProductDocument> Products { get; }
    public IMongoCollection<UserDocument> Users { get; }
    public IMongoCollection<OrderDocument> Orders { get; }

    public async Task EnsureIndexesAsync(CancellationToken cancellationToken = default)
    {
        var phoneIndex = new CreateIndexModel<UserDocument>(
            Builders<UserDocument>.IndexKeys.Ascending(user => user.Phone),
            new CreateIndexOptions { Unique = true, Name = "unique_user_phone" });
        var orderNumberIndex = new CreateIndexModel<OrderDocument>(
            Builders<OrderDocument>.IndexKeys.Ascending(order => order.OrderNumber),
            new CreateIndexOptions { Unique = true, Name = "unique_order_number" });
        await Users.Indexes.CreateOneAsync(phoneIndex, cancellationToken: cancellationToken);
        await Orders.Indexes.CreateOneAsync(orderNumberIndex, cancellationToken: cancellationToken);
    }
}
