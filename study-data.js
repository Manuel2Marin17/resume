// Interview Questions Data
const interviewData = {
    dotnet: [
        {
            question: "Explain the differences between .NET Framework and .NET Core/.NET 8.",
            answer: ".NET Framework is Windows-only and legacy, while .NET Core (now .NET 5+) is cross-platform, open-source, and has better performance. .NET 8 includes native AOT compilation, improved performance, and enhanced cloud-native features."
        },
        {
            question: "What are the key principles of dependency injection in .NET Core?",
            answer: "DI promotes loose coupling, testability, and follows SOLID principles. Services are registered in the DI container with different lifetimes: Singleton (one instance for app lifetime), Scoped (one instance per request), and Transient (new instance each time).",
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
            answer: "Using async/await pattern with Task-based programming. Key practices: Avoid async void (except event handlers), use ConfigureAwait(false) in libraries, proper exception handling with try-catch, understand synchronization contexts.",
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
            answer: "ValueTask is a struct that avoids allocation when result is available synchronously. Use for hot paths where most calls complete synchronously. Task is a reference type that always allocates on the heap.",
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
            answer: "Generational GC with Gen 0, 1, 2. Large Object Heap (LOH) for objects > 85KB. GC modes: Workstation vs Server, Concurrent vs Background. Optimize using object pooling, ArrayPool, and Span<T>.",
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
            answer: "Feature for null safety where reference types are non-null by default. Use ? to mark nullable. Compiler provides warnings for potential null reference exceptions. Helps catch null bugs at compile time.",
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
            answer: "Span<T> provides stack-allocated views over memory without allocations. Memory<T> is like Span but can live on heap. Use for parsing, string manipulation, and working with arrays without copying data.",
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
            answer: "IActionResult for flexible return types, ActionResult<T> for strongly typed with implicit operators. Specific results: Ok(), BadRequest(), NotFound(). ActionResult<T> preferred for better OpenAPI documentation."
        },
        {
            question: "What are record types and when do you use them?",
            answer: "Records provide immutable data types with value equality. Use for DTOs and domain models. Features: automatic equality, with-expressions for non-destructive mutation, concise syntax with positional parameters.",
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
            answer: "Middleware components form a pipeline. Each can process requests before passing to next, process responses on way back, or short-circuit. Implement with InvokeAsync method or use app.Use() in startup.",
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
            answer: "ConfigureAwait(false) prevents capturing the synchronization context, improving performance in libraries and avoiding deadlocks. Default (true) preserves context, needed for UI updates or HttpContext access."
        },
        {
            question: "What is pattern matching in C# and its evolution?",
            answer: "C# 7: Type and constant patterns. C# 8: Property, tuple, positional patterns. C# 9: Relational, logical patterns. C# 10: Extended property patterns. C# 11: List patterns. Enables concise, expressive code.",
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
            answer: "Use exception middleware, IExceptionHandler (NET 8+), or UseExceptionHandler. Return Problem Details for standardized error responses. Log exceptions and provide appropriate status codes.",
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
            answer: "Channels provide thread-safe producer-consumer patterns with async support. Better than BlockingCollection for async scenarios. Support bounded/unbounded capacity, multiple readers/writers."
        },
        {
            question: "Explain the new Native AOT features in .NET 8.",
            answer: "Compile to native code with no JIT overhead. Benefits: faster startup, lower memory, self-contained executables. Trade-offs: larger binaries, no dynamic loading, limited reflection."
        }
    ],
    angular: [
        {
            question: "Explain Angular's change detection strategy in detail.",
            answer: "Angular uses Zone.js to patch async operations and trigger change detection. Default strategy checks all components top-down. OnPush strategy only checks when inputs change, events fire, or observable emits. Use OnPush with immutable data for better performance.",
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
            answer: "Implement ControlValueAccessor interface with writeValue(), registerOnChange(), registerOnTouched(), and setDisabledState(). Provide NG_VALUE_ACCESSOR token. Enables custom components to work seamlessly with Angular forms.",
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
            answer: "map/filter/tap for basic transformations. switchMap for cancelling previous (search). mergeMap for parallel processing. debounceTime to delay emissions. distinctUntilChanged to filter duplicates. catchError/retry for error handling. combineLatest/forkJoin to combine streams.",
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
            answer: "Signals (Angular 16+) provide synchronous reactive state. Simpler than RxJS for basic state. Features: automatic dependency tracking, computed values, better performance. RxJS still needed for async operations, complex transformations.",
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
            answer: "Use loadChildren in routes with dynamic imports. Preloading strategies: PreloadAllModules, NoPreloading, or custom. Custom strategies can preload based on user behavior, network speed, or route priority.",
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
            answer: "Controls CSS scope. Emulated (default): Angular adds attributes to scope styles. None: styles are global. ShadowDom: uses native shadow DOM for true isolation. Choose based on styling needs and browser support."
        },
        {
            question: "Explain the differences between ViewChild, ContentChild, and their plural versions.",
            answer: "ViewChild queries elements in component's template. ContentChild queries projected content. Plural versions return QueryList. Use static:true for access in ngOnInit, static:false (default) for dynamic content.",
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
            answer: "Tree shaking with production builds, lazy loading modules, dynamic imports for libraries, analyze with webpack-bundle-analyzer, remove unused imports, use lighter alternatives, implement differential loading."
        },
        {
            question: "What are standalone components in Angular?",
            answer: "Components without NgModules (Angular 14+). Import dependencies directly in component. Benefits: simpler architecture, better tree-shaking, easier lazy loading. Mark with standalone:true and use imports array.",
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
            answer: "Root injector for app-wide singletons. Module injectors per lazy-loaded module. Component injectors in component tree. Element injectors for directives. Child injectors can override parent providers."
        },
        {
            question: "What are the new control flow syntax in Angular 17+?",
            answer: "@if/@else for conditionals, @for with track for loops, @switch/@case for multiple conditions. Replace *ngIf, *ngFor, *ngSwitch. Better performance, type checking, and developer experience.",
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
            answer: "Bias is error from wrong assumptions (underfitting) - model too simple. Variance is error from sensitivity to fluctuations (overfitting) - model too complex. Goal is to balance both for optimal performance through techniques like cross-validation and regularization."
        },
        {
            question: "How do you handle imbalanced datasets?",
            answer: "Use resampling techniques: SMOTE, undersampling, oversampling. Adjust class weights in loss function. Use different metrics: Precision, Recall, F1, AUC-ROC instead of accuracy. Consider ensemble methods or anomaly detection approaches.",
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
            answer: "Low-Rank Adaptation allows efficient fine-tuning by training only small adapter matrices instead of all parameters. Reduces memory by 90%+, maintains base model quality. Use when fine-tuning large models with limited resources.",
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
            answer: "XGBoost: fast, handles missing values, built-in regularization. LightGBM: faster training with leaf-wise growth. CatBoost: handles categorical features natively. Scikit-learn: simple, good for prototyping. Choose based on data and requirements."
        },
        {
            question: "How does attention mechanism work in transformers?",
            answer: "Attention allows models to focus on relevant parts of input. Computed as: Attention(Q,K,V) = softmax(QK^T/√d_k)V. Self-attention within same sequence, cross-attention between sequences. Multi-head attention learns multiple attention patterns.",
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
    ]
};

// Make data globally accessible
window.interviewData = interviewData;