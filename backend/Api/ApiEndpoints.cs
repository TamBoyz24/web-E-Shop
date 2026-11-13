using System.IdentityModel.Tokens.Jwt;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using backend.Data;
using backend.Models;
using backend.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.IdentityModel.Tokens;
using MongoDB.Bson;
using MongoDB.Driver;

namespace backend.Api;

public static class ApiEndpoints
{
    private static readonly HashSet<string> OrderStatuses =
        ["pending", "confirmed", "shipping", "completed", "cancelled"];
    private static readonly HashSet<string> PaymentMethods =
        ["cod", "bank_transfer", "vnpay", "zalopay"];

    public static void MapApiEndpoints(this WebApplication app)
    {
        var auth = app.MapGroup("/api/auth");
        auth.MapPost("/admin/login", AdminLogin);
        auth.MapPost("/register", Register);
        auth.MapPost("/login", UserLogin);
        auth.MapPost("/password-recovery-requests", SubmitPasswordRecoveryRequest)
            .WithName("SubmitPasswordRecoveryRequest")
            .WithSummary("Submit an administrator-assisted password recovery request")
            .Produces(StatusCodes.Status202Accepted)
            .Produces(StatusCodes.Status400BadRequest);

        var customer = app.MapGroup("/api/users")
            .RequireAuthorization(policy => policy.RequireClaim("userId"));
        customer.MapGet("/me", GetCurrentUserProfile);
        customer.MapPut("/me", UpdateCurrentUserProfile);

        var products = app.MapGroup("/api/products");
        products.MapGet("/", GetPublicProducts);
        products.MapGet("/{id}", GetPublicProduct);

        var orders = app.MapGroup("/api/orders");
        orders.MapGet("/mine", GetCurrentUserOrders)
            .RequireAuthorization(policy => policy.RequireClaim("userId"));
        orders.MapPost("/", CreateOrder)
            .RequireAuthorization(policy => policy.RequireClaim("userId"));
        orders.MapPost("/{id}/payment", StartOrderPayment)
            .RequireAuthorization(policy => policy.RequireClaim("userId"))
            .WithName("StartOrderPayment")
            .WithSummary("Create a hosted payment session for the authenticated customer's order")
            .Produces<PaymentCheckoutResponse>()
            .Produces(StatusCodes.Status403Forbidden)
            .Produces(StatusCodes.Status404NotFound)
            .Produces(StatusCodes.Status409Conflict)
            .Produces(StatusCodes.Status502BadGateway);

        var payments = app.MapGroup("/api/payments");
        payments.MapGet("/options", (IPaymentService paymentService) => Results.Ok(paymentService.GetOptions()))
            .WithName("GetPaymentOptions")
            .WithSummary("Return payment methods enabled for checkout")
            .Produces<PaymentOptionsResponse>();
        payments.MapGet("/vnpay/return", VnPayReturn)
            .WithName("VnPayReturn")
            .WithSummary("Verify VNPay's signed browser return and redirect to the result page");
        payments.MapGet("/vnpay/ipn", VnPayIpn)
            .WithName("VnPayIpn")
            .WithSummary("Verify VNPay's server-to-server payment notification")
            .Produces<VnPayIpnResponse>();
        payments.MapPost("/zalopay/callback", ZaloPayCallback)
            .WithName("ZaloPayCallback")
            .WithSummary("Verify and acknowledge ZaloPay's signed payment callback")
            .Produces<ZaloPayCallbackResponse>();

        var admin = app.MapGroup("/api/admin").RequireAuthorization();
        admin.MapGet("/products", GetAllProducts);
        admin.MapPost("/products", CreateProduct);
        admin.MapPost("/products/seed", SeedProducts);
        admin.MapPut("/products/{id}", UpdateProduct);
        admin.MapDelete("/products/{id}", DeleteProduct);
        admin.MapGet("/users", GetUsers);
        admin.MapPost("/users", CreateUser);
        admin.MapGet("/users/{id}", GetUser);
        admin.MapPut("/users/{id}/profile", UpdateCustomerProfile);
        admin.MapPatch("/users/{id}/email", UpdateCustomerEmail);
        admin.MapPatch("/users/{id}/password", ResetCustomerPassword);
        admin.MapPatch("/users/{id}/status", UpdateUserStatus);
        admin.MapDelete("/users/{id}", DeleteUser);
        admin.MapGet("/password-recovery-requests", GetPasswordRecoveryRequests);
        admin.MapPatch("/password-recovery-requests/{id}", UpdatePasswordRecoveryRequest);
        admin.MapGet("/orders", GetOrders);
        admin.MapGet("/orders/pending-count", GetPendingOrderCount);
        admin.MapPost("/orders/import", ImportLegacyOrders);
        admin.MapPatch("/orders/{id}/status", UpdateOrderStatus);
        admin.MapPatch("/orders/{id}/payment-status", UpdateOrderPaymentStatus);
        admin.MapDelete("/orders/{id}", DeleteOrder);
        admin.MapGet("/dashboard", GetDashboard);

        var staff = app.MapGroup("/api/admin/staff")
            .RequireAuthorization(policy => policy.RequireClaim("adminLevel", "owner"));
        staff.MapGet("/", GetAdminStaff);
        staff.MapPost("/", CreateAdminStaff);
        staff.MapPatch("/{id}/status", UpdateAdminStaffStatus);
    }

