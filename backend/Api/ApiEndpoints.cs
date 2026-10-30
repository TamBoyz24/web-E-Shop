using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using backend.Data;
using backend.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using MongoDB.Bson;
using MongoDB.Driver;

namespace backend.Api;

public static class ApiEndpoints
{
    private static readonly HashSet<string> OrderStatuses =
        ["pending", "confirmed", "shipping", "completed", "cancelled"];

    public static void MapApiEndpoints(this WebApplication app)
    {
        var auth = app.MapGroup("/api/auth");
        auth.MapPost("/admin/login", AdminLogin);
        auth.MapPost("/register", Register);
        auth.MapPost("/login", UserLogin);

        var products = app.MapGroup("/api/products");
        products.MapGet("/", GetPublicProducts);
        products.MapGet("/{id}", GetPublicProduct);

        var orders = app.MapGroup("/api/orders");
        orders.MapPost("/", CreateOrder);

        var admin = app.MapGroup("/api/admin").RequireAuthorization();
        admin.MapGet("/products", GetAllProducts);
        admin.MapPost("/products", CreateProduct);
        admin.MapPost("/products/seed", SeedProducts);
        admin.MapPut("/products/{id}", UpdateProduct);
        admin.MapDelete("/products/{id}", DeleteProduct);
        admin.MapGet("/users", GetUsers);
        admin.MapPost("/users", CreateUser);
        admin.MapPatch("/users/{id}/status", UpdateUserStatus);
        admin.MapDelete("/users/{id}", DeleteUser);
        admin.MapGet("/orders", GetOrders);
        admin.MapPost("/orders/import", ImportLegacyOrders);
        admin.MapPatch("/orders/{id}/status", UpdateOrderStatus);
        admin.MapDelete("/orders/{id}", DeleteOrder);
        admin.MapGet("/dashboard", GetDashboard);
    }

