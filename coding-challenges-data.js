// Coding Challenges Data
const codingChallenges = [
    // C# / .NET Challenges
    {
        category: "C#/.NET",
        difficulty: "Easy",
        title: "Async/Await Pattern",
        description: "What will be the output of this C# code?",
        code: `public async Task<string> GetDataAsync()
{
    await Task.Delay(1000);
    return "Data";
}

public async Task Main()
{
    var task = GetDataAsync();
    Console.WriteLine("Started");
    var result = await task;
    Console.WriteLine(result);
}`,
        question: "What is the order of console output?",
        options: [
            "Started\nData",
            "Data\nStarted",
            "Started\n(waits 1 second)\nData",
            "Compilation error"
        ],
        correct: 0,
        explanation: "The code starts the async operation, immediately prints 'Started', then waits for the task to complete before printing 'Data'."
    },
    {
        category: "C#/.NET",
        difficulty: "Medium",
        title: "LINQ Query Execution",
        description: "When does this LINQ query execute?",
        code: `var numbers = new List<int> { 1, 2, 3, 4, 5 };
var query = numbers.Where(n => n > 3).Select(n => n * 2);
numbers.Add(6);
var result = query.ToList();`,
        question: "What values are in the result list?",
        options: [
            "[8, 10]",
            "[8, 10, 12]",
            "[4, 5, 6]",
            "[6, 8, 10]"
        ],
        correct: 1,
        explanation: "LINQ queries are deferred. The query executes when ToList() is called, after 6 was added. So it processes [4, 5, 6] and returns [8, 10, 12]."
    },
    {
        category: "C#/.NET",
        difficulty: "Hard",
        title: "Memory and Span<T>",
        description: "What is the advantage of using Span<T> in this code?",
        code: `// Option A
string ProcessString(string input)
{
    return input.Substring(0, 5);
}

// Option B
ReadOnlySpan<char> ProcessSpan(ReadOnlySpan<char> input)
{
    return input.Slice(0, 5);
}`,
        question: "What is the main benefit of Option B over Option A?",
        options: [
            "Better type safety",
            "No heap allocation for the substring",
            "Faster execution time",
            "Works with any collection type"
        ],
        correct: 1,
        explanation: "Span<T>.Slice creates a view over existing memory without allocating a new string on the heap, reducing GC pressure."
    },

    // JavaScript/TypeScript Challenges
    {
        category: "JavaScript",
        difficulty: "Easy",
        title: "Closure Behavior",
        description: "What will this JavaScript code output?",
        code: `for (var i = 0; i < 3; i++) {
    setTimeout(function() {
        console.log(i);
    }, 100);
}`,
        question: "What gets logged to the console?",
        options: [
            "0 1 2",
            "3 3 3",
            "0 0 0",
            "undefined undefined undefined"
        ],
        correct: 1,
        explanation: "The var variable is function-scoped, and all setTimeout callbacks share the same i. By the time they execute, the loop has finished and i is 3."
    },
    {
        category: "JavaScript",
        difficulty: "Medium",
        title: "Promise Execution Order",
        description: "What is the output order?",
        code: `console.log('1');

setTimeout(() => console.log('2'), 0);

Promise.resolve().then(() => console.log('3'));

console.log('4');`,
        question: "In what order are the numbers logged?",
        options: [
            "1 2 3 4",
            "1 4 3 2",
            "1 4 2 3",
            "1 3 4 2"
        ],
        correct: 1,
        explanation: "Synchronous code runs first (1, 4), then microtasks (Promise - 3), then macrotasks (setTimeout - 2)."
    },
    {
        category: "TypeScript",
        difficulty: "Medium",
        title: "Type Inference",
        description: "What is the inferred type of result?",
        code: `function process<T extends { id: number }>(items: T[]) {
    return items.map(item => ({
        ...item,
        processed: true
    }));
}

const result = process([
    { id: 1, name: 'A' },
    { id: 2, name: 'B' }
]);`,
        question: "What is the type of result?",
        options: [
            "{ id: number, processed: boolean }[]",
            "{ id: number, name: string, processed: boolean }[]",
            "unknown[]",
            "any[]"
        ],
        correct: 1,
        explanation: "TypeScript preserves the full type through the generic constraint. The spread operator keeps all original properties and adds 'processed'."
    },

    // Algorithm Challenges
    {
        category: "Algorithms",
        difficulty: "Easy",
        title: "Time Complexity",
        description: "What is the time complexity of this algorithm?",
        code: `function findDuplicates(arr) {
    const seen = new Set();
    const duplicates = [];
    
    for (const num of arr) {
        if (seen.has(num)) {
            duplicates.push(num);
        } else {
            seen.add(num);
        }
    }
    
    return duplicates;
}`,
        question: "What is the time complexity?",
        options: [
            "O(n²)",
            "O(n)",
            "O(n log n)",
            "O(1)"
        ],
        correct: 1,
        explanation: "Set operations (has, add) are O(1) on average. We iterate through the array once, so overall complexity is O(n)."
    },
    {
        category: "Algorithms",
        difficulty: "Medium",
        title: "Binary Search Variant",
        description: "What does this modified binary search find?",
        code: `function search(arr, target) {
    let left = 0, right = arr.length - 1;
    let result = -1;
    
    while (left <= right) {
        let mid = Math.floor((left + right) / 2);
        
        if (arr[mid] >= target) {
            result = mid;
            right = mid - 1;
        } else {
            left = mid + 1;
        }
    }
    
    return result;
}`,
        question: "What does this function find in a sorted array?",
        options: [
            "Last occurrence of target",
            "First occurrence of target or higher",
            "Exact match of target",
            "Largest element smaller than target"
        ],
        correct: 1,
        explanation: "This finds the leftmost position where target could be inserted to maintain sorted order (lower bound)."
    },

    // System Design / Architecture
    {
        category: "Architecture",
        difficulty: "Medium",
        title: "Caching Strategy",
        description: "Which caching pattern is shown here?",
        code: `public async Task<User> GetUser(int id)
{
    var cached = await cache.GetAsync($"user:{id}");
    if (cached != null)
        return cached;
    
    var user = await database.GetUserAsync(id);
    if (user != null)
        await cache.SetAsync($"user:{id}", user, TimeSpan.FromMinutes(5));
    
    return user;
}`,
        question: "What caching pattern is this?",
        options: [
            "Write-through cache",
            "Write-behind cache",
            "Cache-aside (Lazy loading)",
            "Refresh-ahead cache"
        ],
        correct: 2,
        explanation: "Cache-aside pattern: application manages cache, checks cache first, loads from database on miss, then updates cache."
    },
    {
        category: "Architecture",
        difficulty: "Hard",
        title: "Distributed System Concept",
        description: "What problem does this pattern solve?",
        code: `class CircuitBreaker {
    constructor(threshold = 5, timeout = 60000) {
        this.failureCount = 0;
        this.threshold = threshold;
        this.timeout = timeout;
        this.state = 'CLOSED';
        this.nextAttempt = Date.now();
    }
    
    async call(fn) {
        if (this.state === 'OPEN') {
            if (Date.now() < this.nextAttempt) {
                throw new Error('Circuit breaker is OPEN');
            }
            this.state = 'HALF_OPEN';
        }
        
        try {
            const result = await fn();
            this.onSuccess();
            return result;
        } catch (error) {
            this.onFailure();
            throw error;
        }
    }
}`,
        question: "What is the main purpose of this pattern?",
        options: [
            "Load balancing across services",
            "Preventing cascading failures",
            "Implementing retry logic",
            "Service discovery"
        ],
        correct: 1,
        explanation: "Circuit breaker prevents cascading failures by failing fast when a service is down, giving it time to recover."
    },

    // Angular Specific
    {
        category: "Angular",
        difficulty: "Easy",
        title: "Change Detection",
        description: "When does Angular check this component for changes?",
        code: `@Component({
    selector: 'app-item',
    template: '{{ item.name }}',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ItemComponent {
    @Input() item: Item;
}`,
        question: "When does change detection run for this component?",
        options: [
            "On every browser event",
            "Only when @Input() reference changes",
            "Every 100ms",
            "Only when explicitly triggered"
        ],
        correct: 1,
        explanation: "With OnPush strategy, change detection only runs when input references change, events occur, or observables emit."
    },
    {
        category: "Angular",
        difficulty: "Medium",
        title: "RxJS Operators",
        description: "What does this RxJS chain do?",
        code: `search$ = this.searchControl.valueChanges.pipe(
    debounceTime(300),
    distinctUntilChanged(),
    switchMap(term => this.api.search(term)),
    catchError(() => of([]))
);`,
        question: "What behavior does this implement?",
        options: [
            "Polls the API every 300ms",
            "Batches multiple searches together",
            "Implements search with debounce and cancellation",
            "Retries failed searches 3 times"
        ],
        correct: 2,
        explanation: "This implements search with 300ms debounce, ignores duplicate values, cancels previous searches with switchMap, and handles errors."
    },

    // Python/Data Science
    {
        category: "Python",
        difficulty: "Easy",
        title: "List Comprehension",
        description: "What does this Python code produce?",
        code: `matrix = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
result = [num for row in matrix for num in row if num % 2 == 0]`,
        question: "What is the value of result?",
        options: [
            "[2, 4, 6, 8]",
            "[[2], [4, 6], [8]]",
            "[2, 4, 6, 8, 10]",
            "[1, 3, 5, 7, 9]"
        ],
        correct: 0,
        explanation: "The list comprehension flattens the matrix and filters even numbers, resulting in [2, 4, 6, 8]."
    },
    {
        category: "Python",
        difficulty: "Medium",
        title: "Decorator Behavior",
        description: "What does this decorator do?",
        code: `def memoize(func):
    cache = {}
    def wrapper(*args):
        if args in cache:
            return cache[args]
        result = func(*args)
        cache[args] = result
        return result
    return wrapper

@memoize
def fibonacci(n):
    if n < 2:
        return n
    return fibonacci(n-1) + fibonacci(n-2)`,
        question: "What is the main benefit of this decorator?",
        options: [
            "Prevents stack overflow",
            "Makes the function thread-safe",
            "Caches results to avoid recomputation",
            "Logs function calls"
        ],
        correct: 2,
        explanation: "The memoize decorator caches function results, dramatically improving performance for recursive functions with overlapping subproblems."
    },

    // SQL/Database
    {
        category: "SQL",
        difficulty: "Easy",
        title: "JOIN Types",
        description: "What does this query return?",
        code: `SELECT c.name, COUNT(o.id) as order_count
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id
GROUP BY c.id, c.name
HAVING COUNT(o.id) = 0`,
        question: "What does this query find?",
        options: [
            "Customers with the most orders",
            "Customers with no orders",
            "All customers and their order counts",
            "Orders without customers"
        ],
        correct: 1,
        explanation: "LEFT JOIN includes all customers, COUNT(o.id) is 0 for customers with no matching orders, HAVING filters to only those."
    },
    {
        category: "SQL",
        difficulty: "Medium",
        title: "Window Functions",
        description: "What does this window function calculate?",
        code: `SELECT 
    employee_id,
    salary,
    department_id,
    RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) as rank
FROM employees`,
        question: "What does the 'rank' column represent?",
        options: [
            "Global salary ranking across all employees",
            "Salary ranking within each department",
            "Number of employees in each department",
            "Cumulative salary by department"
        ],
        correct: 1,
        explanation: "RANK() with PARTITION BY creates separate rankings for each department, ordering by salary descending within each partition."
    }
];

// Make data globally accessible
window.codingChallenges = codingChallenges;