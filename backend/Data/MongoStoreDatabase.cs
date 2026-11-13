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
        AdminUsers = Database.GetCollection<AdminUserDocument>("admin_users");
        PasswordRecoveryRequests = Database.GetCollection<PasswordRecoveryRequestDocument>("password_recovery_requests");
    }

    public IMongoDatabase Database { get; }
    public IMongoCollection<ProductDocument> Products { get; }
    public IMongoCollection<UserDocument> Users { get; }
    public IMongoCollection<OrderDocument> Orders { get; }
    public IMongoCollection<AdminUserDocument> AdminUsers { get; }
    public IMongoCollection<PasswordRecoveryRequestDocument> PasswordRecoveryRequests { get; }

    public async Task EnsureIndexesAsync(CancellationToken cancellationToken = default)
    {
        var phoneIndex = new CreateIndexModel<UserDocument>(
            Builders<UserDocument>.IndexKeys.Ascending(user => user.Phone),
            new CreateIndexOptions { Unique = true, Name = "unique_user_phone" });
        var orderNumberIndex = new CreateIndexModel<OrderDocument>(
            Builders<OrderDocument>.IndexKeys.Ascending(order => order.OrderNumber),
            new CreateIndexOptions { Unique = true, Name = "unique_order_number" });
        var userOrdersIndex = new CreateIndexModel<OrderDocument>(
            Builders<OrderDocument>.IndexKeys
                .Ascending(order => order.UserId)
                .Descending(order => order.CreatedAt),
            new CreateIndexOptions { Name = "user_orders_by_created_at" });
        var adminUsernameIndex = new CreateIndexModel<AdminUserDocument>(
            Builders<AdminUserDocument>.IndexKeys.Ascending(admin => admin.Username),
            new CreateIndexOptions { Unique = true, Name = "unique_admin_username" });
        var pendingRecoveryIndex = new CreateIndexModel<PasswordRecoveryRequestDocument>(
            Builders<PasswordRecoveryRequestDocument>.IndexKeys
                .Ascending(request => request.Phone)
                .Ascending(request => request.Status),
            new CreateIndexOptions { Name = "recovery_requests_by_phone_and_status" });
        await Users.Indexes.CreateOneAsync(phoneIndex, cancellationToken: cancellationToken);
        await Orders.Indexes.CreateOneAsync(orderNumberIndex, cancellationToken: cancellationToken);
        await Orders.Indexes.CreateOneAsync(userOrdersIndex, cancellationToken: cancellationToken);
        await AdminUsers.Indexes.CreateOneAsync(adminUsernameIndex, cancellationToken: cancellationToken);
        await PasswordRecoveryRequests.Indexes.CreateOneAsync(pendingRecoveryIndex, cancellationToken: cancellationToken);

        var legacySamplePriceFilter = Builders<ProductDocument>.Filter.Regex(
                product => product.Sku,
                new MongoDB.Bson.BsonRegularExpression("^SP-"))
            & Builders<ProductDocument>.Filter.Gt(product => product.Price, 0)
            & Builders<ProductDocument>.Filter.Lt(product => product.Price, 10000);
        var legacyProducts = await Products.Find(legacySamplePriceFilter)
            .ToListAsync(cancellationToken);

        foreach (var product in legacyProducts)
        {
            var unchangedLegacyPrice = Builders<ProductDocument>.Filter.Eq(candidate => candidate.Id, product.Id)
                & Builders<ProductDocument>.Filter.Eq(candidate => candidate.Price, product.Price);
            await Products.UpdateOneAsync(
                unchangedLegacyPrice,
                Builders<ProductDocument>.Update.Set(candidate => candidate.Price, product.Price * 1000),
                cancellationToken: cancellationToken);
        }
    }
}
