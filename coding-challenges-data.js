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
    {
        category: "Python",
        difficulty: "Hard", 
        title: "Generator Memory Usage",
        description: "Which approach uses less memory for processing large files?",
        code: `# Approach A
def process_file_a(filename):
    with open(filename) as f:
        lines = f.readlines()
    return [line.upper() for line in lines if 'error' in line]

# Approach B  
def process_file_b(filename):
    with open(filename) as f:
        return [line.upper() for line in f if 'error' in line]

# Approach C
def process_file_c(filename):
    with open(filename) as f:
        for line in f:
            if 'error' in line:
                yield line.upper()`,
        question: "Which approach is most memory efficient for a 10GB file?",
        options: [
            "Approach A",
            "Approach B", 
            "Approach C",
            "All use the same memory"
        ],
        correct: 2,
        explanation: "Approach C uses a generator, processing one line at a time. A loads entire file into memory. B is better than A but still creates a list. C yields results lazily."
    },
    {
        category: "Python",
        difficulty: "Medium",
        title: "NumPy Broadcasting",
        description: "What is the shape of the result?",
        code: `import numpy as np

a = np.array([[1, 2, 3]])      # shape (1, 3)
b = np.array([[1], [2], [3]])  # shape (3, 1)
c = a + b`,
        question: "What is the shape of array c?",
        options: [
            "(1, 3)",
            "(3, 1)",
            "(3, 3)",
            "Error: shapes not compatible"
        ],
        correct: 2,
        explanation: "NumPy broadcasting expands both arrays: a becomes (3,3) by repeating rows, b becomes (3,3) by repeating columns. Result is element-wise sum with shape (3,3)."
    },
    {
        category: "Python",
        difficulty: "Easy",
        title: "Python GIL Impact",
        description: "Which code benefits from multi-threading in Python?",
        code: `# Task A: CPU-intensive
def compute_squares(n):
    return [i**2 for i in range(n)]

# Task B: I/O-intensive  
def fetch_urls(urls):
    results = []
    for url in urls:
        response = requests.get(url)
        results.append(response.text)
    return results`,
        question: "Which task benefits from multi-threading despite the GIL?",
        options: [
            "Task A only",
            "Task B only",
            "Both tasks equally",
            "Neither task"
        ],
        correct: 1,
        explanation: "The GIL is released during I/O operations. Task B (I/O-intensive) benefits from threading as threads can run while others wait for I/O. Task A is CPU-bound and limited by GIL."
    },
    {
        category: "Python",
        difficulty: "Medium",
        title: "Pandas DataFrame Operations",
        description: "What does this pandas code do?",
        code: `import pandas as pd

df = pd.DataFrame({
    'A': [1, 2, 3, 4],
    'B': [5, 6, 7, 8],
    'C': ['x', 'y', 'x', 'y']
})

result = df.groupby('C')['A'].transform('mean')`,
        question: "What is the result?",
        options: [
            "Series: [2.0, 3.0]",
            "Series: [2.0, 3.0, 2.0, 3.0]",
            "DataFrame with means by group",
            "Series: [1, 2, 3, 4]"
        ],
        correct: 1,
        explanation: "transform() returns a Series with the same length as the original, where each value is replaced by the group mean. Groups 'x':[1,3] mean=2.0, 'y':[2,4] mean=3.0."
    },
    {
        category: "Python",
        difficulty: "Hard",
        title: "Neural Network Backpropagation",
        description: "What is the gradient of the loss with respect to w1?",
        code: `import numpy as np

# Forward pass
x = np.array([1.0, 2.0])  # Input
w1 = np.array([[0.5, -0.3], [0.2, 0.8]])  # First layer weights
w2 = np.array([0.7, 0.3])  # Second layer weights

h = np.maximum(0, x @ w1)  # ReLU activation
y_pred = h @ w2  # Output
loss = (y_pred - 1.0) ** 2  # MSE loss, target = 1.0`,
        question: "Which factor does NOT affect the gradient ∂loss/∂w1?",
        options: [
            "The ReLU activation derivative",
            "The value of w2",
            "The prediction error (y_pred - 1.0)",
            "The value of w1"
        ],
        correct: 3,
        explanation: "The gradient ∂loss/∂w1 depends on: prediction error, w2 (backprop through it), ReLU derivative (gates gradients), and input x. Current w1 values don't affect their own gradient."
    },
    {
        category: "Python",
        difficulty: "Easy",
        title: "List vs Tuple",
        description: "Which statement about lists and tuples is correct?",
        code: `# Lists
list1 = [1, 2, 3]
list2 = list1
list2.append(4)

# Tuples  
tuple1 = (1, 2, 3)
tuple2 = tuple1
tuple2 += (4,)`,
        question: "After this code executes, what is true?",
        options: [
            "list1 is [1,2,3] and tuple1 is (1,2,3)",
            "list1 is [1,2,3,4] and tuple1 is (1,2,3,4)",
            "list1 is [1,2,3,4] and tuple1 is (1,2,3)",
            "Both raise errors"
        ],
        correct: 2,
        explanation: "Lists are mutable; append modifies the list in-place, affecting both variables. Tuples are immutable; += creates a new tuple, so tuple2 gets reassigned but tuple1 is unchanged."
    },
    {
        category: "Python",
        difficulty: "Medium",
        title: "Scikit-learn Pipeline",
        description: "What is the correct order of operations in this pipeline?",
        code: `from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from sklearn.svm import SVC

pipeline = Pipeline([
    ('scaler', StandardScaler()),
    ('pca', PCA(n_components=10)),
    ('svm', SVC())
])

pipeline.fit(X_train, y_train)
predictions = pipeline.predict(X_test)`,
        question: "In what order are transformations applied to X_test?",
        options: [
            "SVC → PCA → StandardScaler",
            "StandardScaler → PCA → SVC",
            "PCA → StandardScaler → SVC",
            "All transformations happen simultaneously"
        ],
        correct: 1,
        explanation: "Pipeline applies transformations in the order defined: 1) StandardScaler normalizes features, 2) PCA reduces dimensions, 3) SVC makes predictions on transformed data."
    },
    {
        category: "Python",
        difficulty: "Hard",
        title: "Async/Await Execution Order",
        description: "What is the output of this async code?",
        code: `import asyncio

async def task(name, delay):
    print(f"{name} started")
    await asyncio.sleep(delay)
    print(f"{name} finished")
    return name

async def main():
    results = await asyncio.gather(
        task("A", 2),
        task("B", 1),
        task("C", 3)
    )
    print(f"Results: {results}")

asyncio.run(main())`,
        question: "What is the order of 'finished' messages?",
        options: [
            "A finished, B finished, C finished",
            "B finished, A finished, C finished",
            "C finished, B finished, A finished",
            "Random order each time"
        ],
        correct: 1,
        explanation: "All tasks start concurrently. Since B has shortest delay (1s), it finishes first, then A (2s), then C (3s). gather() returns results in original order [A,B,C]."
    },
    {
        category: "Python",
        difficulty: "Medium",
        title: "TensorFlow/Keras Model",
        description: "What is the total number of trainable parameters?",
        code: `import tensorflow as tf

model = tf.keras.Sequential([
    tf.keras.layers.Dense(128, activation='relu', input_shape=(784,)),
    tf.keras.layers.Dense(64, activation='relu'),
    tf.keras.layers.Dense(10, activation='softmax')
])`,
        question: "How many trainable parameters does this model have?",
        options: [
            "784 + 128 + 64 + 10 = 986",
            "(784 * 128) + (128 * 64) + (64 * 10) = 109,184",
            "(784 * 128 + 128) + (128 * 64 + 64) + (64 * 10 + 10) = 109,386",
            "Cannot determine without compiling the model"
        ],
        correct: 2,
        explanation: "Dense layers have weights + biases. Layer 1: 784*128 + 128 = 100,480. Layer 2: 128*64 + 64 = 8,256. Layer 3: 64*10 + 10 = 650. Total = 109,386."
    },
    {
        category: "Python",
        difficulty: "Easy",
        title: "Dictionary Default Values",
        description: "Which approach safely handles missing keys?",
        code: `data = {'a': 1, 'b': 2}

# Approach 1
value1 = data['c'] if 'c' in data else 0

# Approach 2
value2 = data.get('c', 0)

# Approach 3
from collections import defaultdict
data3 = defaultdict(int, data)
value3 = data3['c']`,
        question: "Which approaches return 0 for missing key 'c' without raising KeyError?",
        options: [
            "Only Approach 1",
            "Approaches 1 and 2",
            "Approaches 2 and 3",
            "All three approaches"
        ],
        correct: 3,
        explanation: "All handle missing keys: Approach 1 checks existence first, Approach 2 uses get() with default, Approach 3 uses defaultdict which returns int() = 0 for missing keys."
    },
    {
        category: "Python",
        difficulty: "Medium",
        title: "Context Managers",
        description: "What happens if an exception occurs in the with block?",
        code: `class MyContext:
    def __enter__(self):
        print("Entering")
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        print("Exiting")
        return False  # Don't suppress exception

with MyContext() as ctx:
    print("Inside")
    raise ValueError("Error!")
    print("After error")`,
        question: "What gets printed?",
        options: [
            "Entering → Inside → After error → Exiting",
            "Entering → Inside → Exiting (then exception)",
            "Entering → Inside (then exception)",
            "Entering → Exiting (skips Inside)"
        ],
        correct: 1,
        explanation: "__exit__ is always called even if exception occurs. Since it returns False, the exception is re-raised after cleanup. 'After error' never executes."
    },
    {
        category: "Python",
        difficulty: "Hard",
        title: "Gradient Descent Implementation",
        description: "What's wrong with this gradient descent implementation?",
        code: `import numpy as np

def gradient_descent(X, y, learning_rate=0.01, iterations=1000):
    m, n = X.shape
    theta = np.zeros(n)
    
    for _ in range(iterations):
        predictions = X @ theta
        errors = predictions - y
        gradient = X.T @ errors  # Missing something?
        theta = theta - learning_rate * gradient
    
    return theta`,
        question: "What's the bug in this implementation?",
        options: [
            "Wrong matrix multiplication order",
            "Gradient not normalized by sample size",
            "Learning rate too small",
            "Should use += instead of -="
        ],
        correct: 1,
        explanation: "The gradient should be normalized by m (sample size): gradient = (1/m) * X.T @ errors. Without this, gradient magnitude scales with dataset size, making learning rate dataset-dependent."
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