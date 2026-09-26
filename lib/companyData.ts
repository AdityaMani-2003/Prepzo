export interface CompanyProfile {
  id: string;
  name: string;
  category: "FAANG / Big Tech" | "Top Tier Product" | "FinTech & Banking" | "Enterprise & Services" | "Fast-Growing Startup";
  interviewFocus: string;
  keyTopics: string[];
  dsaTopics: string[];
  sqlFocus: string;
  systemDesignFocus?: string;
  behavioralStyle: string;
  realQuestionsSample: {
    round: "DSA" | "SQL" | "Fundamentals" | "System Design" | "Behavioral";
    title: string;
    prompt: string;
  }[];
}

export const COMPANY_DATABASE: Record<string, CompanyProfile> = {
  google: {
    id: "google",
    name: "Google",
    category: "FAANG / Big Tech",
    interviewFocus: "Clean code, algorithmic optimization, graph algorithms, and edge-case mastery. High standard for time & space complexity defense.",
    keyTopics: ["Graphs & Trees", "Dynamic Programming", "Sliding Window", "Distributed Systems", "Googliness & Cognitive Ability"],
    dsaTopics: ["Binary Search variants", "BFS/DFS shortest path", "Topological Sort", "Tries", "Dynamic Programming"],
    sqlFocus: "Complex analytical queries with window functions (LEAD/LAG, DENSE_RANK), self-joins, and partition optimization.",
    systemDesignFocus: "Massive scale (billions of users), global data distribution, Bigtable/Spanner consistency, low latency caching.",
    behavioralStyle: "Googliness: intellectual humility, navigating ambiguity, collaborative problem solving, thriving with change.",
    realQuestionsSample: [
      {
        round: "DSA",
        title: "Longest Path in a Directed Acyclic Graph with Constraints",
        prompt: "Given a directed acyclic graph and target weights, find the longest path between any two nodes. State the exact time and space complexity.",
      },
      {
        round: "SQL",
        title: "Rolling 7-Day Active User Metric",
        prompt: "Write a SQL query using window functions to compute the 7-day rolling active user count per country from daily user login logs.",
      },
      {
        round: "Fundamentals",
        title: "Garbage Collection & Memory Leaks in V8 Engine",
        prompt: "How does the V8 engine handle generational garbage collection (Scavenge vs Mark-Sweep-Compact), and how do closures cause unintended memory retention?",
      },
    ],
  },

  amazon: {
    id: "amazon",
    name: "Amazon",
    category: "FAANG / Big Tech",
    interviewFocus: "Heavy emphasis on the 16 Leadership Principles (Customer Obsession, Ownership, Bias for Action, Dive Deep). Practical coding and robust service architectures.",
    keyTopics: ["16 Leadership Principles", "Tree/Graph Traversal", "Priority Queues / Heaps", "Microservice Reliability", "DynamoDB NoSQL Design"],
    dsaTopics: ["PriorityQueue / Kth largest", "BFS/DFS grid traversal", "Two pointers / Sliding window", "LRU Cache"],
    sqlFocus: "Order fulfillment metrics, customer lifetime value, join optimization, and handling NULL data gracefully.",
    systemDesignFocus: "High-availability retail checkout, order processing pipelines, asynchronous queues (SQS/SNS), idempotent APIs.",
    behavioralStyle: "Strict STAR method required. Questions always map to Leadership Principles like Customer Obsession or Disagree and Commit.",
    realQuestionsSample: [
      {
        round: "DSA",
        title: "Top K Frequent Orders in Delivery Stream",
        prompt: "Given an incoming stream of package deliveries, efficiently return the top K most frequent distribution centers. Use a min-heap.",
      },
      {
        round: "Behavioral",
        title: "Customer Obsession & Disagree and Commit",
        prompt: "Tell me about a time you had a strong disagreement with a technical decision made by your manager or senior engineer. How did you handle it?",
      },
      {
        round: "System Design",
        title: "Design Amazon Locker Delivery System",
        prompt: "Design the backend system for Amazon Locker allocation, delivery notifications, and locker retrieval with network disconnect handling.",
      },
    ],
  },

  meta: {
    id: "meta",
    name: "Meta",
    category: "FAANG / Big Tech",
    interviewFocus: "Coding speed and bug-free execution (typically 2 LeetCode medium questions in 40 minutes). Practical API & state management for frontend.",
    keyTopics: ["Fast Algorithmic Coding", "Graph BFS/DFS", "React Internals & Virtual DOM", "Distributed Feed Architecture", "GraphQL & Relay"],
    dsaTopics: ["Binary Tree right side view", "Subarray sum equals K", "Lowest Common Ancestor", "Merge intervals"],
    sqlFocus: "Social graph analysis, friend-of-friend queries, engagement drop-off funnel calculations.",
    systemDesignFocus: "Newsfeed generation, real-time messaging (WhatsApp/Messenger), photo storage blob stores, write-heavy caching.",
    behavioralStyle: "Move fast, focus on high-impact results, cross-functional collaboration, ownership in fast iterations.",
    realQuestionsSample: [
      {
        round: "DSA",
        title: "Lowest Common Ancestor in Binary Tree",
        prompt: "Given a binary tree and two nodes, find their Lowest Common Ancestor (LCA). Handle cases where nodes are on the same branch.",
      },
      {
        round: "Fundamentals",
        title: "React Concurrent Mode & Fiber Reconciliation",
        prompt: "Explain how React 19 Fiber architecture splits work into priority lanes and handles interruptible rendering.",
      },
    ],
  },

  microsoft: {
    id: "microsoft",
    name: "Microsoft",
    category: "FAANG / Big Tech",
    interviewFocus: "Clean, maintainable, modular object-oriented design. Thorough test case identification and growth mindset.",
    keyTopics: ["Object Oriented Design (SOLID)", "Data Structures", "System Reliability", "Azure Cloud Patterns", "Growth Mindset"],
    dsaTopics: ["Linked list cycles & reversals", "String manipulation & parsing", "Binary search tree validation", "Matrix manipulations"],
    sqlFocus: "Relational database normalization, indexing strategies, deadlocks and transaction isolation levels.",
    systemDesignFocus: "Collaborative editing (OneDrive / Word Online), notification hubs, enterprise identity and access management.",
    behavioralStyle: "Growth mindset, learning from mistakes, continuous improvement, empathy and team support.",
    realQuestionsSample: [
      {
        round: "DSA",
        title: "Reverse Nodes in k-Group",
        prompt: "Given the head of a linked list, reverse the nodes of the list k at a time and return its modified list.",
      },
      {
        round: "Fundamentals",
        title: "Database Isolation Levels & Dirty Reads",
        prompt: "What is the difference between Read Committed and Serializable isolation levels in relational databases? How do phantom reads occur?",
      },
    ],
  },

  stripe: {
    id: "stripe",
    name: "Stripe",
    category: "Top Tier Product",
    interviewFocus: "Real-world engineering craft: writing production code in an IDE, debugging existing codebases, resilient financial ledger logic, API ergonomics.",
    keyTopics: ["Idempotency & Retry Mechanisms", "Double-Entry Ledger Design", "API Versioning & Ergonomics", "HTTP & Concurrency", "Defensive Programming"],
    dsaTopics: ["Rate limiter token bucket", "Currency conversions with graph paths", "Nested JSON payload parser"],
    sqlFocus: "Financial transaction reconciliation, locking mechanisms (optimistic vs pessimistic), ledger balancing queries.",
    systemDesignFocus: "Payment gateway processing, webhook delivery systems with exponential backoff, PCI-DSS compliance boundaries.",
    behavioralStyle: "User-first obsession, meticulous attention to detail, clear written communication, rigor and humility.",
    realQuestionsSample: [
      {
        round: "System Design",
        title: "Idempotent Payment API & Webhook Delivery",
        prompt: "Design a webhook delivery service that guarantees at-least-once delivery with exponential backoff, jitter, and signature verification.",
      },
      {
        round: "SQL",
        title: "Discrepancy Detection in Payment Ledgers",
        prompt: "Given tables `charges` and `refunds`, write a query to detect accounts where the net refunded amount exceeds the original settled charge.",
      },
    ],
  },

  uber: {
    id: "uber",
    name: "Uber",
    category: "Top Tier Product",
    interviewFocus: "Real-time dispatch systems, geospatial indexing (H3 / Geohash), concurrency, high-throughput distributed queues.",
    keyTopics: ["Geospatial Indexing", "Real-Time Matching", "WebSocket / SSE Architectures", "Kafka Event Streams", "Dynamic Pricing"],
    dsaTopics: ["Graph shortest path with dynamic traffic weights", "Interval scheduling", "Design hit counter / rate limiter"],
    sqlFocus: "Driver surge pricing calculation, trip duration anomalies, rider retention cohort analysis.",
    systemDesignFocus: "Ride dispatch matching engine, real-time driver GPS tracking at scale, push notification pipelines.",
    behavioralStyle: "Customer-centric, engineering pragmatism, dealing with high operational pressure during live incidents.",
    realQuestionsSample: [
      {
        round: "DSA",
        title: "Nearest Driver Match within Geospatial Radius",
        prompt: "Given a 2D coordinate grid with dynamic driver locations, design an efficient data structure to find the K nearest active drivers to a pickup point.",
      },
      {
        round: "System Design",
        title: "Design Uber Real-Time Location Tracker",
        prompt: "Design a location tracking backend that accepts GPS coordinates from 5 million active drivers every 4 seconds with sub-second rider broadcast.",
      },
    ],
  },

  goldman_sachs: {
    id: "goldman_sachs",
    name: "Goldman Sachs",
    category: "FinTech & Banking",
    interviewFocus: "Low-latency systems, Java/C++ memory models, rigorous math/probability puzzles, SQL data pipelines and financial risk analytics.",
    keyTopics: ["Multithreading & Concurrency", "Java Memory Model & GC", "SQL Window Functions & Aggregations", "HashMaps & TreeMaps", "Time Complexity"],
    dsaTopics: ["Subarray product less than K", "Trapping rain water", "Median from data stream", "Stock buy-and-sell variants"],
    sqlFocus: "Complex trade book aggregations, daily PnL calculation, ranking traders by volume per sector using PARTITION BY.",
    systemDesignFocus: "Order execution engine, market data feed handler, trade matching and auditing.",
    behavioralStyle: "Professional integrity, attention to compliance and regulatory accuracy, working under market deadlines.",
    realQuestionsSample: [
      {
        round: "DSA",
        title: "Best Time to Buy and Sell Stock with Cooldown",
        prompt: "You are given an array of stock prices. You may complete as many transactions as you like with a 1-day cooldown. Maximize profit.",
      },
      {
        round: "SQL",
        title: "Daily Profit and Loss (PnL) Calculation",
        prompt: "Given a `trades` table with `symbol`, `price`, `quantity`, `trade_type` ('BUY'/'SELL'), and `timestamp`, calculate the net realized PnL per symbol for the current day.",
      },
      {
        round: "Fundamentals",
        title: "ConcurrentHashMap vs SynchronizedMap in Java",
        prompt: "Explain how ConcurrentHashMap achieves thread safety without locking the entire map. How does lock striping and compare-and-swap (CAS) work?",
      },
    ],
  },

  tcs_infosys: {
    id: "tcs_infosys",
    name: "TCS / Infosys / IT Services",
    category: "Enterprise & Services",
    interviewFocus: "Core computer science fundamentals: Object-Oriented Programming (OOPs), DBMS normalization and joins, Operating Systems (processes vs threads), Computer Networks (TCP/IP, OSI layers), and standard DSA patterns.",
    keyTopics: ["OOPs (Inheritance, Polymorphism, Abstraction, Encapsulation)", "DBMS & SQL Joins", "OS & Multiprocessing", "Computer Networks (TCP/UDP, DNS)", "Basic to Medium DSA"],
    dsaTopics: ["Array rotations & duplicate removal", "String palindrome & anagram checks", "Binary search", "Stack operations & balanced parentheses"],
    sqlFocus: "Difference between INNER and LEFT JOIN, finding second highest salary using subquery, GROUP BY with HAVING clause, Primary vs Unique key.",
    behavioralStyle: "Willingness to learn new tech stacks, adaptability to client shifts, communication clarity, teamwork in diverse environments.",
    realQuestionsSample: [
      {
        round: "SQL",
        title: "Find 2nd Highest Salary in Department",
        prompt: "Write a SQL query to find the 2nd highest salary from an `Employee` table without using LIMIT. Explain your approach.",
      },
      {
        round: "Fundamentals",
        title: "4 Pillars of OOP with Practical Examples",
        prompt: "Explain Abstraction, Encapsulation, Inheritance, and Polymorphism. Give real-world code examples demonstrating method overriding vs method overloading.",
      },
      {
        round: "DSA",
        title: "Check for Balanced Parentheses",
        prompt: "Given a string containing characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid using a Stack. Detail time complexity.",
      },
    ],
  },

  startup: {
    id: "startup",
    name: "High-Growth Startup / Y Combinator",
    category: "Fast-Growing Startup",
    interviewFocus: "High velocity, full-stack capability, product sense, practical engineering trade-offs, debugging, and getting features built without over-engineering.",
    keyTopics: ["Full-Stack Architecture", "PostgreSQL & Prisma/Drizzle", "Next.js & Server Actions", "Auth & API Integrations", "Pragmatic Trade-Offs"],
    dsaTopics: ["Practical data manipulation", "Parsing API responses", "State caching & debouncing"],
    sqlFocus: "Schema design for multi-tenant SaaS, indexing foreign keys, full-text search with pg_trgm.",
    systemDesignFocus: "MVPs that scale to 100k users, monolithic vs microservice decision, third-party integrations (Stripe, Resend, Supabase).",
    behavioralStyle: "High agency, speed of execution, customer empathy, willingness to wear multiple hats.",
    realQuestionsSample: [
      {
        round: "Fundamentals",
        title: "Database Indexing & N+1 Query Problem",
        prompt: "Explain how the N+1 query problem occurs in ORMs and how to detect and resolve it using eager loading and database indexing.",
      },
      {
        round: "System Design",
        title: "Multi-Tenant SaaS Database Architecture",
        prompt: "Compare single database with tenant_id column (row-level tenancy) vs separate schemas per tenant. What are the operational trade-offs?",
      },
    ],
  },
};

export function getCompanyProfile(companyInput?: string): CompanyProfile | null {
  if (!companyInput || !companyInput.trim()) return null;
  const normalized = companyInput.toLowerCase().trim();

  for (const [key, profile] of Object.entries(COMPANY_DATABASE)) {
    if (
      normalized.includes(key) ||
      profile.name.toLowerCase().includes(normalized) ||
      (key === "tcs_infosys" && (normalized.includes("tcs") || normalized.includes("infosys") || normalized.includes("wipro") || normalized.includes("accenture") || normalized.includes("cognizant")))
    ) {
      return profile;
    }
  }

  return null;
}
