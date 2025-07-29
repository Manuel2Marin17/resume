// Interview Questions Data
const interviewData = {
    dotnet: [
        {
            question: "Explain the differences between .NET Framework and .NET Core/.NET 8.",
            answer: ".NET Framework is Windows-only and legacy, while .NET Core (now .NET 5+) is cross-platform, open-source, and has better performance. .NET 8 includes native AOT compilation, improved performance, and enhanced cloud-native features."
        },
        {
            question: "What are the key principles of dependency injection in .NET Core?",
            answer: "DI promotes loose coupling, testability, and follows SOLID principles. Services are registered in the DI container with different lifetimes: Singleton (one instance for app lifetime), Scoped (one instance per request), and Transient (new instance each time)."
        },
        {
            question: "How do you handle asynchronous programming in C#?",
            answer: "Using async/await pattern with Task-based programming. Key practices: Avoid async void (except event handlers), use ConfigureAwait(false) in libraries, proper exception handling with try-catch, understand synchronization contexts."
        },
        {
            question: "What is the difference between Task and ValueTask?",
            answer: "ValueTask is a struct that avoids allocation when result is available synchronously. Use for hot paths where most calls complete synchronously. Task is a reference type that always allocates on the heap."
        },
        {
            question: "Explain memory management and garbage collection in .NET.",
            answer: "Generational GC with Gen 0, 1, 2. Large Object Heap (LOH) for objects > 85KB. GC modes: Workstation vs Server, Concurrent vs Background. Optimize using object pooling, ArrayPool, and Span<T>."
        },
        {
            question: "What are nullable reference types in C# 8+?",
            answer: "Feature for null safety where reference types are non-null by default. Use ? to mark nullable. Compiler provides warnings for potential null reference exceptions. Helps catch null bugs at compile time."
        },
        {
            question: "How do you use Span<T> and Memory<T> for performance?",
            answer: "Span<T> provides stack-allocated views over memory without allocations. Memory<T> is like Span but can live on heap. Use for parsing, string manipulation, and working with arrays without copying data."
        },
        {
            question: "Explain different types of Action Results in ASP.NET Core.",
            answer: "IActionResult for flexible return types, ActionResult<T> for strongly typed with implicit operators. Specific results: Ok(), BadRequest(), NotFound(). ActionResult<T> preferred for better OpenAPI documentation."
        },
        {
            question: "What are record types and when do you use them?",
            answer: "Records provide immutable data types with value equality. Use for DTOs and domain models. Features: automatic equality, with-expressions for non-destructive mutation, concise syntax with positional parameters."
        },
        {
            question: "How do you implement middleware in ASP.NET Core?",
            answer: "Middleware components form a pipeline. Each can process requests before passing to next, process responses on way back, or short-circuit. Implement with InvokeAsync method or use app.Use() in startup."
        },
        {
            question: "Explain ConfigureAwait and SynchronizationContext.",
            answer: "ConfigureAwait(false) prevents capturing the synchronization context, improving performance in libraries and avoiding deadlocks. Default (true) preserves context, needed for UI updates or HttpContext access."
        },
        {
            question: "What is pattern matching in C# and its evolution?",
            answer: "C# 7: Type and constant patterns. C# 8: Property, tuple, positional patterns. C# 9: Relational, logical patterns. C# 10: Extended property patterns. C# 11: List patterns. Enables concise, expressive code."
        },
        {
            question: "How do you handle global exception handling in ASP.NET Core?",
            answer: "Use exception middleware, IExceptionHandler (NET 8+), or UseExceptionHandler. Return Problem Details for standardized error responses. Log exceptions and provide appropriate status codes."
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
            answer: "Angular uses Zone.js to patch async operations and trigger change detection. Default strategy checks all components top-down. OnPush strategy only checks when inputs change, events fire, or observable emits. Use OnPush with immutable data for better performance."
        },
        {
            question: "How do you implement custom form controls with ControlValueAccessor?",
            answer: "Implement ControlValueAccessor interface with writeValue(), registerOnChange(), registerOnTouched(), and setDisabledState(). Provide NG_VALUE_ACCESSOR token. Enables custom components to work seamlessly with Angular forms."
        },
        {
            question: "What are the most important RxJS operators and their use cases?",
            answer: "map/filter/tap for basic transformations. switchMap for cancelling previous (search). mergeMap for parallel processing. debounceTime to delay emissions. distinctUntilChanged to filter duplicates. catchError/retry for error handling. combineLatest/forkJoin to combine streams."
        },
        {
            question: "How do you handle memory leaks in Angular?",
            answer: "Unsubscribe in ngOnDestroy using takeUntil pattern with Subject. Use async pipe which auto-unsubscribes. Remove event listeners. Clear timers/intervals. Avoid storing component references in services."
        },
        {
            question: "Explain Angular Signals and how they differ from RxJS.",
            answer: "Signals (Angular 16+) provide synchronous reactive state. Simpler than RxJS for basic state. Features: automatic dependency tracking, computed values, better performance. RxJS still needed for async operations, complex transformations."
        },
        {
            question: "How do you implement lazy loading with preloading strategies?",
            answer: "Use loadChildren in routes with dynamic imports. Preloading strategies: PreloadAllModules, NoPreloading, or custom. Custom strategies can preload based on user behavior, network speed, or route priority."
        },
        {
            question: "What is ViewEncapsulation and its options?",
            answer: "Controls CSS scope. Emulated (default): Angular adds attributes to scope styles. None: styles are global. ShadowDom: uses native shadow DOM for true isolation. Choose based on styling needs and browser support."
        },
        {
            question: "Explain the differences between ViewChild, ContentChild, and their plural versions.",
            answer: "ViewChild queries elements in component's template. ContentChild queries projected content. Plural versions return QueryList. Use static:true for access in ngOnInit, static:false (default) for dynamic content."
        },
        {
            question: "How do you optimize bundle size in Angular?",
            answer: "Tree shaking with production builds, lazy loading modules, dynamic imports for libraries, analyze with webpack-bundle-analyzer, remove unused imports, use lighter alternatives, implement differential loading."
        },
        {
            question: "What are standalone components in Angular?",
            answer: "Components without NgModules (Angular 14+). Import dependencies directly in component. Benefits: simpler architecture, better tree-shaking, easier lazy loading. Mark with standalone:true and use imports array."
        },
        {
            question: "How do you implement virtual scrolling for large lists?",
            answer: "Use CDK virtual scroll viewport with itemSize. Only renders visible items plus buffer. Dramatically improves performance for large lists. Can implement custom strategies for variable heights."
        },
        {
            question: "Explain Angular's dependency injection hierarchy.",
            answer: "Root injector for app-wide singletons. Module injectors per lazy-loaded module. Component injectors in component tree. Element injectors for directives. Child injectors can override parent providers."
        },
        {
            question: "What are the new control flow syntax in Angular 17+?",
            answer: "@if/@else for conditionals, @for with track for loops, @switch/@case for multiple conditions. Replace *ngIf, *ngFor, *ngSwitch. Better performance, type checking, and developer experience."
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
            answer: "Use resampling techniques: SMOTE, undersampling, oversampling. Adjust class weights in loss function. Use different metrics: Precision, Recall, F1, AUC-ROC instead of accuracy. Consider ensemble methods or anomaly detection approaches."
        },
        {
            question: "What is LoRA fine-tuning and when would you use it?",
            answer: "Low-Rank Adaptation allows efficient fine-tuning by training only small adapter matrices instead of all parameters. Reduces memory by 90%+, maintains base model quality. Use when fine-tuning large models with limited resources."
        },
        {
            question: "Explain different types of gradient boosting implementations.",
            answer: "XGBoost: fast, handles missing values, built-in regularization. LightGBM: faster training with leaf-wise growth. CatBoost: handles categorical features natively. Scikit-learn: simple, good for prototyping. Choose based on data and requirements."
        },
        {
            question: "How does attention mechanism work in transformers?",
            answer: "Attention allows models to focus on relevant parts of input. Computed as: Attention(Q,K,V) = softmax(QK^T/√d_k)V. Self-attention within same sequence, cross-attention between sequences. Multi-head attention learns multiple attention patterns."
        },
        {
            question: "What's the difference between GPT and BERT architectures?",
            answer: "GPT is autoregressive (left-to-right), decoder-only, optimized for generation. BERT is bidirectional, encoder-only, uses masked language modeling, optimized for understanding. GPT for text generation, BERT for classification/extraction tasks."
        },
        {
            question: "How do you implement RAG (Retrieval Augmented Generation)?",
            answer: "1) Chunk and embed documents 2) Store in vector database 3) Retrieve relevant chunks via semantic search 4) Inject context into LLM prompt 5) Generate answer. Reduces hallucination, enables up-to-date information."
        },
        {
            question: "Explain different regularization techniques in deep learning.",
            answer: "L1/L2 regularization penalizes large weights. Dropout randomly disables neurons during training. Batch normalization stabilizes training. Early stopping prevents overfitting. Data augmentation increases dataset size. Each addresses overfitting differently."
        },
        {
            question: "How do you handle vanishing/exploding gradients?",
            answer: "Vanishing: use ReLU activation, batch normalization, residual connections, proper initialization. Exploding: gradient clipping, careful learning rate. LSTM/GRU for RNNs. Skip connections help gradient flow."
        },
        {
            question: "What are different evaluation metrics for classification?",
            answer: "Accuracy for balanced datasets. Precision (correct positive predictions). Recall (found all positives). F1-score (harmonic mean). AUC-ROC for probability ranking. Use based on problem: high recall for medical diagnosis, high precision for spam."
        },
        {
            question: "Explain transfer learning strategies.",
            answer: "Feature extraction: freeze base model, train only head. Fine-tuning: unfreeze some/all layers. Progressive unfreezing: gradual approach. Domain adaptation for different domains. Saves time, improves performance with less data."
        },
        {
            question: "How do you detect and handle model drift?",
            answer: "Monitor data drift with statistical tests (KS test, PSI). Track prediction drift in output distribution. Watch performance metrics degradation. Implement automated alerts, regular retraining schedules, A/B testing for new models."
        },
        {
            question: "What's your approach to hyperparameter tuning?",
            answer: "Grid search for small search spaces. Random search for many parameters. Bayesian optimization (Optuna, Hyperopt) for efficiency. Use cross-validation, early stopping. Start with defaults, tune systematically based on impact."
        },
        {
            question: "Explain different types of neural network architectures.",
            answer: "CNNs for spatial data (images) with convolution and pooling. RNNs/LSTMs for sequential data with memory. Transformers for parallel processing with attention. GANs for generation. Autoencoders for compression/denoising."
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
            answer: "WHERE filters rows before grouping, works with individual rows. HAVING filters after GROUP BY, works with aggregated data. Example: WHERE salary > 50000 filters employees, HAVING AVG(salary) > 50000 filters departments."
        },
        {
            question: "Explain the different types of JOINs in SQL.",
            answer: "INNER JOIN: Returns matching rows from both tables. LEFT JOIN: All rows from left table, matching from right. RIGHT JOIN: All rows from right table. FULL OUTER JOIN: All rows from both tables. CROSS JOIN: Cartesian product of both tables."
        },
        {
            question: "What are indexes and when should you use them?",
            answer: "Indexes are data structures that improve query performance by providing quick lookups. Use on: Primary/foreign keys, columns in WHERE/JOIN/ORDER BY clauses. Avoid on: Small tables, frequently updated columns, columns with low selectivity. Trade-off: Faster reads, slower writes."
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
            answer: "1) Analyze execution plan 2) Add appropriate indexes 3) Rewrite query logic 4) Update statistics 5) Avoid SELECT * 6) Use EXISTS instead of IN for subqueries 7) Partition large tables 8) Consider denormalization for read-heavy workloads."
        },
        {
            question: "Explain window functions and provide examples.",
            answer: "Window functions perform calculations across rows related to current row. ROW_NUMBER(): Sequential numbering. RANK(): Same rank for ties. DENSE_RANK(): No gaps in ranking. LAG/LEAD: Access previous/next rows. Running totals with SUM() OVER()."
        },
        {
            question: "What are CTEs and how do they differ from subqueries?",
            answer: "Common Table Expressions (WITH clause) create named temporary result sets. Benefits over subqueries: Better readability, reusable in same query, support recursion, easier to debug. Subqueries can be correlated, CTEs cannot reference outer query."
        },
        {
            question: "Explain normalization and denormalization.",
            answer: "Normalization: Organizing data to reduce redundancy. 1NF: Atomic values. 2NF: No partial dependencies. 3NF: No transitive dependencies. Denormalization: Strategic redundancy for performance. Use normalization for OLTP, consider denormalization for OLAP/reporting."
        },
        {
            question: "How do you handle NULL values in SQL?",
            answer: "NULL represents unknown/missing data. Use IS NULL/IS NOT NULL for comparisons. COALESCE() returns first non-null value. NULLIF() returns NULL if values equal. Consider ISNULL() in SQL Server. NULLs affect aggregations, joins, and comparisons."
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
            answer: "LIMIT/OFFSET: Simple but slow for large offsets. Keyset pagination: WHERE id > last_id more efficient. Row_Number() with CTE for complex sorting. Consider total count needs, index usage, and consistent ordering."
        },
        {
            question: "What are stored procedures and their advantages?",
            answer: "Precompiled SQL code stored in database. Advantages: Better performance, reduced network traffic, code reusability, enhanced security through parameterization, centralized business logic. Disadvantages: Database vendor lock-in, harder version control."
        },
        {
            question: "Explain the difference between clustered and non-clustered indexes.",
            answer: "Clustered: One per table, defines physical order of data, contains actual data. Non-clustered: Multiple allowed, separate structure with pointers to data, contains only indexed columns and row locators. Choose clustered for primary key or most queried column."
        },
        {
            question: "How do you handle hierarchical data in SQL?",
            answer: "Adjacency list: parent_id column, simple but recursive queries needed. Path enumeration: store full path. Nested sets: left/right values for tree traversal. Closure table: separate table for all paths. Modern: Use recursive CTEs or hierarchyid (SQL Server)."
        },
        {
            question: "What are Oracle-specific features you've used?",
            answer: "PL/SQL for procedural code. Sequences for auto-increment. MERGE for upsert operations. Materialized views for performance. Partitioning for large tables. Flashback for point-in-time recovery. Oracle Text for full-text search. AWR for performance tuning."
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