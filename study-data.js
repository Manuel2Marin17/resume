// Interview Questions Data
const interviewData = {
    dotnet: [
        {
            question: "Explain the differences between .NET Framework and .NET Core/.NET 8.",
            answer: ".NET Framework is Windows-only and legacy. .NET Core (now .NET 5+) is cross-platform, open-source, with better performance. .NET 8 adds native AOT compilation and cloud-native features."
        },
        {
            question: "What are the key principles of dependency injection in .NET Core?",
            answer: "DI promotes loose coupling and testability. Three lifetimes: Singleton (one instance for app), Scoped (one per request), Transient (new each time). Register services → Inject via constructor → Use in methods.",
            code: `// Program.cs - Registering services
var builder = WebApplication.CreateBuilder(args);

// Different service lifetimes
builder.Services.AddSingleton<ISingletonService, SingletonService>();
builder.Services.AddScoped<IScopedService, ScopedService>();
builder.Services.AddTransient<ITransientService, TransientService>();

// Register with implementation factory
builder.Services.AddScoped<IEmailService>(provider => {
    var config = provider.GetRequiredService<IConfiguration>();
    return new EmailService(config["SmtpServer"]);
});

// Register multiple implementations
builder.Services.AddScoped<INotificationService, EmailNotificationService>();
builder.Services.AddScoped<INotificationService, SmsNotificationService>();

// Constructor injection
public class OrderService
{
    private readonly IOrderRepository _repository;
    private readonly IEmailService _emailService;
    private readonly ILogger<OrderService> _logger;
    
    public OrderService(
        IOrderRepository repository,
        IEmailService emailService,
        ILogger<OrderService> logger)
    {
        _repository = repository;
        _emailService = emailService;
        _logger = logger;
    }
    
    public async Task<Order> CreateOrderAsync(OrderDto dto)
    {
        _logger.LogInformation("Creating order for {UserId}", dto.UserId);
        
        var order = await _repository.CreateAsync(dto);
        await _emailService.SendOrderConfirmationAsync(order);
        
        return order;
    }
}

// Using IServiceProvider for manual resolution
public class NotificationManager
{
    private readonly IServiceProvider _serviceProvider;
    
    public NotificationManager(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }
    
    public async Task NotifyAllChannels(string message)
    {
        // Resolve all implementations
        var services = _serviceProvider.GetServices<INotificationService>();
        
        var tasks = services.Select(s => s.SendAsync(message));
        await Task.WhenAll(tasks);
    }
}`
        },
        {
            question: "How do you handle asynchronous programming in C#?",
            answer: "Use async/await with Task-based programming. Key rules: Avoid async void (except event handlers), use ConfigureAwait(false) in libraries, wrap in try-catch for error handling, Task.WhenAll for parallel operations.",
            code: `// Basic async/await pattern
public async Task<User> GetUserAsync(int id)
{
    using var client = new HttpClient();
    var response = await client.GetAsync($"api/users/{id}");
    response.EnsureSuccessStatusCode();
    
    var json = await response.Content.ReadAsStringAsync();
    return JsonSerializer.Deserialize<User>(json);
}

// Avoid async void - use async Task
// Bad
public async void ProcessData() // Can't catch exceptions!
{
    await Task.Delay(1000);
    throw new Exception("This won't be caught");
}

// Good
public async Task ProcessDataAsync()
{
    await Task.Delay(1000);
    // Exceptions can be properly handled
}

// Exception handling in async methods
public async Task<Result<T>> SafeExecuteAsync<T>(Func<Task<T>> operation)
{
    try
    {
        var result = await operation();
        return Result<T>.Success(result);
    }
    catch (HttpRequestException ex)
    {
        _logger.LogError(ex, "HTTP request failed");
        return Result<T>.Failure("Network error occurred");
    }
    catch (TaskCanceledException)
    {
        return Result<T>.Failure("Operation was cancelled");
    }
}

// ConfigureAwait for library code
public async Task<string> ReadFileAsync(string path)
{
    using var stream = File.OpenRead(path);
    using var reader = new StreamReader(stream);
    
    // ConfigureAwait(false) in library code
    return await reader.ReadToEndAsync().ConfigureAwait(false);
}

// Parallel async operations
public async Task<DashboardData> GetDashboardDataAsync(int userId)
{
    // Start all tasks simultaneously
    var userTask = GetUserAsync(userId);
    var ordersTask = GetUserOrdersAsync(userId);
    var statsTask = GetUserStatsAsync(userId);
    
    // Wait for all to complete
    await Task.WhenAll(userTask, ordersTask, statsTask);
    
    return new DashboardData
    {
        User = await userTask,
        Orders = await ordersTask,
        Stats = await statsTask
    };
}

// Async enumerable with cancellation
public async IAsyncEnumerable<DataPoint> StreamDataAsync(
    [EnumeratorCancellation] CancellationToken ct = default)
{
    while (!ct.IsCancellationRequested)
    {
        var data = await FetchNextDataPointAsync();
        yield return data;
        
        await Task.Delay(1000, ct);
    }
}`
        },
        {
            question: "What is the difference between Task and ValueTask?",
            answer: "ValueTask is a struct that avoids allocation when result is synchronous - use for hot paths. Task is a class that always allocates. ValueTask can only be awaited once - convert to Task with AsTask() if needed multiple times.",
            code: `// ValueTask for synchronous fast path
public interface ICache
{
    ValueTask<T?> GetAsync<T>(string key);
}

public class MemoryCache : ICache
{
    private readonly Dictionary<string, object> _cache = new();
    
    public ValueTask<T?> GetAsync<T>(string key)
    {
        // Synchronous path - no allocation
        if (_cache.TryGetValue(key, out var value))
        {
            return new ValueTask<T?>((T)value);
        }
        
        // Async path - falls back to Task
        return new ValueTask<T?>(LoadFromDatabaseAsync<T>(key));
    }
    
    private async Task<T?> LoadFromDatabaseAsync<T>(string key)
    {
        await Task.Delay(100); // Simulate DB call
        return default(T);
    }
}

// DO NOT do this - ValueTask can only be awaited once!
public async Task BadValueTaskUsage()
{
    ValueTask<int> valueTask = GetValueAsync();
    
    var result1 = await valueTask; // OK
    var result2 = await valueTask; // ERROR! Already consumed
}

// Convert to Task if you need multiple awaits
public async Task GoodValueTaskUsage()
{
    ValueTask<int> valueTask = GetValueAsync();
    
    // Convert to Task for multiple operations
    Task<int> task = valueTask.AsTask();
    
    var result1 = await task;
    var result2 = await task; // OK with Task
}

// Performance comparison example
public class Repository
{
    private readonly Dictionary<int, User> _cache = new();
    private readonly DbContext _context;
    
    // Task version - always allocates
    public async Task<User?> GetUserTaskAsync(int id)
    {
        if (_cache.TryGetValue(id, out var user))
            return user;
            
        return await _context.Users.FindAsync(id);
    }
    
    // ValueTask version - no allocation for cache hits
    public ValueTask<User?> GetUserValueTaskAsync(int id)
    {
        if (_cache.TryGetValue(id, out var user))
            return new ValueTask<User?>(user); // No heap allocation
            
        return new ValueTask<User?>(LoadUserAsync(id));
    }
    
    private async Task<User?> LoadUserAsync(int id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user != null)
            _cache[id] = user;
        return user;
    }
}`
        },
        {
            question: "Explain memory management and garbage collection in .NET.",
            answer: "GC has generations 0/1/2 plus Large Object Heap (>85KB). Two modes: Workstation vs Server, Concurrent vs Background. Optimize with object pooling, ArrayPool, Span<T>, and prefer structs over classes.",
            code: `// Understanding GC generations
public class GCExample
{
    public void DemonstrateGenerations()
    {
        // Gen 0 - short-lived objects
        var temp = new byte[1024]; // Small, short-lived
        
        // Force garbage collection to show generations
        GC.Collect(0); // Collect only Gen 0
        
        // Objects that survive move to Gen 1
        var data = new List<string>();
        GC.Collect(0);
        
        // Gen 2 - long-lived objects
        GC.Collect(1); // Now data is in Gen 2
        
        // Large Object Heap (> 85KB)
        var largeArray = new byte[100_000]; // Goes directly to LOH
        
        Console.WriteLine($"Gen 0: {GC.CollectionCount(0)}");
        Console.WriteLine($"Gen 1: {GC.CollectionCount(1)}");
        Console.WriteLine($"Gen 2: {GC.CollectionCount(2)}");
    }
}

// Object pooling to reduce allocations
public class BufferPool
{
    private readonly ObjectPool<StringBuilder> _stringBuilderPool;
    
    public BufferPool()
    {
        var provider = new DefaultObjectPoolProvider();
        var policy = new StringBuilderPooledObjectPolicy();
        _stringBuilderPool = provider.Create(policy);
    }
    
    public string ProcessData(string[] items)
    {
        // Rent from pool instead of creating new
        var sb = _stringBuilderPool.Get();
        try
        {
            foreach (var item in items)
            {
                sb.AppendLine(item);
            }
            return sb.ToString();
        }
        finally
        {
            // Return to pool
            _stringBuilderPool.Return(sb);
        }
    }
}

// Using ArrayPool to avoid LOH allocations
public class DataProcessor
{
    public async Task ProcessLargeDataAsync(Stream stream)
    {
        // Rent array from pool
        var buffer = ArrayPool<byte>.Shared.Rent(4096);
        try
        {
            int bytesRead;
            while ((bytesRead = await stream.ReadAsync(buffer, 0, buffer.Length)) > 0)
            {
                ProcessBuffer(buffer.AsSpan(0, bytesRead));
            }
        }
        finally
        {
            // Always return to pool
            ArrayPool<byte>.Shared.Return(buffer, clearArray: true);
        }
    }
    
    private void ProcessBuffer(ReadOnlySpan<byte> data)
    {
        // Process without allocating
    }
}

// Configure GC settings
// In csproj or runtimeconfig.json
<PropertyGroup>
    <ServerGarbageCollection>true</ServerGarbageCollection>
    <ConcurrentGarbageCollection>true</ConcurrentGarbageCollection>
    <RetainVMGarbageCollection>true</RetainVMGarbageCollection>
</PropertyGroup>

// Memory-efficient string operations with Span<T>
public static class StringExtensions
{
    public static int CountOccurrences(this string text, char target)
    {
        // Use Span to avoid allocations
        ReadOnlySpan<char> span = text.AsSpan();
        int count = 0;
        
        foreach (char c in span)
        {
            if (c == target) count++;
        }
        
        return count;
    }
}`
        },
        {
            question: "What are nullable reference types in C# 8+?",
            answer: "Reference types are non-null by default in C# 8+. Add ? to mark nullable. Compiler warns about potential null references. Use attributes like NotNull, NotNullWhen, MemberNotNullWhen for flow analysis.",
            code: `// Enable nullable reference types in csproj
<Nullable>enable</Nullable>

// Or per file
#nullable enable

public class UserService
{
    // Non-nullable by default
    private readonly IUserRepository _repository;
    private readonly ILogger<UserService> _logger;
    
    // Nullable reference type
    private ICache? _cache;
    
    public UserService(IUserRepository repository, ILogger<UserService> logger)
    {
        _repository = repository; // Compiler ensures not null
        _logger = logger;
    }
    
    // Return type indicates it might be null
    public async Task<User?> GetUserAsync(int id)
    {
        // Null-conditional operator
        var cached = await _cache?.GetAsync<User>($"user_{id}");
        if (cached != null)
            return cached;
            
        return await _repository.FindByIdAsync(id);
    }
    
    // Non-null return type with null-forgiving operator
    public async Task<User> GetUserOrThrowAsync(int id)
    {
        var user = await GetUserAsync(id);
        
        // Null check with pattern matching
        if (user is null)
            throw new UserNotFoundException(id);
            
        return user; // Compiler knows it's not null here
    }
    
    // Nullable annotations for better API design
    public void ProcessUser(
        User user,                    // Cannot be null
        string? nickname,             // Can be null
        [NotNull] string? email)      // Nullable but validated
    {
        // Compiler warning if not checked
        var length = nickname?.Length ?? 0;
        
        // After this, compiler knows email is not null
        if (string.IsNullOrEmpty(email))
            throw new ArgumentNullException(nameof(email));
            
        var domain = email.Split('@')[1]; // No warning
    }
    
    // Nullable with generics
    public class Result<T> where T : notnull
    {
        public T? Value { get; init; }
        public string? Error { get; init; }
        
        [MemberNotNullWhen(true, nameof(Value))]
        [MemberNotNullWhen(false, nameof(Error))]
        public bool IsSuccess => Value != null;
    }
    
    // Using nullable attributes
    public bool TryGetUser(int id, [NotNullWhen(true)] out User? user)
    {
        user = _repository.FindByIdAsync(id).Result;
        return user != null;
    }
}

// Nullable value types (different from reference types)
public class OrderService
{
    // Nullable value type (struct)
    public DateTime? DeliveryDate { get; set; }
    
    // Nullable reference type (class)
    public string? TrackingNumber { get; set; }
    
    public void UpdateDelivery(DateTime? date, string? tracking)
    {
        // Value type: use HasValue
        if (date.HasValue)
        {
            DeliveryDate = date.Value;
        }
        
        // Reference type: use null check
        if (!string.IsNullOrWhiteSpace(tracking))
        {
            TrackingNumber = tracking;
        }
    }
}`
        },
        {
            question: "How do you use Span<T> and Memory<T> for performance?",
            answer: "Span<T> provides stack-allocated views without allocation, sync-only. Memory<T> can live on heap and works with async. Use for parsing and slicing data without copying. ReadOnlySpan for string manipulation.",
            code: `// Span<T> for zero-allocation string parsing
public static class CsvParser
{
    public static List<string> ParseLine(string line)
    {
        var results = new List<string>();
        ReadOnlySpan<char> remaining = line.AsSpan();
        
        while (!remaining.IsEmpty)
        {
            int commaIndex = remaining.IndexOf(',');
            
            if (commaIndex == -1)
            {
                // Last field
                results.Add(remaining.ToString());
                break;
            }
            
            // Slice without allocation
            results.Add(remaining.Slice(0, commaIndex).ToString());
            remaining = remaining.Slice(commaIndex + 1);
        }
        
        return results;
    }
}

// Memory<T> for async scenarios
public class BufferProcessor
{
    private readonly Memory<byte> _buffer;
    
    public BufferProcessor(int size)
    {
        _buffer = new byte[size];
    }
    
    public async Task<int> ReadAsync(Stream stream)
    {
        // Memory<T> can be used with async
        return await stream.ReadAsync(_buffer);
    }
    
    public void Process()
    {
        // Convert to Span for synchronous processing
        Span<byte> span = _buffer.Span;
        
        // Manipulate without copying
        span.Fill(0);
        span.Slice(0, 10).Fill(255);
    }
}

// High-performance string building without allocations
public ref struct ValueStringBuilder
{
    private Span<char> _chars;
    private int _pos;
    
    public ValueStringBuilder(Span<char> initialBuffer)
    {
        _chars = initialBuffer;
        _pos = 0;
    }
    
    public void Append(ReadOnlySpan<char> value)
    {
        if (_pos + value.Length > _chars.Length)
            Grow(value.Length);
            
        value.CopyTo(_chars.Slice(_pos));
        _pos += value.Length;
    }
    
    public void AppendLine(ReadOnlySpan<char> value)
    {
        Append(value);
        Append(Environment.NewLine);
    }
    
    public override string ToString()
    {
        return _chars.Slice(0, _pos).ToString();
    }
    
    private void Grow(int additionalCapacity)
    {
        // Implementation for growing buffer
    }
}

// Stack-allocated array with Span
public static class HashHelper
{
    public static string ComputeHash(ReadOnlySpan<byte> data)
    {
        // Stack allocate for small data
        Span<byte> hash = stackalloc byte[32];
        
        using (var sha256 = SHA256.Create())
        {
            sha256.TryComputeHash(data, hash, out _);
        }
        
        // Convert to hex without allocations
        Span<char> chars = stackalloc char[64];
        for (int i = 0; i < hash.Length; i++)
        {
            hash[i].TryFormat(chars.Slice(i * 2, 2), out _, "X2");
        }
        
        return chars.ToString();
    }
}

// Efficient array operations
public static class ArrayExtensions
{
    public static void RotateLeft<T>(Span<T> span, int positions)
    {
        positions %= span.Length;
        if (positions == 0) return;
        
        // Efficient rotation without allocating new array
        span.Slice(0, positions).Reverse();
        span.Slice(positions).Reverse();
        span.Reverse();
    }
}`
        },
        {
            question: "Explain different types of Action Results in ASP.NET Core.",
            answer: "IActionResult for flexible return types. ActionResult<T> for strongly-typed returns with implicit operators. Common results: Ok(), BadRequest(), NotFound(). Prefer ActionResult<T> for better OpenAPI documentation."
        },
        {
            question: "What are record types and when do you use them?",
            answer: "Records are immutable types with value equality. Use for DTOs and domain models. Features: automatic equality, 'with' expressions for non-destructive updates, positional parameters, deconstruction support.",
            code: `// Basic record declaration
public record Person(string FirstName, string LastName, DateTime BirthDate);

// Record with additional members
public record Employee(
    string FirstName, 
    string LastName, 
    DateTime BirthDate,
    string EmployeeId,
    decimal Salary) : Person(FirstName, LastName, BirthDate)
{
    // Computed property
    public int Age => DateTime.Now.Year - BirthDate.Year;
    
    // Custom validation
    public Employee
    {
        if (Salary < 0)
            throw new ArgumentException("Salary cannot be negative");
    }
}

// Using records for DTOs
public record CreateUserRequest(
    string Email,
    string Password,
    string? PhoneNumber = null);

public record UserResponse(
    Guid Id,
    string Email,
    DateTime CreatedAt,
    string Role);

// Value equality demonstration
var user1 = new Person("John", "Doe", new DateTime(1990, 1, 1));
var user2 = new Person("John", "Doe", new DateTime(1990, 1, 1));
Console.WriteLine(user1 == user2); // True (value equality)

// With-expressions for immutable updates
var john = new Employee("John", "Doe", new DateTime(1990, 1, 1), "E123", 50000m);
var johnWithRaise = john with { Salary = 55000m };
var johnSmith = john with { LastName = "Smith" };

// Record structs (C# 10+)
public readonly record struct Point(double X, double Y)
{
    public double Distance => Math.Sqrt(X * X + Y * Y);
}

// Deconstruction
var (firstName, lastName, birthDate) = john;
Console.WriteLine($"{firstName} {lastName}");

// Pattern matching with records
public decimal CalculateDiscount(Person person) => person switch
{
    Employee { Salary: > 100000 } => 0.20m,
    Employee { Age: >= 65 } => 0.15m,
    Employee => 0.10m,
    _ => 0.05m
};

// Records for domain events
public abstract record DomainEvent(Guid Id, DateTime OccurredAt);

public record OrderPlaced(
    Guid Id,
    DateTime OccurredAt,
    Guid OrderId,
    Guid CustomerId,
    decimal TotalAmount) : DomainEvent(Id, OccurredAt);

// Using records in collections with value equality
var orders = new HashSet<OrderPlaced>();
var order1 = new OrderPlaced(Guid.NewGuid(), DateTime.Now, Guid.NewGuid(), Guid.NewGuid(), 100m);
var order2 = order1 with { }; // Create copy
Console.WriteLine(orders.Add(order1)); // True
Console.WriteLine(orders.Add(order2)); // False (same values)`
        },
        {
            question: "How do you implement middleware in ASP.NET Core?",
            answer: "Middleware forms a pipeline: Request → MW1 → MW2 → Response. Each middleware can process requests, modify response, or short-circuit. Implement with InvokeAsync(HttpContext) method or inline with app.Use().",
            code: `// Custom middleware class
public class RequestTimingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RequestTimingMiddleware> _logger;
    
    public RequestTimingMiddleware(
        RequestDelegate next,
        ILogger<RequestTimingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }
    
    public async Task InvokeAsync(HttpContext context)
    {
        var stopwatch = Stopwatch.StartNew();
        
        try
        {
            // Before passing to next middleware
            context.Response.OnStarting(() =>
            {
                context.Response.Headers.Add(
                    "X-Response-Time", 
                    stopwatch.ElapsedMilliseconds.ToString());
                return Task.CompletedTask;
            });
            
            await _next(context); // Call next middleware
        }
        finally
        {
            // After response comes back
            stopwatch.Stop();
            _logger.LogInformation(
                "Request {Method} {Path} took {ElapsedMs}ms",
                context.Request.Method,
                context.Request.Path,
                stopwatch.ElapsedMilliseconds);
        }
    }
}

// Extension method for clean registration
public static class MiddlewareExtensions
{
    public static IApplicationBuilder UseRequestTiming(
        this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<RequestTimingMiddleware>();
    }
}

// In Program.cs - middleware pipeline order matters!
var app = builder.Build();

// Built-in middleware
app.UseExceptionHandler("/Error");
app.UseHsts();
app.UseHttpsRedirection();
app.UseStaticFiles();

// Custom middleware
app.UseRequestTiming();

// Inline middleware with app.Use
app.Use(async (context, next) =>
{
    // Add security headers
    context.Response.Headers.Add("X-Content-Type-Options", "nosniff");
    context.Response.Headers.Add("X-Frame-Options", "DENY");
    
    await next();
});

// Conditional middleware
app.UseWhen(context => context.Request.Path.StartsWithSegments("/api"),
    appBuilder =>
    {
        appBuilder.UseMiddleware<ApiKeyAuthenticationMiddleware>();
    });

// Terminal middleware with app.Run
app.MapGet("/health", () => Results.Ok(new { Status = "Healthy" }));

app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// Short-circuiting middleware
public class RateLimitingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IMemoryCache _cache;
    
    public async Task InvokeAsync(HttpContext context)
    {
        var ipAddress = context.Connection.RemoteIpAddress?.ToString();
        var key = $"rate_limit_{ipAddress}";
        
        if (_cache.TryGetValue<int>(key, out var requestCount))
        {
            if (requestCount >= 100)
            {
                // Short-circuit - don't call next
                context.Response.StatusCode = 429;
                await context.Response.WriteAsync("Rate limit exceeded");
                return;
            }
        }
        
        _cache.Set(key, requestCount + 1, TimeSpan.FromMinutes(1));
        await _next(context);
    }
}`
        },
        {
            question: "Explain ConfigureAwait and SynchronizationContext.",
            answer: "ConfigureAwait(false) prevents capturing synchronization context - improves performance and avoids deadlocks. Use in library code. Default (true) preserves context, needed for UI updates or HttpContext access."
        },
        {
            question: "What is pattern matching in C# and its evolution?",
            answer: "Evolution: C# 7 added type/constant patterns. C# 8: property/tuple patterns. C# 9: relational (<,>) and logical (and/or). C# 10: nested properties. C# 11: list patterns [1,2,..]. Use switch expressions for concise code.",
            code: `// C# 7: Type and constant patterns
public string DescribeValue(object value)
{
    switch (value)
    {
        case null:
            return "null";
        case int n when n > 0:
            return $"Positive integer: {n}";
        case string s:
            return $"String of length {s.Length}";
        case bool b:
            return b ? "True" : "False";
        default:
            return "Unknown";
    }
}

// C# 8: Switch expressions and property patterns
public decimal CalculateDiscount(Customer customer) => customer switch
{
    { IsPremium: true, YearsActive: > 5 } => 0.20m,
    { IsPremium: true } => 0.10m,
    { Orders.Count: > 10 } => 0.05m,
    _ => 0m
};

// C# 8: Tuple patterns
public string RockPaperScissors(string first, string second) => 
    (first, second) switch
    {
        ("rock", "scissors") or ("scissors", "paper") or ("paper", "rock") => "First wins",
        ("rock", "paper") or ("paper", "scissors") or ("scissors", "rock") => "Second wins",
        _ => "Draw"
    };

// C# 9: Relational and logical patterns
public string CategorizeAge(int age) => age switch
{
    < 0 => "Invalid",
    < 13 => "Child",
    < 18 => "Teenager",
    < 65 => "Adult",
    _ => "Senior"
};

// C# 9: Combining patterns with 'and', 'or', 'not'
public bool IsWeekend(DateTime date) => date.DayOfWeek is DayOfWeek.Saturday or DayOfWeek.Sunday;

public string ProcessOrder(Order order) => order switch
{
    { Status: OrderStatus.Pending, Total: > 100 and < 1000 } => "Process normally",
    { Status: OrderStatus.Pending, Total: >= 1000 } => "Requires approval",
    { Status: not OrderStatus.Cancelled } => "Already processed",
    _ => "Cancelled"
};

// C# 10: Extended property patterns
public bool IsHighValueCustomer(Customer customer) => customer is
{
    Account: { Balance: > 10000, Type: AccountType.Premium },
    Orders: { Count: > 50 }
};

// C# 11: List patterns
public string DescribeArray(int[] array) => array switch
{
    [] => "Empty array",
    [var single] => $"Single element: {single}",
    [var first, var second] => $"Two elements: {first}, {second}",
    [1, 2, ..] => "Starts with 1, 2",
    [.., var last] => $"Last element is {last}",
    [var first, .., var last] => $"First: {first}, Last: {last}"
};

// Pattern matching with generics and constraints
public T ProcessResult<T>(Result<T> result) where T : class
{
    return result switch
    {
        { IsSuccess: true, Value: not null } success => success.Value,
        { IsSuccess: false, Error: var error } => throw new Exception(error),
        _ => throw new InvalidOperationException()
    };
}

// Recursive patterns with nested objects
public void ProcessNode(TreeNode node)
{
    var description = node switch
    {
        { Left: null, Right: null } => "Leaf node",
        { Left: { Value: var l }, Right: { Value: var r } } => $"Node with children: {l}, {r}",
        { Left: null, Right: { } } => "Only right child",
        { Left: { }, Right: null } => "Only left child",
        _ => "Unknown"
    };
}`
        },
        {
            question: "How do you handle global exception handling in ASP.NET Core?",
            answer: ".NET 8+ uses IExceptionHandler interface. Legacy apps use UseExceptionHandler. Return ProblemDetails for standard error responses (RFC 7807). Map exceptions to appropriate HTTP status codes and always log.",
            code: `// .NET 8+ with IExceptionHandler
public class GlobalExceptionHandler : IExceptionHandler
{
    private readonly ILogger<GlobalExceptionHandler> _logger;
    
    public GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger)
    {
        _logger = logger;
    }
    
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        _logger.LogError(exception, 
            "Exception occurred: {Message}", exception.Message);
        
        var problemDetails = CreateProblemDetails(exception);
        
        httpContext.Response.StatusCode = problemDetails.Status ?? 500;
        await httpContext.Response.WriteAsJsonAsync(problemDetails, cancellationToken);
        
        return true;
    }
    
    private static ProblemDetails CreateProblemDetails(Exception exception) => 
        exception switch
        {
            NotFoundException notFound => new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "Resource not found",
                Detail = notFound.Message,
                Type = "https://datatracker.ietf.org/doc/html/rfc7231#section-6.5.4"
            },
            ValidationException validation => new ValidationProblemDetails(
                validation.Errors.ToDictionary(e => e.PropertyName, e => new[] { e.ErrorMessage }))
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Validation failed"
            },
            UnauthorizedException => new ProblemDetails
            {
                Status = StatusCodes.Status401Unauthorized,
                Title = "Unauthorized",
                Detail = "Authentication required"
            },
            _ => new ProblemDetails
            {
                Status = StatusCodes.Status500InternalServerError,
                Title = "An error occurred",
                Detail = "An unexpected error occurred while processing your request"
            }
        };
}

// Register in Program.cs
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails();

// Custom exception types
public class NotFoundException : Exception
{
    public NotFoundException(string message) : base(message) { }
}

public class ValidationException : Exception
{
    public IReadOnlyList<ValidationError> Errors { get; }
    
    public ValidationException(IReadOnlyList<ValidationError> errors)
        : base("Validation failed")
    {
        Errors = errors;
    }
}

// Alternative: Exception middleware for older versions
public class ExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionMiddleware> _logger;
    
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An exception occurred");
            await HandleExceptionAsync(context, ex);
        }
    }
    
    private static async Task HandleExceptionAsync(
        HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/problem+json";
        
        var response = exception switch
        {
            NotFoundException => new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "Not Found",
                Detail = exception.Message
            },
            _ => new ProblemDetails
            {
                Status = StatusCodes.Status500InternalServerError,
                Title = "Internal Server Error",
                Detail = "An error occurred while processing your request"
            }
        };
        
        context.Response.StatusCode = response.Status ?? 500;
        await context.Response.WriteAsJsonAsync(response);
    }
}

// Result pattern for explicit error handling
public class Result<T>
{
    public T? Value { get; }
    public Error? Error { get; }
    public bool IsSuccess => Error == null;
    
    private Result(T? value, Error? error)
    {
        Value = value;
        Error = error;
    }
    
    public static Result<T> Success(T value) => new(value, null);
    public static Result<T> Failure(Error error) => new(default, error);
}`
        },
        {
            question: "What are channels and how do they compare to other producer-consumer patterns?",
            answer: "Channels provide async producer-consumer patterns. Better than BlockingCollection for async scenarios. Support bounded/unbounded capacity and multiple readers/writers. Create with Channel<T>.CreateUnbounded() or CreateBounded()."
        },
        {
            question: "Explain the new Native AOT features in .NET 8.",
            answer: "Native AOT compiles to native code without JIT. Benefits: faster startup, lower memory usage, self-contained executables. Limitations: larger binaries, no dynamic loading, limited reflection support."
        }
    ],
    angular: [
        {
            question: "Explain Angular's change detection strategy in detail.",
            answer: "Zone.js patches async operations to trigger change detection. Default strategy checks all components top-down. OnPush only checks when @Input changes, events fire, or observables emit. Best used with immutable data.",
            code: `// Default Change Detection
@Component({
  selector: 'app-default',
  template: '{{ data }}'
})
export class DefaultComponent {
  data = 'Updates on any change';
}

// OnPush Change Detection
@Component({
  selector: 'app-optimized',
  template: '{{ user.name }}',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OptimizedComponent {
  @Input() user: User;
  
  constructor(private cd: ChangeDetectorRef) {}
  
  // Manually trigger change detection when needed
  updateData() {
    this.user = { ...this.user, name: 'New Name' };
    this.cd.markForCheck();
  }
}

// Using Observables with OnPush
@Component({
  selector: 'app-observable',
  template: '{{ data$ | async }}',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ObservableComponent {
  data$ = this.service.getData(); // Auto-updates with async pipe
}`
        },
        {
            question: "How do you implement custom form controls with ControlValueAccessor?",
            answer: "Implement ControlValueAccessor with four methods: writeValue(), registerOnChange(), registerOnTouched(), setDisabledState(). Provide NG_VALUE_ACCESSOR token. This enables custom components to work seamlessly with Angular forms.",
            code: `import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-custom-input',
  template: \`
    <input 
      [value]="value"
      [disabled]="disabled"
      (input)="onInput($event)"
      (blur)="onTouched()"
    />
  \`,
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => CustomInputComponent),
    multi: true
  }]
})
export class CustomInputComponent implements ControlValueAccessor {
  value: string = '';
  disabled = false;
  
  onChange: (value: string) => void = () => {};
  onTouched: () => void = () => {};
  
  writeValue(value: string): void {
    this.value = value || '';
  }
  
  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }
  
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  
  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
  
  onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.value = value;
    this.onChange(value);
  }
}

// Usage in forms
<form [formGroup]="myForm">
  <app-custom-input formControlName="customField"></app-custom-input>
</form>`
        },
        {
            question: "What are the most important RxJS operators and their use cases?",
            answer: "Transform data with map/filter/tap. Cancel previous with switchMap (perfect for search). Run parallel with mergeMap. Delay emissions with debounceTime. Remove duplicates with distinctUntilChanged. Handle errors with catchError/retry. Combine streams with combineLatest/forkJoin.",
            code: `// Search with debounce and switchMap
searchControl.valueChanges.pipe(
  debounceTime(300),
  distinctUntilChanged(),
  switchMap(term => this.api.search(term)), // Cancels previous requests
  catchError(err => {
    console.error(err);
    return of([]);
  })
).subscribe(results => this.results = results);

// Parallel requests with forkJoin
forkJoin({
  user: this.userService.getUser(id),
  posts: this.postService.getUserPosts(id),
  comments: this.commentService.getUserComments(id)
}).subscribe(({ user, posts, comments }) => {
  // All complete together
});

// Combine latest values
combineLatest([
  this.filters$,
  this.searchTerm$,
  this.sortOrder$
]).pipe(
  map(([filters, search, sort]) => {
    return this.applyFiltersAndSort(data, filters, search, sort);
  })
).subscribe(filteredData => this.displayData = filteredData);

// Retry with exponential backoff
this.http.get('/api/data').pipe(
  retry({
    count: 3,
    delay: (error, retryCount) => {
      return timer(Math.pow(2, retryCount) * 1000);
    }
  }),
  catchError(err => {
    return throwError(() => new Error('Failed after 3 retries'));
  })
).subscribe();

// Share subscription with multiple consumers
const shared$ = this.expensive$.pipe(
  shareReplay({ bufferSize: 1, refCount: true })
);`
        },
        {
            question: "How do you handle memory leaks in Angular?",
            answer: "Unsubscribe in ngOnDestroy using takeUntil pattern with Subject. Use async pipe which auto-unsubscribes. Remove event listeners. Clear timers/intervals. Avoid storing component references in services.",
            code: `// Method 1: takeUntil pattern
export class MyComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  ngOnInit() {
    // All subscriptions use takeUntil
    this.service.getData().pipe(
      takeUntil(this.destroy$)
    ).subscribe(data => this.data = data);
    
    interval(1000).pipe(
      takeUntil(this.destroy$)
    ).subscribe(count => this.counter = count);
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

// Method 2: Async pipe (auto-unsubscribes)
@Component({
  template: \`
    <div *ngFor="let item of items$ | async">
      {{ item.name }}
    </div>
  \`
})
export class AutoUnsubComponent {
  items$ = this.service.getItems();
}

// Method 3: Subscription management
export class SubsComponent implements OnDestroy {
  private subscriptions = new Subscription();
  
  ngOnInit() {
    this.subscriptions.add(
      this.service.data$.subscribe(data => this.data = data)
    );
    
    this.subscriptions.add(
      this.service.updates$.subscribe(update => this.handleUpdate(update))
    );
  }
  
  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}

// Clean up event listeners and timers
export class CleanupComponent implements OnDestroy {
  private resizeListener: () => void;
  private timerId: number;
  
  ngOnInit() {
    this.resizeListener = this.onResize.bind(this);
    window.addEventListener('resize', this.resizeListener);
    
    this.timerId = window.setInterval(() => {
      this.checkStatus();
    }, 5000);
  }
  
  ngOnDestroy() {
    window.removeEventListener('resize', this.resizeListener);
    window.clearInterval(this.timerId);
  }
}`
        },
        {
            question: "Explain Angular Signals and how they differ from RxJS.",
            answer: "Signals provide synchronous reactive state with automatic dependency tracking and computed values. Simpler than RxJS for basic state management. Still use RxJS for async operations, complex operators, and stream transformations.",
            code: `// Creating and using signals
import { signal, computed, effect } from '@angular/core';

@Component({
  template: \`
    <p>Count: {{ count() }}</p>
    <p>Double: {{ double() }}</p>
    <button (click)="increment()">Increment</button>
  \`
})
export class SignalComponent {
  // Writable signal
  count = signal(0);
  
  // Computed signal (auto-updates)
  double = computed(() => this.count() * 2);
  
  // Signal with object
  user = signal<User>({ name: 'John', age: 30 });
  
  constructor() {
    // Effect runs when dependencies change
    effect(() => {
      console.log('Count changed:', this.count());
    });
  }
  
  increment() {
    // Update signal value
    this.count.set(this.count() + 1);
    // or
    this.count.update(value => value + 1);
  }
  
  updateUser() {
    // Mutate object signal
    this.user.mutate(user => {
      user.age++;
    });
  }
}

// Converting between Signals and Observables
import { toObservable, toSignal } from '@angular/core/rxjs-interop';

@Component({
  template: '{{ data() }}'
})
export class InteropComponent {
  // Observable to Signal
  data = toSignal(this.http.get('/api/data'), {
    initialValue: []
  });
  
  // Signal to Observable
  count = signal(0);
  count$ = toObservable(this.count);
  
  // Combining with RxJS
  searchResults = toSignal(
    this.searchTerm$.pipe(
      debounceTime(300),
      switchMap(term => this.api.search(term))
    )
  );
}`
        },
        {
            question: "How do you implement lazy loading with preloading strategies?",
            answer: "Use loadChildren with dynamic imports for lazy loading. Preloading strategies include PreloadAllModules, NoPreloading, or custom strategies. Custom strategies can preload based on user behavior, network speed, or route priority.",
            code: `// App routing with lazy loading
const routes: Routes = [
  {
    path: 'dashboard',
    loadChildren: () => import('./dashboard/dashboard.module')
      .then(m => m.DashboardModule)
  },
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.module')
      .then(m => m.AdminModule),
    data: { preload: true } // Custom preload flag
  }
];

// Configure preloading strategy
@NgModule({
  imports: [RouterModule.forRoot(routes, {
    preloadingStrategy: PreloadAllModules // or custom strategy
  })],
  exports: [RouterModule]
})
export class AppRoutingModule {}

// Custom preloading strategy
@Injectable()
export class SelectivePreloadingStrategy implements PreloadingStrategy {
  preload(route: Route, load: () => Observable<any>): Observable<any> {
    // Preload if route has preload: true in data
    if (route.data && route.data['preload']) {
      return load();
    }
    return of(null);
  }
}

// Network-aware preloading
@Injectable()
export class NetworkAwarePreloadingStrategy implements PreloadingStrategy {
  preload(route: Route, load: () => Observable<any>): Observable<any> {
    const connection = (navigator as any).connection;
    
    // Only preload on good connections
    if (connection && connection.effectiveType === '4g') {
      return load();
    }
    return of(null);
  }
}

// Preload based on user navigation patterns
@Injectable()
export class PredictivePreloadingStrategy implements PreloadingStrategy {
  private preloadOnDemand$ = new Subject<Route>();
  
  preload(route: Route, load: () => Observable<any>): Observable<any> {
    return this.preloadOnDemand$.pipe(
      filter(r => r === route),
      take(1),
      switchMap(() => load())
    );
  }
  
  // Call this when user hovers over navigation
  preloadRoute(routePath: string) {
    const route = this.router.config.find(r => r.path === routePath);
    if (route) {
      this.preloadOnDemand$.next(route);
    }
  }
}`
        },
        {
            question: "What is ViewEncapsulation and its options?",
            answer: "Controls CSS scoping in components. Emulated (default) adds attributes to scope styles. None makes styles global. ShadowDom uses native shadow DOM for true isolation. Choose based on styling needs and browser support."
        },
        {
            question: "Explain the differences between ViewChild, ContentChild, and their plural versions.",
            answer: "ViewChild queries elements in component's template. ContentChild queries projected content. Plural versions return QueryList. Use static:true for access in ngOnInit, static:false for dynamic content or structural directives.",
            code: `// ViewChild - Query template elements
@Component({
  selector: 'app-parent',
  template: \`
    <input #nameInput>
    <app-child #childComponent></app-child>
    <div *ngFor="let item of items">
      <p #paragraph>{{ item }}</p>
    </div>
  \`
})
export class ParentComponent implements AfterViewInit {
  // Single element reference
  @ViewChild('nameInput') nameInput!: ElementRef;
  
  // Component reference
  @ViewChild(ChildComponent) childComponent!: ChildComponent;
  
  // Static query (available in ngOnInit)
  @ViewChild('nameInput', { static: true }) staticInput!: ElementRef;
  
  // Multiple elements
  @ViewChildren('paragraph') paragraphs!: QueryList<ElementRef>;
  
  // Query by directive/component type
  @ViewChildren(ChildComponent) children!: QueryList<ChildComponent>;
  
  ngAfterViewInit() {
    // Access ViewChild elements here
    this.nameInput.nativeElement.focus();
    
    // Subscribe to changes in QueryList
    this.paragraphs.changes.subscribe(list => {
      console.log('Paragraphs updated:', list.length);
    });
  }
}

// ContentChild - Query projected content
@Component({
  selector: 'app-tabs',
  template: \`
    <div class="tab-headers">
      <button *ngFor="let tab of tabs" 
              (click)="selectTab(tab)">
        {{ tab.title }}
      </button>
    </div>
    <ng-content></ng-content>
  \`
})
export class TabsComponent implements AfterContentInit {
  @ContentChildren(TabComponent) tabs!: QueryList<TabComponent>;
  @ContentChild('headerTemplate') headerTemplate!: TemplateRef<any>;
  
  ngAfterContentInit() {
    // Access projected content here
    this.tabs.forEach(tab => {
      tab.active = false;
    });
    
    // Select first tab
    if (this.tabs.first) {
      this.selectTab(this.tabs.first);
    }
    
    // Listen for changes
    this.tabs.changes.subscribe(() => {
      // Handle dynamic tab additions/removals
    });
  }
}

// Usage with content projection
<app-tabs>
  <ng-template #headerTemplate>
    <h2>Custom Header</h2>
  </ng-template>
  <app-tab title="Tab 1">Content 1</app-tab>
  <app-tab title="Tab 2">Content 2</app-tab>
</app-tabs>`
        },
        {
            question: "How do you optimize bundle size in Angular?",
            answer: "Tree-shake with production builds, lazy load modules, use dynamic imports for libraries. Analyze with webpack-bundle-analyzer, remove unused imports, choose lighter alternatives, implement differential loading, use OnPush change detection."
        },
        {
            question: "What are standalone components in Angular?",
            answer: "Components without NgModules (Angular 14+). Mark with standalone:true and use imports array. Benefits: simpler architecture, better tree-shaking, easier lazy loading. Use bootstrapApplication() to bootstrap.",
            code: `// Standalone component
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { UserService } from './user.service';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    // Import other standalone components
    UserAvatarComponent,
    UserDetailsComponent
  ],
  template: \`
    <div *ngIf="user$ | async as user">
      <app-user-avatar [user]="user"></app-user-avatar>
      <app-user-details [user]="user"></app-user-details>
      <button mat-button (click)="save()">Save</button>
    </div>
  \`,
  providers: [UserService] // Component-level providers
})
export class UserProfileComponent {
  user$ = this.userService.getCurrentUser();
  
  constructor(private userService: UserService) {}
  
  save() {
    // Save logic
  }
}

// Bootstrapping standalone app
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    provideAnimations(),
    // Global providers
  ]
});

// Lazy loading standalone components
const routes: Routes = [
  {
    path: 'profile',
    loadComponent: () => import('./profile/profile.component')
      .then(m => m.ProfileComponent)
  },
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.routes')
      .then(m => m.ADMIN_ROUTES)
  }
];

// admin.routes.ts
export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      {
        path: 'users',
        loadComponent: () => import('./users/users.component')
          .then(m => m.UsersComponent)
      }
    ]
  }
];`
        },
        {
            question: "How do you implement virtual scrolling for large lists?",
            answer: "Use CDK virtual scroll viewport with itemSize. Only renders visible items plus buffer. Dramatically improves performance for large lists. Can implement custom strategies for variable heights.",
            code: `// Install CDK: npm install @angular/cdk

// Fixed height items
import { ScrollingModule } from '@angular/cdk/scrolling';

@Component({
  selector: 'app-large-list',
  template: \`
    <cdk-virtual-scroll-viewport 
      itemSize="50" 
      class="viewport">
      <div *cdkVirtualFor="let item of items; 
           let i = index; 
           trackBy: trackByFn"
           class="list-item">
        {{ i }}: {{ item.name }}
      </div>
    </cdk-virtual-scroll-viewport>
  \`,
  styles: [\`
    .viewport {
      height: 400px;
      width: 100%;
      border: 1px solid #ccc;
    }
    .list-item {
      height: 50px;
      display: flex;
      align-items: center;
      padding: 0 16px;
    }
  \`]
})
export class LargeListComponent {
  items = Array.from({length: 10000}, (_, i) => ({
    id: i,
    name: \`Item #\${i}\`
  }));
  
  trackByFn(index: number, item: any) {
    return item.id;
  }
}

// Variable height items
@Component({
  template: \`
    <cdk-virtual-scroll-viewport 
      [itemSize]="estimatedItemSize"
      class="viewport">
      <div *cdkVirtualFor="let item of items"
           [style.height.px]="item.height"
           class="variable-item">
        {{ item.content }}
      </div>
    </cdk-virtual-scroll-viewport>
  \`
})
export class VariableHeightListComponent {
  estimatedItemSize = 100;
  items = this.generateItems();
  
  generateItems() {
    return Array.from({length: 1000}, (_, i) => ({
      content: \`Item \${i} with variable content...\`,
      height: Math.floor(Math.random() * 100) + 50
    }));
  }
}

// Infinite scroll with virtual scrolling
@Component({
  template: \`
    <cdk-virtual-scroll-viewport 
      itemSize="60"
      (scrolledIndexChange)="onScroll($event)"
      class="viewport">
      <div *cdkVirtualFor="let item of infiniteItems">
        {{ item }}
      </div>
      <div class="loading" *ngIf="loading">
        Loading more items...
      </div>
    </cdk-virtual-scroll-viewport>
  \`
})
export class InfiniteScrollComponent {
  infiniteItems: string[] = [];
  loading = false;
  batch = 20;
  
  constructor() {
    this.loadMore();
  }
  
  onScroll(index: number) {
    const end = this.viewport.getRenderedRange().end;
    const total = this.viewport.getDataLength();
    
    // Load more when scrolled to bottom
    if (end === total && !this.loading) {
      this.loadMore();
    }
  }
  
  loadMore() {
    this.loading = true;
    
    // Simulate API call
    setTimeout(() => {
      const newItems = Array.from(
        {length: this.batch}, 
        (_, i) => \`Item \${this.infiniteItems.length + i}\`
      );
      this.infiniteItems.push(...newItems);
      this.loading = false;
    }, 1000);
  }
  
  @ViewChild(CdkVirtualScrollViewport) 
  viewport!: CdkVirtualScrollViewport;
}`
        },
        {
            question: "Explain Angular's dependency injection hierarchy.",
            answer: "DI hierarchy flows: Root injector (app-wide) → Module injectors (lazy modules) → Component injectors (component tree) → Element injectors (directives). Child injectors can override parent providers. Use providedIn: 'root' for singletons."
        },
        {
            question: "What are the new control flow syntax in Angular 17+?",
            answer: "New syntax: @if/@else for conditionals, @for with required track for loops, @switch/@case for multiple conditions. Replace *ngIf/*ngFor/*ngSwitch directives. Benefits: better performance, type checking, developer experience. Use @empty for empty collections.",
            code: `// New control flow syntax (Angular 17+)

// @if / @else if / @else
@Component({
  template: \`
    @if (user.isAdmin) {
      <app-admin-panel />
    } @else if (user.isModerator) {
      <app-moderator-panel />
    } @else {
      <app-user-panel />
    }
    
    <!-- With async pipe -->
    @if (user$ | async; as user) {
      <h1>Welcome, {{ user.name }}!</h1>
    } @else {
      <p>Loading user...</p>
    }
  \`
})
export class UserDashboardComponent {}

// @for with track
@Component({
  template: \`
    @for (item of items; track item.id) {
      <li>{{ item.name }}</li>
    } @empty {
      <li>No items found</li>
    }
    
    <!-- With index and other variables -->
    @for (item of items; track item.id; let idx = $index, 
          let isFirst = $first, let isLast = $last, 
          let isEven = $even) {
      <div [class.first]="isFirst" [class.last]="isLast">
        {{ idx + 1 }}. {{ item.name }}
      </div>
    }
  \`
})
export class ItemListComponent {
  items = [
    { id: 1, name: 'Item 1' },
    { id: 2, name: 'Item 2' }
  ];
}

// @switch / @case / @default
@Component({
  template: \`
    @switch (status) {
      @case ('loading') {
        <app-spinner />
      }
      @case ('success') {
        <app-success-message />
      }
      @case ('error') {
        <app-error-message [error]="error" />
      }
      @default {
        <p>Unknown status</p>
      }
    }
  \`
})
export class StatusComponent {
  status: 'loading' | 'success' | 'error' | 'unknown' = 'loading';
}

// Deferred loading with @defer
@Component({
  template: \`
    @defer (on viewport) {
      <app-heavy-component />
    } @loading (minimum 100ms) {
      <app-skeleton-loader />
    } @error {
      <p>Failed to load component</p>
    } @placeholder {
      <div>Scroll down to load content</div>
    }
    
    <!-- Multiple triggers -->
    @defer (on hover, timer(5s), when shouldLoad) {
      <app-chart [data]="chartData" />
    }
  \`
})
export class DeferredContentComponent {
  shouldLoad = false;
  chartData = [];
}`
        },
        {
            question: "How do you handle server-side rendering (SSR) with Angular Universal?",
            answer: "Adds server-side rendering for better SEO, faster initial load, social media previews. Use TransferState to avoid duplicate API calls. Handle browser-only APIs with isPlatformBrowser checks."
        },
        {
            question: "What's your approach to state management in Angular?",
            answer: "Services with BehaviorSubjects for simple state. NgRx for complex apps with Redux pattern. Akita as simpler alternative. Signals for future. Choose based on app complexity and team experience."
        }
    ],
    aiml: [
        {
            question: "Explain the bias-variance tradeoff.",
            answer: "Bias is error from oversimplified models (underfitting). Variance is error from overly sensitive models (overfitting). Balance both using cross-validation and regularization. Goal: achieve low bias and low variance for optimal performance."
        },
        {
            question: "How do you handle imbalanced datasets?",
            answer: "Handle imbalanced data with resampling techniques: SMOTE, undersampling, oversampling. Adjust class weights to 'balanced' in models. Use appropriate metrics: F1-score, AUC-ROC instead of accuracy. Consider ensemble methods or anomaly detection approaches.",
            code: `# Python example for handling imbalanced datasets
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, roc_auc_score
from imblearn.over_sampling import SMOTE
from imblearn.under_sampling import RandomUnderSampler
from imblearn.pipeline import Pipeline

# 1. SMOTE (Synthetic Minority Over-sampling Technique)
smote = SMOTE(sampling_strategy='minority', random_state=42)
X_resampled, y_resampled = smote.fit_resample(X_train, y_train)

# 2. Combined over and under sampling
over = SMOTE(sampling_strategy=0.5)  # Increase minority to 50% of majority
under = RandomUnderSampler(sampling_strategy=0.8)  # Reduce majority

pipeline = Pipeline([
    ('over', over),
    ('under', under)
])

X_resampled, y_resampled = pipeline.fit_resample(X_train, y_train)

# 3. Class weights in model
from sklearn.ensemble import RandomForestClassifier
from sklearn.utils.class_weight import compute_class_weight

# Compute class weights
classes = np.unique(y_train)
class_weights = compute_class_weight(
    'balanced', classes=classes, y=y_train
)
class_weight_dict = dict(zip(classes, class_weights))

# Use in model
rf = RandomForestClassifier(
    class_weight=class_weight_dict,  # or 'balanced'
    n_estimators=100,
    random_state=42
)

# 4. Custom metrics for evaluation
from sklearn.metrics import make_scorer, f1_score

# Focus on minority class
f1_minority = make_scorer(f1_score, pos_label=1, average='binary')

# 5. Threshold adjustment
y_proba = model.predict_proba(X_test)[:, 1]

# Find optimal threshold
from sklearn.metrics import precision_recall_curve
precisions, recalls, thresholds = precision_recall_curve(y_test, y_proba)

# F1 scores for different thresholds
f1_scores = 2 * (precisions * recalls) / (precisions + recalls)
optimal_idx = np.argmax(f1_scores)
optimal_threshold = thresholds[optimal_idx]

# Apply custom threshold
y_pred_adjusted = (y_proba >= optimal_threshold).astype(int)

# 6. Ensemble approach for imbalanced data
from imblearn.ensemble import BalancedRandomForestClassifier

brf = BalancedRandomForestClassifier(
    n_estimators=100,
    sampling_strategy='all',  # Resample all classes
    replacement=True,
    random_state=42
)

brf.fit(X_train, y_train)`
        },
        {
            question: "What is LoRA fine-tuning and when would you use it?",
            answer: "LoRA trains small adapter matrices instead of all parameters. The rank 'r' (typically 16) controls adapter size. Reduces memory usage by 90%+ while maintaining base model quality. Use for fine-tuning large models with limited GPU. QLoRA combines 4-bit quantization with LoRA.",
            code: `# LoRA implementation example using HuggingFace PEFT
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import LoraConfig, get_peft_model, TaskType
import torch

# Load base model
model_name = "meta-llama/Llama-2-7b-hf"
model = AutoModelForCausalLM.from_pretrained(
    model_name,
    torch_dtype=torch.float16,
    device_map="auto"
)

# LoRA configuration
lora_config = LoraConfig(
    r=16,  # Rank - lower = fewer parameters
    lora_alpha=32,  # Scaling parameter
    target_modules=[  # Which layers to apply LoRA to
        "q_proj", "v_proj", "k_proj", "o_proj",
        "gate_proj", "up_proj", "down_proj"
    ],
    lora_dropout=0.1,
    bias="none",
    task_type=TaskType.CAUSAL_LM
)

# Apply LoRA to model
model = get_peft_model(model, lora_config)

# Check trainable parameters
model.print_trainable_parameters()
# Output: trainable params: 8,388,608 || all params: 6,746,804,736 || trainable%: 0.124

# Training with LoRA
from transformers import Trainer, TrainingArguments

training_args = TrainingArguments(
    output_dir="./lora-finetuned",
    num_train_epochs=3,
    per_device_train_batch_size=4,
    gradient_accumulation_steps=4,
    warmup_steps=100,
    learning_rate=2e-4,
    fp16=True,
    logging_steps=10,
    save_strategy="epoch",
    evaluation_strategy="epoch"
)

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=train_dataset,
    eval_dataset=eval_dataset,
    data_collator=data_collator
)

# Fine-tune with LoRA
trainer.train()

# Save LoRA weights only (small file)
model.save_pretrained("lora-weights")

# Load and merge LoRA weights later
from peft import PeftModel

# Load base model
base_model = AutoModelForCausalLM.from_pretrained(model_name)

# Load LoRA weights
lora_model = PeftModel.from_pretrained(base_model, "lora-weights")

# Merge LoRA weights into base model (optional)
merged_model = lora_model.merge_and_unload()

# QLoRA - Quantized LoRA for even more efficiency
from transformers import BitsAndBytesConfig

bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=torch.float16,
    bnb_4bit_use_double_quant=True
)

# Load model in 4-bit
model = AutoModelForCausalLM.from_pretrained(
    model_name,
    quantization_config=bnb_config,
    device_map="auto"
)

# Apply LoRA to quantized model
model = get_peft_model(model, lora_config)`
        },
        {
            question: "Explain different types of gradient boosting implementations.",
            answer: "XGBoost is fast, handles missing values, includes L1/L2 regularization. LightGBM is faster with leaf-wise growth strategy. CatBoost handles categorical features natively without encoding. Scikit-learn's GradientBoosting is simple for prototyping. Choose based on your specific needs."
        },
        {
            question: "How does attention mechanism work in transformers?",
            answer: "Attention lets models focus on relevant input parts. Core formula: Attention(Q,K,V) = softmax(QK^T/√d_k)V. Self-attention operates within same sequence, cross-attention between different sequences. Multi-head attention learns multiple attention patterns in parallel for richer representations.",
            code: `# Simplified attention mechanism implementation
import torch
import torch.nn as nn
import torch.nn.functional as F
import math

class SelfAttention(nn.Module):
    def __init__(self, embed_dim, num_heads=8):
        super().__init__()
        self.embed_dim = embed_dim
        self.num_heads = num_heads
        self.head_dim = embed_dim // num_heads
        
        assert self.head_dim * num_heads == embed_dim
        
        # Linear projections for Q, K, V
        self.q_proj = nn.Linear(embed_dim, embed_dim)
        self.k_proj = nn.Linear(embed_dim, embed_dim)
        self.v_proj = nn.Linear(embed_dim, embed_dim)
        self.out_proj = nn.Linear(embed_dim, embed_dim)
        
        self.scale = 1.0 / math.sqrt(self.head_dim)
        
    def forward(self, x, mask=None):
        batch_size, seq_len, embed_dim = x.shape
        
        # Project to Q, K, V
        Q = self.q_proj(x)  # [batch, seq_len, embed_dim]
        K = self.k_proj(x)
        V = self.v_proj(x)
        
        # Reshape for multi-head attention
        Q = Q.view(batch_size, seq_len, self.num_heads, self.head_dim)
        K = K.view(batch_size, seq_len, self.num_heads, self.head_dim)
        V = V.view(batch_size, seq_len, self.num_heads, self.head_dim)
        
        # Transpose for attention computation
        Q = Q.transpose(1, 2)  # [batch, heads, seq_len, head_dim]
        K = K.transpose(1, 2)
        V = V.transpose(1, 2)
        
        # Compute attention scores
        scores = torch.matmul(Q, K.transpose(-2, -1)) * self.scale
        # scores shape: [batch, heads, seq_len, seq_len]
        
        # Apply mask if provided (e.g., for causal attention)
        if mask is not None:
            scores = scores.masked_fill(mask == 0, -1e9)
        
        # Apply softmax
        attn_weights = F.softmax(scores, dim=-1)
        
        # Apply attention to values
        attn_output = torch.matmul(attn_weights, V)
        # [batch, heads, seq_len, head_dim]
        
        # Concatenate heads
        attn_output = attn_output.transpose(1, 2).contiguous()
        attn_output = attn_output.view(batch_size, seq_len, embed_dim)
        
        # Final projection
        output = self.out_proj(attn_output)
        
        return output, attn_weights

# Cross-attention for encoder-decoder models
class CrossAttention(nn.Module):
    def __init__(self, embed_dim, num_heads=8):
        super().__init__()
        self.attention = SelfAttention(embed_dim, num_heads)
        
    def forward(self, query, key_value, mask=None):
        # Query from decoder, Key/Value from encoder
        batch_size, seq_len, embed_dim = query.shape
        
        # Use query for Q, but key_value for K and V
        Q = self.attention.q_proj(query)
        K = self.attention.k_proj(key_value)
        V = self.attention.v_proj(key_value)
        
        # Rest follows same pattern as self-attention
        # ...

# Position-aware attention with positional encoding
class PositionalEncoding(nn.Module):
    def __init__(self, embed_dim, max_len=5000):
        super().__init__()
        pe = torch.zeros(max_len, embed_dim)
        position = torch.arange(0, max_len).unsqueeze(1).float()
        
        div_term = torch.exp(torch.arange(0, embed_dim, 2).float() * 
                           -(math.log(10000.0) / embed_dim))
        
        pe[:, 0::2] = torch.sin(position * div_term)
        pe[:, 1::2] = torch.cos(position * div_term)
        
        self.register_buffer('pe', pe.unsqueeze(0))
        
    def forward(self, x):
        return x + self.pe[:, :x.size(1)]

# Complete transformer block
class TransformerBlock(nn.Module):
    def __init__(self, embed_dim, num_heads, mlp_ratio=4.0, dropout=0.1):
        super().__init__()
        self.attention = SelfAttention(embed_dim, num_heads)
        self.norm1 = nn.LayerNorm(embed_dim)
        self.norm2 = nn.LayerNorm(embed_dim)
        
        mlp_dim = int(embed_dim * mlp_ratio)
        self.mlp = nn.Sequential(
            nn.Linear(embed_dim, mlp_dim),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(mlp_dim, embed_dim),
            nn.Dropout(dropout)
        )
        
    def forward(self, x, mask=None):
        # Self-attention with residual
        attn_out, _ = self.attention(self.norm1(x), mask)
        x = x + attn_out
        
        # MLP with residual
        x = x + self.mlp(self.norm2(x))
        
        return x`
        },
        {
            question: "What's the difference between GPT and BERT architectures?",
            answer: "GPT is autoregressive (left-to-right), decoder-only, optimized for generation. BERT is bidirectional, encoder-only, uses masked language modeling, optimized for understanding. GPT for text generation, BERT for classification/extraction tasks."
        },
        {
            question: "How do you implement RAG (Retrieval Augmented Generation)?",
            answer: "1) Chunk and embed documents 2) Store in vector database 3) Retrieve relevant chunks via semantic search 4) Inject context into LLM prompt 5) Generate answer. Reduces hallucination, enables up-to-date information.",
            code: `# RAG implementation example
import numpy as np
from typing import List, Dict
import openai
from sentence_transformers import SentenceTransformer
import chromadb
from langchain.text_splitter import RecursiveCharacterTextSplitter

class RAGSystem:
    def __init__(self, collection_name="documents"):
        # Initialize embedding model
        self.embedder = SentenceTransformer('all-MiniLM-L6-v2')
        
        # Initialize vector database
        self.client = chromadb.Client()
        self.collection = self.client.create_collection(
            name=collection_name,
            metadata={"hnsw:space": "cosine"}
        )
        
        # Text splitter for chunking
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=500,
            chunk_overlap=50,
            separators=["\n\n", "\n", ".", " ", ""]
        )
    
    def add_documents(self, documents: List[Dict[str, str]]):
        """Add documents to vector store"""
        for doc in documents:
            # Split into chunks
            chunks = self.text_splitter.split_text(doc['content'])
            
            # Generate embeddings
            embeddings = self.embedder.encode(chunks)
            
            # Store in vector database
            self.collection.add(
                embeddings=embeddings.tolist(),
                documents=chunks,
                metadatas=[{"source": doc['source']} for _ in chunks],
                ids=[f"{doc['source']}_{i}" for i in range(len(chunks))]
            )
    
    def retrieve_context(self, query: str, k: int = 5) -> List[str]:
        """Retrieve relevant context for query"""
        # Embed query
        query_embedding = self.embedder.encode([query])[0]
        
        # Search vector database
        results = self.collection.query(
            query_embeddings=[query_embedding.tolist()],
            n_results=k
        )
        
        # Extract documents
        contexts = results['documents'][0]
        sources = [m['source'] for m in results['metadatas'][0]]
        
        return contexts, sources
    
    def generate_answer(self, query: str, contexts: List[str]) -> str:
        """Generate answer using LLM with context"""
        # Format context
        context_str = "\n\n".join([
            f"Context {i+1}: {ctx}" 
            for i, ctx in enumerate(contexts)
        ])
        
        # Create prompt
        prompt = f"""You are a helpful assistant. Answer the question based on the provided context.
        If the answer cannot be found in the context, say so.
        
        Context:
        {context_str}
        
        Question: {query}
        
        Answer:"""
        
        # Generate with LLM
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=500
        )
        
        return response.choices[0].message.content
    
    def query(self, question: str) -> Dict[str, any]:
        """Complete RAG pipeline"""
        # Retrieve relevant context
        contexts, sources = self.retrieve_context(question)
        
        # Generate answer
        answer = self.generate_answer(question, contexts)
        
        return {
            "question": question,
            "answer": answer,
            "sources": sources,
            "contexts": contexts
        }

# Advanced RAG with reranking
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch

class AdvancedRAG(RAGSystem):
    def __init__(self, collection_name="documents"):
        super().__init__(collection_name)
        
        # Load reranking model
        self.reranker_name = "cross-encoder/ms-marco-MiniLM-L-6-v2"
        self.reranker_tokenizer = AutoTokenizer.from_pretrained(self.reranker_name)
        self.reranker_model = AutoModelForSequenceClassification.from_pretrained(self.reranker_name)
    
    def rerank_contexts(self, query: str, contexts: List[str], top_k: int = 3):
        """Rerank retrieved contexts for better relevance"""
        pairs = [[query, ctx] for ctx in contexts]
        
        # Tokenize
        inputs = self.reranker_tokenizer(
            pairs, 
            padding=True, 
            truncation=True, 
            return_tensors='pt'
        )
        
        # Get scores
        with torch.no_grad():
            scores = self.reranker_model(**inputs).logits.squeeze(-1)
        
        # Sort by score
        sorted_indices = torch.argsort(scores, descending=True)
        
        # Return top contexts
        reranked_contexts = [
            contexts[idx] for idx in sorted_indices[:top_k]
        ]
        
        return reranked_contexts

# Usage example
rag = AdvancedRAG()

# Add documents
documents = [
    {"source": "doc1.pdf", "content": "Machine learning content..."},
    {"source": "doc2.pdf", "content": "Deep learning content..."}
]
rag.add_documents(documents)

# Query
result = rag.query("What is gradient descent?")
print(result['answer'])`
        },
        {
            question: "Explain different regularization techniques in deep learning.",
            answer: "L1/L2 regularization penalizes large weights. Dropout randomly disables neurons during training. Batch normalization stabilizes training. Early stopping prevents overfitting. Data augmentation increases dataset size. Each addresses overfitting differently.",
            code: `# PyTorch regularization techniques
import torch
import torch.nn as nn
import torch.nn.functional as F
import torchvision.transforms as transforms

# 1. L1/L2 Regularization
class RegularizedModel(nn.Module):
    def __init__(self, input_dim, hidden_dim, output_dim):
        super().__init__()
        self.fc1 = nn.Linear(input_dim, hidden_dim)
        self.fc2 = nn.Linear(hidden_dim, hidden_dim)
        self.fc3 = nn.Linear(hidden_dim, output_dim)
        
    def forward(self, x):
        x = F.relu(self.fc1(x))
        x = F.relu(self.fc2(x))
        return self.fc3(x)
    
    def l1_regularization(self, lambda_l1):
        l1_norm = sum(p.abs().sum() for p in self.parameters())
        return lambda_l1 * l1_norm
    
    def l2_regularization(self, lambda_l2):
        l2_norm = sum(p.pow(2).sum() for p in self.parameters())
        return lambda_l2 * l2_norm

# Training with regularization
model = RegularizedModel(784, 256, 10)
optimizer = torch.optim.Adam(model.parameters(), lr=0.001)

# In training loop
for epoch in range(num_epochs):
    for batch_idx, (data, target) in enumerate(train_loader):
        optimizer.zero_grad()
        output = model(data)
        
        # Base loss
        loss = F.cross_entropy(output, target)
        
        # Add regularization
        loss += model.l1_regularization(lambda_l1=0.001)
        loss += model.l2_regularization(lambda_l2=0.001)
        
        loss.backward()
        optimizer.step()

# 2. Dropout
class DropoutModel(nn.Module):
    def __init__(self, input_dim, hidden_dim, output_dim, dropout_rate=0.5):
        super().__init__()
        self.fc1 = nn.Linear(input_dim, hidden_dim)
        self.dropout1 = nn.Dropout(dropout_rate)
        self.fc2 = nn.Linear(hidden_dim, hidden_dim)
        self.dropout2 = nn.Dropout(dropout_rate)
        self.fc3 = nn.Linear(hidden_dim, output_dim)
        
    def forward(self, x, training=True):
        x = F.relu(self.fc1(x))
        x = self.dropout1(x) if training else x
        x = F.relu(self.fc2(x))
        x = self.dropout2(x) if training else x
        return self.fc3(x)

# 3. Batch Normalization
class BatchNormModel(nn.Module):
    def __init__(self, input_dim, hidden_dim, output_dim):
        super().__init__()
        self.fc1 = nn.Linear(input_dim, hidden_dim)
        self.bn1 = nn.BatchNorm1d(hidden_dim)
        self.fc2 = nn.Linear(hidden_dim, hidden_dim)
        self.bn2 = nn.BatchNorm1d(hidden_dim)
        self.fc3 = nn.Linear(hidden_dim, output_dim)
        
    def forward(self, x):
        x = self.fc1(x)
        x = self.bn1(x)
        x = F.relu(x)
        
        x = self.fc2(x)
        x = self.bn2(x)
        x = F.relu(x)
        
        return self.fc3(x)

# 4. Early Stopping
class EarlyStopping:
    def __init__(self, patience=10, min_delta=0.001):
        self.patience = patience
        self.min_delta = min_delta
        self.counter = 0
        self.best_loss = None
        self.early_stop = False
        
    def __call__(self, val_loss):
        if self.best_loss is None:
            self.best_loss = val_loss
        elif val_loss > self.best_loss - self.min_delta:
            self.counter += 1
            if self.counter >= self.patience:
                self.early_stop = True
        else:
            self.best_loss = val_loss
            self.counter = 0
            
# Usage
early_stopping = EarlyStopping(patience=10)

for epoch in range(num_epochs):
    train_loss = train_epoch(model, train_loader)
    val_loss = validate(model, val_loader)
    
    early_stopping(val_loss)
    if early_stopping.early_stop:
        print(f"Early stopping at epoch {epoch}")
        break

# 5. Data Augmentation
# For images
train_transform = transforms.Compose([
    transforms.RandomHorizontalFlip(p=0.5),
    transforms.RandomRotation(degrees=15),
    transforms.RandomCrop(224, padding=4),
    transforms.ColorJitter(brightness=0.2, contrast=0.2),
    transforms.RandomAffine(degrees=0, translate=(0.1, 0.1)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], 
                       std=[0.229, 0.224, 0.225])
])

# For text (custom augmentation)
import random

def text_augmentation(text):
    augmentations = []
    
    # Synonym replacement
    words = text.split()
    if len(words) > 3:
        idx = random.randint(0, len(words)-1)
        # Replace with synonym (simplified)
        words[idx] = get_synonym(words[idx])
        augmentations.append(' '.join(words))
    
    # Random insertion
    idx = random.randint(0, len(words))
    words.insert(idx, random.choice(['very', 'quite', 'really']))
    augmentations.append(' '.join(words))
    
    return augmentations

# 6. Mixup augmentation
def mixup_data(x, y, alpha=1.0):
    if alpha > 0:
        lam = np.random.beta(alpha, alpha)
    else:
        lam = 1
    
    batch_size = x.size()[0]
    index = torch.randperm(batch_size)
    
    mixed_x = lam * x + (1 - lam) * x[index, :]
    y_a, y_b = y, y[index]
    
    return mixed_x, y_a, y_b, lam

# Training with mixup
for (inputs, targets) in train_loader:
    inputs, targets_a, targets_b, lam = mixup_data(inputs, targets)
    outputs = model(inputs)
    loss = lam * criterion(outputs, targets_a) + (1 - lam) * criterion(outputs, targets_b)
    loss.backward()`
        },
        {
            question: "How do you handle vanishing/exploding gradients?",
            answer: "Vanishing: use ReLU activation, batch normalization, residual connections, proper initialization. Exploding: gradient clipping, careful learning rate. LSTM/GRU for RNNs. Skip connections help gradient flow.",
            code: `# Techniques to handle gradient problems
import torch
import torch.nn as nn
import torch.nn.init as init
import numpy as np

# 1. Proper weight initialization
class ProperlyInitializedNet(nn.Module):
    def __init__(self, layers_dims):
        super().__init__()
        self.layers = nn.ModuleList()
        
        for i in range(len(layers_dims) - 1):
            layer = nn.Linear(layers_dims[i], layers_dims[i+1])
            
            # Xavier/Glorot initialization for tanh/sigmoid
            if i < len(layers_dims) - 2:  # Hidden layers
                init.xavier_uniform_(layer.weight)
            
            # He initialization for ReLU
            # init.kaiming_uniform_(layer.weight, nonlinearity='relu')
            
            # Initialize bias to zero
            init.zeros_(layer.bias)
            
            self.layers.append(layer)
    
    def forward(self, x):
        for i, layer in enumerate(self.layers[:-1]):
            x = torch.relu(layer(x))
        return self.layers[-1](x)

# 2. Gradient clipping
def train_with_gradient_clipping(model, data_loader, optimizer, max_norm=1.0):
    model.train()
    for batch_idx, (data, target) in enumerate(data_loader):
        optimizer.zero_grad()
        output = model(data)
        loss = F.cross_entropy(output, target)
        loss.backward()
        
        # Clip gradients
        torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm)
        
        # Alternative: clip by value
        # torch.nn.utils.clip_grad_value_(model.parameters(), clip_value=1.0)
        
        optimizer.step()
        
        # Monitor gradient norms
        total_norm = 0
        for p in model.parameters():
            if p.grad is not None:
                param_norm = p.grad.data.norm(2)
                total_norm += param_norm.item() ** 2
        total_norm = total_norm ** 0.5
        
        if batch_idx % 100 == 0:
            print(f'Gradient norm: {total_norm:.4f}')

# 3. Residual connections (ResNet style)
class ResidualBlock(nn.Module):
    def __init__(self, in_features, out_features):
        super().__init__()
        self.fc1 = nn.Linear(in_features, out_features)
        self.bn1 = nn.BatchNorm1d(out_features)
        self.fc2 = nn.Linear(out_features, out_features)
        self.bn2 = nn.BatchNorm1d(out_features)
        
        # Skip connection
        self.shortcut = nn.Linear(in_features, out_features) \
                        if in_features != out_features else nn.Identity()
        
    def forward(self, x):
        identity = self.shortcut(x)
        
        out = self.fc1(x)
        out = self.bn1(out)
        out = F.relu(out)
        
        out = self.fc2(out)
        out = self.bn2(out)
        
        # Add skip connection
        out += identity
        out = F.relu(out)
        
        return out

# 4. LSTM for sequence modeling (handles vanishing gradients)
class LSTMModel(nn.Module):
    def __init__(self, input_size, hidden_size, num_layers, output_size):
        super().__init__()
        self.lstm = nn.LSTM(
            input_size, 
            hidden_size, 
            num_layers,
            batch_first=True,
            dropout=0.2 if num_layers > 1 else 0
        )
        self.fc = nn.Linear(hidden_size, output_size)
        
    def forward(self, x):
        # x shape: (batch, seq_len, input_size)
        lstm_out, (h_n, c_n) = self.lstm(x)
        
        # Use last hidden state
        out = self.fc(h_n[-1])
        return out

# 5. Gradient monitoring and adaptive learning rate
class GradientMonitor:
    def __init__(self, model):
        self.model = model
        self.gradient_norms = []
        
    def compute_gradient_norm(self):
        total_norm = 0
        for p in self.model.parameters():
            if p.grad is not None:
                param_norm = p.grad.data.norm(2)
                total_norm += param_norm.item() ** 2
        return total_norm ** 0.5
    
    def check_gradient_health(self, threshold_low=1e-7, threshold_high=1e3):
        grad_norm = self.compute_gradient_norm()
        self.gradient_norms.append(grad_norm)
        
        if grad_norm < threshold_low:
            print(f"Warning: Vanishing gradients detected (norm={grad_norm:.2e})")
            return "vanishing"
        elif grad_norm > threshold_high:
            print(f"Warning: Exploding gradients detected (norm={grad_norm:.2e})")
            return "exploding"
        return "healthy"

# 6. Layer normalization (alternative to batch norm)
class LayerNormModel(nn.Module):
    def __init__(self, input_dim, hidden_dim, output_dim):
        super().__init__()
        self.fc1 = nn.Linear(input_dim, hidden_dim)
        self.ln1 = nn.LayerNorm(hidden_dim)
        self.fc2 = nn.Linear(hidden_dim, hidden_dim)
        self.ln2 = nn.LayerNorm(hidden_dim)
        self.fc3 = nn.Linear(hidden_dim, output_dim)
        
    def forward(self, x):
        x = self.fc1(x)
        x = self.ln1(x)
        x = F.relu(x)
        
        x = self.fc2(x)
        x = self.ln2(x)
        x = F.relu(x)
        
        return self.fc3(x)

# Usage example with monitoring
model = ResidualBlock(100, 256)
optimizer = torch.optim.Adam(model.parameters(), lr=0.001)
monitor = GradientMonitor(model)

for epoch in range(num_epochs):
    for data, target in train_loader:
        optimizer.zero_grad()
        output = model(data)
        loss = criterion(output, target)
        loss.backward()
        
        # Check gradient health
        status = monitor.check_gradient_health()
        
        if status == "exploding":
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
        
        optimizer.step()`
        },
        {
            question: "What are different evaluation metrics for classification?",
            answer: "Accuracy for balanced datasets. Precision (correct positive predictions). Recall (found all positives). F1-score (harmonic mean). AUC-ROC for probability ranking. Use based on problem: high recall for medical diagnosis, high precision for spam.",
            code: `# Comprehensive evaluation metrics implementation
import numpy as np
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, roc_curve, precision_recall_curve,
    confusion_matrix, classification_report
)
import matplotlib.pyplot as plt

class ClassificationMetrics:
    def __init__(self, y_true, y_pred, y_proba=None, class_names=None):
        self.y_true = y_true
        self.y_pred = y_pred
        self.y_proba = y_proba
        self.class_names = class_names
        
    def basic_metrics(self):
        """Calculate basic classification metrics"""
        metrics = {
            'accuracy': accuracy_score(self.y_true, self.y_pred),
            'precision': precision_score(self.y_true, self.y_pred, average='weighted'),
            'recall': recall_score(self.y_true, self.y_pred, average='weighted'),
            'f1': f1_score(self.y_true, self.y_pred, average='weighted')
        }
        
        # Per-class metrics
        if len(np.unique(self.y_true)) > 2:
            metrics['precision_per_class'] = precision_score(
                self.y_true, self.y_pred, average=None
            )
            metrics['recall_per_class'] = recall_score(
                self.y_true, self.y_pred, average=None
            )
            metrics['f1_per_class'] = f1_score(
                self.y_true, self.y_pred, average=None
            )
        
        return metrics
    
    def confusion_matrix_analysis(self):
        """Analyze confusion matrix"""
        cm = confusion_matrix(self.y_true, self.y_pred)
        
        # Calculate per-class metrics from confusion matrix
        n_classes = cm.shape[0]
        metrics = {}
        
        for i in range(n_classes):
            tp = cm[i, i]
            fp = cm[:, i].sum() - tp
            fn = cm[i, :].sum() - tp
            tn = cm.sum() - tp - fp - fn
            
            class_name = self.class_names[i] if self.class_names else f"Class {i}"
            
            metrics[class_name] = {
                'true_positives': tp,
                'false_positives': fp,
                'false_negatives': fn,
                'true_negatives': tn,
                'precision': tp / (tp + fp) if (tp + fp) > 0 else 0,
                'recall': tp / (tp + fn) if (tp + fn) > 0 else 0,
                'specificity': tn / (tn + fp) if (tn + fp) > 0 else 0
            }
            
        return cm, metrics
    
    def plot_roc_curve(self):
        """Plot ROC curve for binary classification"""
        if self.y_proba is None:
            print("Probability scores required for ROC curve")
            return
            
        fpr, tpr, thresholds = roc_curve(self.y_true, self.y_proba)
        auc = roc_auc_score(self.y_true, self.y_proba)
        
        plt.figure(figsize=(8, 6))
        plt.plot(fpr, tpr, label=f'ROC curve (AUC = {auc:.3f}')
        plt.plot([0, 1], [0, 1], 'k--', label='Random')
        plt.xlabel('False Positive Rate')
        plt.ylabel('True Positive Rate')
        plt.title('ROC Curve')
        plt.legend()
        plt.grid(True, alpha=0.3)
        plt.show()
        
        return auc
    
    def plot_precision_recall_curve(self):
        """Plot Precision-Recall curve"""
        if self.y_proba is None:
            return
            
        precision, recall, thresholds = precision_recall_curve(
            self.y_true, self.y_proba
        )
        
        plt.figure(figsize=(8, 6))
        plt.plot(recall, precision)
        plt.xlabel('Recall')
        plt.ylabel('Precision')
        plt.title('Precision-Recall Curve')
        plt.grid(True, alpha=0.3)
        plt.show()
        
        # Find optimal threshold
        f1_scores = 2 * (precision * recall) / (precision + recall)
        optimal_idx = np.argmax(f1_scores[:-1])
        optimal_threshold = thresholds[optimal_idx]
        
        return optimal_threshold

# Custom metrics for specific use cases
def specificity_score(y_true, y_pred):
    """Calculate specificity (true negative rate)"""
    tn, fp, fn, tp = confusion_matrix(y_true, y_pred).ravel()
    return tn / (tn + fp)

def balanced_accuracy(y_true, y_pred):
    """Average of recall for each class"""
    recall_per_class = recall_score(y_true, y_pred, average=None)
    return np.mean(recall_per_class)

def matthews_corrcoef(y_true, y_pred):
    """Matthews Correlation Coefficient"""
    tn, fp, fn, tp = confusion_matrix(y_true, y_pred).ravel()
    numerator = (tp * tn) - (fp * fn)
    denominator = np.sqrt((tp + fp) * (tp + fn) * (tn + fp) * (tn + fn))
    return numerator / denominator if denominator != 0 else 0

# Multi-class metrics
from sklearn.preprocessing import label_binarize

def multiclass_roc_auc(y_true, y_proba, classes):
    """Calculate ROC AUC for multi-class"""
    y_true_bin = label_binarize(y_true, classes=classes)
    
    # Calculate AUC for each class
    auc_scores = {}
    for i, class_name in enumerate(classes):
        auc = roc_auc_score(y_true_bin[:, i], y_proba[:, i])
        auc_scores[class_name] = auc
    
    # Macro and weighted average
    macro_auc = np.mean(list(auc_scores.values()))
    
    return auc_scores, macro_auc

# Usage example
y_true = np.array([0, 1, 1, 0, 1, 0, 1, 0])
y_pred = np.array([0, 1, 1, 0, 0, 0, 1, 1])
y_proba = np.array([0.1, 0.9, 0.8, 0.2, 0.4, 0.3, 0.7, 0.6])

metrics = ClassificationMetrics(y_true, y_pred, y_proba)
basic = metrics.basic_metrics()
print(f"Accuracy: {basic['accuracy']:.3f}")
print(f"Precision: {basic['precision']:.3f}")
print(f"Recall: {basic['recall']:.3f}")
print(f"F1-Score: {basic['f1']:.3f}")

# When to use which metric:
# - Accuracy: Only when classes are balanced
# - Precision: When false positives are costly (spam detection)
# - Recall: When false negatives are costly (disease detection)
# - F1: Balance between precision and recall
# - AUC-ROC: Overall model performance, probability ranking
# - Specificity: When true negatives matter (healthy patient classification)`
        },
        {
            question: "Explain transfer learning strategies.",
            answer: "Feature extraction: freeze base model, train only head. Fine-tuning: unfreeze some/all layers. Progressive unfreezing: gradual approach. Domain adaptation for different domains. Saves time, improves performance with less data."
        },
        {
            question: "How do you detect and handle model drift?",
            answer: "Monitor data drift with statistical tests (KS test, PSI). Track prediction drift in output distribution. Watch performance metrics degradation. Implement automated alerts, regular retraining schedules, A/B testing for new models.",
            code: `# Model drift detection and monitoring
import numpy as np
import pandas as pd
from scipy import stats
from datetime import datetime, timedelta
import warnings

class ModelDriftDetector:
    def __init__(self, reference_data, reference_predictions):
        """Initialize with reference/baseline data"""
        self.reference_data = reference_data
        self.reference_predictions = reference_predictions
        self.drift_history = []
        
    def calculate_psi(self, expected, actual, buckets=10):
        """Calculate Population Stability Index"""
        # Create bins based on expected distribution
        breakpoints = np.quantile(expected, np.linspace(0, 1, buckets))
        breakpoints[0] = -np.inf
        breakpoints[-1] = np.inf
        
        # Calculate frequencies
        expected_freq = pd.cut(expected, breakpoints).value_counts() / len(expected)
        actual_freq = pd.cut(actual, breakpoints).value_counts() / len(actual)
        
        # Align indices
        psi_df = pd.DataFrame({
            'expected': expected_freq,
            'actual': actual_freq
        }).fillna(0.0001)  # Avoid log(0)
        
        # Calculate PSI
        psi = np.sum(
            (psi_df['actual'] - psi_df['expected']) * 
            np.log(psi_df['actual'] / psi_df['expected'])
        )
        
        return psi
    
    def kolmogorov_smirnov_test(self, feature_name, current_data):
        """KS test for feature drift"""
        reference_feature = self.reference_data[feature_name]
        current_feature = current_data[feature_name]
        
        statistic, p_value = stats.ks_2samp(reference_feature, current_feature)
        
        return {
            'feature': feature_name,
            'ks_statistic': statistic,
            'p_value': p_value,
            'drift_detected': p_value < 0.05
        }
    
    def detect_data_drift(self, current_data, threshold=0.1):
        """Detect drift in input features"""
        drift_results = {}
        
        for column in self.reference_data.columns:
            if column in current_data.columns:
                # PSI for numerical features
                if np.issubdtype(current_data[column].dtype, np.number):
                    psi = self.calculate_psi(
                        self.reference_data[column],
                        current_data[column]
                    )
                    
                    drift_results[column] = {
                        'psi': psi,
                        'drift_detected': psi > threshold,
                        'drift_severity': self._classify_psi(psi)
                    }
                    
                    # Also run KS test
                    ks_result = self.kolmogorov_smirnov_test(column, current_data)
                    drift_results[column].update(ks_result)
                    
        return drift_results
    
    def detect_prediction_drift(self, current_predictions):
        """Detect drift in model predictions"""
        # PSI for prediction distribution
        pred_psi = self.calculate_psi(
            self.reference_predictions,
            current_predictions
        )
        
        # Statistical tests
        ks_stat, ks_pvalue = stats.ks_2samp(
            self.reference_predictions,
            current_predictions
        )
        
        # Mean shift
        mean_shift = np.abs(
            np.mean(current_predictions) - np.mean(self.reference_predictions)
        )
        
        return {
            'prediction_psi': pred_psi,
            'ks_statistic': ks_stat,
            'ks_pvalue': ks_pvalue,
            'mean_shift': mean_shift,
            'drift_detected': pred_psi > 0.1 or ks_pvalue < 0.05
        }
    
    def _classify_psi(self, psi):
        """Classify PSI severity"""
        if psi < 0.1:
            return 'no_drift'
        elif psi < 0.2:
            return 'moderate_drift'
        else:
            return 'severe_drift'
    
    def monitor_performance_drift(self, current_performance, baseline_performance):
        """Monitor model performance metrics"""
        performance_drift = {}
        
        for metric, baseline_value in baseline_performance.items():
            current_value = current_performance.get(metric, 0)
            
            # Calculate percentage change
            pct_change = (current_value - baseline_value) / baseline_value * 100
            
            # Define thresholds for different metrics
            if metric in ['accuracy', 'auc', 'f1']:
                # For metrics where higher is better
                drift_detected = pct_change < -5  # 5% degradation
            elif metric in ['mse', 'mae']:
                # For metrics where lower is better
                drift_detected = pct_change > 5  # 5% increase
            else:
                drift_detected = abs(pct_change) > 10
                
            performance_drift[metric] = {
                'baseline': baseline_value,
                'current': current_value,
                'pct_change': pct_change,
                'drift_detected': drift_detected
            }
            
        return performance_drift

# Automated monitoring system
class ModelMonitor:
    def __init__(self, model, drift_detector, alert_config):
        self.model = model
        self.drift_detector = drift_detector
        self.alert_config = alert_config
        self.monitoring_log = []
        
    def run_monitoring_pipeline(self, new_data, new_labels=None):
        """Complete monitoring pipeline"""
        timestamp = datetime.now()
        
        # Get predictions
        predictions = self.model.predict(new_data)
        
        # Check data drift
        data_drift = self.drift_detector.detect_data_drift(new_data)
        
        # Check prediction drift
        pred_drift = self.drift_detector.detect_prediction_drift(predictions)
        
        # Check performance if labels available
        performance_drift = None
        if new_labels is not None:
            current_performance = self.calculate_performance(predictions, new_labels)
            performance_drift = self.drift_detector.monitor_performance_drift(
                current_performance,
                self.alert_config['baseline_performance']
            )
        
        # Log results
        monitoring_result = {
            'timestamp': timestamp,
            'data_drift': data_drift,
            'prediction_drift': pred_drift,
            'performance_drift': performance_drift
        }
        
        self.monitoring_log.append(monitoring_result)
        
        # Check alerts
        self.check_alerts(monitoring_result)
        
        return monitoring_result
    
    def check_alerts(self, monitoring_result):
        """Check if alerts should be triggered"""
        alerts = []
        
        # Data drift alerts
        severe_drift_features = [
            feat for feat, info in monitoring_result['data_drift'].items()
            if info.get('drift_severity') == 'severe_drift'
        ]
        
        if severe_drift_features:
            alerts.append({
                'type': 'data_drift',
                'severity': 'high',
                'message': f"Severe drift detected in features: {severe_drift_features}"
            })
        
        # Prediction drift alert
        if monitoring_result['prediction_drift']['drift_detected']:
            alerts.append({
                'type': 'prediction_drift',
                'severity': 'medium',
                'message': "Significant drift in model predictions detected"
            })
        
        # Performance alerts
        if monitoring_result['performance_drift']:
            degraded_metrics = [
                metric for metric, info in monitoring_result['performance_drift'].items()
                if info['drift_detected']
            ]
            
            if degraded_metrics:
                alerts.append({
                    'type': 'performance_drift',
                    'severity': 'high',
                    'message': f"Performance degradation in: {degraded_metrics}"
                })
        
        # Send alerts
        for alert in alerts:
            self.send_alert(alert)
            
    def send_alert(self, alert):
        """Send alert (implement based on your infrastructure)"""
        print(f"ALERT [{alert['severity']}]: {alert['message']}")
        # Implement email, Slack, PagerDuty, etc.

# Retraining strategy
class AdaptiveRetrainer:
    def __init__(self, model_class, retrain_threshold=0.2):
        self.model_class = model_class
        self.retrain_threshold = retrain_threshold
        self.retrain_history = []
        
    def should_retrain(self, drift_scores):
        """Decide if model should be retrained"""
        # Check multiple criteria
        data_drift_score = np.mean([
            info['psi'] for info in drift_scores['data_drift'].values()
            if 'psi' in info
        ])
        
        prediction_drift = drift_scores['prediction_drift']['prediction_psi']
        
        # Performance degradation
        if drift_scores.get('performance_drift'):
            performance_degraded = any(
                info['drift_detected'] 
                for info in drift_scores['performance_drift'].values()
            )
        else:
            performance_degraded = False
            
        return (
            data_drift_score > self.retrain_threshold or
            prediction_drift > self.retrain_threshold or
            performance_degraded
        )
    
    def retrain_model(self, new_data, new_labels):
        """Retrain model with new data"""
        # Combine with historical data if needed
        # Train new model
        new_model = self.model_class()
        new_model.fit(new_data, new_labels)
        
        # Log retraining
        self.retrain_history.append({
            'timestamp': datetime.now(),
            'data_size': len(new_data),
            'trigger': 'drift_detection'
        })
        
        return new_model`
        },
        {
            question: "What's your approach to hyperparameter tuning?",
            answer: "Grid search for small search spaces. Random search for many parameters. Bayesian optimization (Optuna, Hyperopt) for efficiency. Use cross-validation, early stopping. Start with defaults, tune systematically based on impact."
        },
        {
            question: "Explain different types of neural network architectures.",
            answer: "CNNs for spatial data (images) with convolution and pooling. RNNs/LSTMs for sequential data with memory. Transformers for parallel processing with attention. GANs for generation. Autoencoders for compression/denoising.",
            code: `# Different neural network architectures in PyTorch
import torch
import torch.nn as nn
import torch.nn.functional as F

# 1. Convolutional Neural Network (CNN)
class CNN(nn.Module):
    def __init__(self, num_classes=10):
        super(CNN, self).__init__()
        # Convolutional layers
        self.conv1 = nn.Conv2d(3, 32, kernel_size=3, padding=1)
        self.bn1 = nn.BatchNorm2d(32)
        self.conv2 = nn.Conv2d(32, 64, kernel_size=3, padding=1)
        self.bn2 = nn.BatchNorm2d(64)
        self.conv3 = nn.Conv2d(64, 128, kernel_size=3, padding=1)
        self.bn3 = nn.BatchNorm2d(128)
        
        # Pooling
        self.pool = nn.MaxPool2d(2, 2)
        
        # Fully connected layers
        self.fc1 = nn.Linear(128 * 4 * 4, 256)
        self.fc2 = nn.Linear(256, num_classes)
        self.dropout = nn.Dropout(0.5)
        
    def forward(self, x):
        # Conv block 1
        x = self.pool(F.relu(self.bn1(self.conv1(x))))
        # Conv block 2
        x = self.pool(F.relu(self.bn2(self.conv2(x))))
        # Conv block 3
        x = self.pool(F.relu(self.bn3(self.conv3(x))))
        
        # Flatten
        x = x.view(x.size(0), -1)
        
        # Fully connected
        x = F.relu(self.fc1(x))
        x = self.dropout(x)
        x = self.fc2(x)
        
        return x

# 2. Recurrent Neural Network (LSTM)
class LSTMClassifier(nn.Module):
    def __init__(self, input_size, hidden_size, num_layers, num_classes):
        super(LSTMClassifier, self).__init__()
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        
        # LSTM layer
        self.lstm = nn.LSTM(
            input_size, 
            hidden_size, 
            num_layers, 
            batch_first=True,
            dropout=0.2 if num_layers > 1 else 0,
            bidirectional=True
        )
        
        # Output layer
        self.fc = nn.Linear(hidden_size * 2, num_classes)  # *2 for bidirectional
        
    def forward(self, x):
        # Initialize hidden state
        h0 = torch.zeros(self.num_layers * 2, x.size(0), self.hidden_size).to(x.device)
        c0 = torch.zeros(self.num_layers * 2, x.size(0), self.hidden_size).to(x.device)
        
        # LSTM forward
        out, (hn, cn) = self.lstm(x, (h0, c0))
        
        # Use last hidden state from both directions
        out = self.fc(out[:, -1, :])
        
        return out

# 3. Transformer Architecture
class TransformerModel(nn.Module):
    def __init__(self, vocab_size, d_model=512, nhead=8, num_layers=6):
        super(TransformerModel, self).__init__()
        self.d_model = d_model
        self.embedding = nn.Embedding(vocab_size, d_model)
        self.pos_encoding = PositionalEncoding(d_model)
        
        # Transformer encoder
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=d_model,
            nhead=nhead,
            dim_feedforward=2048,
            dropout=0.1
        )
        self.transformer = nn.TransformerEncoder(encoder_layer, num_layers)
        
        self.output_layer = nn.Linear(d_model, vocab_size)
        
    def forward(self, x, mask=None):
        # Embedding and positional encoding
        x = self.embedding(x) * torch.sqrt(torch.tensor(self.d_model, dtype=torch.float))
        x = self.pos_encoding(x)
        
        # Transformer
        x = self.transformer(x, mask)
        
        # Output
        x = self.output_layer(x)
        
        return x

# 4. Generative Adversarial Network (GAN)
class Generator(nn.Module):
    def __init__(self, z_dim=100, img_dim=784):
        super(Generator, self).__init__()
        self.gen = nn.Sequential(
            nn.Linear(z_dim, 256),
            nn.LeakyReLU(0.2),
            nn.BatchNorm1d(256),
            nn.Linear(256, 512),
            nn.LeakyReLU(0.2),
            nn.BatchNorm1d(512),
            nn.Linear(512, 1024),
            nn.LeakyReLU(0.2),
            nn.BatchNorm1d(1024),
            nn.Linear(1024, img_dim),
            nn.Tanh()  # Output between -1 and 1
        )
        
    def forward(self, x):
        return self.gen(x)

class Discriminator(nn.Module):
    def __init__(self, img_dim=784):
        super(Discriminator, self).__init__()
        self.disc = nn.Sequential(
            nn.Linear(img_dim, 512),
            nn.LeakyReLU(0.2),
            nn.Dropout(0.3),
            nn.Linear(512, 256),
            nn.LeakyReLU(0.2),
            nn.Dropout(0.3),
            nn.Linear(256, 1),
            nn.Sigmoid()  # Output probability
        )
        
    def forward(self, x):
        return self.disc(x)

# 5. Autoencoder
class Autoencoder(nn.Module):
    def __init__(self, input_dim=784, encoding_dim=32):
        super(Autoencoder, self).__init__()
        
        # Encoder
        self.encoder = nn.Sequential(
            nn.Linear(input_dim, 128),
            nn.ReLU(),
            nn.Linear(128, 64),
            nn.ReLU(),
            nn.Linear(64, encoding_dim)
        )
        
        # Decoder
        self.decoder = nn.Sequential(
            nn.Linear(encoding_dim, 64),
            nn.ReLU(),
            nn.Linear(64, 128),
            nn.ReLU(),
            nn.Linear(128, input_dim),
            nn.Sigmoid()  # For normalized inputs
        )
        
    def forward(self, x):
        encoded = self.encoder(x)
        decoded = self.decoder(encoded)
        return decoded
    
    def encode(self, x):
        return self.encoder(x)
    
    def decode(self, x):
        return self.decoder(x)

# 6. Variational Autoencoder (VAE)
class VAE(nn.Module):
    def __init__(self, input_dim=784, latent_dim=20):
        super(VAE, self).__init__()
        
        # Encoder
        self.fc1 = nn.Linear(input_dim, 400)
        self.fc21 = nn.Linear(400, latent_dim)  # Mean
        self.fc22 = nn.Linear(400, latent_dim)  # Log variance
        
        # Decoder
        self.fc3 = nn.Linear(latent_dim, 400)
        self.fc4 = nn.Linear(400, input_dim)
        
    def encode(self, x):
        h1 = F.relu(self.fc1(x))
        return self.fc21(h1), self.fc22(h1)
    
    def reparameterize(self, mu, logvar):
        std = torch.exp(0.5 * logvar)
        eps = torch.randn_like(std)
        return mu + eps * std
    
    def decode(self, z):
        h3 = F.relu(self.fc3(z))
        return torch.sigmoid(self.fc4(h3))
    
    def forward(self, x):
        mu, logvar = self.encode(x)
        z = self.reparameterize(mu, logvar)
        return self.decode(z), mu, logvar

# 7. Graph Neural Network (simplified)
class GCNLayer(nn.Module):
    def __init__(self, in_features, out_features):
        super(GCNLayer, self).__init__()
        self.linear = nn.Linear(in_features, out_features)
        
    def forward(self, x, adj):
        # x: node features, adj: adjacency matrix
        out = torch.matmul(adj, x)
        out = self.linear(out)
        return F.relu(out)

class GCN(nn.Module):
    def __init__(self, input_dim, hidden_dim, output_dim):
        super(GCN, self).__init__()
        self.gc1 = GCNLayer(input_dim, hidden_dim)
        self.gc2 = GCNLayer(hidden_dim, output_dim)
        self.dropout = nn.Dropout(0.5)
        
    def forward(self, x, adj):
        x = self.gc1(x, adj)
        x = self.dropout(x)
        x = self.gc2(x, adj)
        return x`
        },
        {
            question: "How do you implement model quantization?",
            answer: "Reduce precision (FP32 to INT8) for smaller, faster models. Dynamic quantization at runtime. Static quantization with calibration. Quantization-aware training for best results. Trade small accuracy loss for 4x size/speed improvement."
        }
    ],
    system: [
        {
            question: "Design a URL shortener like bit.ly.",
            answer: "Requirements: 100M URLs/day, <100ms latency. Use NoSQL for scale, Redis cache for reads. Base62 encoding for short URLs. Separate table for custom URLs. Async analytics processing. Shard by URL hash for horizontal scaling."
        },
        {
            question: "How would you design a real-time chat application?",
            answer: "WebSocket for real-time communication. Message queue (Kafka) for reliability. Cassandra for message storage. Redis for presence/online status. S3 for media with CDN. Microservices architecture with load balancers for scale."
        },
        {
            question: "Explain CAP theorem and its implications.",
            answer: "Consistency, Availability, Partition tolerance - can only guarantee 2. In practice: CP systems (MongoDB, HBase) prioritize consistency. AP systems (Cassandra, DynamoDB) prioritize availability. Choose based on requirements."
        },
        {
            question: "How do you handle distributed transactions?",
            answer: "Two-phase commit for strong consistency but blocking. Saga pattern with compensating transactions for microservices. Event sourcing for audit trail. CQRS to separate reads/writes. Prefer eventual consistency when possible."
        },
        {
            question: "What are different caching strategies?",
            answer: "Cache-aside: app manages cache. Write-through: write to cache and DB. Write-behind: async DB write. Refresh-ahead: proactive refresh. Multi-tier: L1 local + L2 distributed. Choose based on consistency needs."
        },
        {
            question: "How do you scale databases?",
            answer: "Vertical scaling: bigger machines (limited). Horizontal: sharding by key. Read replicas for read-heavy workloads. Federation by function. Denormalization for performance. Caching layer to reduce load."
        },
        {
            question: "Design a video streaming platform architecture.",
            answer: "Store videos in S3 with multiple quality versions. Queue-based transcoding service. CDN for global distribution. Adaptive bitrate streaming. Elasticsearch for metadata. ML-based recommendation service. Analytics with stream processing."
        },
        {
            question: "How do you implement rate limiting?",
            answer: "Token bucket for flexible bursts. Fixed/sliding window for simplicity. Distributed rate limiting with Redis. Return 429 status with retry headers. Consider per-user, per-IP, per-API key limits based on needs."
        },
        {
            question: "Explain microservices communication patterns.",
            answer: "Synchronous: REST, gRPC for request-response. Asynchronous: message queues, event streaming. Service mesh for observability. API gateway for external access. Circuit breakers for resilience."
        },
        {
            question: "How do you design for high availability?",
            answer: "Eliminate single points of failure. Multi-AZ deployment. Auto-scaling groups. Health checks and automatic failover. Circuit breakers. Graceful degradation. Chaos engineering to test resilience."
        },
        {
            question: "What's your approach to distributed logging?",
            answer: "Structured JSON logging. Centralized with ELK stack. Correlation IDs for request tracing. Log levels for filtering. Retention policies. Index optimization. Alerting on error patterns."
        },
        {
            question: "How do you implement distributed tracing?",
            answer: "OpenTelemetry for standards. Propagate trace IDs across services. Collect spans with timing. Jaeger/Zipkin for visualization. Sample to reduce overhead. Correlate with logs and metrics."
        },
        {
            question: "Design a recommendation system.",
            answer: "Collaborative filtering for user-item interactions. Content-based for item features. Hybrid approach for best results. Real-time updates with stream processing. A/B testing framework. Handle cold start with popularity."
        },
        {
            question: "How do you handle data consistency in distributed systems?",
            answer: "Strong consistency with distributed locks/transactions. Eventual consistency with conflict resolution. Causal consistency for related operations. Read-after-write consistency for user experience. Vector clocks for ordering."
        },
        {
            question: "What are different load balancing algorithms?",
            answer: "Round-robin for equal distribution. Least connections for current load. Weighted for server capacity. IP hash for sticky sessions. Geographic for latency. Health checks to exclude unhealthy servers."
        }
    ],
    behavioral: [
        {
            question: "Tell me about a time you prevented a major production issue.",
            answer: "Situation: Testing hardware/software system at INFICON. Task: Ensure system reliability before deployment. Action: Identified critical flaws through thorough analysis, documented issues, proposed fixes, coordinated international deployment. Result: Prevented $1M production failure, established new testing protocols."
        },
        {
            question: "Describe a challenging technical problem you solved.",
            answer: "Situation: Legacy .NET Framework app with tightly coupled architecture. Task: Modernize without disrupting operations. Action: Created phased migration plan, introduced dependency injection, wrote comprehensive tests, incremental refactoring. Result: Successfully migrated to .NET 8, 40% performance improvement."
        },
        {
            question: "How did you handle a conflict between team members?",
            answer: "Situation: Two senior developers disagreeing on architecture. Task: Resolve conflict while maintaining team cohesion. Action: Met individually to understand perspectives, facilitated architecture review, created pros/cons matrix, built POCs for both approaches. Result: Data-driven decision, hybrid approach, improved collaboration."
        },
        {
            question: "Tell me about a time you had to mentor a struggling developer.",
            answer: "Situation: Junior developer making repeated mistakes. Task: Improve their performance without damaging confidence. Action: One-on-one to understand challenges, created personalized learning plan, weekly pair programming, celebrated small wins. Result: Developer became productive team member, now mentors others."
        },
        {
            question: "Describe launching a project from scratch.",
            answer: "Situation: Company needed new application for manufacturing. Task: Build complete solution with no existing infrastructure. Action: Gathered requirements, designed scalable architecture, chose tech stack (.NET/Angular), built MVP, iterated based on feedback. Result: Application now valued at $1M+, widely adopted."
        },
        {
            question: "How do you prioritize competing deadlines?",
            answer: "Situation: Three critical projects with same deadline. Task: Deliver all without compromising quality. Action: Met stakeholders to understand priorities, negotiated phased deliveries, delegated effectively, focused on highest risk items first. Result: All projects delivered, stakeholders satisfied with transparency."
        },
        {
            question: "Tell me about a time you had to push back on requirements.",
            answer: "Situation: Product wanted real-time sync for 10K users in 2 weeks. Task: Manage expectations while delivering value. Action: Demonstrated technical constraints, proposed phased approach, built prototype showing limitations, suggested near real-time alternative. Result: Delivered working solution, product understood tradeoffs."
        },
        {
            question: "Describe a time you went above and beyond.",
            answer: "Situation: Customer critical issue on holiday weekend. Task: Resolve despite being off duty. Action: Responded to emergency call, diagnosed remotely, coordinated with on-call team, implemented fix, created runbook. Result: Customer saved major revenue, recognized by leadership, promoted shortly after."
        },
        {
            question: "How did you introduce new technology to your team?",
            answer: "Situation: Team using outdated Angular state management. Task: Introduce NgRx without disrupting productivity. Action: Built proof of concept, lunch & learn session, created migration guide, started with low-risk feature, paired with team. Result: Full adoption in 3 months, 70% reduction in state bugs."
        },
        {
            question: "Tell me about your biggest failure and lessons learned.",
            answer: "Situation: Deployed untested optimization causing data corruption. Task: Fix issue and prevent recurrence. Action: Immediately rolled back, led data recovery, implemented comprehensive testing, created deployment checklist, shared learnings. Result: Recovered all data, established testing culture, no similar incidents."
        },
        {
            question: "How do you handle ambiguous requirements?",
            answer: "Situation: Asked to 'improve system performance' with no specifics. Task: Define success criteria and deliver improvements. Action: Interviewed stakeholders, established baseline metrics, identified bottlenecks, created measurement dashboard, iterative improvements. Result: 50% latency reduction, clear performance SLAs."
        },
        {
            question: "Describe working with difficult stakeholders.",
            answer: "Situation: Product owner constantly changing requirements mid-sprint. Task: Establish better working relationship. Action: Understood their pressures, proposed requirement freeze periods, created change request process, showed impact with charts. Result: 50% reduction in changes, better planning, improved relationship."
        },
        {
            question: "Tell me about adapting to major change.",
            answer: "Situation: Company switched from Waterfall to Agile mid-project. Task: Help team transition smoothly. Action: Studied Agile methodologies, became Scrum champion, helped break down work, facilitated ceremonies, addressed concerns. Result: Successful transition, 40% improvement in delivery speed."
        },
        {
            question: "How do you ensure code quality?",
            answer: "Implement TDD for critical logic, comprehensive code reviews focusing on design, automated testing pyramid, static analysis tools, performance benchmarks, production monitoring, post-mortems for issues, documentation as first-class citizen."
        },
        {
            question: "Why are you looking for new opportunities?",
            answer: "After establishing myself as Software Architect and completing Master's in AI, I'm ready for new challenges combining enterprise development with AI/ML expertise. Seeking roles where I can build intelligent systems at scale and make larger impact."
        }
    ],
    sql: [
        {
            question: "What is the difference between WHERE and HAVING clauses?",
            answer: "WHERE filters rows before grouping, works with individual rows. HAVING filters after GROUP BY, works with aggregated data. Example: WHERE salary > 50000 filters employees, HAVING AVG(salary) > 50000 filters departments.",
            code: `-- WHERE clause example
SELECT employee_id, name, salary, department_id
FROM employees
WHERE salary > 50000;

-- HAVING clause example  
SELECT department_id, AVG(salary) as avg_salary, COUNT(*) as emp_count
FROM employees
GROUP BY department_id
HAVING AVG(salary) > 50000;

-- Combined WHERE and HAVING
SELECT department_id, AVG(salary) as avg_salary
FROM employees
WHERE hire_date > '2020-01-01'
GROUP BY department_id
HAVING AVG(salary) > 50000 AND COUNT(*) > 5;`
        },
        {
            question: "Explain the different types of JOINs in SQL.",
            answer: "INNER JOIN: Returns matching rows from both tables. LEFT JOIN: All rows from left table, matching from right. RIGHT JOIN: All rows from right table. FULL OUTER JOIN: All rows from both tables. CROSS JOIN: Cartesian product of both tables.",
            code: `-- INNER JOIN
SELECT e.name, d.department_name
FROM employees e
INNER JOIN departments d ON e.dept_id = d.dept_id;

-- LEFT JOIN (all employees, even without department)
SELECT e.name, d.department_name
FROM employees e
LEFT JOIN departments d ON e.dept_id = d.dept_id;

-- RIGHT JOIN (all departments, even without employees)
SELECT e.name, d.department_name
FROM employees e
RIGHT JOIN departments d ON e.dept_id = d.dept_id;

-- FULL OUTER JOIN (all employees and all departments)
SELECT e.name, d.department_name
FROM employees e
FULL OUTER JOIN departments d ON e.dept_id = d.dept_id;

-- CROSS JOIN (Cartesian product)
SELECT e.name, p.project_name
FROM employees e
CROSS JOIN projects p;`
        },
        {
            question: "What are indexes and when should you use them?",
            answer: "Indexes are data structures that improve query performance by providing quick lookups. Use on: Primary/foreign keys, columns in WHERE/JOIN/ORDER BY clauses. Avoid on: Small tables, frequently updated columns, columns with low selectivity. Trade-off: Faster reads, slower writes.",
            code: `-- Create different types of indexes
-- Single column index
CREATE INDEX idx_employee_salary ON employees(salary);

-- Composite index (covers multiple columns)
CREATE INDEX idx_emp_dept_salary ON employees(department_id, salary);

-- Unique index
CREATE UNIQUE INDEX idx_employee_email ON employees(email);

-- Filtered/Partial index (PostgreSQL/SQL Server)
CREATE INDEX idx_active_employees ON employees(employee_id) 
WHERE status = 'ACTIVE';

-- Check if index is being used
EXPLAIN SELECT * FROM employees WHERE salary > 100000;

-- Drop index if not needed
DROP INDEX idx_employee_salary;`
        },
        {
            question: "Explain ACID properties in database transactions.",
            answer: "Atomicity: All or nothing execution. Consistency: Data integrity maintained. Isolation: Concurrent transactions don't interfere. Durability: Committed changes persist. Essential for reliable database operations, especially in financial systems."
        },
        {
            question: "What's the difference between DELETE, TRUNCATE, and DROP?",
            answer: "DELETE: Removes rows with WHERE clause, logged, can rollback, triggers fire. TRUNCATE: Removes all rows, minimal logging, faster, resets identity, cannot rollback. DROP: Removes entire table structure and data permanently."
        },
        {
            question: "How do you optimize a slow-running query?",
            answer: "1) Analyze execution plan 2) Add appropriate indexes 3) Rewrite query logic 4) Update statistics 5) Avoid SELECT * 6) Use EXISTS instead of IN for subqueries 7) Partition large tables 8) Consider denormalization for read-heavy workloads.",
            code: `-- Before optimization
SELECT * FROM orders o
WHERE o.customer_id IN (
    SELECT c.customer_id FROM customers c
    WHERE c.country = 'USA'
);

-- After optimization: Use EXISTS
SELECT o.order_id, o.order_date, o.total_amount
FROM orders o
WHERE EXISTS (
    SELECT 1 FROM customers c
    WHERE c.customer_id = o.customer_id 
    AND c.country = 'USA'
);

-- Use JOIN instead of subquery
SELECT o.order_id, o.order_date, o.total_amount
FROM orders o
INNER JOIN customers c ON o.customer_id = c.customer_id
WHERE c.country = 'USA';

-- Analyze execution plan
EXPLAIN ANALYZE SELECT ... ; -- PostgreSQL
SET STATISTICS PROFILE ON; -- SQL Server
EXPLAIN PLAN FOR SELECT ... ; -- Oracle`
        },
        {
            question: "Explain window functions and provide examples.",
            answer: "Window functions perform calculations across rows related to current row. ROW_NUMBER(): Sequential numbering. RANK(): Same rank for ties. DENSE_RANK(): No gaps in ranking. LAG/LEAD: Access previous/next rows. Running totals with SUM() OVER().",
            code: `-- ROW_NUMBER: Sequential numbering
SELECT 
    employee_id, name, salary,
    ROW_NUMBER() OVER (ORDER BY salary DESC) as salary_rank
FROM employees;

-- RANK vs DENSE_RANK with ties
SELECT 
    name, salary,
    RANK() OVER (ORDER BY salary DESC) as rank,
    DENSE_RANK() OVER (ORDER BY salary DESC) as dense_rank
FROM employees;

-- Partition by department
SELECT 
    department_id, name, salary,
    ROW_NUMBER() OVER (PARTITION BY department_id ORDER BY salary DESC) as dept_rank
FROM employees;

-- Running total
SELECT 
    order_date, amount,
    SUM(amount) OVER (ORDER BY order_date) as running_total
FROM orders;

-- LAG/LEAD for comparing with previous/next row
SELECT 
    month, revenue,
    LAG(revenue, 1) OVER (ORDER BY month) as prev_month,
    revenue - LAG(revenue, 1) OVER (ORDER BY month) as growth
FROM monthly_sales;`
        },
        {
            question: "What are CTEs and how do they differ from subqueries?",
            answer: "Common Table Expressions (WITH clause) create named temporary result sets. Benefits over subqueries: Better readability, reusable in same query, support recursion, easier to debug. Subqueries can be correlated, CTEs cannot reference outer query.",
            code: `-- Basic CTE
WITH high_value_customers AS (
    SELECT customer_id, SUM(order_total) as total_spent
    FROM orders
    GROUP BY customer_id
    HAVING SUM(order_total) > 10000
)
SELECT c.name, h.total_spent
FROM customers c
JOIN high_value_customers h ON c.customer_id = h.customer_id;

-- Multiple CTEs
WITH 
recent_orders AS (
    SELECT * FROM orders 
    WHERE order_date >= DATEADD(month, -3, GETDATE())
),
order_totals AS (
    SELECT customer_id, COUNT(*) as order_count, SUM(total) as total_amount
    FROM recent_orders
    GROUP BY customer_id
)
SELECT * FROM order_totals WHERE order_count > 5;

-- Recursive CTE for hierarchical data
WITH RECURSIVE employee_hierarchy AS (
    -- Anchor: top-level employees
    SELECT employee_id, name, manager_id, 0 as level
    FROM employees
    WHERE manager_id IS NULL
    
    UNION ALL
    
    -- Recursive: employees under managers
    SELECT e.employee_id, e.name, e.manager_id, h.level + 1
    FROM employees e
    JOIN employee_hierarchy h ON e.manager_id = h.employee_id
)
SELECT * FROM employee_hierarchy ORDER BY level, name;`
        },
        {
            question: "Explain normalization and denormalization.",
            answer: "Normalization: Organizing data to reduce redundancy. 1NF: Atomic values. 2NF: No partial dependencies. 3NF: No transitive dependencies. Denormalization: Strategic redundancy for performance. Use normalization for OLTP, consider denormalization for OLAP/reporting."
        },
        {
            question: "How do you handle NULL values in SQL?",
            answer: "NULL represents unknown/missing data. Use IS NULL/IS NOT NULL for comparisons. COALESCE() returns first non-null value. NULLIF() returns NULL if values equal. Consider ISNULL() in SQL Server. NULLs affect aggregations, joins, and comparisons.",
            code: `-- NULL comparison (wrong vs right)
-- Wrong: This won't work
SELECT * FROM employees WHERE manager_id = NULL;

-- Right: Use IS NULL
SELECT * FROM employees WHERE manager_id IS NULL;

-- COALESCE: Return first non-null value
SELECT 
    employee_id,
    COALESCE(mobile_phone, office_phone, home_phone, 'No phone') as contact_phone
FROM employees;

-- NULLIF: Return NULL if values are equal
SELECT 
    product_id,
    NULLIF(quantity, 0) as quantity, -- Avoids division by zero
    price / NULLIF(quantity, 0) as unit_price
FROM inventory;

-- NULL in aggregations (NULLs are ignored)
SELECT 
    COUNT(*) as total_employees,          -- Counts all rows
    COUNT(commission) as with_commission, -- Ignores NULL commissions
    AVG(commission) as avg_commission     -- Average of non-NULL values only
FROM employees;

-- Handle NULL in ORDER BY
SELECT name, bonus
FROM employees
ORDER BY bonus NULLS LAST; -- or NULLS FIRST`
        },
        {
            question: "What's the difference between UNION and UNION ALL?",
            answer: "UNION: Combines result sets, removes duplicates, slower due to distinct operation. UNION ALL: Keeps all rows including duplicates, faster performance. Both require same number of columns with compatible data types. Use UNION ALL when duplicates are acceptable."
        },
        {
            question: "Explain database isolation levels.",
            answer: "READ UNCOMMITTED: Dirty reads possible. READ COMMITTED: Prevents dirty reads. REPEATABLE READ: Prevents dirty and non-repeatable reads. SERIALIZABLE: Highest isolation, prevents all phenomena. Trade-off between consistency and concurrency."
        },
        {
            question: "How do you implement pagination in SQL?",
            answer: "LIMIT/OFFSET: Simple but slow for large offsets. Keyset pagination: WHERE id > last_id more efficient. Row_Number() with CTE for complex sorting. Consider total count needs, index usage, and consistent ordering.",
            code: `-- Method 1: LIMIT/OFFSET (MySQL, PostgreSQL)
-- Page 3 with 20 items per page
SELECT * FROM products
ORDER BY product_id
LIMIT 20 OFFSET 40;

-- Method 2: ROW_NUMBER (SQL Server, works everywhere)
WITH ProductPage AS (
    SELECT *, ROW_NUMBER() OVER (ORDER BY product_id) as rn
    FROM products
)
SELECT * FROM ProductPage
WHERE rn BETWEEN 41 AND 60;

-- Method 3: Keyset/Cursor pagination (most efficient)
-- First page
SELECT * FROM products
WHERE product_id > 0
ORDER BY product_id
LIMIT 20;

-- Next pages (using last ID from previous page)
SELECT * FROM products
WHERE product_id > 1234  -- last product_id from previous page
ORDER BY product_id
LIMIT 20;

-- Method 4: FETCH/OFFSET (SQL Server 2012+)
SELECT * FROM products
ORDER BY product_id
OFFSET 40 ROWS
FETCH NEXT 20 ROWS ONLY;

-- Getting total count for pagination UI
SELECT COUNT(*) OVER() as total_count, *
FROM products
ORDER BY product_id
LIMIT 20 OFFSET 40;`
        },
        {
            question: "What are stored procedures and their advantages?",
            answer: "Precompiled SQL code stored in database. Advantages: Better performance, reduced network traffic, code reusability, enhanced security through parameterization, centralized business logic. Disadvantages: Database vendor lock-in, harder version control."
        },
        {
            question: "Explain the difference between clustered and non-clustered indexes.",
            answer: "Clustered: One per table, defines physical order of data, contains actual data. Non-clustered: Multiple allowed, separate structure with pointers to data, contains only indexed columns and row locators. Choose clustered for primary key or most queried column.",
            code: `-- Clustered index (only one per table)
-- Primary key creates clustered index by default
CREATE TABLE orders (
    order_id INT PRIMARY KEY CLUSTERED,
    customer_id INT,
    order_date DATETIME,
    total_amount DECIMAL(10,2)
);

-- Or explicitly create clustered index
CREATE CLUSTERED INDEX idx_order_date 
ON orders(order_date);

-- Non-clustered indexes (multiple allowed)
CREATE NONCLUSTERED INDEX idx_customer 
ON orders(customer_id);

CREATE NONCLUSTERED INDEX idx_amount 
ON orders(total_amount) 
INCLUDE (customer_id, order_date); -- Covering index

-- View index information
SELECT 
    i.name AS index_name,
    i.type_desc,
    i.is_primary_key,
    i.is_unique
FROM sys.indexes i
WHERE i.object_id = OBJECT_ID('orders');`
        },
        {
            question: "How do you handle hierarchical data in SQL?",
            answer: "Adjacency list: parent_id column, simple but recursive queries needed. Path enumeration: store full path. Nested sets: left/right values for tree traversal. Closure table: separate table for all paths. Modern: Use recursive CTEs or hierarchyid (SQL Server).",
            code: `-- Method 1: Adjacency List Model
CREATE TABLE categories (
    category_id INT PRIMARY KEY,
    name VARCHAR(100),
    parent_id INT REFERENCES categories(category_id)
);

-- Query hierarchy with recursive CTE
WITH RECURSIVE category_tree AS (
    -- Root categories
    SELECT category_id, name, parent_id, 0 as level, 
           CAST(name AS VARCHAR(1000)) as path
    FROM categories WHERE parent_id IS NULL
    
    UNION ALL
    
    -- Child categories
    SELECT c.category_id, c.name, c.parent_id, ct.level + 1,
           CONCAT(ct.path, ' > ', c.name)
    FROM categories c
    JOIN category_tree ct ON c.parent_id = ct.category_id
)
SELECT * FROM category_tree ORDER BY path;

-- Method 2: Path Enumeration
CREATE TABLE categories_path (
    category_id INT PRIMARY KEY,
    name VARCHAR(100),
    path VARCHAR(255) -- e.g., '1/3/7/'
);

-- Find all descendants
SELECT * FROM categories_path 
WHERE path LIKE '1/3/%';

-- Method 3: Nested Sets
CREATE TABLE categories_nested (
    category_id INT PRIMARY KEY,
    name VARCHAR(100),
    lft INT,
    rgt INT
);

-- Find all descendants
SELECT child.* 
FROM categories_nested parent, categories_nested child
WHERE child.lft BETWEEN parent.lft AND parent.rgt
AND parent.name = 'Electronics';`
        },
        {
            question: "What are Oracle-specific features you've used?",
            answer: "PL/SQL for procedural code. Sequences for auto-increment. MERGE for upsert operations. Materialized views for performance. Partitioning for large tables. Flashback for point-in-time recovery. Oracle Text for full-text search. AWR for performance tuning.",
            code: `-- Sequences for auto-increment
CREATE SEQUENCE emp_seq START WITH 1000 INCREMENT BY 1;

INSERT INTO employees (employee_id, name)
VALUES (emp_seq.NEXTVAL, 'John Doe');

-- MERGE statement (UPSERT)
MERGE INTO employees e
USING (SELECT 101 as id, 'Jane Smith' as name, 75000 as salary FROM dual) s
ON (e.employee_id = s.id)
WHEN MATCHED THEN
    UPDATE SET e.name = s.name, e.salary = s.salary
WHEN NOT MATCHED THEN
    INSERT (employee_id, name, salary) VALUES (s.id, s.name, s.salary);

-- Materialized View
CREATE MATERIALIZED VIEW mv_dept_summary
BUILD IMMEDIATE
REFRESH COMPLETE ON COMMIT
AS
SELECT department_id, COUNT(*) emp_count, AVG(salary) avg_salary
FROM employees
GROUP BY department_id;

-- Table Partitioning
CREATE TABLE orders (
    order_id NUMBER,
    order_date DATE,
    amount NUMBER
)
PARTITION BY RANGE (order_date) (
    PARTITION p_2023 VALUES LESS THAN (DATE '2024-01-01'),
    PARTITION p_2024 VALUES LESS THAN (DATE '2025-01-01'),
    PARTITION p_future VALUES LESS THAN (MAXVALUE)
);

-- Flashback Query
SELECT * FROM employees AS OF TIMESTAMP (SYSTIMESTAMP - INTERVAL '1' HOUR);`
        },
        {
            question: "Explain Oracle's ROWNUM vs ROW_NUMBER().",
            answer: "ROWNUM: Assigned during fetch, before ORDER BY, used in WHERE clause for top-N queries. ROW_NUMBER(): Analytic function, works with ORDER BY in OVER clause, more flexible for pagination and ranking. ROW_NUMBER() preferred for complex requirements."
        },
        {
            question: "How do you tune Oracle database performance?",
            answer: "Use AWR/ADDM reports for analysis. Analyze execution plans with EXPLAIN PLAN. Gather statistics with DBMS_STATS. Use hints sparingly. Implement partitioning for large tables. Configure SGA/PGA properly. Use bind variables to reduce parsing."
        },
        {
            question: "What's the difference between VARCHAR and VARCHAR2 in Oracle?",
            answer: "VARCHAR2: Oracle-specific, recommended, max 4000 bytes in SQL, 32767 in PL/SQL. VARCHAR: Reserved for future use, currently synonymous with VARCHAR2. Always use VARCHAR2 in Oracle. Consider CLOB for larger text data."
        }
    ],
    python: [
        // AI/ML Interview Questions
        {
            question: "Explain the difference between supervised, unsupervised, and reinforcement learning.",
            answer: "Supervised learning uses labeled data for classification/regression tasks. Unsupervised finds patterns without labels using clustering or dimensionality reduction. Reinforcement learning has agents that learn through environment interaction to maximize rewards.",
            code: `# Supervised Learning - Classification
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score

# Training with labeled data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)
clf = RandomForestClassifier()
clf.fit(X_train, y_train)  # Learning from labeled examples
predictions = clf.predict(X_test)

# Unsupervised Learning - Clustering
from sklearn.cluster import KMeans

# Finding patterns without labels
kmeans = KMeans(n_clusters=3)
clusters = kmeans.fit_predict(X)  # No y labels needed

# Reinforcement Learning concept
class Agent:
    def __init__(self):
        self.q_table = {}  # State-action values
    
    def choose_action(self, state, epsilon=0.1):
        if random.random() < epsilon:
            return random.choice(actions)  # Explore
        return max(actions, key=lambda a: self.q_table.get((state, a), 0))  # Exploit`
        },
        {
            question: "What is the bias-variance tradeoff in machine learning?",
            answer: "Bias is error from oversimplified models (underfitting). Variance is error from overly complex models (overfitting). As model complexity increases, bias decreases but variance increases. Goal: find the sweet spot balancing both.",
            code: `# Demonstrating bias-variance tradeoff
from sklearn.preprocessing import PolynomialFeatures
from sklearn.linear_model import LinearRegression
from sklearn.pipeline import Pipeline

# High bias model (underfitting)
linear_model = LinearRegression()
linear_model.fit(X_train, y_train)

# Balanced model
poly_features = PolynomialFeatures(degree=3)
balanced_model = Pipeline([('poly', poly_features), ('linear', LinearRegression())])
balanced_model.fit(X_train, y_train)

# High variance model (overfitting)
complex_features = PolynomialFeatures(degree=15)
complex_model = Pipeline([('poly', complex_features), ('linear', LinearRegression())])
complex_model.fit(X_train, y_train)

# Validation curves show the tradeoff
train_scores = []
val_scores = []
for degree in range(1, 20):
    model = Pipeline([('poly', PolynomialFeatures(degree)), 
                     ('linear', LinearRegression())])
    model.fit(X_train, y_train)
    train_scores.append(model.score(X_train, y_train))
    val_scores.append(model.score(X_val, y_val))`
        },
        {
            question: "Explain gradient descent and its variants (SGD, Mini-batch, Adam).",
            answer: "Gradient Descent iteratively moves parameters toward minimum loss. SGD updates using one sample (faster but noisy). Mini-batch updates per batch (balanced approach). Adam combines adaptive learning rates with momentum for faster convergence.",
            code: `import numpy as np

# Vanilla Gradient Descent
def gradient_descent(X, y, learning_rate=0.01, iterations=1000):
    m, n = X.shape
    theta = np.zeros(n)
    
    for _ in range(iterations):
        # Compute gradient using all data
        predictions = X @ theta
        errors = predictions - y
        gradient = (1/m) * X.T @ errors
        theta -= learning_rate * gradient
    return theta

# Stochastic Gradient Descent (SGD)
def sgd(X, y, learning_rate=0.01, iterations=1000):
    m, n = X.shape
    theta = np.zeros(n)
    
    for _ in range(iterations):
        # Random sample
        idx = np.random.randint(0, m)
        xi, yi = X[idx:idx+1], y[idx:idx+1]
        
        # Update using single sample
        prediction = xi @ theta
        error = prediction - yi
        gradient = xi.T @ error
        theta -= learning_rate * gradient
    return theta

# Adam Optimizer
class AdamOptimizer:
    def __init__(self, learning_rate=0.001, beta1=0.9, beta2=0.999, epsilon=1e-8):
        self.lr = learning_rate
        self.beta1 = beta1
        self.beta2 = beta2
        self.epsilon = epsilon
        self.m = None  # First moment
        self.v = None  # Second moment
        self.t = 0
    
    def update(self, params, gradients):
        if self.m is None:
            self.m = np.zeros_like(params)
            self.v = np.zeros_like(params)
        
        self.t += 1
        self.m = self.beta1 * self.m + (1 - self.beta1) * gradients
        self.v = self.beta2 * self.v + (1 - self.beta2) * (gradients ** 2)
        
        # Bias correction
        m_hat = self.m / (1 - self.beta1 ** self.t)
        v_hat = self.v / (1 - self.beta2 ** self.t)
        
        params -= self.lr * m_hat / (np.sqrt(v_hat) + self.epsilon)
        return params`
        },
        {
            question: "What is backpropagation and how does it work in neural networks?",
            answer: "Backpropagation computes gradients using chain rule. Forward pass: input flows to predictions. Backward pass: errors propagate back to calculate gradients layer by layer. Reuses intermediate computations for efficient deep network training.",
            code: `import numpy as np

class NeuralNetwork:
    def __init__(self, layers):
        self.weights = []
        self.biases = []
        
        # Initialize weights and biases
        for i in range(len(layers) - 1):
            w = np.random.randn(layers[i], layers[i+1]) * 0.1
            b = np.zeros((1, layers[i+1]))
            self.weights.append(w)
            self.biases.append(b)
    
    def sigmoid(self, x):
        return 1 / (1 + np.exp(-x))
    
    def sigmoid_derivative(self, x):
        return x * (1 - x)
    
    def forward(self, X):
        self.activations = [X]
        self.z_values = []
        
        for i in range(len(self.weights)):
            z = self.activations[-1] @ self.weights[i] + self.biases[i]
            self.z_values.append(z)
            
            if i < len(self.weights) - 1:
                a = self.sigmoid(z)  # Hidden layers
            else:
                a = z  # Output layer (linear)
            self.activations.append(a)
        
        return self.activations[-1]
    
    def backward(self, X, y, learning_rate=0.1):
        m = X.shape[0]
        
        # Start with output layer error
        delta = self.activations[-1] - y
        
        # Backpropagate through layers
        for i in range(len(self.weights) - 1, -1, -1):
            # Gradient computation
            dW = (1/m) * self.activations[i].T @ delta
            db = (1/m) * np.sum(delta, axis=0, keepdims=True)
            
            # Update weights and biases
            self.weights[i] -= learning_rate * dW
            self.biases[i] -= learning_rate * db
            
            # Propagate error to previous layer
            if i > 0:
                delta = (delta @ self.weights[i].T) * self.sigmoid_derivative(self.activations[i])

# Training example
nn = NeuralNetwork([784, 128, 64, 10])  # MNIST architecture
for epoch in range(100):
    predictions = nn.forward(X_train)
    loss = np.mean((predictions - y_train)**2)
    nn.backward(X_train, y_train)`
        },
        {
            question: "Explain regularization techniques (L1, L2, Dropout, Early Stopping).",
            answer: "L1/Lasso adds absolute weight penalty creating sparse models. L2/Ridge adds squared weight penalty keeping weights small. Dropout randomly deactivates neurons preventing co-adaptation. Early stopping halts training when validation loss starts increasing.",
            code: `# L1 and L2 Regularization
from sklearn.linear_model import Ridge, Lasso, ElasticNet

# L2 Regularization (Ridge)
ridge_model = Ridge(alpha=1.0)  # alpha controls regularization strength
ridge_model.fit(X_train, y_train)

# L1 Regularization (Lasso) - creates sparse models
lasso_model = Lasso(alpha=0.1)
lasso_model.fit(X_train, y_train)
sparse_features = np.sum(lasso_model.coef_ != 0)  # Count non-zero coefficients

# Combined L1 + L2 (Elastic Net)
elastic_model = ElasticNet(alpha=0.1, l1_ratio=0.5)
elastic_model.fit(X_train, y_train)

# Dropout in Neural Networks
import torch
import torch.nn as nn

class DropoutNet(nn.Module):
    def __init__(self, input_size, hidden_size, output_size, dropout_rate=0.5):
        super().__init__()
        self.fc1 = nn.Linear(input_size, hidden_size)
        self.dropout1 = nn.Dropout(dropout_rate)  # Randomly zero out neurons
        self.fc2 = nn.Linear(hidden_size, hidden_size)
        self.dropout2 = nn.Dropout(dropout_rate)
        self.fc3 = nn.Linear(hidden_size, output_size)
        
    def forward(self, x):
        x = torch.relu(self.fc1(x))
        x = self.dropout1(x)  # Apply dropout during training
        x = torch.relu(self.fc2(x))
        x = self.dropout2(x)
        x = self.fc3(x)
        return x

# Early Stopping
class EarlyStopping:
    def __init__(self, patience=10, min_delta=0.001):
        self.patience = patience
        self.min_delta = min_delta
        self.counter = 0
        self.best_loss = None
        self.early_stop = False
        
    def __call__(self, val_loss):
        if self.best_loss is None:
            self.best_loss = val_loss
        elif val_loss > self.best_loss - self.min_delta:
            self.counter += 1
            if self.counter >= self.patience:
                self.early_stop = True
        else:
            self.best_loss = val_loss
            self.counter = 0
        return self.early_stop

# Usage
early_stopping = EarlyStopping(patience=5)
for epoch in range(1000):
    train_loss = train_epoch(model, train_loader)
    val_loss = validate(model, val_loader)
    
    if early_stopping(val_loss):
        print(f"Early stopping at epoch {epoch}")
        break`
        },
        {
            question: "What is cross-validation and why is it important?",
            answer: "K-fold CV splits data into k parts, trains on k-1 folds, tests on 1, repeats k times. Benefits: detects overfitting, provides robust metrics, uses all data. Special variants: Stratified (maintains class balance), Time Series (preserves order).",
            code: `from sklearn.model_selection import cross_val_score, KFold, StratifiedKFold
from sklearn.model_selection import cross_validate
import numpy as np

# Basic k-fold cross-validation
model = RandomForestClassifier()
cv_scores = cross_val_score(model, X, y, cv=5, scoring='accuracy')
print(f"CV Scores: {cv_scores}")
print(f"Mean: {cv_scores.mean():.3f} (+/- {cv_scores.std() * 2:.3f})")

# Manual k-fold implementation
kfold = KFold(n_splits=5, shuffle=True, random_state=42)
scores = []

for train_idx, val_idx in kfold.split(X):
    X_train, X_val = X[train_idx], X[val_idx]
    y_train, y_val = y[train_idx], y[val_idx]
    
    model = RandomForestClassifier()
    model.fit(X_train, y_train)
    score = model.score(X_val, y_val)
    scores.append(score)

# Stratified k-fold for imbalanced datasets
skfold = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
# Maintains class distribution in each fold

# Time Series Cross-Validation
from sklearn.model_selection import TimeSeriesSplit

tscv = TimeSeriesSplit(n_splits=5)
for train_idx, val_idx in tscv.split(X):
    # Training data always comes before validation data
    print(f"Train: {train_idx[:5]}... Val: {val_idx[:5]}...")

# Cross-validation with multiple metrics
scoring = {
    'accuracy': 'accuracy',
    'precision': 'precision_macro',
    'recall': 'recall_macro',
    'f1': 'f1_macro'
}

cv_results = cross_validate(model, X, y, cv=5, scoring=scoring)
for metric, scores in cv_results.items():
    if metric.startswith('test_'):
        print(f"{metric}: {scores.mean():.3f}")`
        },
        {
            question: "Explain the concept of feature engineering and its importance in ML.",
            answer: "Feature engineering creates or transforms features to improve model performance. Methods include scaling, encoding categoricals, creating interactions, polynomial features, and domain-specific transformations. Often more impactful than algorithm selection.",
            code: `import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, MinMaxScaler, LabelEncoder
from sklearn.preprocessing import OneHotEncoder, PolynomialFeatures

# Feature Scaling
scaler = StandardScaler()  # Zero mean, unit variance
X_scaled = scaler.fit_transform(X)

# Min-Max Scaling
minmax = MinMaxScaler()  # Scale to [0, 1]
X_minmax = minmax.fit_transform(X)

# Categorical Encoding
# One-hot encoding
onehot = OneHotEncoder(sparse=False)
categorical_encoded = onehot.fit_transform(df[['category']])

# Label encoding (for ordinal features)
label_encoder = LabelEncoder()
df['size_encoded'] = label_encoder.fit_transform(df['size'])  # S, M, L -> 0, 1, 2

# Feature Creation
df['price_per_sqft'] = df['price'] / df['square_feet']
df['age'] = pd.datetime.now().year - df['year_built']
df['total_rooms'] = df['bedrooms'] + df['bathrooms']

# Polynomial Features
poly = PolynomialFeatures(degree=2, include_bias=False)
X_poly = poly.fit_transform(X)  # Creates x1, x2, x1^2, x1*x2, x2^2

# Time-based Features
df['day_of_week'] = pd.to_datetime(df['date']).dt.dayofweek
df['month'] = pd.to_datetime(df['date']).dt.month
df['is_weekend'] = df['day_of_week'].isin([5, 6]).astype(int)

# Text Features
from sklearn.feature_extraction.text import TfidfVectorizer

tfidf = TfidfVectorizer(max_features=1000, stop_words='english')
text_features = tfidf.fit_transform(df['description'])

# Binning continuous variables
df['age_group'] = pd.cut(df['age'], bins=[0, 18, 35, 50, 65, 100], 
                         labels=['child', 'young', 'middle', 'senior', 'elderly'])

# Feature Selection
from sklearn.feature_selection import SelectKBest, f_classif
from sklearn.feature_selection import RFE

# Select top k features
selector = SelectKBest(score_func=f_classif, k=10)
X_selected = selector.fit_transform(X, y)

# Recursive Feature Elimination
rfe = RFE(estimator=RandomForestClassifier(), n_features_to_select=10)
X_rfe = rfe.fit_transform(X, y)
selected_features = X.columns[rfe.support_]`
        },
        {
            question: "What are word embeddings (Word2Vec, GloVe) and how do they work?",
            answer: "Word embeddings are dense vectors capturing semantic meaning. Word2Vec uses Skip-gram (predict context from word) or CBOW (predict word from context). GloVe uses global co-occurrence statistics. Result: similar words have nearby vectors in space.",
            code: `# Word2Vec implementation concept
import numpy as np
from collections import defaultdict

class Word2Vec:
    def __init__(self, sentences, vector_size=100, window=5, min_count=1):
        self.vector_size = vector_size
        self.window = window
        self.min_count = min_count
        self.word_vectors = {}
        self.vocabulary = self.build_vocabulary(sentences)
        
    def build_vocabulary(self, sentences):
        word_count = defaultdict(int)
        for sentence in sentences:
            for word in sentence:
                word_count[word] += 1
        
        vocab = {word: idx for idx, (word, count) in enumerate(word_count.items()) 
                 if count >= self.min_count}
        return vocab
    
    def train_skip_gram(self, sentences, epochs=5, learning_rate=0.025):
        # Initialize word vectors
        vocab_size = len(self.vocabulary)
        self.W1 = np.random.randn(vocab_size, self.vector_size) * 0.1
        self.W2 = np.random.randn(self.vector_size, vocab_size) * 0.1
        
        for epoch in range(epochs):
            for sentence in sentences:
                for i, center_word in enumerate(sentence):
                    if center_word not in self.vocabulary:
                        continue
                    
                    # Get context words within window
                    context_words = []
                    for j in range(max(0, i - self.window), 
                                  min(len(sentence), i + self.window + 1)):
                        if i != j and sentence[j] in self.vocabulary:
                            context_words.append(sentence[j])
                    
                    # Skip-gram training (simplified)
                    center_idx = self.vocabulary[center_word]
                    for context_word in context_words:
                        context_idx = self.vocabulary[context_word]
                        
                        # Forward pass
                        h = self.W1[center_idx]  # Hidden layer
                        u = np.dot(h, self.W2)   # Output layer
                        y_pred = self.softmax(u)
                        
                        # Backward pass (gradient descent)
                        # ... (implementation details)

# Using pre-trained embeddings with Gensim
from gensim.models import Word2Vec, KeyedVectors

# Train Word2Vec
sentences = [['this', 'is', 'a', 'sentence'], ['another', 'sentence']]
model = Word2Vec(sentences, vector_size=100, window=5, min_count=1, workers=4)

# Access word vectors
vector = model.wv['sentence']
similar_words = model.wv.most_similar('sentence', topn=5)

# Load pre-trained embeddings (GloVe)
# Download from: https://nlp.stanford.edu/projects/glove/
glove_file = 'glove.6B.100d.txt'
word_vectors = {}

with open(glove_file, 'r', encoding='utf-8') as f:
    for line in f:
        values = line.split()
        word = values[0]
        vector = np.array(values[1:], dtype='float32')
        word_vectors[word] = vector

# Using embeddings in neural networks
embedding_matrix = np.zeros((vocab_size, embedding_dim))
for word, idx in word_to_idx.items():
    if word in word_vectors:
        embedding_matrix[idx] = word_vectors[word]

# Embedding layer in Keras/TensorFlow
from tensorflow.keras.layers import Embedding

embedding_layer = Embedding(
    input_dim=vocab_size,
    output_dim=embedding_dim,
    weights=[embedding_matrix],
    trainable=False  # Freeze pre-trained embeddings
)`
        },
        {
            question: "What is the attention mechanism and how does it improve sequence models?",
            answer: "Attention mechanisms let models focus on relevant input parts. Computes weighted sum of all states instead of fixed-size context. Uses Query, Key, Value matrices to calculate attention weights. Enables long-range dependencies and improves translation/summarization.",
            code: `import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np

# Basic Attention Mechanism
class BahdanauAttention(nn.Module):
    def __init__(self, hidden_size):
        super().__init__()
        self.W_q = nn.Linear(hidden_size, hidden_size)
        self.W_k = nn.Linear(hidden_size, hidden_size)
        self.W_v = nn.Linear(hidden_size, hidden_size)
        self.fc = nn.Linear(hidden_size, 1)
        
    def forward(self, query, keys, values, mask=None):
        # query: [batch, 1, hidden_size]
        # keys: [batch, seq_len, hidden_size]
        # values: [batch, seq_len, hidden_size]
        
        # Calculate attention scores
        scores = self.fc(torch.tanh(self.W_q(query) + self.W_k(keys)))
        scores = scores.squeeze(-1)  # [batch, seq_len]
        
        if mask is not None:
            scores = scores.masked_fill(mask == 0, -1e9)
        
        # Apply softmax to get attention weights
        attention_weights = F.softmax(scores, dim=-1)
        
        # Weighted sum of values
        context = torch.bmm(attention_weights.unsqueeze(1), values)
        
        return context, attention_weights

# Scaled Dot-Product Attention (used in Transformers)
def scaled_dot_product_attention(query, key, value, mask=None, dropout=None):
    d_k = query.size(-1)
    
    # Compute attention scores
    scores = torch.matmul(query, key.transpose(-2, -1)) / np.sqrt(d_k)
    
    if mask is not None:
        scores = scores.masked_fill(mask == 0, -1e9)
    
    attention_weights = F.softmax(scores, dim=-1)
    
    if dropout is not None:
        attention_weights = dropout(attention_weights)
    
    output = torch.matmul(attention_weights, value)
    return output, attention_weights

# Multi-Head Attention
class MultiHeadAttention(nn.Module):
    def __init__(self, d_model, num_heads, dropout=0.1):
        super().__init__()
        assert d_model % num_heads == 0
        
        self.d_model = d_model
        self.num_heads = num_heads
        self.d_k = d_model // num_heads
        
        self.W_q = nn.Linear(d_model, d_model)
        self.W_k = nn.Linear(d_model, d_model)
        self.W_v = nn.Linear(d_model, d_model)
        self.W_o = nn.Linear(d_model, d_model)
        
        self.dropout = nn.Dropout(dropout)
        
    def forward(self, query, key, value, mask=None):
        batch_size = query.size(0)
        
        # Linear transformations and split into heads
        Q = self.W_q(query).view(batch_size, -1, self.num_heads, self.d_k).transpose(1, 2)
        K = self.W_k(key).view(batch_size, -1, self.num_heads, self.d_k).transpose(1, 2)
        V = self.W_v(value).view(batch_size, -1, self.num_heads, self.d_k).transpose(1, 2)
        
        # Apply attention
        attention_output, attention_weights = scaled_dot_product_attention(
            Q, K, V, mask, self.dropout
        )
        
        # Concatenate heads
        attention_output = attention_output.transpose(1, 2).contiguous().view(
            batch_size, -1, self.d_model
        )
        
        # Final linear transformation
        output = self.W_o(attention_output)
        
        return output, attention_weights

# Self-Attention example in sequence labeling
class SelfAttentionLayer(nn.Module):
    def __init__(self, input_dim):
        super().__init__()
        self.attention = nn.MultiheadAttention(input_dim, num_heads=8)
        self.norm = nn.LayerNorm(input_dim)
        self.dropout = nn.Dropout(0.1)
        
    def forward(self, x):
        # Self-attention: query, key, value are all the same
        attn_output, _ = self.attention(x, x, x)
        
        # Add & Norm (residual connection)
        x = self.norm(x + self.dropout(attn_output))
        return x`
        },
        {
            question: "Explain batch normalization and its benefits in deep learning.",
            answer: "Batch normalization normalizes layer inputs using batch statistics (mean, variance). Benefits: faster training, allows higher learning rates, reduces internal covariate shift, acts as regularization, less sensitive to initialization. Apply before or after activation functions.",
            code: `import torch
import torch.nn as nn
import numpy as np

# Batch Normalization implementation concept
class BatchNorm1d:
    def __init__(self, num_features, eps=1e-5, momentum=0.1):
        self.num_features = num_features
        self.eps = eps
        self.momentum = momentum
        
        # Parameters to be learned
        self.gamma = np.ones(num_features)  # Scale
        self.beta = np.zeros(num_features)  # Shift
        
        # Running statistics
        self.running_mean = np.zeros(num_features)
        self.running_var = np.ones(num_features)
        
    def forward(self, x, training=True):
        if training:
            # Calculate batch statistics
            batch_mean = np.mean(x, axis=0)
            batch_var = np.var(x, axis=0)
            
            # Update running statistics
            self.running_mean = (1 - self.momentum) * self.running_mean + self.momentum * batch_mean
            self.running_var = (1 - self.momentum) * self.running_var + self.momentum * batch_var
            
            # Normalize
            x_norm = (x - batch_mean) / np.sqrt(batch_var + self.eps)
        else:
            # Use running statistics during inference
            x_norm = (x - self.running_mean) / np.sqrt(self.running_var + self.eps)
        
        # Scale and shift
        out = self.gamma * x_norm + self.beta
        return out

# Using BatchNorm in PyTorch
class ConvNet(nn.Module):
    def __init__(self, num_classes=10):
        super().__init__()
        # Conv -> BatchNorm -> ReLU pattern
        self.conv1 = nn.Conv2d(3, 64, kernel_size=3, padding=1)
        self.bn1 = nn.BatchNorm2d(64)
        self.conv2 = nn.Conv2d(64, 128, kernel_size=3, padding=1)
        self.bn2 = nn.BatchNorm2d(128)
        
        self.fc1 = nn.Linear(128 * 7 * 7, 256)
        self.bn3 = nn.BatchNorm1d(256)
        self.fc2 = nn.Linear(256, num_classes)
        
        self.pool = nn.MaxPool2d(2, 2)
        self.dropout = nn.Dropout(0.5)
        
    def forward(self, x):
        # Conv block 1
        x = self.pool(F.relu(self.bn1(self.conv1(x))))
        
        # Conv block 2
        x = self.pool(F.relu(self.bn2(self.conv2(x))))
        
        # Flatten
        x = x.view(x.size(0), -1)
        
        # FC layers
        x = F.relu(self.bn3(self.fc1(x)))
        x = self.dropout(x)
        x = self.fc2(x)
        
        return x

# Benefits demonstration
# Without BatchNorm - slower convergence, need smaller learning rate
model_no_bn = SimpleNet(use_bn=False)
optimizer_no_bn = torch.optim.SGD(model_no_bn.parameters(), lr=0.01)

# With BatchNorm - faster convergence, can use larger learning rate
model_with_bn = SimpleNet(use_bn=True)
optimizer_with_bn = torch.optim.SGD(model_with_bn.parameters(), lr=0.1)

# Training comparison
for epoch in range(epochs):
    # Model with BN typically converges faster and achieves better performance
    train_with_bn = train_epoch(model_with_bn, train_loader, optimizer_with_bn)
    train_no_bn = train_epoch(model_no_bn, train_loader, optimizer_no_bn)`
        },
        
        // General Python Questions
        {
            question: "Explain Python's GIL (Global Interpreter Lock) and its implications.",
            answer: "GIL (Global Interpreter Lock) allows only one thread to execute Python at a time. This limits true parallelism in CPU-bound tasks. Solutions: multiprocessing for CPU work, async/await for I/O, or C extensions like NumPy that release the GIL.",
            code: `import threading
import multiprocessing
import time
import asyncio

# GIL limitation example - CPU-bound tasks
def cpu_bound_task(n):
    result = 0
    for i in range(n):
        result += i ** 2
    return result

# Threading (limited by GIL for CPU-bound tasks)
def threading_example():
    start = time.time()
    threads = []
    
    for _ in range(4):
        t = threading.Thread(target=cpu_bound_task, args=(10_000_000,))
        t.start()
        threads.append(t)
    
    for t in threads:
        t.join()
    
    print(f"Threading time: {time.time() - start:.2f}s")
    # Won't see significant speedup due to GIL

# Multiprocessing (true parallelism)
def multiprocessing_example():
    start = time.time()
    
    with multiprocessing.Pool(4) as pool:
        results = pool.map(cpu_bound_task, [10_000_000] * 4)
    
    print(f"Multiprocessing time: {time.time() - start:.2f}s")
    # Significant speedup for CPU-bound tasks

# I/O-bound tasks work well with threading
def io_bound_task(url):
    # Simulated I/O operation
    time.sleep(1)  # GIL is released during I/O
    return f"Downloaded {url}"

# Async/await for concurrent I/O
async def async_io_task(session, url):
    async with session.get(url) as response:
        return await response.text()

async def async_main():
    import aiohttp
    urls = ['http://example.com'] * 10
    
    async with aiohttp.ClientSession() as session:
        tasks = [async_io_task(session, url) for url in urls]
        results = await asyncio.gather(*tasks)
    
    return results

# Using C extensions that release GIL
# NumPy operations release GIL
import numpy as np

def numpy_parallel():
    # These operations can run in parallel
    # because NumPy releases GIL during computation
    arrays = [np.random.rand(1000, 1000) for _ in range(4)]
    
    threads = []
    results = [None] * 4
    
    def matrix_multiply(idx, arr):
        results[idx] = np.dot(arr, arr.T)
    
    for i, arr in enumerate(arrays):
        t = threading.Thread(target=matrix_multiply, args=(i, arr))
        t.start()
        threads.append(t)
    
    for t in threads:
        t.join()`
        },
        {
            question: "What are Python decorators and how do they work?",
            answer: "Decorators are functions that wrap and modify other functions using @decorator syntax. Common uses: logging, timing, caching, authentication, validation. Pattern: decorator takes function, returns wrapper function that adds behavior.",
            code: `import time
import functools
from typing import Any, Callable

# Basic decorator
def timer_decorator(func):
    @functools.wraps(func)  # Preserves function metadata
    def wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        end = time.time()
        print(f"{func.__name__} took {end - start:.4f} seconds")
        return result
    return wrapper

@timer_decorator
def slow_function():
    time.sleep(1)
    return "Done"

# Decorator with arguments
def retry(max_attempts=3, delay=1):
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(max_attempts):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    if attempt == max_attempts - 1:
                        raise
                    print(f"Attempt {attempt + 1} failed: {e}")
                    time.sleep(delay)
            return None
        return wrapper
    return decorator

@retry(max_attempts=3, delay=2)
def unreliable_api_call():
    import random
    if random.random() < 0.7:
        raise ConnectionError("API failed")
    return "Success"

# Class decorator
def singleton(cls):
    instances = {}
    def get_instance(*args, **kwargs):
        if cls not in instances:
            instances[cls] = cls(*args, **kwargs)
        return instances[cls]
    return get_instance

@singleton
class DatabaseConnection:
    def __init__(self):
        self.connection = "Connected to DB"

# Property decorator
class Temperature:
    def __init__(self, celsius=0):
        self._celsius = celsius
    
    @property
    def celsius(self):
        return self._celsius
    
    @celsius.setter
    def celsius(self, value):
        if value < -273.15:
            raise ValueError("Temperature below absolute zero is not possible")
        self._celsius = value
    
    @property
    def fahrenheit(self):
        return self._celsius * 9/5 + 32
    
    @fahrenheit.setter
    def fahrenheit(self, value):
        self.celsius = (value - 32) * 5/9

# Memoization decorator
def memoize(func):
    cache = {}
    
    @functools.wraps(func)
    def wrapper(*args):
        if args in cache:
            return cache[args]
        result = func(*args)
        cache[args] = result
        return result
    
    wrapper.cache = cache  # Expose cache for inspection
    return wrapper

@memoize
def fibonacci(n):
    if n < 2:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

# Decorator classes
class CountCalls:
    def __init__(self, func):
        self.func = func
        self.count = 0
    
    def __call__(self, *args, **kwargs):
        self.count += 1
        print(f"Call {self.count} of {self.func.__name__}")
        return self.func(*args, **kwargs)

@CountCalls
def say_hello():
    print("Hello!")

# Chaining decorators
@timer_decorator
@memoize
def expensive_computation(n):
    time.sleep(0.1)
    return sum(i ** 2 for i in range(n))`
        },
        {
            question: "Explain Python's memory management and garbage collection.",
            answer: "Python uses reference counting plus cyclic garbage collector. Memory in private heap managed by Python. Objects deallocated when refcount reaches 0. Generational GC (0,1,2) handles circular references. Manual collection with gc.collect().",
            code: `import gc
import sys
import weakref

# Reference counting
def reference_counting_demo():
    # Create object and check reference count
    obj = [1, 2, 3]
    print(f"Initial refs: {sys.getrefcount(obj) - 1}")  # -1 for getrefcount's reference
    
    # Create another reference
    another_ref = obj
    print(f"After assignment: {sys.getrefcount(obj) - 1}")
    
    # Create container reference
    container = {'data': obj}
    print(f"After container: {sys.getrefcount(obj) - 1}")
    
    # Delete references
    del another_ref
    print(f"After del: {sys.getrefcount(obj) - 1}")
    
    # Object destroyed when last reference removed
    del container
    del obj  # Object deallocated here

# Circular references problem
class Node:
    def __init__(self, value):
        self.value = value
        self.next = None
        print(f"Node {value} created")
    
    def __del__(self):
        print(f"Node {self.value} destroyed")

def circular_reference_demo():
    # Create circular reference
    node1 = Node(1)
    node2 = Node(2)
    node1.next = node2
    node2.next = node1  # Circular reference
    
    # Delete local references
    del node1
    del node2
    
    # Objects not immediately destroyed due to circular reference
    print("Before garbage collection")
    
    # Force garbage collection
    gc.collect()
    print("After garbage collection")

# Weak references
def weak_reference_demo():
    class ExpensiveObject:
        def __init__(self, data):
            self.data = data
            print(f"ExpensiveObject created with {data}")
        
        def __del__(self):
            print(f"ExpensiveObject with {self.data} destroyed")
    
    # Regular reference
    obj = ExpensiveObject("important data")
    strong_ref = obj
    
    # Weak reference doesn't prevent garbage collection
    weak_ref = weakref.ref(obj)
    
    print(f"Object via weak ref: {weak_ref()}")
    
    # Delete strong references
    del obj
    del strong_ref
    
    # Object is garbage collected
    print(f"Object via weak ref after deletion: {weak_ref()}")  # Returns None

# Memory optimization techniques
# 1. __slots__ to reduce memory usage
class RegularClass:
    def __init__(self, x, y):
        self.x = x
        self.y = y

class SlottedClass:
    __slots__ = ['x', 'y']  # Prevents __dict__ creation
    
    def __init__(self, x, y):
        self.x = x
        self.y = y

# Memory comparison
regular = RegularClass(1, 2)
slotted = SlottedClass(1, 2)
print(f"Regular size: {sys.getsizeof(regular.__dict__)}")  # Has __dict__
# print(f"Slotted size: {sys.getsizeof(slotted.__dict__)}")  # No __dict__, AttributeError

# 2. Generator expressions for memory efficiency
# List comprehension (stores all in memory)
squares_list = [x**2 for x in range(1000000)]
print(f"List size: {sys.getsizeof(squares_list)} bytes")

# Generator expression (lazy evaluation)
squares_gen = (x**2 for x in range(1000000))
print(f"Generator size: {sys.getsizeof(squares_gen)} bytes")

# 3. Context managers for resource management
class FileManager:
    def __init__(self, filename, mode):
        self.filename = filename
        self.mode = mode
        self.file = None
    
    def __enter__(self):
        self.file = open(self.filename, self.mode)
        return self.file
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.file.close()
        # Memory/resources freed automatically

# Garbage collection control
# Get current thresholds
print(f"GC thresholds: {gc.get_threshold()}")

# Disable automatic garbage collection (careful!)
gc.disable()
# ... performance critical code ...
gc.enable()

# Manual collection with generation specification
gc.collect(0)  # Collect generation 0
gc.collect(1)  # Collect generations 0 and 1
gc.collect(2)  # Full collection

# Memory profiling
import tracemalloc

tracemalloc.start()

# Code to profile
data = [i ** 2 for i in range(100000)]

current, peak = tracemalloc.get_traced_memory()
print(f"Current memory usage: {current / 1024 / 1024:.2f} MB")
print(f"Peak memory usage: {peak / 1024 / 1024:.2f} MB")

tracemalloc.stop()`
        },
        {
            question: "What is the difference between deep copy and shallow copy in Python?",
            answer: "Shallow copy creates new object but shares references to nested objects. Deep copy creates new object and recursively copies all nested objects. Use copy.copy() for shallow, copy.deepcopy() for deep. Critical when working with nested mutable structures.",
            code: `import copy

# Demonstrating shallow vs deep copy
original_list = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]

# Shallow copy
shallow = copy.copy(original_list)
# Also: shallow = original_list.copy() or shallow = original_list[:]

# Deep copy
deep = copy.deepcopy(original_list)

# Modifying nested objects
original_list[0][0] = 999

print(f"Original: {original_list}")  # [[999, 2, 3], [4, 5, 6], [7, 8, 9]]
print(f"Shallow: {shallow}")         # [[999, 2, 3], [4, 5, 6], [7, 8, 9]] - Changed!
print(f"Deep: {deep}")              # [[1, 2, 3], [4, 5, 6], [7, 8, 9]] - Unchanged

# Custom objects example
class Person:
    def __init__(self, name, friends=None):
        self.name = name
        self.friends = friends or []
    
    def add_friend(self, friend):
        self.friends.append(friend)
    
    def __repr__(self):
        return f"Person(name='{self.name}', friends={[f.name for f in self.friends]})"

# Create relationships
alice = Person("Alice")
bob = Person("Bob")
charlie = Person("Charlie", [alice, bob])

# Shallow copy
charlie_shallow = copy.copy(charlie)
charlie_shallow.name = "Charlie Shallow"
charlie_shallow.add_friend(Person("David"))

print(f"Original Charlie: {charlie}")
print(f"Shallow Charlie: {charlie_shallow}")
# Friends list is shared!

# Deep copy
charlie_deep = copy.deepcopy(charlie)
charlie_deep.name = "Charlie Deep"
charlie_deep.friends[0].name = "Alice Modified"

print(f"Original Charlie: {charlie}")
print(f"Deep Charlie: {charlie_deep}")
# Completely independent copy

# Custom copy behavior
class CustomObject:
    def __init__(self, data, shared_resource):
        self.data = data
        self.shared_resource = shared_resource
    
    def __copy__(self):
        # Custom shallow copy behavior
        return CustomObject(
            copy.copy(self.data),
            self.shared_resource  # Share the resource
        )
    
    def __deepcopy__(self, memo):
        # Custom deep copy behavior
        return CustomObject(
            copy.deepcopy(self.data, memo),
            self.shared_resource  # Still share this specific resource
        )

# Performance considerations
import time

large_nested_list = [[i] * 100 for i in range(1000)]

# Shallow copy is faster
start = time.time()
shallow_result = copy.copy(large_nested_list)
shallow_time = time.time() - start

# Deep copy is slower but safer
start = time.time()
deep_result = copy.deepcopy(large_nested_list)
deep_time = time.time() - start

print(f"Shallow copy time: {shallow_time:.6f}s")
print(f"Deep copy time: {deep_time:.6f}s")
print(f"Deep copy is {deep_time/shallow_time:.2f}x slower")

# Common pitfalls
# 1. Mutable default arguments
def add_item(item, list_=[]):  # DON'T DO THIS
    list_.append(item)
    return list_

result1 = add_item(1)  # [1]
result2 = add_item(2)  # [1, 2] - Unexpected!

# Fix with None default
def add_item_fixed(item, list_=None):
    if list_ is None:
        list_ = []
    list_.append(item)
    return list_

# 2. Dictionary copy gotchas
dict_original = {'a': [1, 2, 3], 'b': {'nested': 'value'}}
dict_shallow = dict_original.copy()  # or dict(dict_original)

dict_original['a'].append(4)
dict_original['b']['nested'] = 'modified'

print(f"Original dict: {dict_original}")
print(f"Shallow dict: {dict_shallow}")  # Nested structures are shared!`
        },
        {
            question: "Explain Python's context managers and the 'with' statement.",
            answer: "Context managers ensure proper resource management using __enter__ and __exit__ methods. The 'with' statement guarantees cleanup even if exceptions occur. Common uses: file handling, locks, database connections. Create with classes or @contextmanager decorator.",
            code: `import contextlib
import sqlite3
import threading
import time
from typing import Any

# Basic context manager class
class FileManager:
    def __init__(self, filename, mode):
        self.filename = filename
        self.mode = mode
        self.file = None
    
    def __enter__(self):
        print(f"Opening file: {self.filename}")
        self.file = open(self.filename, self.mode)
        return self.file
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        print(f"Closing file: {self.filename}")
        if self.file:
            self.file.close()
        
        # Handle exceptions if needed
        if exc_type is not None:
            print(f"Exception occurred: {exc_type.__name__}: {exc_val}")
        
        # Return False to propagate exception, True to suppress
        return False

# Using the context manager
with FileManager('test.txt', 'w') as f:
    f.write("Hello, World!")
# File automatically closed

# Context manager decorator
@contextlib.contextmanager
def timer_context(name):
    print(f"Starting {name}")
    start = time.time()
    try:
        yield start  # This is where the with block executes
    finally:
        end = time.time()
        print(f"{name} took {end - start:.4f} seconds")

with timer_context("Data processing") as start_time:
    time.sleep(1)
    print(f"Started at {start_time}")

# Database connection manager
class DatabaseConnection:
    def __init__(self, db_name):
        self.db_name = db_name
        self.conn = None
        self.cursor = None
    
    def __enter__(self):
        self.conn = sqlite3.connect(self.db_name)
        self.cursor = self.conn.cursor()
        return self.cursor
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is None:
            self.conn.commit()
        else:
            self.conn.rollback()
        
        self.cursor.close()
        self.conn.close()

# Thread lock context manager
lock = threading.Lock()

@contextlib.contextmanager
def acquire_lock(lock, timeout=None):
    acquired = lock.acquire(timeout=timeout)
    try:
        if acquired:
            yield lock
        else:
            raise TimeoutError("Could not acquire lock")
    finally:
        if acquired:
            lock.release()

# Multiple context managers
with acquire_lock(lock), timer_context("Critical section"):
    # Thread-safe operation
    print("Doing thread-safe work")

# Nested context managers
with open('input.txt', 'r') as infile, \
     open('output.txt', 'w') as outfile:
    data = infile.read()
    outfile.write(data.upper())

# Custom cleanup with suppress
from contextlib import suppress

# Ignore specific exceptions
with suppress(FileNotFoundError, PermissionError):
    os.remove('possibly_missing_file.txt')
# No exception raised even if file doesn't exist

# Reentrant context manager
@contextlib.contextmanager
def reentrant_lock():
    print("Acquiring lock")
    yield
    print("Releasing lock")

# ExitStack for dynamic context management
def process_files(filenames):
    with contextlib.ExitStack() as stack:
        files = [
            stack.enter_context(open(fname))
            for fname in filenames
        ]
        # All files will be properly closed
        return [f.read() for f in files]

# Async context managers
import asyncio

class AsyncResource:
    async def __aenter__(self):
        print("Acquiring async resource")
        await asyncio.sleep(0.1)
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        print("Releasing async resource")
        await asyncio.sleep(0.1)

async def use_async_resource():
    async with AsyncResource() as resource:
        print("Using async resource")
        await asyncio.sleep(0.5)

# Practical example: Temporary directory
import tempfile
import shutil

@contextlib.contextmanager
def temporary_directory():
    temp_dir = tempfile.mkdtemp()
    try:
        yield temp_dir
    finally:
        shutil.rmtree(temp_dir)

with temporary_directory() as temp_dir:
    # Work with temporary directory
    temp_file = os.path.join(temp_dir, 'temp.txt')
    with open(temp_file, 'w') as f:
        f.write("Temporary data")
# Directory and all contents automatically deleted

# Context manager for changing working directory
@contextlib.contextmanager
def change_dir(destination):
    current = os.getcwd()
    try:
        os.chdir(destination)
        yield
    finally:
        os.chdir(current)

with change_dir('/tmp'):
    print(f"Now in: {os.getcwd()}")
# Back to original directory`
        },
        {
            question: "What are metaclasses in Python and when would you use them?",
            answer: "Metaclasses are classes whose instances are classes themselves. Default metaclass is 'type'. Use cases: ORMs, singleton patterns, class validation, frameworks. Generally avoid unless building frameworks - 'deeper magic than 99% of users need'.",
            code: `# Understanding metaclasses
# Classes are instances of metaclasses
class SimpleClass:
    pass

print(type(SimpleClass))  # <class 'type'>
print(type(type))        # <class 'type'> - type is its own metaclass

# Creating a class dynamically with type
def init(self, name):
    self.name = name

def greet(self):
    return f"Hello, I'm {self.name}"

# type(name, bases, dict)
DynamicClass = type('DynamicClass', (), {
    '__init__': init,
    'greet': greet,
    'class_var': 42
})

obj = DynamicClass("Dynamic")
print(obj.greet())  # Hello, I'm Dynamic

# Custom metaclass
class SingletonMeta(type):
    _instances = {}
    
    def __call__(cls, *args, **kwargs):
        if cls not in cls._instances:
            cls._instances[cls] = super().__call__(*args, **kwargs)
        return cls._instances[cls]

class Singleton(metaclass=SingletonMeta):
    def __init__(self, value):
        self.value = value

# Test singleton
s1 = Singleton(1)
s2 = Singleton(2)
print(s1 is s2)  # True - same instance
print(s1.value)  # 1 - initialized only once

# Metaclass for validation
class ValidatedMeta(type):
    def __new__(mcs, name, bases, namespace):
        # Validate class definition
        if 'required_method' not in namespace:
            raise TypeError(f"{name} must implement required_method")
        
        # Ensure all methods have docstrings
        for attr_name, attr_value in namespace.items():
            if callable(attr_value) and not attr_name.startswith('_'):
                if not attr_value.__doc__:
                    raise ValueError(f"{name}.{attr_name} must have a docstring")
        
        return super().__new__(mcs, name, bases, namespace)

class ValidatedClass(metaclass=ValidatedMeta):
    def required_method(self):
        """This method is required."""
        pass

# ORM-style metaclass example
class ModelMeta(type):
    def __new__(mcs, name, bases, namespace):
        if name == 'Model':
            return super().__new__(mcs, name, bases, namespace)
        
        # Collect field definitions
        fields = {}
        for key, value in namespace.items():
            if isinstance(value, Field):
                fields[key] = value
                value.name = key
        
        namespace['_fields'] = fields
        return super().__new__(mcs, name, bases, namespace)

class Field:
    def __init__(self, field_type, default=None):
        self.field_type = field_type
        self.default = default
        self.name = None
    
    def __get__(self, instance, owner):
        if instance is None:
            return self
        return instance.__dict__.get(self.name, self.default)
    
    def __set__(self, instance, value):
        if not isinstance(value, self.field_type):
            raise TypeError(f"{self.name} must be {self.field_type}")
        instance.__dict__[self.name] = value

class Model(metaclass=ModelMeta):
    def __init__(self, **kwargs):
        for name, field in self._fields.items():
            value = kwargs.get(name, field.default)
            setattr(self, name, value)
    
    def to_dict(self):
        return {name: getattr(self, name) for name in self._fields}

# Using the ORM-style model
class User(Model):
    name = Field(str)
    age = Field(int, default=0)
    email = Field(str)

user = User(name="Alice", email="alice@example.com")
print(user.to_dict())  # {'name': 'Alice', 'age': 0, 'email': 'alice@example.com'}

# Abstract base class with metaclass
from abc import ABCMeta, abstractmethod

class PluginMeta(ABCMeta):
    # Registry of all plugins
    plugins = {}
    
    def __new__(mcs, name, bases, namespace):
        cls = super().__new__(mcs, name, bases, namespace)
        
        # Register non-abstract classes
        if not hasattr(cls, '__abstractmethods__') or not cls.__abstractmethods__:
            mcs.plugins[name] = cls
        
        return cls

class Plugin(metaclass=PluginMeta):
    @abstractmethod
    def execute(self):
        pass

class ConcretePlugin(Plugin):
    def execute(self):
        print("Executing concrete plugin")

print(PluginMeta.plugins)  # {'ConcretePlugin': <class 'ConcretePlugin'>}

# __prepare__ method for ordered namespaces
class OrderedMeta(type):
    @classmethod
    def __prepare__(mcs, name, bases):
        # Return OrderedDict to preserve attribute order
        from collections import OrderedDict
        return OrderedDict()
    
    def __new__(mcs, name, bases, namespace):
        cls = super().__new__(mcs, name, bases, namespace)
        cls._order = list(namespace.keys())
        return cls

class OrderedClass(metaclass=OrderedMeta):
    first = 1
    second = 2
    third = 3

print(OrderedClass._order)  # Preserves definition order`
        },
        {
            question: "Explain Python's async/await and how it differs from threading.",
            answer: "Async/await provides cooperative multitasking on single thread for I/O operations. Threading uses OS threads with preemptive multitasking. Async is better for I/O (avoids GIL) but needs async libraries. Threading better for CPU-bound tasks with C extensions.",
            code: `import asyncio
import aiohttp
import threading
import time
import concurrent.futures

# Basic async/await example
async def fetch_data(url):
    print(f"Fetching {url}")
    await asyncio.sleep(1)  # Simulated I/O
    return f"Data from {url}"

async def main():
    # Concurrent execution
    urls = ['http://api1.com', 'http://api2.com', 'http://api3.com']
    
    # Method 1: gather
    results = await asyncio.gather(
        fetch_data(urls[0]),
        fetch_data(urls[1]),
        fetch_data(urls[2])
    )
    print(f"Results: {results}")
    
    # Method 2: create_task
    tasks = [asyncio.create_task(fetch_data(url)) for url in urls]
    results = await asyncio.gather(*tasks)
    
    # Method 3: as_completed
    tasks = [asyncio.create_task(fetch_data(url)) for url in urls]
    for coro in asyncio.as_completed(tasks):
        result = await coro
        print(f"Completed: {result}")

# Run async code
asyncio.run(main())

# Async context manager
class AsyncDatabase:
    async def __aenter__(self):
        print("Connecting to database...")
        await asyncio.sleep(0.5)
        self.connection = "Connected"
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        print("Closing database connection...")
        await asyncio.sleep(0.5)
    
    async def query(self, sql):
        await asyncio.sleep(0.1)
        return f"Results for: {sql}"

async def use_database():
    async with AsyncDatabase() as db:
        result = await db.query("SELECT * FROM users")
        print(result)

# Async generator
async def async_range(start, stop):
    for i in range(start, stop):
        await asyncio.sleep(0.1)
        yield i

async def use_async_generator():
    async for num in async_range(0, 5):
        print(f"Got: {num}")

# Comparison: Async vs Threading
# Async I/O-bound task
async def async_io_task(n):
    start = time.time()
    tasks = []
    
    async def io_operation(i):
        await asyncio.sleep(1)  # Simulated I/O
        return i ** 2
    
    for i in range(n):
        tasks.append(asyncio.create_task(io_operation(i)))
    
    results = await asyncio.gather(*tasks)
    print(f"Async took: {time.time() - start:.2f}s")
    return results

# Threading I/O-bound task
def threading_io_task(n):
    start = time.time()
    results = []
    threads = []
    
    def io_operation(i):
        time.sleep(1)  # Simulated I/O
        results.append(i ** 2)
    
    for i in range(n):
        t = threading.Thread(target=io_operation, args=(i,))
        t.start()
        threads.append(t)
    
    for t in threads:
        t.join()
    
    print(f"Threading took: {time.time() - start:.2f}s")
    return results

# Real-world async example with aiohttp
async def fetch_multiple_urls():
    urls = [
        'https://httpbin.org/delay/1',
        'https://httpbin.org/delay/2',
        'https://httpbin.org/delay/3'
    ]
    
    async with aiohttp.ClientSession() as session:
        async def fetch(url):
            async with session.get(url) as response:
                return await response.json()
        
        # Fetch all URLs concurrently
        results = await asyncio.gather(*[fetch(url) for url in urls])
        return results

# Async queue for producer-consumer pattern
async def producer_consumer():
    queue = asyncio.Queue(maxsize=10)
    
    async def producer():
        for i in range(20):
            await asyncio.sleep(0.1)
            await queue.put(f"item_{i}")
            print(f"Produced item_{i}")
        await queue.put(None)  # Signal completion
    
    async def consumer(name):
        while True:
            item = await queue.get()
            if item is None:
                # Put it back for other consumers
                await queue.put(None)
                break
            print(f"{name} consumed {item}")
            await asyncio.sleep(0.3)
    
    # Run producer and multiple consumers
    await asyncio.gather(
        producer(),
        consumer("Consumer1"),
        consumer("Consumer2")
    )

# Error handling in async code
async def error_handling_example():
    async def may_fail():
        import random
        if random.random() > 0.5:
            raise ValueError("Random failure")
        return "Success"
    
    # Method 1: try/except
    try:
        result = await may_fail()
    except ValueError as e:
        print(f"Caught: {e}")
    
    # Method 2: gather with return_exceptions
    results = await asyncio.gather(
        may_fail(),
        may_fail(),
        may_fail(),
        return_exceptions=True
    )
    
    for result in results:
        if isinstance(result, Exception):
            print(f"Error: {result}")
        else:
            print(f"Success: {result}")

# Async timeout
async def with_timeout():
    try:
        async with asyncio.timeout(2.0):
            await asyncio.sleep(3.0)  # This will timeout
    except TimeoutError:
        print("Operation timed out")

# Converting sync to async
def sync_function(x):
    time.sleep(1)
    return x ** 2

async def make_async():
    loop = asyncio.get_event_loop()
    
    # Run in thread pool
    with concurrent.futures.ThreadPoolExecutor() as pool:
        result = await loop.run_in_executor(pool, sync_function, 5)
        print(f"Result: {result}")`
        },
        {
            question: "What are Python's magic methods (dunder methods) and their uses?",
            answer: "Magic methods (dunder methods) define object behavior for built-in operations. Key ones: __init__ (constructor), __str__ (string representation), __eq__ (equality), __len__ (length), __getitem__ (indexing), __add__ (addition). Enable operator overloading and Pythonic interfaces.",
            code: `class Vector:
    def __init__(self, x, y):
        self.x = x
        self.y = y
    
    # String representations
    def __str__(self):
        return f"Vector({self.x}, {self.y})"
    
    def __repr__(self):
        return f"Vector(x={self.x}, y={self.y})"
    
    # Arithmetic operations
    def __add__(self, other):
        if isinstance(other, Vector):
            return Vector(self.x + other.x, self.y + other.y)
        return NotImplemented
    
    def __sub__(self, other):
        if isinstance(other, Vector):
            return Vector(self.x - other.x, self.y - other.y)
        return NotImplemented
    
    def __mul__(self, scalar):
        return Vector(self.x * scalar, self.y * scalar)
    
    def __rmul__(self, scalar):
        return self.__mul__(scalar)
    
    def __truediv__(self, scalar):
        return Vector(self.x / scalar, self.y / scalar)
    
    # Comparison operations
    def __eq__(self, other):
        if isinstance(other, Vector):
            return self.x == other.x and self.y == other.y
        return False
    
    def __lt__(self, other):
        return self.magnitude() < other.magnitude()
    
    def __le__(self, other):
        return self.magnitude() <= other.magnitude()
    
    # Unary operations
    def __neg__(self):
        return Vector(-self.x, -self.y)
    
    def __abs__(self):
        return (self.x ** 2 + self.y ** 2) ** 0.5
    
    def magnitude(self):
        return abs(self)
    
    # Container behavior
    def __len__(self):
        return 2
    
    def __getitem__(self, index):
        if index == 0:
            return self.x
        elif index == 1:
            return self.y
        raise IndexError("Vector index out of range")
    
    def __setitem__(self, index, value):
        if index == 0:
            self.x = value
        elif index == 1:
            self.y = value
        else:
            raise IndexError("Vector index out of range")
    
    # Iterator protocol
    def __iter__(self):
        return iter([self.x, self.y])
    
    # Context manager protocol
    def __enter__(self):
        print(f"Entering vector context: {self}")
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        print(f"Exiting vector context: {self}")
        return False
    
    # Callable behavior
    def __call__(self, scale=1):
        return Vector(self.x * scale, self.y * scale)
    
    # Attribute access
    def __getattr__(self, name):
        if name == 'magnitude':
            return abs(self)
        raise AttributeError(f"Vector has no attribute '{name}'")
    
    # Boolean conversion
    def __bool__(self):
        return self.x != 0 or self.y != 0
    
    # Hash for use in sets/dicts
    def __hash__(self):
        return hash((self.x, self.y))

# Usage examples
v1 = Vector(3, 4)
v2 = Vector(1, 2)

print(str(v1))          # Vector(3, 4)
print(repr(v1))         # Vector(x=3, y=4)
print(v1 + v2)          # Vector(4, 6)
print(v1 * 2)           # Vector(6, 8)
print(2 * v1)           # Vector(6, 8) - using __rmul__
print(abs(v1))          # 5.0
print(v1[0])            # 3
print(list(v1))         # [3, 4]

# Advanced magic methods
class Database:
    def __init__(self):
        self.data = {}
        self.closed = False
    
    # Context manager for automatic cleanup
    def __enter__(self):
        print("Opening database connection")
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        print("Closing database connection")
        self.close()
    
    # Destructor
    def __del__(self):
        if not self.closed:
            print("Warning: Database not properly closed")
            self.close()
    
    # Make it act like a dictionary
    def __getitem__(self, key):
        return self.data[key]
    
    def __setitem__(self, key, value):
        self.data[key] = value
    
    def __delitem__(self, key):
        del self.data[key]
    
    def __contains__(self, key):
        return key in self.data
    
    def __len__(self):
        return len(self.data)
    
    def close(self):
        self.closed = True

# Descriptor protocol
class Validator:
    def __init__(self, min_value=None, max_value=None):
        self.min_value = min_value
        self.max_value = max_value
    
    def __set_name__(self, owner, name):
        self.name = name
    
    def __get__(self, instance, owner):
        if instance is None:
            return self
        return instance.__dict__.get(self.name)
    
    def __set__(self, instance, value):
        if self.min_value is not None and value < self.min_value:
            raise ValueError(f"{self.name} must be >= {self.min_value}")
        if self.max_value is not None and value > self.max_value:
            raise ValueError(f"{self.name} must be <= {self.max_value}")
        instance.__dict__[self.name] = value
    
    def __delete__(self, instance):
        del instance.__dict__[self.name]

class Person:
    age = Validator(min_value=0, max_value=150)
    
    def __init__(self, name, age):
        self.name = name
        self.age = age  # Uses validator

# Metaclass magic methods
class MetaClass(type):
    # Called when class is created
    def __new__(mcs, name, bases, namespace):
        print(f"Creating class {name}")
        return super().__new__(mcs, name, bases, namespace)
    
    # Called when class is instantiated
    def __call__(cls, *args, **kwargs):
        print(f"Creating instance of {cls.__name__}")
        return super().__call__(*args, **kwargs)

# Number-like class with all numeric operations
class Complex:
    def __init__(self, real, imag):
        self.real = real
        self.imag = imag
    
    # All numeric operations
    def __add__(self, other):
        if isinstance(other, (int, float)):
            return Complex(self.real + other, self.imag)
        return Complex(self.real + other.real, self.imag + other.imag)
    
    def __radd__(self, other):
        return self.__add__(other)
    
    def __iadd__(self, other):
        if isinstance(other, (int, float)):
            self.real += other
        else:
            self.real += other.real
            self.imag += other.imag
        return self
    
    # Format specification
    def __format__(self, format_spec):
        if format_spec == 'r':
            return f"{self.real:.2f}"
        elif format_spec == 'i':
            return f"{self.imag:.2f}"
        return f"{self.real:.2f} + {self.imag:.2f}i"`
        },
        {
            question: "How do Python generators work and what are their advantages?",
            answer: "Generators are lazy iterators created with 'yield' keyword. They maintain state between calls, use minimal memory, and can handle large or infinite sequences. Create with generator functions or expressions. Benefits: memory efficiency, composability, cleaner code.",
            code: `# Basic generator function
def fibonacci_generator(n):
    a, b = 0, 1
    count = 0
    while count < n:
        yield a  # Pause and return value
        a, b = b, a + b
        count += 1

# Using the generator
fib = fibonacci_generator(10)
print(next(fib))  # 0
print(next(fib))  # 1
print(list(fib))  # [1, 2, 3, 5, 8, 13, 21, 34] - remaining values

# Generator expression
squares = (x**2 for x in range(10))
print(type(squares))  # <class 'generator'>

# Memory efficiency comparison
import sys

# List comprehension - stores all values
list_comp = [x**2 for x in range(1000000)]
print(f"List size: {sys.getsizeof(list_comp)} bytes")

# Generator expression - lazy evaluation
gen_exp = (x**2 for x in range(1000000))
print(f"Generator size: {sys.getsizeof(gen_exp)} bytes")

# Infinite sequences
def infinite_sequence():
    num = 0
    while True:
        yield num
        num += 1

# Use with care!
counter = infinite_sequence()
limited = itertools.islice(counter, 10)
print(list(limited))  # [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

# Generator with state
def running_average():
    total = 0
    count = 0
    average = None
    while True:
        value = yield average
        if value is not None:
            total += value
            count += 1
            average = total / count

# Using send() method
avg = running_average()
next(avg)  # Prime the generator
print(avg.send(10))   # 10.0
print(avg.send(20))   # 15.0
print(avg.send(30))   # 20.0

# File processing with generators
def read_large_file(file_path):
    with open(file_path, 'r') as file:
        for line in file:
            yield line.strip()

def process_data(lines):
    for line in lines:
        if line and not line.startswith('#'):
            yield line.upper()

# Chain generators for pipeline
# lines = read_large_file('huge_file.txt')
# processed = process_data(lines)
# for result in processed:
#     print(result)

# Generator delegation with yield from
def flatten(nested_list):
    for item in nested_list:
        if isinstance(item, list):
            yield from flatten(item)  # Delegate to sub-generator
        else:
            yield item

nested = [1, [2, 3, [4, 5]], 6, [7, [8, 9]]]
print(list(flatten(nested)))  # [1, 2, 3, 4, 5, 6, 7, 8, 9]

# Context manager generator
from contextlib import contextmanager
import time

@contextmanager
def timer():
    start = time.time()
    try:
        yield
    finally:
        end = time.time()
        print(f"Elapsed time: {end - start:.4f} seconds")

with timer():
    time.sleep(1)

# Advanced generator patterns
def window_slider(iterable, window_size):
    iterator = iter(iterable)
    window = []
    
    # Fill initial window
    for _ in range(window_size):
        try:
            window.append(next(iterator))
        except StopIteration:
            return
    
    yield tuple(window)
    
    # Slide window
    for item in iterator:
        window = window[1:] + [item]
        yield tuple(window)

data = [1, 2, 3, 4, 5, 6, 7, 8, 9]
for window in window_slider(data, 3):
    print(window)  # (1, 2, 3), (2, 3, 4), ..., (7, 8, 9)

# Generator error handling
def safe_divide_generator(numbers, divisor):
    for num in numbers:
        try:
            yield num / divisor
        except ZeroDivisionError:
            yield float('inf')
        except Exception as e:
            yield f"Error: {e}"

# Using throw() and close()
def interactive_generator():
    try:
        value = 0
        while True:
            value = yield value
            print(f"Received: {value}")
    except GeneratorExit:
        print("Generator closing")
    except Exception as e:
        print(f"Exception received: {e}")

gen = interactive_generator()
next(gen)  # Prime
gen.send(10)
gen.throw(ValueError, "Custom error")  # Send exception
gen.close()  # Clean shutdown

# Performance comparison
def compute_squares_list(n):
    return [x**2 for x in range(n)]

def compute_squares_generator(n):
    return (x**2 for x in range(n))

# Memory and time efficiency
import timeit

# List stores all values immediately
list_time = timeit.timeit(
    'sum(compute_squares_list(1000000))',
    globals=globals(),
    number=10
)

# Generator computes on demand
gen_time = timeit.timeit(
    'sum(compute_squares_generator(1000000))',
    globals=globals(),
    number=10
)

print(f"List time: {list_time:.4f}s")
print(f"Generator time: {gen_time:.4f}s")`
        }
    ]
};

// Make data globally accessible
window.interviewData = interviewData;