    private static async Task<IResult> AdminLogin(
        AdminLoginRequest request,
        IConfiguration configuration,
        MongoStoreDatabase database,
        IPasswordHasher<AdminUserDocument> passwordHasher,
        CancellationToken cancellationToken)
    {
        var configuredUsername = configuration["Admin:Username"];
        var configuredPassword = configuration["Admin:Password"];
        var username = request.Username?.Trim();
        if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(request.Password))
        {
            return Results.Unauthorized();
        }

        string adminId;
        string displayName;
        string role;
        if (!string.IsNullOrWhiteSpace(configuredUsername)
            && string.Equals(username, configuredUsername, StringComparison.OrdinalIgnoreCase))
        {
            if (string.IsNullOrWhiteSpace(configuredPassword)
                || !FixedTimeEquals(request.Password, configuredPassword))
            {
                return Results.Unauthorized();
            }

            adminId = "configured-admin";
            username = configuredUsername;
            displayName = configuredUsername;
            role = "owner";
        }
        else
        {
            var admin = await database.AdminUsers
                .Find(candidate => candidate.Username == username.ToLowerInvariant())
                .FirstOrDefaultAsync(cancellationToken);
            if (admin is null
                || admin.Status != "active"
                || passwordHasher.VerifyHashedPassword(admin, admin.PasswordHash, request.Password)
                    == PasswordVerificationResult.Failed)
            {
                return Results.Unauthorized();
            }

            adminId = admin.Id;
            username = admin.Username;
            displayName = admin.DisplayName;
            role = "staff";
        }