    private static IResult AdminLogin(
        AdminLoginRequest request,
        IConfiguration configuration)
    {
        var configuredUsername = configuration["Admin:Username"];
        var configuredPassword = configuration["Admin:Password"];
        if (string.IsNullOrWhiteSpace(request.Username)
            || string.IsNullOrWhiteSpace(request.Password)
            || string.IsNullOrWhiteSpace(configuredUsername)
            || string.IsNullOrWhiteSpace(configuredPassword)
            || !FixedTimeEquals(request.Username, configuredUsername)
            || !FixedTimeEquals(request.Password, configuredPassword))
        {
            return Results.Unauthorized();
        }

        var now = DateTime.UtcNow;
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, configuredUsername),
            new Claim(ClaimTypes.Role, "admin")
        };
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(configuration["Jwt:Key"]!));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(
            issuer: configuration["Jwt:Issuer"],
            audience: configuration["Jwt:Audience"],
            claims: claims,
            notBefore: now,
            expires: now.AddHours(4),
            signingCredentials: credentials);

        return Results.Ok(new
        {
            username = configuredUsername,
            token = new JwtSecurityTokenHandler().WriteToken(token),
            expiresAt = token.ValidTo
        });
    }

    private static async Task<IResult> Register(
        RegisterRequest request,
        MongoStoreDatabase database,
        IPasswordHasher<UserDocument> passwordHasher,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Username)
            || request.Username.Trim().Length > 80
            || !IsValidPhone(request.Phone)
            || string.IsNullOrEmpty(request.Password)
            || request.Password.Length is < 6 or > 50)
        {
            return Results.BadRequest(new { message = "Vui lòng nhập tên, số điện thoại hợp lệ và mật khẩu từ 6 đến 50 ký tự." });
        }

        var user = new UserDocument
        {
            Username = request.Username.Trim(),
            Phone = request.Phone,
            CreatedAt = DateTime.UtcNow
        };
        user.PasswordHash = passwordHasher.HashPassword(user, request.Password);

        try
        {
            await database.Users.InsertOneAsync(user, cancellationToken: cancellationToken);
        }
        catch (MongoWriteException exception) when (exception.WriteError?.Category == ServerErrorCategory.DuplicateKey)
        {
            return Results.Conflict(new { message = "Số điện thoại này đã được đăng ký." });
        }

        return Results.Created($"/api/users/{user.Id}", ToUserResponse(user));
    }

    private static async Task<IResult> UserLogin(
        UserLoginRequest request,
        MongoStoreDatabase database,
        IPasswordHasher<UserDocument> passwordHasher,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Phone) || string.IsNullOrEmpty(request.Password))
        {
            return Results.Unauthorized();
        }

        var user = await database.Users
            .Find(candidate => candidate.Phone == request.Phone)
            .FirstOrDefaultAsync(cancellationToken);
        if (user is null
            || user.Status != "active"
            || passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.Password)
                == PasswordVerificationResult.Failed)
        {
            return Results.Unauthorized();
        }

        return Results.Ok(ToUserResponse(user));
    }

    private static async Task<IResult> GetPublicProducts(
        MongoStoreDatabase database,
        CancellationToken cancellationToken)
    {
        var filter = Builders<ProductDocument>.Filter.Eq(product => product.Status, "active")
            & Builders<ProductDocument>.Filter.Gt(product => product.Stock, 0);
        var products = await database.Products.Find(filter)
            .SortBy(product => product.Name)
            .ToListAsync(cancellationToken);
        return Results.Ok(products);
    }

    private static async Task<IResult> GetPublicProduct(
        string id,
        MongoStoreDatabase database,
        CancellationToken cancellationToken)
    {
        if (!ObjectId.TryParse(id, out _))
        {
            return Results.NotFound();
        }

        var filter = Builders<ProductDocument>.Filter.Eq(product => product.Id, id)
            & Builders<ProductDocument>.Filter.Eq(product => product.Status, "active")
            & Builders<ProductDocument>.Filter.Gt(product => product.Stock, 0);
        var product = await database.Products.Find(filter).FirstOrDefaultAsync(cancellationToken);
        return product is null ? Results.NotFound() : Results.Ok(product);
    }

    private static async Task<IResult> GetAllProducts(
        MongoStoreDatabase database,
        CancellationToken cancellationToken)
    {
        var products = await database.Products.Find(Builders<ProductDocument>.Filter.Empty)
            .SortBy(product => product.Name)
            .ToListAsync(cancellationToken);
        return Results.Ok(products);
    }

    private static async Task<IResult> CreateProduct(
        ProductInput input,
        MongoStoreDatabase database,
        CancellationToken cancellationToken)
    {
        var validation = ValidateProduct(input);
        if (validation is not null)
        {
            return Results.BadRequest(new { message = validation });
        }

        var product = ToProduct(input);
        await database.Products.InsertOneAsync(product, cancellationToken: cancellationToken);
        return Results.Created($"/api/products/{product.Id}", product);
    }

    private static async Task<IResult> SeedProducts(
        List<ProductInput> inputs,
        MongoStoreDatabase database,
        CancellationToken cancellationToken)
    {
        if (inputs.Count is 0 or > 500)
        {
            return Results.BadRequest(new { message = "Danh sách khởi tạo phải có từ 1 đến 500 sản phẩm." });
        }

        var existingCount = await database.Products.CountDocumentsAsync(
            Builders<ProductDocument>.Filter.Empty,
            cancellationToken: cancellationToken);
        if (existingCount > 0)
        {
            return Results.Conflict(new { message = "Database đã có sản phẩm; không thể khởi tạo lại danh mục." });
        }

        var invalidProduct = inputs.FirstOrDefault(input => ValidateProduct(input) is not null);
        if (invalidProduct is not null)
        {
            return Results.BadRequest(new { message = ValidateProduct(invalidProduct) });
        }

        var products = inputs.Select(ToProduct).ToList();
        await database.Products.InsertManyAsync(products, cancellationToken: cancellationToken);
        return Results.Ok(products);
    }

    private static async Task<IResult> UpdateProduct(
        string id,
        ProductInput input,
        MongoStoreDatabase database,
        CancellationToken cancellationToken)
    {
        if (!ObjectId.TryParse(id, out _))
        {
            return Results.NotFound();
        }

        var validation = ValidateProduct(input);
        if (validation is not null)
        {
            return Results.BadRequest(new { message = validation });
        }

        var product = ToProduct(input);
        product.Id = id;
        product.UpdatedAt = DateTime.UtcNow;
        var result = await database.Products.ReplaceOneAsync(
            candidate => candidate.Id == id,
            product,
            cancellationToken: cancellationToken);
        return result.MatchedCount == 0 ? Results.NotFound() : Results.Ok(product);
    }

    private static async Task<IResult> DeleteProduct(
        string id,
        MongoStoreDatabase database,
        CancellationToken cancellationToken)
    {
        if (!ObjectId.TryParse(id, out _))
        {
            return Results.NotFound();
        }

        var result = await database.Products.DeleteOneAsync(
            product => product.Id == id,
            cancellationToken);
        return result.DeletedCount == 0 ? Results.NotFound() : Results.NoContent();
    }

    private static async Task<IResult> GetUsers(
        MongoStoreDatabase database,
        CancellationToken cancellationToken)
    {
        var users = await database.Users.Find(Builders<UserDocument>.Filter.Empty)
            .SortByDescending(user => user.CreatedAt)
            .ToListAsync(cancellationToken);
        return Results.Ok(users.Select(ToUserResponse));
    }

    private static async Task<IResult> CreateUser(
        UserCreateRequest request,
        MongoStoreDatabase database,
        IPasswordHasher<UserDocument> passwordHasher,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Username)
            || request.Username.Trim().Length > 80
            || !IsValidPhone(request.Phone)
            || string.IsNullOrEmpty(request.Password)
            || request.Password.Length is < 6 or > 50)
        {
            return Results.BadRequest(new { message = "Vui lòng nhập tên, số điện thoại hợp lệ và mật khẩu từ 6 đến 50 ký tự." });
        }

        var user = new UserDocument
        {
            Username = request.Username.Trim(),
            Phone = request.Phone,
            CreatedAt = DateTime.UtcNow
        };
        user.PasswordHash = passwordHasher.HashPassword(user, request.Password);

        try
        {
            await database.Users.InsertOneAsync(user, cancellationToken: cancellationToken);
        }
        catch (MongoWriteException exception) when (exception.WriteError?.Category == ServerErrorCategory.DuplicateKey)
        {
            return Results.Conflict(new { message = "Số điện thoại này đã được đăng ký." });
        }

        return Results.Created($"/api/admin/users/{user.Id}", ToUserResponse(user));
    }

    private static async Task<IResult> UpdateUserStatus(
        string id,
        UserStatusRequest request,
        MongoStoreDatabase database,
        CancellationToken cancellationToken)
    {
        if (!ObjectId.TryParse(id, out _))
        {
            return Results.NotFound();
        }
        if (request.Status is not ("active" or "blocked"))
        {
            return Results.BadRequest(new { message = "Trạng thái tài khoản không hợp lệ." });
        }

        var update = Builders<UserDocument>.Update.Set(user => user.Status, request.Status);
        var result = await database.Users.UpdateOneAsync(
            user => user.Id == id,
            update,
            cancellationToken: cancellationToken);
        return result.MatchedCount == 0 ? Results.NotFound() : Results.NoContent();
    }

    private static async Task<IResult> DeleteUser(
        string id,
        MongoStoreDatabase database,
        CancellationToken cancellationToken)
    {
        if (!ObjectId.TryParse(id, out _))
        {
            return Results.NotFound();
        }

        var result = await database.Users.DeleteOneAsync(user => user.Id == id, cancellationToken);
        return result.DeletedCount == 0 ? Results.NotFound() : Results.NoContent();
    }

    private static async Task<IResult> CreateOrder(
        CreateOrderRequest request,
        MongoStoreDatabase database,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Customer)
            || request.Customer.Length > 120
            || !IsValidPhone(request.Phone)
            || string.IsNullOrWhiteSpace(request.Address)
            || request.Address.Length > 500
            || request.Items is null
            || request.Items.Count is 0 or > 100
            || request.Items.Any(item => string.IsNullOrWhiteSpace(item.Name)
                || item.Quantity is < 1 or > 100
                || item.Price < 0))
        {
            return Results.BadRequest(new { message = "Thông tin người nhận hoặc sản phẩm trong đơn hàng không hợp lệ." });
        }

        var now = DateTime.UtcNow;
        var order = new OrderDocument
        {
            OrderNumber = $"DH-{now:yyyyMMddHHmmss}-{RandomNumberGenerator.GetInt32(1000, 10000)}",
            Customer = request.Customer.Trim(),
            Phone = request.Phone,
            Address = request.Address.Trim(),
            UserId = request.UserId,
            Items = request.Items.Select(item => new OrderItemDocument
            {
                Id = item.Id,
                Name = item.Name,
                Price = item.Price,
                Quantity = item.Quantity,
                Images = item.Images,
                Image = item.Image,
                Color = item.Color
            }).ToList(),
            TotalQuantity = request.Items.Sum(item => item.Quantity),
            Total = request.Items.Sum(item => item.Price * item.Quantity),
            CreatedAt = now,
            UpdatedAt = now
        };

        await database.Orders.InsertOneAsync(order, cancellationToken: cancellationToken);
        return Results.Created($"/api/admin/orders/{order.Id}", order);
    }

    private static async Task<IResult> GetOrders(
        MongoStoreDatabase database,
        CancellationToken cancellationToken)
    {
        var orders = await database.Orders.Find(Builders<OrderDocument>.Filter.Empty)
            .SortByDescending(order => order.CreatedAt)
            .ToListAsync(cancellationToken);
        return Results.Ok(orders);
    }

    private static async Task<IResult> ImportLegacyOrders(
        List<LegacyOrderInput> inputs,
        MongoStoreDatabase database,
        CancellationToken cancellationToken)
    {
        if (inputs.Count is 0 or > 500
            || inputs.Any(order => string.IsNullOrWhiteSpace(order.Id)
                || string.IsNullOrWhiteSpace(order.Customer)
                || string.IsNullOrWhiteSpace(order.Phone)
                || string.IsNullOrWhiteSpace(order.Address)
                || order.Items is null
                || order.Items.Count == 0
                || order.Total < 0))
        {
            return Results.BadRequest(new { message = "Dữ liệu đơn hàng cũ không hợp lệ." });
        }

        var currentCount = await database.Orders.CountDocumentsAsync(
            Builders<OrderDocument>.Filter.Empty,
            cancellationToken: cancellationToken);
        if (currentCount > 0)
        {
            return Results.Conflict(new { message = "Database đã có đơn hàng; không thể nhập lại dữ liệu cũ." });
        }

        var orders = inputs.Select(input =>
        {
            var createdAt = input.CreatedAt?.ToUniversalTime() ?? DateTime.UtcNow;
            return new OrderDocument
            {
                OrderNumber = input.Id!.Trim(),
                Customer = input.Customer!.Trim(),
                Phone = input.Phone!,
                Address = input.Address!.Trim(),
                UserId = ReadUserId(input.UserId),
                Items = input.Items!.Select(item => new OrderItemDocument
                {
                    Id = item.Id ?? "",
                    Name = item.Name ?? "",
                    Price = item.Price,
                    Quantity = Math.Max(1, item.Quantity),
                    Images = item.Images ?? "",
                    Image = item.Image,
                    Color = item.Color
                }).ToList(),
                TotalQuantity = input.TotalQuantity > 0
                    ? input.TotalQuantity
                    : input.Items!.Sum(item => Math.Max(1, item.Quantity)),
                Total = input.Total,
                Status = OrderStatuses.Contains(input.Status ?? "") ? input.Status! : "pending",
                CreatedAt = createdAt,
                UpdatedAt = input.UpdatedAt?.ToUniversalTime() ?? createdAt
            };
        }).ToList();

        await database.Orders.InsertManyAsync(orders, cancellationToken: cancellationToken);
        return Results.Ok(orders);
    }

    private static async Task<IResult> UpdateOrderStatus(
        string id,
        OrderStatusRequest request,
        MongoStoreDatabase database,
        CancellationToken cancellationToken)
    {
        if (!ObjectId.TryParse(id, out _))
        {
            return Results.NotFound();
        }
        if (!OrderStatuses.Contains(request.Status))
        {
            return Results.BadRequest(new { message = "Trạng thái đơn hàng không hợp lệ." });
        }

        var update = Builders<OrderDocument>.Update
            .Set(order => order.Status, request.Status)
            .Set(order => order.UpdatedAt, DateTime.UtcNow);
        var result = await database.Orders.UpdateOneAsync(
            order => order.Id == id,
            update,
            cancellationToken: cancellationToken);
        return result.MatchedCount == 0 ? Results.NotFound() : Results.NoContent();
    }

    private static async Task<IResult> DeleteOrder(
        string id,
        MongoStoreDatabase database,
        CancellationToken cancellationToken)
    {
        if (!ObjectId.TryParse(id, out _))
        {
            return Results.NotFound();
        }

        var result = await database.Orders.DeleteOneAsync(order => order.Id == id, cancellationToken);
        return result.DeletedCount == 0 ? Results.NotFound() : Results.NoContent();
    }

    private static async Task<IResult> GetDashboard(
        MongoStoreDatabase database,
        CancellationToken cancellationToken)
    {
        var productsTask = database.Products.CountDocumentsAsync(
            Builders<ProductDocument>.Filter.Empty,
            cancellationToken: cancellationToken);
        var usersTask = database.Users.CountDocumentsAsync(
            Builders<UserDocument>.Filter.Empty,
            cancellationToken: cancellationToken);
        var ordersTask = database.Orders.Find(Builders<OrderDocument>.Filter.Empty)
            .SortByDescending(order => order.CreatedAt)
            .ToListAsync(cancellationToken);

        await Task.WhenAll(productsTask, usersTask, ordersTask);
        var orders = await ordersTask;
        return Results.Ok(new
        {
            productCount = await productsTask,
            userCount = await usersTask,
            orders,
            pendingOrderCount = orders.Count(order => order.Status == "pending"),
            completedRevenue = orders
                .Where(order => order.Status == "completed")
                .Sum(order => order.Total)
        });
    }

    private static ProductDocument ToProduct(ProductInput input)
    {
        var now = DateTime.UtcNow;
        return new ProductDocument
        {
            Name = input.Name.Trim(),
            Sku = input.Sku.Trim(),
            Brand = input.Brand.Trim(),
            Category = input.Category.Trim(),
            Price = input.Price,
            Stock = input.Stock,
            Images = input.Images.Trim(),
            Description = input.Description.Trim(),
            Status = input.Status,
            CreatedAt = now,
            UpdatedAt = now
        };
    }

    private static string? ValidateProduct(ProductInput input)
    {
        if (input.Brand is null
            || input.Description is null
            || string.IsNullOrWhiteSpace(input.Name)
            || input.Name.Length > 180
            || string.IsNullOrWhiteSpace(input.Sku)
            || input.Sku.Length > 80
            || string.IsNullOrWhiteSpace(input.Category)
            || input.Category.Length > 80
            || input.Price < 0
            || input.Stock < 0
            || string.IsNullOrWhiteSpace(input.Images)
            || input.Images.Length > 300
            || input.Description.Length > 3000
            || input.Status is not ("active" or "hidden"))
        {
            return "Thông tin sản phẩm không hợp lệ.";
        }

        return null;
    }

    private static object ToUserResponse(UserDocument user) => new
    {
        user.Id,
        user.Username,
        user.Phone,
        user.Status,
        user.CreatedAt
    };

    private static bool IsValidPhone(string? phone) =>
        phone is not null && phone.Length is 10 or 11 && phone.All(char.IsDigit);

    private static string? ReadUserId(JsonElement? userId)
    {
        if (!userId.HasValue)
        {
            return null;
        }

        return userId.Value.ValueKind switch
        {
            JsonValueKind.String => userId.Value.GetString(),
            JsonValueKind.Number => userId.Value.ToString(),
            _ => null
        };
    }

    private static bool FixedTimeEquals(string submitted, string expected)
    {
        var submittedBytes = Encoding.UTF8.GetBytes(submitted);
        var expectedBytes = Encoding.UTF8.GetBytes(expected);
        return submittedBytes.Length == expectedBytes.Length
            && CryptographicOperations.FixedTimeEquals(submittedBytes, expectedBytes);
    }
}