        var now = DateTime.UtcNow;
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, adminId),
            new Claim(ClaimTypes.Role, "admin"),
            new Claim("adminId", adminId),
            new Claim("adminName", displayName),
            new Claim("adminUsername", username),
            new Claim("adminLevel", role)
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
            username,
            displayName,
            role,
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
            || !IsValidEmail(request.Email)
            || string.IsNullOrEmpty(request.Password)
            || request.Password.Length is < 6 or > 50)
        {
            return Results.BadRequest(new { message = "Vui lòng nhập tên, số điện thoại hợp lệ, email hợp lệ nếu có và mật khẩu từ 6 đến 50 ký tự." });
        }

        var user = new UserDocument
        {
            Username = request.Username.Trim(),
            Phone = request.Phone,
            Email = NormalizeEmail(request.Email),
            CreatedAt = DateTime.UtcNow,
            CreatedByAdminName = "Khách tự đăng ký"
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
        IConfiguration configuration,
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

        return Results.Ok(new
        {
            user.Id,
            user.Username,
            user.Phone,
            user.Email,
            user.Status,
            user.CreatedAt,
            token = CreateUserToken(user, configuration)
        });
    }

    private static async Task<IResult> SubmitPasswordRecoveryRequest(
        PasswordRecoveryRequest request,
        MongoStoreDatabase database,
        CancellationToken cancellationToken)
    {
        var phone = request.Phone?.Trim();
        if (string.IsNullOrWhiteSpace(phone) || !IsValidPhone(phone))
        {
            return Results.BadRequest(new { message = "Vui lòng nhập số điện thoại gồm 10 hoặc 11 chữ số." });
        }

        var genericResponse = new
        {
            message = "Nếu số điện thoại đã đăng ký, yêu cầu sẽ được chuyển tới quản trị viên để xác minh."
        };
        var userExists = await database.Users
            .Find(user => user.Phone == phone)
            .AnyAsync(cancellationToken);
        if (!userExists)
        {
            return Results.Accepted(value: genericResponse);
        }

        var recentRequestExists = await database.PasswordRecoveryRequests
            .Find(recovery => recovery.Phone == phone && recovery.CreatedAt >= DateTime.UtcNow.AddMinutes(-15))
            .AnyAsync(cancellationToken);
        if (!recentRequestExists)
        {
            await database.PasswordRecoveryRequests.InsertOneAsync(
                new PasswordRecoveryRequestDocument { Phone = phone },
                cancellationToken: cancellationToken);
        }

        return Results.Accepted(value: genericResponse);
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

        var products = inputs.Select(input =>
        {
            var product = ToProduct(input);
            if (product.Sku.StartsWith("SP-", StringComparison.OrdinalIgnoreCase)
                && product.Price is > 0 and < 10000)
            {
                product.Price *= 1000;
            }
            return product;
        }).ToList();
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
        return Results.Ok(users.Select(user => ToUserResponse(user, includeAudit: true)));
    }

    private static async Task<IResult> GetUser(
        string id,
        MongoStoreDatabase database,
        CancellationToken cancellationToken)
    {
        if (!ObjectId.TryParse(id, out _))
        {
            return Results.NotFound();
        }

        var user = await database.Users.Find(customer => customer.Id == id)
            .FirstOrDefaultAsync(cancellationToken);
        return user is null ? Results.NotFound() : Results.Ok(ToUserResponse(user, includeAudit: true));
    }

    private static async Task<IResult> GetCurrentUserProfile(
        ClaimsPrincipal principal,
        MongoStoreDatabase database,
        CancellationToken cancellationToken)
    {
        var userId = principal.FindFirstValue("userId");
        if (userId is null || !ObjectId.TryParse(userId, out _))
        {
            return Results.Unauthorized();
        }

        var user = await database.Users.Find(customer => customer.Id == userId)
            .FirstOrDefaultAsync(cancellationToken);
        return user is null ? Results.NotFound() : Results.Ok(ToUserResponse(user));
    }

    private static async Task<IResult> UpdateCurrentUserProfile(
        UpdateCustomerProfileRequest request,
        ClaimsPrincipal principal,
        MongoStoreDatabase database,
        CancellationToken cancellationToken)
    {
        var userId = principal.FindFirstValue("userId");
        if (userId is null || !ObjectId.TryParse(userId, out _))
        {
            return Results.Unauthorized();
        }

        return await SaveCustomerProfile(userId, request, principal, database, cancellationToken);
    }

    private static async Task<IResult> CreateUser(
        UserCreateRequest request,
        ClaimsPrincipal principal,
        MongoStoreDatabase database,
        IPasswordHasher<UserDocument> passwordHasher,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Username)
            || request.Username.Trim().Length > 80
            || !IsValidPhone(request.Phone)
            || !IsValidEmail(request.Email)
            || string.IsNullOrEmpty(request.Password)
            || request.Password.Length is < 6 or > 50)
        {
            return Results.BadRequest(new { message = "Vui lòng nhập tên, số điện thoại hợp lệ, email hợp lệ nếu có và mật khẩu từ 6 đến 50 ký tự." });
        }

        var user = new UserDocument
        {
            Username = request.Username.Trim(),
            Phone = request.Phone,
            Email = NormalizeEmail(request.Email),
            CreatedAt = DateTime.UtcNow,
            CreatedByAdminId = principal.FindFirstValue("adminId"),
            CreatedByAdminName = GetAdminActorName(principal)
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

        return Results.Created($"/api/admin/users/{user.Id}", ToUserResponse(user, includeAudit: true));
    }

    private static async Task<IResult> UpdateCustomerProfile(
        string id,
        UpdateCustomerProfileRequest request,
        ClaimsPrincipal principal,
        MongoStoreDatabase database,
        CancellationToken cancellationToken)
    {
        if (!ObjectId.TryParse(id, out _))
        {
            return Results.NotFound();
        }

        return await SaveCustomerProfile(id, request, principal, database, cancellationToken);
    }

    private static async Task<IResult> SaveCustomerProfile(
        string id,
        UpdateCustomerProfileRequest request,
        ClaimsPrincipal principal,
        MongoStoreDatabase database,
        CancellationToken cancellationToken)
    {
        var username = request.Username?.Trim();
        var phone = request.Phone?.Trim();
        if (string.IsNullOrWhiteSpace(username)
            || username.Length > 80
            || !IsValidPhone(phone)
            || !IsValidEmail(request.Email))
        {
            return Results.BadRequest(new
            {
                message = "Vui lòng nhập tên, số điện thoại hợp lệ và email hợp lệ nếu có."
            });
        }

        var existingUser = await database.Users.Find(user => user.Id == id)
            .FirstOrDefaultAsync(cancellationToken);
        if (existingUser is null)
        {
            return Results.NotFound();
        }

        var changes = new List<string>();
        AddProfileChange(changes, "Họ tên", existingUser.Username, username);
        AddProfileChange(changes, "Số điện thoại", existingUser.Phone, phone);
        AddProfileChange(changes, "Email", existingUser.Email, NormalizeEmail(request.Email));
        if (changes.Count == 0)
        {
            return Results.Ok(ToUserResponse(existingUser, principal.HasClaim("adminLevel", "owner")
                || principal.HasClaim("adminLevel", "staff")));
        }

        var update = Builders<UserDocument>.Update
            .Set(user => user.Username, username)
            .Set(user => user.Phone, phone!)
            .Set(user => user.Email, NormalizeEmail(request.Email))
            .Push(user => user.ProfileChanges, CreateProfileChange(principal, changes));
        try
        {
            var user = await database.Users.FindOneAndUpdateAsync(
                customer => customer.Id == id,
                update,
                new FindOneAndUpdateOptions<UserDocument> { ReturnDocument = ReturnDocument.After },
                cancellationToken);
            return user is null
                ? Results.NotFound()
                : Results.Ok(ToUserResponse(user, principal.HasClaim("adminLevel", "owner")
                    || principal.HasClaim("adminLevel", "staff")));
        }
        catch (MongoWriteException exception) when (exception.WriteError?.Category == ServerErrorCategory.DuplicateKey)
        {
            return Results.Conflict(new { message = "Số điện thoại này đã được đăng ký cho tài khoản khác." });
        }
    }

    private static async Task<IResult> UpdateCustomerEmail(
        string id,
        UpdateCustomerEmailRequest request,
        ClaimsPrincipal principal,
        MongoStoreDatabase database,
        CancellationToken cancellationToken)
    {
        if (!ObjectId.TryParse(id, out _))
        {
            return Results.NotFound();
        }
        if (!IsValidEmail(request.Email))
        {
            return Results.BadRequest(new { message = "Vui lòng nhập địa chỉ email hợp lệ (tối đa 254 ký tự)." });
        }

        var existingUser = await database.Users.Find(user => user.Id == id)
            .FirstOrDefaultAsync(cancellationToken);
        if (existingUser is null)
        {
            return Results.NotFound();
        }

        var email = NormalizeEmail(request.Email);
        if (string.Equals(existingUser.Email, email, StringComparison.Ordinal))
        {
            return Results.Ok(ToUserResponse(existingUser, includeAudit: true));
        }

        var changes = new List<string>();
        AddProfileChange(changes, "Email", existingUser.Email, email);
        var update = Builders<UserDocument>.Update
            .Set(user => user.Email, email)
            .Push(user => user.ProfileChanges, CreateProfileChange(principal, changes));
        var user = await database.Users.FindOneAndUpdateAsync(
            customer => customer.Id == id,
            update,
            new FindOneAndUpdateOptions<UserDocument> { ReturnDocument = ReturnDocument.After },
            cancellationToken);
        return user is null ? Results.NotFound() : Results.Ok(ToUserResponse(user, includeAudit: true));
    }

    private static async Task<IResult> ResetCustomerPassword(
        string id,
        ResetCustomerPasswordRequest request,
        ClaimsPrincipal principal,
        MongoStoreDatabase database,
        IPasswordHasher<UserDocument> passwordHasher,
        CancellationToken cancellationToken)
    {
        if (!ObjectId.TryParse(id, out _))
        {
            return Results.NotFound();
        }
        if (string.IsNullOrEmpty(request.Password) || request.Password.Length is < 6 or > 50)
        {
            return Results.BadRequest(new { message = "Mật khẩu mới phải có từ 6 đến 50 ký tự." });
        }

        var user = await database.Users.Find(candidate => candidate.Id == id)
            .FirstOrDefaultAsync(cancellationToken);
        if (user is null)
        {
            return Results.NotFound();
        }

        var changedAt = DateTime.UtcNow;
        var audit = new PasswordChangeRecord
        {
            AdminId = principal.FindFirstValue("adminId") ?? "unknown-admin",
            AdminName = principal.FindFirstValue("adminName") ?? principal.Identity?.Name ?? "Admin",
            ChangedAt = changedAt
        };
        var update = Builders<UserDocument>.Update
            .Set(candidate => candidate.PasswordHash, passwordHasher.HashPassword(user, request.Password))
            .Push(candidate => candidate.PasswordChanges, audit);
        var result = await database.Users.UpdateOneAsync(
            candidate => candidate.Id == id,
            update,
            cancellationToken: cancellationToken);
        if (result.MatchedCount == 0)
        {
            return Results.NotFound();
        }

        await database.PasswordRecoveryRequests.UpdateManyAsync(
            recovery => recovery.Phone == user.Phone && recovery.Status == "pending",
            Builders<PasswordRecoveryRequestDocument>.Update
                .Set(recovery => recovery.Status, "resolved")
                .Set(recovery => recovery.ResolvedByAdminId, audit.AdminId)
                .Set(recovery => recovery.ResolvedByAdminName, audit.AdminName)
                .Set(recovery => recovery.ResolvedAt, changedAt),
            cancellationToken: cancellationToken);

        user.PasswordChanges.Add(audit);
        return Results.Ok(ToUserResponse(user, includeAudit: true));
    }

    private static async Task<IResult> GetPasswordRecoveryRequests(
        MongoStoreDatabase database,
        CancellationToken cancellationToken)
    {
        var requests = await database.PasswordRecoveryRequests
            .Find(recovery => recovery.Status == "pending")
            .SortBy(recovery => recovery.CreatedAt)
            .ToListAsync(cancellationToken);
        return Results.Ok(requests.Select(recovery => new
        {
            recovery.Id,
            recovery.Phone,
            recovery.Status,
            recovery.CreatedAt
        }));
    }

    private static async Task<IResult> UpdatePasswordRecoveryRequest(
        string id,
        PasswordRecoveryStatusRequest request,
        ClaimsPrincipal principal,
        MongoStoreDatabase database,
        CancellationToken cancellationToken)
    {
        if (!ObjectId.TryParse(id, out _))
        {
            return Results.NotFound();
        }
        if (request.Status is not "resolved" and not "dismissed")
        {
            return Results.BadRequest(new { message = "Trạng thái yêu cầu không hợp lệ." });
        }

        var update = Builders<PasswordRecoveryRequestDocument>.Update
            .Set(recovery => recovery.Status, request.Status)
            .Set(recovery => recovery.ResolvedByAdminId, principal.FindFirstValue("adminId"))
            .Set(recovery => recovery.ResolvedByAdminName, principal.FindFirstValue("adminName"))
            .Set(recovery => recovery.ResolvedAt, DateTime.UtcNow);
        var result = await database.PasswordRecoveryRequests.UpdateOneAsync(
            recovery => recovery.Id == id && recovery.Status == "pending",
            update,
            cancellationToken: cancellationToken);
        return result.MatchedCount == 0 ? Results.NotFound() : Results.NoContent();
    }

    private static async Task<IResult> GetAdminStaff(
        MongoStoreDatabase database,
        CancellationToken cancellationToken)
    {
        var staff = await database.AdminUsers.Find(Builders<AdminUserDocument>.Filter.Empty)
            .SortBy(admin => admin.Username)
            .ToListAsync(cancellationToken);
        return Results.Ok(staff.Select(ToAdminStaffResponse));
    }

    private static async Task<IResult> CreateAdminStaff(
        CreateAdminStaffRequest request,
        IConfiguration configuration,
        MongoStoreDatabase database,
        IPasswordHasher<AdminUserDocument> passwordHasher,
        CancellationToken cancellationToken)
    {
        var username = request.Username?.Trim().ToLowerInvariant();
        var displayName = request.DisplayName?.Trim();
        if (string.IsNullOrWhiteSpace(username)
            || username.Length > 40
            || !username.All(character => char.IsAsciiLetterOrDigit(character) || character is '.' or '_' or '-')
            || string.Equals(username, configuration["Admin:Username"], StringComparison.OrdinalIgnoreCase)
            || string.IsNullOrWhiteSpace(displayName)
            || displayName.Length > 80
            || string.IsNullOrEmpty(request.Password)
            || request.Password.Length is < 8 or > 100)
        {
            return Results.BadRequest(new
            {
                message = "Tên đăng nhập, tên hiển thị hoặc mật khẩu không hợp lệ. Mật khẩu nhân viên cần từ 8 ký tự."
            });
        }

        var admin = new AdminUserDocument
        {
            Username = username,
            DisplayName = displayName,
            PasswordHash = passwordHasher.HashPassword(new AdminUserDocument(), request.Password),
            CreatedAt = DateTime.UtcNow
        };
        try
        {
            await database.AdminUsers.InsertOneAsync(admin, cancellationToken: cancellationToken);
        }
        catch (MongoWriteException exception) when (exception.WriteError?.Category == ServerErrorCategory.DuplicateKey)
        {
            return Results.Conflict(new { message = "Tên đăng nhập admin này đã được sử dụng." });
        }

        return Results.Created($"/api/admin/staff/{admin.Id}", ToAdminStaffResponse(admin));
    }

    private static async Task<IResult> UpdateAdminStaffStatus(
        string id,
        AdminStaffStatusRequest request,
        MongoStoreDatabase database,
        CancellationToken cancellationToken)
    {
        if (!ObjectId.TryParse(id, out _))
        {
            return Results.NotFound();
        }
        if (request.Status is not "active" and not "blocked")
        {
            return Results.BadRequest(new { message = "Trạng thái tài khoản nhân viên không hợp lệ." });
        }

        var result = await database.AdminUsers.UpdateOneAsync(
            admin => admin.Id == id,
            Builders<AdminUserDocument>.Update.Set(admin => admin.Status, request.Status),
            cancellationToken: cancellationToken);
        return result.MatchedCount == 0 ? Results.NotFound() : Results.NoContent();
    }

    private static async Task<IResult> UpdateUserStatus(
        string id,
        UserStatusRequest request,
        ClaimsPrincipal principal,
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

        var existingUser = await database.Users.Find(user => user.Id == id)
            .FirstOrDefaultAsync(cancellationToken);
        if (existingUser is null)
        {
            return Results.NotFound();
        }

        if (existingUser.Status == request.Status)
        {
            return Results.Ok(ToUserResponse(existingUser, includeAudit: true));
        }

        var changes = new List<string> { $"Trạng thái: {existingUser.Status} -> {request.Status}" };
        var update = Builders<UserDocument>.Update
            .Set(user => user.Status, request.Status)
            .Push(user => user.ProfileChanges, CreateProfileChange(principal, changes));
        var user = await database.Users.FindOneAndUpdateAsync(
            customer => customer.Id == id,
            update,
            new FindOneAndUpdateOptions<UserDocument> { ReturnDocument = ReturnDocument.After },
            cancellationToken);
        return user is null ? Results.NotFound() : Results.Ok(ToUserResponse(user, includeAudit: true));
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
        ClaimsPrincipal principal,
        MongoStoreDatabase database,
        IPaymentService paymentService,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Customer)
            || request.Customer.Length > 120
            || !IsValidPhone(request.Phone)
            || string.IsNullOrWhiteSpace(request.Address)
            || request.Address.Length > 500
            || request.Items is null
            || request.Items.Count is 0 or > 100
            || !PaymentMethods.Contains(request.PaymentMethod)
            || request.Items.Any(item => string.IsNullOrWhiteSpace(item.Name)
                || item.Quantity is < 1 or > 100
                || item.Price < 0))
        {
            return Results.BadRequest(new { message = "Thông tin người nhận hoặc sản phẩm trong đơn hàng không hợp lệ." });
        }

        if (!paymentService.IsMethodEnabled(request.PaymentMethod))
        {
            return Results.Conflict(new { message = "Phương thức thanh toán hiện không khả dụng." });
        }

        if (request.Items.Any(item => !ObjectId.TryParse(item.Id, out _)))
        {
            return Results.BadRequest(new { message = "Một hoặc nhiều sản phẩm trong giỏ hàng không còn hợp lệ. Vui lòng tải lại danh sách sản phẩm." });
        }

        var productIds = request.Items.Select(item => item.Id).Distinct().ToList();
        var products = await database.Products
            .Find(Builders<ProductDocument>.Filter.In(product => product.Id, productIds))
            .ToListAsync(cancellationToken);
        var productsById = products.ToDictionary(product => product.Id);
        if (productsById.Count != productIds.Count
            || request.Items.Any(item => !productsById.TryGetValue(item.Id, out var product)
                || product.Status != "active"
                || product.Stock < request.Items
                    .Where(candidate => candidate.Id == item.Id)
                    .Sum(candidate => candidate.Quantity)))
        {
            return Results.BadRequest(new { message = "Một hoặc nhiều sản phẩm đã hết hàng hoặc không còn được bán." });
        }

        var now = DateTime.UtcNow;
        var order = new OrderDocument
        {
            OrderNumber = $"DH-{now:yyyyMMddHHmmss}-{RandomNumberGenerator.GetInt32(1000, 10000)}",
            Customer = request.Customer.Trim(),
            Phone = request.Phone,
            Address = request.Address.Trim(),
            UserId = principal.FindFirstValue("userId"),
            Items = request.Items.Select(item => new OrderItemDocument
            {
                Id = item.Id,
                Name = productsById[item.Id].Name,
                Price = productsById[item.Id].Price,
                Quantity = item.Quantity,
                Images = productsById[item.Id].Images,
                Image = null,
                Color = item.Color
            }).ToList(),
            TotalQuantity = request.Items.Sum(item => item.Quantity),
            Total = request.Items.Sum(item => productsById[item.Id].Price * item.Quantity),
            PaymentMethod = request.PaymentMethod,
            PaymentStatus = request.PaymentMethod == "cod" ? "unpaid" : "pending",
            CreatedAt = now,
            UpdatedAt = now
        };

        await database.Orders.InsertOneAsync(order, cancellationToken: cancellationToken);
        return Results.Created($"/api/admin/orders/{order.Id}", order);
    }

    private static async Task<IResult> StartOrderPayment(
        string id,
        ClaimsPrincipal principal,
        HttpContext context,
        MongoStoreDatabase database,
        IPaymentService paymentService,
        CancellationToken cancellationToken)
    {
        var userId = principal.FindFirstValue("userId");
        var order = await database.Orders.Find(current => current.Id == id && current.UserId == userId)
            .FirstOrDefaultAsync(cancellationToken);
        if (order is null)
        {
            return Results.NotFound(new { message = "Không tìm thấy đơn hàng." });
        }

        try
        {
            return Results.Ok(await paymentService.CreateCheckoutAsync(
                order,
                context.Connection.RemoteIpAddress?.ToString(),
                cancellationToken));
        }
        catch (PaymentUnavailableException exception)
        {
            return Results.Conflict(new { message = exception.Message });
        }
        catch (PaymentProviderException exception)
        {
            return Results.Problem(
                title: "Không thể khởi tạo thanh toán",
                detail: exception.Message,
                statusCode: StatusCodes.Status502BadGateway);
        }
    }

    private static async Task<IResult> VnPayReturn(
        HttpRequest request,
        IConfiguration configuration,
        IPaymentService paymentService,
        CancellationToken cancellationToken)
    {
        var result = await paymentService.ProcessVnPayCallbackAsync(request.Query, cancellationToken);
        var frontendReturnUrl = configuration["Payments:FrontendReturnUrl"];
        if (!Uri.TryCreate(frontendReturnUrl, UriKind.Absolute, out _))
        {
            return Results.Problem(
                title: "Chưa cấu hình trang kết quả thanh toán",
                statusCode: StatusCodes.Status503ServiceUnavailable);
        }

        var returnUrl = QueryHelpers.AddQueryString(frontendReturnUrl, new Dictionary<string, string?>
        {
            ["status"] = result.Status,
            ["orderNumber"] = result.OrderNumber,
            ["paymentMethod"] = "vnpay"
        });
        return Results.Redirect(returnUrl);
    }

    private static async Task<IResult> VnPayIpn(
        HttpRequest request,
        IPaymentService paymentService,
        CancellationToken cancellationToken)
    {
        var result = await paymentService.ProcessVnPayCallbackAsync(request.Query, cancellationToken);
        return Results.Ok(new VnPayIpnResponse(result.RspCode, result.Message));
    }

    private static async Task<IResult> ZaloPayCallback(
        ZaloPayCallbackRequest callback,
        IPaymentService paymentService,
        CancellationToken cancellationToken)
    {
        var result = await paymentService.ProcessZaloPayCallbackAsync(callback, cancellationToken);
        return Results.Ok(result);
    }

    private static async Task<IResult> GetCurrentUserOrders(
        ClaimsPrincipal principal,
        MongoStoreDatabase database,
        CancellationToken cancellationToken)
    {
        var userId = principal.FindFirstValue("userId");
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Results.Unauthorized();
        }

        var orders = await database.Orders
            .Find(order => order.UserId == userId)
            .SortByDescending(order => order.CreatedAt)
            .ToListAsync(cancellationToken);

        return Results.Ok(orders.Select(order => new
        {
            order.Id,
            order.OrderNumber,
            order.Status,
            order.PaymentMethod,
            order.PaymentStatus,
            order.Total,
            order.TotalQuantity,
            order.CreatedAt,
            items = order.Items.Select(item => new
            {
                item.Id,
                item.Name,
                item.Quantity
            })
        }));
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

    private static async Task<IResult> GetPendingOrderCount(
        MongoStoreDatabase database,
        CancellationToken cancellationToken)
    {
        var count = await database.Orders.CountDocumentsAsync(
            order => order.Status == "pending",
            cancellationToken: cancellationToken);
        return Results.Ok(new { count });
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
        ClaimsPrincipal principal,
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

        var existingOrder = await database.Orders.Find(order => order.Id == id)
            .FirstOrDefaultAsync(cancellationToken);
        if (existingOrder is null)
        {
            return Results.NotFound();
        }

        if (existingOrder.Status == request.Status)
        {
            return Results.Ok(existingOrder);
        }

        if (request.Status == "completed"
            && existingOrder.PaymentMethod != "cod"
            && existingOrder.PaymentStatus != "paid")
        {
            return Results.Conflict(new { message = "Chỉ có thể hoàn tất đơn khi đã xác nhận thanh toán." });
        }

        var update = Builders<OrderDocument>.Update
            .Set(order => order.Status, request.Status)
            .Set(order => order.UpdatedAt, DateTime.UtcNow)
            .Push(order => order.StatusHistory, new OrderStatusChange
            {
                PreviousStatus = existingOrder.Status,
                NewStatus = request.Status,
                AdminId = principal.FindFirstValue("adminId") ?? "",
                AdminName = GetAdminActorName(principal),
                AdminRole = GetAdminActorRole(principal)
            });
        if (request.Status == "completed" && existingOrder.PaymentMethod == "cod")
        {
            update = update.Set(order => order.PaymentStatus, "paid");
        }
        var order = await database.Orders.FindOneAndUpdateAsync(
            currentOrder => currentOrder.Id == id,
            update,
            new FindOneAndUpdateOptions<OrderDocument> { ReturnDocument = ReturnDocument.After },
            cancellationToken: cancellationToken);
        return order is null ? Results.NotFound() : Results.Ok(order);
    }

    private static async Task<IResult> UpdateOrderPaymentStatus(
        string id,
        OrderPaymentStatusRequest request,
        MongoStoreDatabase database,
        CancellationToken cancellationToken)
    {
        if (request.Status != "paid" && request.Status != "failed")
        {
            return Results.BadRequest(new { message = "Trạng thái thanh toán không hợp lệ." });
        }

        var existingOrder = await database.Orders.Find(order => order.Id == id)
            .FirstOrDefaultAsync(cancellationToken);
        if (existingOrder is null)
        {
            return Results.NotFound();
        }
        if (existingOrder.PaymentMethod != "bank_transfer")
        {
            return Results.Conflict(new { message = "Chỉ có thể cập nhật thủ công trạng thái chuyển khoản." });
        }
        if (existingOrder.PaymentStatus == "paid" && request.Status != "paid")
        {
            return Results.Conflict(new { message = "Không thể đổi trạng thái của giao dịch đã thanh toán." });
        }

        var order = await database.Orders.FindOneAndUpdateAsync(
            current => current.Id == id,
            Builders<OrderDocument>.Update
                .Set(current => current.PaymentStatus, request.Status)
                .Set(current => current.UpdatedAt, DateTime.UtcNow),
            new FindOneAndUpdateOptions<OrderDocument> { ReturnDocument = ReturnDocument.After },
            cancellationToken: cancellationToken);
        return order is null ? Results.NotFound() : Results.Ok(order);
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

    private static object ToUserResponse(UserDocument user, bool includeAudit = false)
    {
        var response = new Dictionary<string, object?>
        {
            ["id"] = user.Id,
            ["username"] = user.Username,
            ["phone"] = user.Phone,
            ["email"] = user.Email,
            ["status"] = user.Status,
            ["createdAt"] = user.CreatedAt,
            ["passwordChanges"] = user.PasswordChanges.Select(change => new
            {
                change.AdminName,
                change.ChangedAt
            })
        };

        if (includeAudit)
        {
            response["createdByAdminId"] = user.CreatedByAdminId;
            response["createdByAdminName"] = user.CreatedByAdminName;
            response["profileChanges"] = user.ProfileChanges.Select(change => new
            {
                change.ActorId,
                change.ActorName,
                change.ActorRole,
                change.ChangedAt,
                change.Changes
            });
        }

        return response;
    }

    private static void AddProfileChange(
        ICollection<string> changes,
        string field,
        string? previousValue,
        string? newValue)
    {
        var previous = string.IsNullOrWhiteSpace(previousValue) ? "(trống)" : previousValue.Trim();
        var next = string.IsNullOrWhiteSpace(newValue) ? "(trống)" : newValue.Trim();
        if (!string.Equals(previous, next, StringComparison.Ordinal))
        {
            changes.Add($"{field}: {previous} -> {next}");
        }
    }

    private static CustomerProfileChange CreateProfileChange(
        ClaimsPrincipal principal,
        List<string> changes) => new()
    {
        ActorId = principal.FindFirstValue("adminId") ?? principal.FindFirstValue("userId") ?? "",
        ActorName = GetAdminActorName(principal),
        ActorRole = GetAdminActorRole(principal),
        ChangedAt = DateTime.UtcNow,
        Changes = changes
    };

    private static string GetAdminActorName(ClaimsPrincipal principal) =>
        principal.FindFirstValue("adminName")
        ?? principal.FindFirstValue(ClaimTypes.Name)
        ?? principal.FindFirstValue("adminUsername")
        ?? principal.FindFirstValue("userId")
        ?? "Khách hàng";

    private static string GetAdminActorRole(ClaimsPrincipal principal) =>
        principal.FindFirstValue("adminLevel")
        ?? principal.FindFirstValue(ClaimTypes.Role)
        ?? "customer";

    private static bool IsValidEmail(string? email) =>
        string.IsNullOrWhiteSpace(email)
        || (email.Length <= 254 && new EmailAddressAttribute().IsValid(email.Trim()));

    private static string? NormalizeEmail(string? email) =>
        string.IsNullOrWhiteSpace(email) ? null : email.Trim();

    private static object ToAdminStaffResponse(AdminUserDocument admin) => new
    {
        admin.Id,
        admin.Username,
        admin.DisplayName,
        admin.Status,
        admin.CreatedAt
    };

    private static string CreateUserToken(UserDocument user, IConfiguration configuration)
    {
        var now = DateTime.UtcNow;
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id),
            new Claim("userId", user.Id),
            new Claim(ClaimTypes.Role, "customer")
        };
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(configuration["Jwt:Key"]!));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(
            issuer: configuration["Jwt:Issuer"],
            audience: configuration["Jwt:Audience"],
            claims: claims,
            notBefore: now,
            expires: now.AddHours(12),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

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
