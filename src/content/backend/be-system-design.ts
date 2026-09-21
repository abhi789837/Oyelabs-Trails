import type { Module } from "@/types/curriculum";

export default {
  id: "be-system-design",
  trackId: "backend",
  name: "System Design Fundamentals",
  description:
    "Distributed-systems judgement for backend engineers: scaling and statelessness, load balancing and consistent hashing, caching at every layer, replication and sharding with their consistency costs, queues and delivery guarantees, CDNs, and two classic designs built for real, a distributed rate limiter and a URL shortener. Expect back-of-the-envelope math, CAP and PACELC tradeoffs and failure modes, not box diagrams.",
  refs: [
    { label: "roadmap.sh: System Design", url: "https://roadmap.sh/system-design", kind: "article" },
    { label: "donnemartin/system-design-primer", url: "https://github.com/donnemartin/system-design-primer", kind: "interview-prep" },
    { label: "ByteByteGo: System Design 101", url: "https://github.com/ByteByteGoHq/system-design-101", kind: "repo" },
  ],
  topics: [
    {
      id: "sd-scaling",
      moduleId: "be-system-design",
      trackId: "backend",
      title: "Vertical vs Horizontal Scaling",
      summary:
        "Vertical scaling buys a bigger machine: no code changes and no distributed-systems problems. Its limits are a price curve that bends upward, a hard ceiling, a restart or failover to resize, and one machine as a single point of failure. Horizontal scaling adds machines behind a load balancer, which gives redundancy and near-linear capacity for work that parallelizes, at the cost of coordination: shared state, partial failures and consistency questions. Most systems scale the stateless tier horizontally and the database vertically for as long as they can, then add read replicas, caches and, last, sharding.\n\nHorizontal scaling only works if any instance can serve any request, so push state out of the process: sessions into Redis or signed tokens, uploads into object storage, caches into a shared tier, background work into a queue. Sticky sessions are a crutch: load skews towards heavy clients, new instances only get new users, and a crash or deploy logs out everyone pinned to that instance. Amdahl's law caps the gain: if 5% of the work is serialized behind a global lock or a single primary, no number of servers gives more than a 20× speedup, and coordination overhead can make throughput fall as you add nodes.\n\nBack-of-the-envelope math shapes the design before you draw boxes. A day has 86,400 seconds, so a million requests a day is about 12 per second on average; peaks run several times higher, so provision for peak with headroom. Storage is items × size × retention × replication factor, and bandwidth is requests per second × response size. Keep the classic latency ladder in your head: about 100 ns for a main-memory reference, 0.5 ms for a round trip inside a data centre, 10 ms for a disk seek and 150 ms for a round trip across an ocean.",
      level: "advanced",
      estMinutes: 55,
      webRefs: [
        { label: "Azure Architecture Center: Design to scale out", url: "https://learn.microsoft.com/en-us/azure/architecture/guide/design-principles/scale-out", kind: "docs" },
        { label: "The Twelve-Factor App: VI. Processes", url: "https://12factor.net/processes", kind: "article" },
        { label: "Jonas Bonér: Latency numbers every programmer should know", url: "https://gist.github.com/jboner/2841832", kind: "article" },
        { label: "System Design Primer: scalability and back-of-the-envelope estimation", url: "https://github.com/donnemartin/system-design-primer", kind: "interview-prep" },
      ],
      video: {
        title: "Scalability Simply Explained in 10 Minutes",
        channel: "ByteByteGo",
        url: "https://www.youtube.com/watch?v=EWS_CIxttVw",
        videoId: "EWS_CIxttVw",
        durationLabel: "9:20",
      },
      alternateVideos: [
        {
          title: "System Design Course – APIs, Databases, Caching, CDNs, Load Balancing & Production Infra",
          channel: "freeCodeCamp.org",
          url: "https://www.youtube.com/watch?v=C842vFY5kRo",
          videoId: "C842vFY5kRo",
          durationLabel: "2:05:22",
          startSeconds: 812,
          chapterLabel: "Vertical vs Horizontal Scaling",
        },
        {
          title: "Back-Of-The-Envelope Estimation / Capacity Planning",
          channel: "ByteByteGo",
          url: "https://www.youtube.com/watch?v=UC5xf8FbdJc",
          videoId: "UC5xf8FbdJc",
          durationLabel: "8:31",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "sd-scaling-q1",
          prompt: "A service handles 50 million requests a day, and its peak hour runs at 5× the daily average rate. Roughly what peak QPS should you plan for?",
          options: ["About 2,900", "About 580", "About 29,000", "About 35,000"],
          correctIndex: 0,
          explanation:
            "50,000,000 / 86,400 ≈ 580 requests per second on average, and 5× that is about 2,900. 580 forgets the peak; 29,000 slips a factor of 10, and 35,000 divides by minutes instead of seconds.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "sd-scaling-q2",
          prompt:
            "A link service stores 100 million new records a month at about 500 bytes each, keeps them for 5 years and replicates everything 3×. Roughly how much raw storage is that?",
          options: ["About 9 TB", "About 3 TB", "About 900 GB", "About 90 TB"],
          correctIndex: 0,
          explanation:
            "100M × 12 × 5 = 6 billion records; × 500 B = 3 TB; × 3 replicas = 9 TB. 3 TB forgets replication, and the others slip an order of magnitude.",
        },
        {
          id: "sd-scaling-q3",
          prompt: "Those 6 billion records each need a unique base62 code. What's the shortest fixed code length that can hold them all?",
          options: ["6 characters", "5 characters", "7 characters", "8 characters"],
          correctIndex: 0,
          explanation:
            "62^5 ≈ 916 million is too small; 62^6 ≈ 56.8 billion fits with room to spare. Many designs still pick 7 (≈ 3.5 trillion) so random codes rarely collide.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "sd-scaling-q4",
          prompt: "Why are sticky sessions (load balancer affinity) a poor substitute for stateless instances? (Select all that apply.)",
          options: [
            "Load skews towards instances pinned to heavy or long-lived clients",
            "Newly added instances only receive new users, so scaling out doesn't relieve existing hot spots",
            "Users pinned to an instance that crashes or is drained lose their in-memory session",
            "Affinity makes TLS termination at the load balancer impossible",
            "Affinity guarantees that each user always reaches the same data centre after a regional failover",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Affinity keeps state tied to one process, so balance, elasticity and failure handling all suffer. It works with TLS termination (cookie affinity requires it), and it does nothing for regional failover.",
        },
        {
          id: "sd-scaling-q5",
          prompt:
            "An app keeps user sessions in memory and writes uploads to local disk. After scaling from 1 to 4 instances, users get logged out at random and some uploaded images return 404. What's the fix?",
          options: [
            "Move sessions to a shared store (or signed tokens) and uploads to object storage, so any instance can serve any request",
            "Enable sticky sessions and keep everything else as it is",
            "Go back to one bigger instance, because apps can't run on several instances",
            "Increase the load balancer's health-check interval",
          ],
          correctIndex: 0,
          explanation:
            "Each instance only sees its own memory and disk, so requests that land elsewhere miss the state. Stickiness hides the session symptom but not the uploads, and not a crash.",
        },
        {
          id: "sd-scaling-q6",
          prompt: "5% of each request's work runs under a global lock that can't be parallelized. What's the best possible speedup from adding servers?",
          options: ["20×", "95×", "5×", "Unlimited, as long as the load balancer keeps up"],
          correctIndex: 0,
          explanation:
            "Amdahl's law: speedup ≤ 1 / serial fraction = 1 / 0.05 = 20, even with infinitely many servers. Contention usually makes the real curve flatten well before that.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "sd-scaling-q7",
          prompt: "A write-heavy Postgres primary on 8 vCPUs sits at 75% CPU. Queries are indexed and there's a single region. What's the lowest-risk next step?",
          options: [
            "Move to a larger instance (scale up) and keep optimizing queries, postponing sharding",
            "Add three read replicas",
            "Shard the database into four by customer",
            "Switch to multi-leader replication",
          ],
          correctIndex: 0,
          explanation:
            "Replicas replay every write, so they don't relieve a write-bound primary. Sharding and multi-leader add permanent complexity; scaling up buys time cheaply while you learn where the load really is.",
        },
        {
          id: "sd-scaling-q8",
          prompt: "Throughput rose from 1 to 8 nodes, then fell when you added a 9th and 10th. What's the most plausible explanation?",
          options: [
            "Coordination costs (lock contention, cross-node chatter, cache coherence) grow faster than the added capacity",
            "Load balancers can't route to more than 8 backends",
            "More nodes always reduce throughput; the first 8 were an anomaly",
            "The new nodes are slower because they haven't been warmed by the JIT yet",
          ],
          correctIndex: 0,
          explanation:
            "The Universal Scalability Law adds a coherence term that grows with the number of nodes, which is why throughput can go backwards. Find the shared resource and partition it.",
        },
        {
          id: "sd-scaling-q9",
          prompt: "Traffic jumps 10× within a minute, and new instances take 3 minutes to boot and warm up. What actually protects you? (Select all that apply.)",
          options: [
            "Keeping headroom, or scaling out on a schedule ahead of known peaks",
            "Load shedding and rate limiting so excess traffic fails fast",
            "Moving non-urgent work to a queue to be processed later",
            "Relying on autoscaling alone, since it reacts within seconds",
            "Making health checks run more often",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Reactive autoscaling is slower than the spike, so you need spare capacity, a way to reject work gracefully and a way to defer it. Faster health checks only detect trouble sooner.",
        },
        {
          id: "sd-scaling-q10",
          prompt:
            "A request handler makes 40 sequential calls to a service in the same data centre (about 0.5 ms each) and 1 call to an API on another continent (about 150 ms). What dominates its latency?",
          options: [
            "The single cross-continent call, about 150 ms against about 20 ms for the 40 local calls",
            "The 40 local calls, because there are more of them",
            "Both cost about the same",
            "Neither: CPU time always dominates network time",
          ],
          correctIndex: 0,
          explanation:
            "40 × 0.5 ms = 20 ms, while one intercontinental round trip is bounded by the speed of light in fibre. Batch the local calls and cache or move the remote dependency closer.",
        },
        {
          id: "sd-scaling-q11",
          prompt: "Which state can safely stay inside each instance of a horizontally scaled web service?",
          options: [
            "A small per-instance cache of rarely changing reference data with a short TTL",
            "The count of free API calls a user has left this month",
            "A shopping cart that must survive the instance restarting",
            "The lock that prevents two instances from charging the same order",
          ],
          correctIndex: 0,
          explanation:
            "A local cache is fine when a miss or brief staleness is harmless. Quotas, carts and mutual exclusion must be shared, or each instance enforces its own inconsistent version.",
        },
        {
          id: "sd-scaling-q12",
          prompt: "An image service serves 2,000 images per second at an average of 200 KB each. What egress bandwidth does that need?",
          options: ["About 3.2 Gbps", "About 400 Mbps", "About 32 Gbps", "About 1.6 Gbps"],
          correctIndex: 0,
          explanation:
            "2,000 × 200 KB = 400 MB/s, and × 8 bits per byte ≈ 3.2 Gbps. The tempting mistake is to read 400 MB/s as 400 Mbps and forget the factor of 8, which is exactly why this traffic belongs on a CDN.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },
    {
      id: "sd-load-balancing",
      moduleId: "be-system-design",
      trackId: "backend",
      title: "Load Balancing Strategies",
      summary:
        "A load balancer spreads requests across instances, routes around failures and gives clients one stable address. Layer 4 balancers route TCP or UDP connections by address and port without reading the payload: fast, protocol-agnostic, able to pass TLS straight through, but every request on a long-lived connection lands on the same backend. Layer 7 balancers terminate HTTP (and usually TLS), so they can route by host, path or header, retry idempotent requests, add headers and balance individual HTTP/2 or gRPC streams, where an L4 balancer would pin a whole multiplexed gRPC connection to one server.\n\nAlgorithms trade simplicity for awareness. Round robin assumes equal requests and equal servers; weighted round robin handles unequal servers; least connections (or least outstanding requests) adapts to slow requests; power of two choices picks the less loaded of two random backends and gets most of the benefit without global state. Hash-based routing sends the same key to the same backend, which you want for caches and stateful shards. Plain `hash(key) % n` remaps almost every key when `n` changes; consistent hashing places nodes and keys on a ring, so adding or removing one of n nodes moves only about 1/n of the keys, and many virtual nodes per server even out the load. Bounded-load variants cap any node's share so one hot key can't melt a server.\n\nHealth checks take dead backends out of rotation; keep them cheap and separate \"process alive\" from \"ready for traffic\". Watch the failure modes: an aggressive check plus a slow shared dependency ejects every backend at once, retries without a budget turn a brownout into a retry storm, and affinity (cookie or source-IP stickiness) skews load and breaks when its node dies. The balancer itself needs redundancy, or it becomes the single point of failure.",
      level: "advanced",
      estMinutes: 75,
      webRefs: [
        { label: "NGINX Docs: HTTP load balancing", url: "https://docs.nginx.com/nginx/admin-guide/load-balancer/http-load-balancer/", kind: "docs" },
        {
          label: "Envoy Docs: Supported load balancers (P2C, ring hash, Maglev)",
          url: "https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/upstream/load_balancing/load_balancers",
          kind: "docs",
        },
        { label: "Google Research: Consistent hashing with bounded loads", url: "https://research.google/blog/consistent-hashing-with-bounded-loads/", kind: "article" },
        { label: "Google SRE Book: Load Balancing in the Datacenter", url: "https://sre.google/sre-book/load-balancing-datacenter/", kind: "article" },
      ],
      video: {
        title: "System Design Course – APIs, Databases, Caching, CDNs, Load Balancing & Production Infra",
        channel: "freeCodeCamp.org",
        url: "https://www.youtube.com/watch?v=C842vFY5kRo",
        videoId: "C842vFY5kRo",
        durationLabel: "2:05:22",
        startSeconds: 982,
        chapterLabel: "Load Balancing",
      },
      alternateVideos: [
        {
          title: "Consistent Hashing | Algorithms You Should Know #1",
          channel: "ByteByteGo",
          url: "https://www.youtube.com/watch?v=UF9Iqmg94tk",
          videoId: "UF9Iqmg94tk",
          durationLabel: "8:04",
        },
        {
          title: "Load balancing in Layer 4 vs Layer 7 with HAPROXY Examples",
          channel: "Hussein Nasser",
          url: "https://www.youtube.com/watch?v=aKMLgFVxZYk",
          videoId: "aKMLgFVxZYk",
          durationLabel: "37:32",
        },
      ],
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Implement `HashRing`, a consistent-hash ring with virtual nodes: the structure behind memcached client sharding, Dynamo-style partitioning and hash-based load-balancer affinity.\n\n- `new HashRing(vnodes)` creates an empty ring.\n- `addNode(name)` puts `vnodes` points on the ring for that node, at positions `hash32(name + \"#\" + i)` for `i` from `0` to `vnodes - 1`. Adding a node that's already on the ring does nothing.\n- `removeNode(name)` takes all of that node's points off. Removing a node that isn't there does nothing.\n- `getNode(key)` returns the node that owns `key`: the owner of the first point whose position is greater than or equal to `hash32(key)`, wrapping around to the lowest point if there's none. An empty ring returns `null`.\n- If two points have the same position, order them by node name, then by `i`.\n\nUse the provided `hash32` (an unsigned 32-bit hash). Keep `getNode` fast: the largest test puts 51 × 200 points on the ring and does 40,000 lookups, so keep the points sorted when membership changes and binary-search them on lookup.\n\nThe driver (`runRing`) applies steps and reports lookups, per-node key counts and which keys moved after a membership change. The movement tests show what consistent hashing buys you: adding a fourth node moves about a quarter of the keys, all of them onto the new node, where `hash % n` would move about three quarters.",
        starterCode: "class HashRing {\n  /** @param {number} vnodes points on the ring per physical node */\n  constructor(vnodes) {\n    // Your code here\n  }\n\n  /** Put `vnodes` points for `name` on the ring (no-op if it's already there). */\n  addNode(name) {\n    // Your code here\n  }\n\n  /** Take all of `name`'s points off the ring (no-op if it isn't there). */\n  removeNode(name) {\n    // Your code here\n  }\n\n  /** @returns {string | null} the node that owns `key`, or null for an empty ring */\n  getNode(key) {\n    // Your code here\n  }\n}\n\n// ---- Test driver (leave as is) ----\nfunction hash32(str) {\n  let h = 0x811c9dc5;\n  for (let i = 0; i < str.length; i++) {\n    h ^= str.charCodeAt(i);\n    h = Math.imul(h, 0x01000193);\n  }\n  h ^= h >>> 16;\n  h = Math.imul(h, 0x85ebca6b);\n  h ^= h >>> 13;\n  h = Math.imul(h, 0xc2b2ae35);\n  h ^= h >>> 16;\n  return h >>> 0;\n}\n\nfunction runRing(vnodes, steps) {\n  const ring = new HashRing(vnodes);\n  const out = [];\n  let snapshot = [];\n  const assign = (prefix, n) => Array.from({ length: n }, (_, i) => ring.getNode(prefix + i));\n  for (const s of steps) {\n    if (s.op === \"add\") ring.addNode(s.node);\n    else if (s.op === \"remove\") ring.removeNode(s.node);\n    else if (s.op === \"get\") out.push(ring.getNode(s.key));\n    else if (s.op === \"counts\") {\n      const counts = {};\n      for (const node of assign(s.prefix, s.n)) counts[node] = (counts[node] ?? 0) + 1;\n      out.push(counts);\n    } else if (s.op === \"snapshot\") snapshot = assign(s.prefix, s.n);\n    else if (s.op === \"moved\") {\n      const now = assign(s.prefix, s.n);\n      const moves = {};\n      let moved = 0;\n      now.forEach((node, i) => {\n        if (node !== snapshot[i]) {\n          moved++;\n          const k = snapshot[i] + \"->\" + node;\n          moves[k] = (moves[k] ?? 0) + 1;\n        }\n      });\n      out.push(s.summary ? { moved, to: [...new Set(Object.keys(moves).map((k) => k.split(\"->\")[1]))].sort() } : { moved, moves });\n    }\n  }\n  return out;\n}\n",
        functionName: "runRing",
        testCases: [
          {
            description: "one node owns every key",
            args: [100, [{ op: "add", node: "A" }, { op: "get", key: "user:1" }, { op: "get", key: "order:77" }]],
            expected: ["A", "A"],
          },
          {
            description: "a key belongs to the first point at or after its hash, clockwise",
            args: [1, [{ op: "add", node: "A" }, { op: "add", node: "B" }, { op: "add", node: "C" }, { op: "get", key: "user:1" }, { op: "get", key: "user:2" }, { op: "get", key: "user:15" }]],
            expected: ["A", "C", "B"],
          },
          {
            description: "a key past the last point wraps around to the first",
            args: [1, [{ op: "add", node: "A" }, { op: "add", node: "B" }, { op: "add", node: "C" }, { op: "get", key: "user:0" }]],
            expected: ["C"],
            isEdgeCase: true,
          },
          {
            description: "a key that hashes exactly onto a point belongs to that point",
            args: [1, [{ op: "add", node: "A" }, { op: "add", node: "B" }, { op: "add", node: "C" }, { op: "get", key: "B#0" }]],
            expected: ["B"],
            isEdgeCase: true,
          },
          {
            description: "with 1 point per node the load is lopsided",
            args: [1, [{ op: "add", node: "A" }, { op: "add", node: "B" }, { op: "add", node: "C" }, { op: "counts", prefix: "user:", n: 3000 }]],
            expected: [{ C: 1801, A: 771, B: 428 }],
          },
          {
            description: "with 200 virtual nodes per node it evens out",
            args: [200, [{ op: "add", node: "A" }, { op: "add", node: "B" }, { op: "add", node: "C" }, { op: "counts", prefix: "user:", n: 3000 }]],
            expected: [{ C: 923, B: 1028, A: 1049 }],
          },
          {
            description: "adding a node only moves keys onto the new node",
            args: [100, [{ op: "add", node: "A" }, { op: "add", node: "B" }, { op: "add", node: "C" }, { op: "snapshot", prefix: "user:", n: 3000 }, { op: "add", node: "D" }, { op: "moved", prefix: "user:", n: 3000 }]],
            expected: [{ moved: 782, moves: { "C->D": 310, "A->D": 254, "B->D": 218 } }],
          },
          {
            description: "removing a node only moves that node's keys",
            args: [100, [{ op: "add", node: "A" }, { op: "add", node: "B" }, { op: "add", node: "C" }, { op: "add", node: "D" }, { op: "snapshot", prefix: "user:", n: 3000 }, { op: "remove", node: "B" }, { op: "moved", prefix: "user:", n: 3000 }]],
            expected: [{ moved: 746, moves: { "B->A": 221, "B->C": 287, "B->D": 238 } }],
          },
          {
            description: "an empty ring returns null",
            args: [100, [{ op: "get", key: "user:1" }]],
            expected: [null],
            isEdgeCase: true,
          },
          {
            description: "adding a node twice or removing an unknown node changes nothing",
            args: [100, [{ op: "add", node: "A" }, { op: "add", node: "B" }, { op: "snapshot", prefix: "k", n: 500 }, { op: "add", node: "A" }, { op: "remove", node: "Z" }, { op: "moved", prefix: "k", n: 500 }]],
            expected: [{ moved: 0, moves: {} }],
            isEdgeCase: true,
          },
          {
            description: "removing every node empties the ring",
            args: [10, [{ op: "add", node: "A" }, { op: "add", node: "B" }, { op: "remove", node: "A" }, { op: "remove", node: "B" }, { op: "get", key: "user:1" }]],
            expected: [null],
            isEdgeCase: true,
          },
          {
            description: "50 nodes x 200 virtual nodes, 20,000 lookups",
            args: [200, [{ op: "add", node: "cache-0" }, { op: "add", node: "cache-1" }, { op: "add", node: "cache-2" }, { op: "add", node: "cache-3" }, { op: "add", node: "cache-4" }, { op: "add", node: "cache-5" }, { op: "add", node: "cache-6" }, { op: "add", node: "cache-7" }, { op: "add", node: "cache-8" }, { op: "add", node: "cache-9" }, { op: "add", node: "cache-10" }, { op: "add", node: "cache-11" }, { op: "add", node: "cache-12" }, { op: "add", node: "cache-13" }, { op: "add", node: "cache-14" }, { op: "add", node: "cache-15" }, { op: "add", node: "cache-16" }, { op: "add", node: "cache-17" }, { op: "add", node: "cache-18" }, { op: "add", node: "cache-19" }, { op: "add", node: "cache-20" }, { op: "add", node: "cache-21" }, { op: "add", node: "cache-22" }, { op: "add", node: "cache-23" }, { op: "add", node: "cache-24" }, { op: "add", node: "cache-25" }, { op: "add", node: "cache-26" }, { op: "add", node: "cache-27" }, { op: "add", node: "cache-28" }, { op: "add", node: "cache-29" }, { op: "add", node: "cache-30" }, { op: "add", node: "cache-31" }, { op: "add", node: "cache-32" }, { op: "add", node: "cache-33" }, { op: "add", node: "cache-34" }, { op: "add", node: "cache-35" }, { op: "add", node: "cache-36" }, { op: "add", node: "cache-37" }, { op: "add", node: "cache-38" }, { op: "add", node: "cache-39" }, { op: "add", node: "cache-40" }, { op: "add", node: "cache-41" }, { op: "add", node: "cache-42" }, { op: "add", node: "cache-43" }, { op: "add", node: "cache-44" }, { op: "add", node: "cache-45" }, { op: "add", node: "cache-46" }, { op: "add", node: "cache-47" }, { op: "add", node: "cache-48" }, { op: "add", node: "cache-49" }, { op: "snapshot", prefix: "obj:", n: 20000 }, { op: "add", node: "cache-50" }, { op: "moved", prefix: "obj:", n: 20000, summary: true }]],
            expected: [{ moved: 419, to: ["cache-50"] }],
            isEdgeCase: true,
          },
        ],
      },
    },
    {
      id: "sd-caching",
      moduleId: "be-system-design",
      trackId: "backend",
      title: "Caching Strategies at Scale",
      summary:
        "Caching trades freshness for latency and load, and happens at every layer, from the browser and CDN edge to in-process caches, Redis or Memcached, and the database's buffer pool. The common patterns are cache-aside (the app fills the cache after a miss), read-through and write-through (a caching layer loads on a miss or writes to both synchronously), and write-behind (write to the cache and flush to the database later: fast, and able to lose writes). Every cached value needs an owner who invalidates it, plus a TTL that bounds staleness when invalidation fails.\n\nInvalidation races are the subtle part. On writes, delete the key rather than updating it: deletes are idempotent, while two concurrent updates can land in the wrong order. Delete-on-write still leaves a window in which a slow reader writes back the value it read before the update; Facebook's memcache leases close that window and throttle thundering herds, and short TTLs cap the damage. When memory fills, eviction policy matters: Redis defaults to `noeviction`, which rejects writes, so caches usually run `allkeys-lru` or `allkeys-lfu`.\n\nAt scale the failures are load problems. A stampede happens when a hot key expires and thousands of requests miss at once and hammer the database: coalesce misses so one caller recomputes, serve the stale value while one request refreshes it, or refresh probabilistically before expiry, and add jitter to TTLs so keys written together don't expire together. A hot key saturates the one shard that holds it: replicate it under suffixed keys or add a tiny local cache. Penetration, repeated lookups for keys that don't exist, bypasses the cache unless you cache negative results briefly. And a cold cache after a failover can flatten a database sized for a 95% hit rate: at 0% it sees twenty times the reads.",
      level: "expert",
      estMinutes: 65,
      webRefs: [
        { label: "Azure Architecture Center: Caching guidance", url: "https://learn.microsoft.com/en-us/azure/architecture/best-practices/caching", kind: "docs" },
        { label: "Redis Docs: Key eviction", url: "https://redis.io/docs/latest/develop/reference/eviction/", kind: "docs" },
        { label: "USENIX NSDI '13: Scaling Memcache at Facebook", url: "https://www.usenix.org/conference/nsdi13/technical-sessions/presentation/nishtala", kind: "article" },
        { label: "Azure Architecture Center: Cache-Aside pattern", url: "https://learn.microsoft.com/en-us/azure/architecture/patterns/cache-aside", kind: "docs" },
      ],
      video: {
        title: "Caching in System Design Interviews w/ Meta Staff Engineer",
        channel: "Hello Interview",
        url: "https://www.youtube.com/watch?v=1NngTUYPdpI",
        videoId: "1NngTUYPdpI",
        durationLabel: "30:13",
      },
      alternateVideos: [
        {
          title: "Caching Pitfalls Every Developer Should Know",
          channel: "ByteByteGo",
          url: "https://www.youtube.com/watch?v=wh98s0XhMmQ",
          videoId: "wh98s0XhMmQ",
          durationLabel: "6:40",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "sd-caching-q1",
          prompt:
            "A service uses cache-aside with delete-on-write and no TTL. These steps happen in this order:\n\n- Reader A misses the cache and reads `v1` from the database\n- Writer B updates the database to `v2` and deletes the cache key\n- Reader A (slow, e.g. after a GC pause) writes `v1` into the cache\n\nWhat do later readers see?",
          options: [
            "`v1`, indefinitely, until something else deletes or overwrites the key",
            "`v2`, because B's delete happened after A's read",
            "A cache miss, because the cache rejects writes older than the last delete",
            "An error, because A's write conflicts with B's delete",
          ],
          correctIndex: 0,
          explanation:
            "A's stale value lands after the delete, and nothing ever removes it. This is the stale-set race that memcache's leases were built to prevent; a TTL at least bounds how long it lasts.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "sd-caching-q2",
          prompt: "Why do many systems delete the cache key on writes instead of writing the new value into the cache?",
          options: [
            "Deletes are idempotent, while concurrent updates can be applied to the cache in the wrong order and leave an old value",
            "Deleting is faster than writing for every cache engine",
            "Writing to the cache on updates is impossible with Redis",
            "Deleting keeps the cache smaller, which is the main goal",
          ],
          correctIndex: 0,
          explanation:
            "If two writers set the cache after their database writes, the network can reorder them and the older value wins. A delete just forces the next reader to load the current value.",
        },
        {
          id: "sd-caching-q3",
          prompt: "A cache serves 20,000 reads per second at a 95% hit rate. After a failover the cache comes back empty. How does the database's read load change?",
          options: [
            "It jumps from about 1,000 to about 20,000 reads per second, 20× normal",
            "It rises by about 5%",
            "It doubles",
            "It stays the same, because the cache refills before requests arrive",
          ],
          correctIndex: 0,
          explanation:
            "At 95% the database sees 5% of 20,000 = 1,000 reads per second; at 0% it sees all 20,000. Warm the cache, rate-limit the refill or shed load before a database sized for the normal case falls over.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "sd-caching-q4",
          prompt: "A hot key that 5,000 requests per second depend on expires. Which measures prevent a stampede on the database? (Select all that apply.)",
          options: [
            "Coalesce concurrent misses so only one request recomputes the value",
            "Keep serving the stale value while a single request refreshes it",
            "Refresh the value probabilistically shortly before it expires",
            "Give that key a much shorter TTL",
            "Enlarge the database connection pool so every miss gets a connection",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "All three ensure one recomputation instead of thousands. A shorter TTL makes stampedes more frequent, and a bigger pool just lets more identical queries hit the database at once.",
        },
        {
          id: "sd-caching-q5",
          prompt: "A deploy warms 2 million keys in one minute, all with a 1-hour TTL. Exactly an hour later, database load spikes. What's the standard fix?",
          options: [
            "Add random jitter to TTLs so keys written together expire at different times",
            "Use a longer TTL for every key",
            "Warm the cache again every hour",
            "Switch the eviction policy to LRU",
          ],
          correctIndex: 0,
          explanation:
            "Keys written together expire together, and the synchronized misses hit the database at once. A TTL of, say, 60 minutes ± 10% spreads the refills out.",
        },
        {
          id: "sd-caching-q6",
          prompt:
            "One product key gets 200,000 reads per second during a flash sale. It lives on a single Redis shard, which is now at 100% CPU while the other shards idle. What helps?",
          options: [
            "Replicate the value under several suffixed keys (spread across shards) and read a random copy, or add a short-lived in-process cache in front",
            "Add more shards to the cluster",
            "Increase the key's TTL",
            "Switch the cluster to `allkeys-lfu` eviction",
          ],
          correctIndex: 0,
          explanation:
            "One key maps to one shard no matter how many shards exist, so you have to spread or absorb that key's reads. TTL and eviction policy don't change where the reads go.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "sd-caching-q7",
          prompt: "A bot requests `/products/<random-uuid>` thousands of times per second. Every request misses the cache and queries the database. What's the targeted fix?",
          options: [
            "Cache \"not found\" results for a short time (or check a Bloom filter of existing IDs) so misses stop reaching the database",
            "Increase the cache size",
            "Switch from cache-aside to write-through",
            "Lengthen the TTL of existing products",
          ],
          correctIndex: 0,
          explanation:
            "This is cache penetration: the keys don't exist, so nothing is ever cached. Negative caching (plus rate limiting the bot) closes the hole; a bigger cache or longer TTLs don't touch nonexistent keys.",
        },
        {
          id: "sd-caching-q8",
          prompt: "A Redis instance used as a cache reaches `maxmemory` with the default configuration. What happens?",
          options: [
            "Commands that would add data fail with an out-of-memory error, because the default policy is `noeviction`",
            "The least recently used keys are evicted automatically",
            "Random keys with a TTL are evicted",
            "Redis starts writing keys to disk and keeps accepting writes",
          ],
          correctIndex: 0,
          explanation:
            "Redis defaults to `noeviction`, which suits a primary data store but not a cache. Set `maxmemory-policy allkeys-lru` (or `allkeys-lfu`) for caching workloads.",
        },
        {
          id: "sd-caching-q9",
          prompt: "What's the main risk of a write-behind (write-back) cache?",
          options: [
            "Writes acknowledged from the cache can be lost if it fails before flushing them, and the database lags behind",
            "Reads always go to the database, so it doesn't reduce load",
            "Every write is slower because it waits for the database",
            "It can't be used with a TTL",
          ],
          correctIndex: 0,
          explanation:
            "Write-behind makes writes fast by deferring durability. Use it where losing or reordering some writes is acceptable (counters, analytics), and never for money.",
        },
        {
          id: "sd-caching-q10",
          prompt:
            "Twenty API instances each keep an in-process cache with a 60-second TTL. After a user renames a project, some requests show the new name and some the old one for up to a minute. Why?",
          options: [
            "Each instance has its own copy; the write only invalidated the cache on the instance that handled it",
            "The database replicates the new name to instances one at a time",
            "In-process caches ignore TTLs under load",
            "The load balancer caches responses for 60 seconds",
          ],
          correctIndex: 0,
          explanation:
            "Local caches are fast but invisible to each other. Broadcast invalidations (pub/sub), move the data to a shared cache, or accept and shorten the staleness window.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "sd-caching-q11",
          prompt: "Which data fits a shared cache with a TTL well? (Select all that apply.)",
          options: [
            "A product catalog page read thousands of times per write, where a few seconds of staleness is fine",
            "A leaderboard recomputed every minute",
            "Session data with an expiry",
            "An account balance used to approve a withdrawal",
            "An inventory count used to decide whether the last item can be sold",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Caching fits read-heavy data that tolerates staleness, or data whose lifetime matches the TTL. Decisions that must see the latest committed value belong in the database, with the right isolation or locking.",
        },
        {
          id: "sd-caching-q12",
          prompt: "A cache holds a stable set of popular keys, but a nightly batch job reads every product once. Which eviction policy keeps the popular keys cached through the scan?",
          options: [
            "LFU, which evicts by access frequency, so one-off reads don't displace frequently used keys",
            "LRU, which keeps the most recently used keys",
            "FIFO, which evicts the oldest inserted keys",
            "Random eviction, which is immune to access patterns",
          ],
          correctIndex: 0,
          explanation:
            "A scan makes every product \"recently used\", so LRU flushes the working set; frequency-based eviction resists that. Redis offers both as `allkeys-lru` and `allkeys-lfu`.",
        },
      ],
    },
    {
      id: "sd-replication-sharding",
      moduleId: "be-system-design",
      trackId: "backend",
      title: "Database Replication & Sharding",
      summary:
        "Replication copies the same data to several nodes for availability, read scaling and locality; sharding splits the data so each node holds a subset, for write and storage scaling. In leader-follower replication every write goes through one leader, which streams its log to followers. Synchronous replication makes a commit wait for followers; asynchronous doesn't, so a failover can lose already-acknowledged writes, and follower reads can be stale. Lag breaks read-your-writes (your own edit seems to vanish) and monotonic reads (data appears, then disappears on refresh). Fixes: read your own recent writes from the leader, pin sessions to one replica, or wait until a replica reaches the write's log position.\n\nMulti-leader and leaderless designs accept writes on several nodes and must resolve conflicts: last-write-wins silently drops concurrent writes and trusts clocks, while version vectors or CRDTs keep or merge them. Dynamo-style quorums with N replicas, W write acks and R read replies overlap when R + W > N, but sloppy quorums and concurrent writes mean that still isn't linearizable. CAP: during a partition, a replicated system gives up consistency or availability; PACELC adds that without a partition it trades latency against consistency (Dynamo, Cassandra and Riak are the paper's PA/EL examples, fully ACID systems PC/EC).\n\nRange sharding keeps range scans cheap but piles sequential keys (timestamps, auto-increment IDs) onto the newest shard; hash sharding spreads load but turns range queries into scatter-gather; a directory maps keys through a lookup service. Never shard with `hash % n`, because changing `n` moves almost every key: pre-split into many fixed partitions (Redis Cluster has 16,384 hash slots) and move whole partitions. A celebrity key still overloads one shard, so split its writes across suffixed keys. Cross-shard joins, transactions and unique constraints are the price, so choose the shard key by access pattern.",
      level: "expert",
      estMinutes: 75,
      webRefs: [
        { label: "PostgreSQL Docs: High Availability, Load Balancing, and Replication", url: "https://www.postgresql.org/docs/current/high-availability.html", kind: "docs" },
        { label: "Azure Architecture Center: Data partitioning guidance", url: "https://learn.microsoft.com/en-us/azure/architecture/best-practices/data-partitioning", kind: "docs" },
        { label: "Jepsen: Consistency models", url: "https://jepsen.io/consistency", kind: "article" },
        { label: "Daniel Abadi: Consistency Tradeoffs in Modern Distributed Database System Design (PACELC)", url: "https://www.cs.umd.edu/~abadi/papers/abadi-pacelc.pdf", kind: "article" },
      ],
      video: {
        title: "Sharding in System Design Interviews w/ Meta Staff Engineer",
        channel: "Hello Interview",
        url: "https://www.youtube.com/watch?v=L521gizea4s",
        videoId: "L521gizea4s",
        durationLabel: "30:34",
      },
      alternateVideos: [
        {
          title: "Distributed Systems 5.2: Quorums",
          channel: "Martin Kleppmann",
          url: "https://www.youtube.com/watch?v=uNxl3BFcKSA",
          videoId: "uNxl3BFcKSA",
          durationLabel: "9:36",
        },
        {
          title: "CAP Theorem in System Design Interviews",
          channel: "Hello Interview",
          url: "https://www.youtube.com/watch?v=VdrEq0cODu4",
          videoId: "VdrEq0cODu4",
          durationLabel: "13:56",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "sd-replication-sharding-q1",
          prompt:
            "A user edits their bio; the API writes to the primary and redirects to the profile page, which reads from an asynchronous replica. The page shows the old bio, and a refresh a second later shows the new one. What's the cleanest fix?",
          options: [
            "Serve a user's own recently written data from the primary (or from a replica that has caught up to their write's position)",
            "Switch every replica to synchronous replication",
            "Add a one-second sleep before the redirect",
            "Cache the profile page for a minute",
          ],
          correctIndex: 0,
          explanation:
            "That's a read-your-writes violation caused by replication lag. Routing only the writer's reads, for a short window or until a replica reaches their log position, fixes it without making every write wait. Sleeping guesses at lag; caching makes it worse.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "sd-replication-sharding-q2",
          prompt:
            "With asynchronous replication, the leader acknowledges an order 50 ms before it crashes, and a follower is promoted. What can happen to that order?",
          options: [
            "It can be lost, because the follower may never have received it",
            "Nothing: an acknowledged write is always durable on every replica",
            "It's replayed automatically from the client's retry buffer",
            "It's merged into the new leader when the old one's disk is read",
          ],
          correctIndex: 0,
          explanation:
            "Async replication acknowledges before followers confirm, so failover can drop acknowledged writes, and if the old leader returns its extra writes conflict with the new history. Synchronous or semi-synchronous replication (or a consensus-based store) trades latency for that guarantee.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "sd-replication-sharding-q3",
          prompt: "A leaderless store uses N = 3 replicas, W = 2 and R = 2. Which statements are true? (Select all that apply.)",
          options: [
            "Every read quorum overlaps every write quorum in at least one replica",
            "Reads and writes both keep working with one replica down",
            "With W = 3 and R = 1, writes fail whenever any replica is down",
            "R + W > N guarantees linearizable reads in every failure scenario",
            "With W = 1 and R = 1 you still always read the latest write",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "2 + 2 > 3 forces overlap, and each quorum still has 2 of 3 replicas with one down. Abadi's PACELC paper notes that Dynamo-style systems can't achieve full consistency even with R + W > N (sloppy quorums, concurrent writes, partial failures), and 1 + 1 doesn't overlap at all.",
        },
        {
          id: "sd-replication-sharding-q4",
          prompt:
            "Two clients update the same cart concurrently through different replicas of a multi-leader store that resolves conflicts with last-write-wins on wall-clock timestamps. What's the risk?",
          options: [
            "One update is silently discarded, and with clock skew it can even be the one that happened later",
            "Both updates are kept and merged automatically",
            "The store rejects both writes and asks the clients to retry",
            "The earlier write always wins, which is safe",
          ],
          correctIndex: 0,
          explanation:
            "LWW \"resolves\" conflicts by throwing data away and trusts synchronized clocks. For carts, merge (a CRDT such as an add-wins set) or keep both versions via version vectors and let the application merge.",
        },
        {
          id: "sd-replication-sharding-q5",
          prompt: "A user posts a comment, sees it, refreshes, and it's gone; another refresh shows it again. Reads are load-balanced across replicas. What's happening?",
          options: [
            "Consecutive reads hit replicas with different lag, violating monotonic reads; pin each session to one replica",
            "The comment was deleted and restored by a moderator",
            "The primary is rolling back the write and replaying it",
            "The browser is caching an older response",
          ],
          correctIndex: 0,
          explanation:
            "Monotonic reads means you never see older data after newer data. Routing a user consistently (by user ID hash) to the same replica gives it; read-your-writes alone doesn't.",
        },
        {
          id: "sd-replication-sharding-q6",
          prompt: "An events table is range-sharded by `created_at`. What happens under steady write traffic?",
          options: [
            "Every new write lands on the shard that owns the latest time range, so one shard is hot while the rest idle",
            "Writes spread evenly because time is uniform",
            "Range queries by time become scatter-gather across all shards",
            "Old shards fill up and reject writes",
          ],
          correctIndex: 0,
          explanation:
            "Monotonically increasing keys defeat range partitioning for writes. Prefix the key with something well distributed (such as a tenant or device ID) or hash it, and accept costlier time-range scans.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "sd-replication-sharding-q7",
          prompt: "You shard by `hash(key) % n` and grow from 4 to 5 shards. Roughly what fraction of keys must move?",
          options: ["About 80%", "About 20%", "About 25%", "About 50%"],
          correctIndex: 0,
          explanation:
            "A key stays put only if `h % 4 == h % 5`, which holds for about 1 in 5 keys, so about 80% move. Consistent hashing or a fixed set of many partitions moves only about 1/5.",
        },
        {
          id: "sd-replication-sharding-q8",
          prompt: "A viral post's like counter takes 50,000 increments per second, all on one shard, which can't keep up. What's the standard fix?",
          options: [
            "Split the counter into N sub-counters with suffixed keys on different shards, increment a random one and sum them on read",
            "Move the counter to the largest shard",
            "Add read replicas to that shard",
            "Increase the shard's connection pool",
          ],
          correctIndex: 0,
          explanation:
            "Write sharding spreads one logical key across partitions; reads get a little more expensive. Replicas don't help write throughput, and a single row can't be written faster by adding connections.",
        },
        {
          id: "sd-replication-sharding-q9",
          prompt: "A network partition splits a 5-node, consensus-replicated (CP) database into groups of 3 and 2. What do clients connected to the 2-node side see?",
          options: [
            "Writes (and linearizable reads) fail there, because that side has no majority; the 3-node side keeps serving",
            "Both sides keep accepting writes and merge them when the partition heals",
            "The 2-node side becomes read-only but always returns the latest data",
            "Nothing changes as long as the partition lasts under a minute",
          ],
          correctIndex: 0,
          explanation:
            "Choosing consistency during a partition means the minority side must refuse requests it can't order safely. That's the C-versus-A choice CAP describes, made per request, not a label on the whole product.",
        },
        {
          id: "sd-replication-sharding-q10",
          prompt: "What does PACELC add to CAP?",
          options: [
            "Even with no partition, a replicated system trades latency against consistency, for example by waiting for replicas or not",
            "A third choice during partitions that keeps both consistency and availability",
            "A formula for how many replicas you need",
            "The rule that every system must be PC/EC",
          ],
          correctIndex: 0,
          explanation:
            "Partitions are rare; the latency cost of coordination is paid on every request. Abadi classifies default Dynamo, Cassandra and Riak as PA/EL and fully ACID systems such as VoltDB/H-Store and Megastore as PC/EC.",
        },
        {
          id: "sd-replication-sharding-q11",
          prompt: "Orders are sharded by `customer_id`. Which query becomes expensive?",
          options: [
            "\"All orders containing product X in the last hour\", which must scatter-gather every shard or use a separately maintained global index",
            "\"All orders for customer 42\"",
            "\"Order 9001 for customer 42\"",
            "\"Customer 42's most recent order\"",
          ],
          correctIndex: 0,
          explanation:
            "Queries that include the shard key hit one shard; anything else fans out. A global secondary index avoids the fan-out but is usually updated asynchronously, so it can lag.",
        },
        {
          id: "sd-replication-sharding-q12",
          prompt: "A multi-tenant SaaS shards by `tenant_id`. What does that buy, and what's the main risk? (Select all that apply.)",
          options: [
            "Transactions and joins within one tenant stay on a single shard",
            "Per-tenant data can be moved, backed up or isolated as a unit",
            "One very large tenant can outgrow or overload its shard",
            "Cross-tenant analytics becomes a single-shard query",
            "Every tenant's load is guaranteed to be equal",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Tenant sharding aligns with the access pattern, which is why it's common. The whale tenant is the risk; plan to give big tenants their own shard or sub-shard them. Cross-tenant analytics usually moves to a warehouse.",
        },
      ],
    },
    {
      id: "sd-message-queues",
      moduleId: "be-system-design",
      trackId: "backend",
      title: "Message Queues & Async Processing",
      summary:
        "A queue decouples producers from consumers in time and rate: the API enqueues work and returns, workers process it at their own pace, and a traffic spike becomes a growing backlog instead of an outage. Delivery semantics come down to when the consumer acknowledges. Ack (or commit the offset) before processing and a crash loses the message: at-most-once. Process first and a crash before the ack redelivers it: at-least-once, the default almost everywhere. Exactly-once delivery across a network isn't achievable in general; what you build is effectively-once processing: at-least-once delivery plus an idempotent consumer that records processed message IDs (or relies on a natural idempotency key) in the same transaction as its side effects. Kafka's transactions give exactly-once only for read-process-write pipelines that stay inside Kafka; charge a card or send an email and you're back to idempotency keys.\n\nA work queue (SQS, RabbitMQ) hands each message to one of many competing consumers and deletes it once acknowledged; SQS hides a received message for a visibility timeout (30 seconds by default) and redelivers it if it isn't deleted in time, so slow jobs run twice. A log (Kafka) appends records to partitions and keeps them for replay. Order holds only within a partition, equal keys go to the same partition, and each partition is read by one consumer per group, so the partition count caps parallelism (newer Kafka versions add queue-style share groups).\n\nPlan for poison messages and overload: move a message to a dead-letter queue after a few failed attempts, retry with exponential backoff and jitter, and apply backpressure with bounded queues, consumer-lag alerts and producer throttling. And avoid the dual write (commit to the database, then publish, and crash in between): write the event to an outbox table in the same transaction and relay it.",
      level: "expert",
      estMinutes: 65,
      webRefs: [
        { label: "Apache Kafka Docs: Design (message delivery semantics)", url: "https://kafka.apache.org/43/design/design/", kind: "docs" },
        {
          label: "Amazon SQS: Visibility timeout",
          url: "https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-visibility-timeout.html",
          kind: "docs",
        },
        {
          label: "Amazon SQS: Dead-letter queues",
          url: "https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-dead-letter-queues.html",
          kind: "docs",
        },
        {
          label: "Confluent: Exactly-once semantics are possible: here's how Kafka does it",
          url: "https://www.confluent.io/blog/exactly-once-semantics-are-possible-heres-how-apache-kafka-does-it/",
          kind: "article",
        },
      ],
      video: {
        title: "Message Queues in System Design Interviews w/ Meta Staff Engineer",
        channel: "Hello Interview",
        url: "https://www.youtube.com/watch?v=1ISRd0bS714",
        videoId: "1ISRd0bS714",
        durationLabel: "26:46",
      },
      alternateVideos: [
        {
          title: "Kafka vs RabbitMQ",
          channel: "Hello Interview",
          url: "https://www.youtube.com/watch?v=1HOVtQ-_fcE",
          videoId: "1HOVtQ-_fcE",
          durationLabel: "10:55",
        },
        {
          title: "Fix Duplicate Messages with the Idempotent Consumer Pattern",
          channel: "Milan Jovanović",
          url: "https://www.youtube.com/watch?v=GsZ_ZtlRCBg",
          videoId: "GsZ_ZtlRCBg",
          durationLabel: "14:18",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "sd-message-queues-q1",
          prompt:
            "A Kafka consumer commits its offset as soon as it receives a batch, then processes the batch. It crashes halfway through. What happens to the unprocessed messages?",
          options: [
            "They're lost: the group resumes after the committed offset, so this is at-most-once",
            "They're redelivered, because Kafka tracks per-message acknowledgements",
            "They're processed twice",
            "The broker detects the crash and rolls the offset back",
          ],
          correctIndex: 0,
          explanation:
            "Committing before processing means a crash skips the rest of the batch. Process first, then commit, for at-least-once, and make processing idempotent to absorb the redeliveries.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "sd-message-queues-q2",
          prompt: "An SQS queue uses the default visibility timeout. A video-transcoding job takes about 45 seconds. What goes wrong?",
          options: [
            "After 30 seconds the message becomes visible again and a second worker starts the same job",
            "SQS deletes the message after 30 seconds and the job's result is discarded",
            "The worker's receive call blocks until the job finishes",
            "Nothing: visibility timeouts only apply to FIFO queues",
          ],
          correctIndex: 0,
          explanation:
            "The default is 30 seconds. Set the timeout above the worst-case processing time or extend it while working (`ChangeMessageVisibility`), and keep the consumer idempotent anyway.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "sd-message-queues-q3",
          prompt: "A consumer charges a customer's card for each `OrderPlaced` message, and delivery is at-least-once. What makes a redelivery harmless? (Select all that apply.)",
          options: [
            "Passing the order ID as an idempotency key to the payment provider",
            "Recording the processed message ID in the same database transaction as the charge record, and skipping IDs already seen",
            "A unique constraint on the charge table's `order_id` column",
            "Enabling the Kafka producer's idempotence setting",
            "Setting the broker to exactly-once delivery",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Idempotency has to live where the side effect happens. The idempotent producer only stops producer retries from duplicating records in the log, and no broker setting can stop a consumer from charging twice after a crash.",
        },
        {
          id: "sd-message-queues-q4",
          prompt: "Events for each customer must be processed in order, and the topic has 12 partitions. How do you get that?",
          options: [
            "Use the customer ID as the record key, so all of a customer's events go to one partition, where order is preserved",
            "Use a single consumer for the whole topic",
            "Rely on Kafka's global ordering across partitions",
            "Add a timestamp and sort in each consumer",
          ],
          correctIndex: 0,
          explanation:
            "Kafka orders records within a partition, not across partitions, and the default partitioner maps equal keys to the same partition. Per-key ordering keeps parallelism across customers.",
        },
        {
          id: "sd-message-queues-q5",
          prompt: "A topic has 6 partitions. You scale its consumer group from 6 to 10 instances to catch up on lag. What happens?",
          options: [
            "Four instances sit idle, because each partition is assigned to at most one consumer in a group",
            "Throughput rises by about 66%",
            "Kafka splits partitions automatically to fit 10 consumers",
            "Each message is processed by two consumers",
          ],
          correctIndex: 0,
          explanation:
            "Partitions are the unit of parallelism for consumer groups, so plan the partition count for peak consumer parallelism. Share groups, a newer queue-style mode, lift that limit at the cost of per-partition ordering.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "sd-message-queues-q6",
          prompt: "One malformed message makes the consumer throw every time. Without special handling, what happens, and what's the fix?",
          options: [
            "It's redelivered forever and can block everything behind it; move it to a dead-letter queue after N attempts and alert",
            "The broker deletes it automatically after the first failure",
            "The consumer skips it on the second attempt",
            "It's fine: poison messages only affect FIFO queues",
          ],
          correctIndex: 0,
          explanation:
            "SQS redrive policies (`maxReceiveCount`) and retry-plus-DLQ topics in Kafka isolate poison messages so the rest keep flowing, while the DLQ keeps them for inspection and replay.",
        },
        {
          id: "sd-message-queues-q7",
          prompt:
            "A service commits an order to Postgres and then publishes `OrderPlaced`. It crashes between the two steps. What's the robust pattern?",
          options: [
            "Write the event to an outbox table in the same transaction as the order, and have a relay publish it (at least once)",
            "Publish first, then commit, so the event is never lost",
            "Wrap both in a try/catch and retry the publish in the catch block",
            "Use a distributed lock around both steps",
          ],
          correctIndex: 0,
          explanation:
            "The two systems can't commit atomically, so either order leaves a crash window. The outbox turns publishing into a local database write; publishing first just flips the bug to events for orders that don't exist.",
        },
        {
          id: "sd-message-queues-q8",
          prompt: "Consumer lag climbs every evening at peak and never fully recovers overnight. What does that tell you?",
          options: [
            "Average consumption is slower than average production; a queue absorbs bursts, not a sustained deficit, so add consumer capacity or make processing cheaper",
            "The broker is misconfigured, because lag should always return to zero",
            "Lag is harmless as long as the broker has disk space",
            "The producers should batch more to reduce lag",
          ],
          correctIndex: 0,
          explanation:
            "If lag trends upwards over days, the backlog grows until retention deletes unprocessed data or latency becomes unacceptable. Alert on lag trend and age of the oldest message, not just on depth.",
        },
        {
          id: "sd-message-queues-q9",
          prompt: "Workers retry a failing downstream call immediately, as fast as they can. The downstream service partially recovers, then falls over again. Why?",
          options: [
            "Synchronized retries multiply the load; use exponential backoff with jitter and a retry budget",
            "Retries should always be immediate so users wait less",
            "The downstream service needs a larger thread pool",
            "Retries should use a fixed 1-second delay for every worker",
          ],
          correctIndex: 0,
          explanation:
            "Immediate or fixed-interval retries arrive in waves exactly when the service is weakest. Jitter spreads them out, backoff reduces the rate, and a budget caps retries as a fraction of traffic.",
        },
        {
          id: "sd-message-queues-q10",
          prompt: "A new analytics service needs to process the last 7 days of order events, then keep up with new ones. Which fits?",
          options: [
            "A log such as Kafka with at least 7 days of retention, read by a new consumer group from the earliest offset",
            "An SQS standard queue, reading all messages again",
            "A RabbitMQ work queue shared with the existing consumers",
            "Any queue works, because messages are kept after acknowledgement",
          ],
          correctIndex: 0,
          explanation:
            "Logs retain records independently of consumption, so a new group can replay history without affecting others. Work queues delete messages once they're acknowledged.",
        },
        {
          id: "sd-message-queues-q11",
          prompt: "What do Kafka's transactions (exactly-once semantics) actually guarantee?",
          options: [
            "Consuming from one topic, producing to another and committing the consumer offsets happen atomically, for readers using `read_committed`",
            "Any external side effect, such as an email or an HTTP call, happens exactly once",
            "Messages are delivered exactly once even to consumers that crash mid-processing and call external APIs",
            "Producers never need to retry",
          ],
          correctIndex: 0,
          explanation:
            "Kafka's docs are explicit that exactly-once for other destinations needs their cooperation, typically storing offsets alongside the output or deduplicating. Anything outside Kafka still needs idempotency.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "sd-message-queues-q12",
          prompt: "To keep a partition moving, a consumer sends messages that fail to a separate retry topic and carries on. What guarantee did it just give up?",
          options: [
            "Per-key ordering: a later event for the same key can be processed before the earlier one being retried",
            "At-least-once delivery",
            "Durability of the failed messages",
            "Consumer group rebalancing",
          ],
          correctIndex: 0,
          explanation:
            "Retry topics trade ordering for availability. If order matters, park the whole key (stop processing later events for it until the retry succeeds) or make handlers tolerate out-of-order events with versions.",
        },
      ],
    },
    {
      id: "sd-cdn-edge",
      moduleId: "be-system-design",
      trackId: "backend",
      title: "CDNs & Edge Caching",
      summary:
        "A CDN caches responses at points of presence near users, which cuts latency, absorbs spikes and DDoS traffic, and offloads the origin. It's a shared HTTP cache, governed by RFC 9111 plus vendor configuration. The cache key decides what counts as the same response: by default the scheme, host, path and query string, so `?utm_source=` variants fragment the cache unless you strip or sort parameters, and every header listed in `Vary` multiplies the variants. The origin's `Cache-Control` sets freshness: `max-age` for every cache, `s-maxage` to override it for shared caches, `private` for per-user responses a CDN must never store, and `no-store` for responses nothing may keep. A personalised page cached as `public` is one of the worst bugs you can ship: one user's data served to everyone.\n\nInvalidation is hard, so design so you rarely need it. Fingerprint static assets (`app.3f9c2e1.js`) and serve them with a long `max-age` plus `immutable`, so a deploy changes URLs instead of purging. For HTML and API responses use short TTLs with `stale-while-revalidate` (serve the stale copy while fetching a fresh one in the background) and `stale-if-error` (serve stale when the origin fails), both from RFC 5861, and keep purge-by-URL or by-tag for emergencies; purges take time to propagate and never reach browser caches. Redirects are cached too: a 301 is cacheable by default, so browsers and edges may stop asking you, while a 302 is cached only if you give it explicit freshness.\n\nProtect the origin. When a popular object expires, many edge locations miss at once; an origin shield (a mid-tier cache every edge goes through) plus request collapsing turns that into roughly one origin fetch. Track the hit ratio per path rather than globally. The edge is also where you terminate TLS, rate-limit and run small stateless functions.",
      level: "advanced",
      estMinutes: 50,
      webRefs: [
        { label: "MDN: HTTP caching", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching", kind: "docs" },
        { label: "RFC 9111: HTTP Caching", url: "https://www.rfc-editor.org/rfc/rfc9111.html", kind: "spec" },
        { label: "Cloudflare Docs: Cache keys", url: "https://developers.cloudflare.com/cache/how-to/cache-keys/", kind: "docs" },
        {
          label: "Amazon CloudFront: Using Origin Shield",
          url: "https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/origin-shield.html",
          kind: "article",
        },
      ],
      video: {
        title: "What Is A CDN? How Does It Work?",
        channel: "ByteByteGo",
        url: "https://www.youtube.com/watch?v=RI9np1LWzqw",
        videoId: "RI9np1LWzqw",
        durationLabel: "4:23",
      },
      alternateVideos: [
        {
          title: "Everything you need to know about HTTP Caching",
          channel: "the roadmap",
          url: "https://www.youtube.com/watch?v=HiBDZgTNpXY",
          videoId: "HiBDZgTNpXY",
          durationLabel: "13:33",
        },
        {
          title: "Cloudflare's 150ms global cache purge | Deep Dive",
          channel: "Hussein Nasser",
          url: "https://www.youtube.com/watch?v=Ou-4rfillYo",
          videoId: "Ou-4rfillYo",
          durationLabel: "1:00:40",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "sd-cdn-edge-q1",
          prompt:
            "A link shortener switches its redirects from 302 to 301 to cut server load. A week later, the click counts in its analytics have dropped sharply while traffic from partners hasn't. Why?",
          options: [
            "A 301 is cacheable by default, so browsers (and CDN edges) reuse the redirect without contacting the service, and those clicks are never logged",
            "Browsers refuse to follow 301 redirects to other domains",
            "301 responses can't carry analytics cookies",
            "Search engines stopped indexing the short links",
          ],
          correctIndex: 0,
          explanation:
            "RFC 9110 makes 301 heuristically cacheable, and browsers keep permanent redirects aggressively. Use 302 or 307 (with `Cache-Control: private, max-age=0` or a short lifetime) when every click must reach you.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "sd-cdn-edge-q2",
          prompt:
            "A campaign landing page has a 12% CDN hit ratio even though its HTML is identical for everyone. Its URLs look like `/spring?utm_source=x&utm_medium=y&fbclid=...`. What's the likely cause?",
          options: [
            "The default cache key includes the full query string, so every tracking-parameter combination is a separate cache entry",
            "CDNs never cache HTML",
            "The TTL is too long",
            "Query strings make responses uncacheable under RFC 9111",
          ],
          correctIndex: 0,
          explanation:
            "Cloudflare's default key, for example, includes the URI with its query string. Strip or ignore marketing parameters in the cache key (the page's analytics script reads them client-side anyway).",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "sd-cdn-edge-q3",
          prompt: "Which responses may a shared CDN cache store, based on their headers alone? (Select all that apply.)",
          options: [
            "`Cache-Control: public, s-maxage=60`",
            "`Cache-Control: max-age=31536000, immutable` on `app.3f9c2e1.js`",
            "`Cache-Control: max-age=86400` on `/logo.svg`",
            "`Cache-Control: private, max-age=300`",
            "`Cache-Control: no-store`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Without `private`, `max-age` applies to shared caches too, and `s-maxage` overrides it for them. `private` forbids shared caches from storing the response, and `no-store` forbids every cache.",
        },
        {
          id: "sd-cdn-edge-q4",
          prompt: "A logged-in dashboard is served with `Cache-Control: public, max-age=300`. What's the risk?",
          options: [
            "The CDN can store one user's dashboard and serve it to other users for five minutes",
            "Users see their own dashboard up to five minutes late, which is harmless",
            "The browser refuses to render pages with `public`",
            "Only the page's images will be cached",
          ],
          correctIndex: 0,
          explanation:
            "If the cache key doesn't include the user, `public` means \"anyone may get this copy\". Personalised responses need `private` (or `no-store`), and it's worth a test that asserts it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "sd-cdn-edge-q5",
          prompt: "Why do build tools fingerprint asset file names (`app.3f9c2e1.js`)?",
          options: [
            "Each deploy produces new URLs, so assets can be cached for a year as `immutable` without ever needing a purge",
            "Fingerprinted files compress better",
            "CDNs only cache files with hashes in their names",
            "It prevents browsers from downloading assets in parallel",
          ],
          correctIndex: 0,
          explanation:
            "Changing the URL is the one invalidation that's instant and reaches every cache, browsers included. The HTML that references the assets gets a short TTL instead.",
        },
        {
          id: "sd-cdn-edge-q6",
          prompt: "A response has `Cache-Control: max-age=60, stale-while-revalidate=300`. How does a cache treat it 2 minutes after it was fetched?",
          options: [
            "It serves the stale copy immediately and revalidates with the origin in the background",
            "It must revalidate with the origin before serving anything",
            "It serves the stale copy and never revalidates",
            "It discards the copy, because it's older than 60 seconds",
          ],
          correctIndex: 0,
          explanation:
            "Between 60 and 360 seconds the response is stale but may be served while a background refresh runs; after 360 seconds the cache must revalidate first. Users get fast responses, and the origin sees one refresh instead of a burst.",
        },
        {
          id: "sd-cdn-edge-q7",
          prompt: "What does `stale-if-error=86400` let a cache do?",
          options: [
            "Serve a stale copy for up to a day when the origin returns an error or can't be reached",
            "Cache error responses for a day",
            "Retry the origin for a day before giving up",
            "Serve stale content for a day regardless of the origin's health",
          ],
          correctIndex: 0,
          explanation:
            "RFC 5861 defines it as a fallback: while the origin is healthy, normal freshness rules apply. It turns an origin outage into slightly old pages instead of error pages.",
        },
        {
          id: "sd-cdn-edge-q8",
          prompt: "What problem does an origin shield solve?",
          options: [
            "It adds a mid-tier cache that every edge location goes through, so a miss across many edges becomes roughly one request to the origin",
            "It encrypts traffic between the CDN and the origin",
            "It blocks DDoS traffic before it reaches the edge",
            "It lets the origin push content to edges before it's requested",
          ],
          correctIndex: 0,
          explanation:
            "Without it, each point of presence misses independently when an object expires. With it, and with request collapsing, the origin serves each object about once per TTL.",
        },
        {
          id: "sd-cdn-edge-q9",
          prompt: "An API response adds `Vary: User-Agent`, and the CDN hit ratio collapses. Why?",
          options: [
            "Every distinct User-Agent string gets its own cache entry, and there are thousands of them",
            "CDNs refuse to cache responses with a `Vary` header",
            "`Vary` disables `s-maxage`",
            "The header makes every response `private`",
          ],
          correctIndex: 0,
          explanation:
            "`Vary` adds the named request headers to the cache key. Vary on something low-cardinality (a normalised device class, `Accept-Encoding`) or not at all.",
        },
        {
          id: "sd-cdn-edge-q10",
          prompt: "What does `Cache-Control: max-age=0, s-maxage=600` do?",
          options: [
            "Browsers treat the response as stale immediately and revalidate, while shared caches such as the CDN keep it fresh for 10 minutes",
            "Nothing caches it, because `max-age=0` overrides everything",
            "Browsers cache it for 10 minutes and the CDN revalidates every time",
            "It's invalid, because the two directives conflict",
          ],
          correctIndex: 0,
          explanation:
            "`s-maxage` applies only to shared caches and overrides `max-age` there. It's the usual way to let the CDN absorb load while keeping browsers current (and purging the CDN on change).",
        },
        {
          id: "sd-cdn-edge-q11",
          prompt: "After an emergency purge of `/pricing` at the CDN, some users still see the old page. What's the most likely reason?",
          options: [
            "Their browsers cached the page under its `max-age`; a CDN purge can't reach browser caches",
            "The purge failed silently everywhere",
            "The CDN re-cached the old version from its own backup",
            "Purges only apply to images",
          ],
          correctIndex: 0,
          explanation:
            "Purges clear the CDN (after propagation), not the copies already in browsers. Keep HTML `max-age` short, or use `s-maxage` for the CDN and a small `max-age` for browsers.",
        },
      ],
    },
    {
      id: "sd-rate-limiter",
      moduleId: "be-system-design",
      trackId: "backend",
      title: "Designing a Rate Limiter",
      summary:
        "A rate limiter protects a service from abuse, runaway clients and noisy neighbours, and enforces product quotas. Decide first what you key on (API key, user or IP; NAT and IPv6 make IPs a poor identity), where you enforce (the edge or API gateway for coarse limits, the service for per-endpoint or cost-based ones), and what happens when the limiter's own store is down. Failing open risks overload; failing closed turns a Redis blip into an outage. Most APIs fail open for quotas and closed for security limits such as login attempts.\n\nThe algorithms trade accuracy, memory and burst behaviour. A fixed-window counter (`INCR` one key per minute) is cheap but lets through up to twice the limit across a window boundary. A sliding-window log stores every timestamp: exact, but memory grows with the limit. A sliding-window counter weights the previous window's count by how much of it still overlaps; across 400 million requests Cloudflare found it wrongly allowed or limited 0.003% of them. A token bucket holds up to `capacity` tokens refilled at a steady rate, so it allows controlled bursts while enforcing an average; a leaky bucket smooths output to a constant rate.\n\nIn a fleet the state must be shared, usually in Redis, and every check is a read-modify-write that has to be atomic. `GET`, compare, then `SET` lets two servers spend the same token; even `INCR` followed by `EXPIRE` leaves a key that never expires if the process dies in between. Run the whole check as one Lua script (or `MULTI`/`EXEC`), tolerate clock skew between app servers or use the store's clock, and give every key a TTL. Rejections return `429 Too Many Requests` with `Retry-After`; the IETF's `RateLimit` and `RateLimit-Policy` header fields, still an Internet-Draft, advertise the remaining quota so clients can slow down early.",
      level: "expert",
      estMinutes: 100,
      isMilestone: true,
      webRefs: [
        { label: "IETF Internet-Draft: RateLimit header fields for HTTP", url: "https://datatracker.ietf.org/doc/draft-ietf-httpapi-ratelimit-headers/", kind: "spec" },
        { label: "Redis Docs: INCR (rate limiter patterns and their race conditions)", url: "https://redis.io/docs/latest/commands/incr/", kind: "docs" },
        { label: "Cloudflare: How we built rate limiting capable of scaling to millions of domains", url: "https://blog.cloudflare.com/counting-things-a-lot-of-different-things/", kind: "article" },
        { label: "Stripe: Scaling your API with rate limiters", url: "https://stripe.com/blog/rate-limiters", kind: "article" },
      ],
      video: {
        title: "Design a Distributed Rate Limiter w/ a Ex-Meta Staff Engineer: System Design Breakdown",
        channel: "Hello Interview",
        url: "https://www.youtube.com/watch?v=MIJFyUPG4Z4",
        videoId: "MIJFyUPG4Z4",
        durationLabel: "55:57",
      },
      alternateVideos: [
        {
          title: "Rate Limiter System Design: Token Bucket, Leaky Bucket, Scaling",
          channel: "ByteByteGo",
          url: "https://www.youtube.com/watch?v=YXkOdWBwqaA",
          videoId: "YXkOdWBwqaA",
          durationLabel: "7:46",
        },
      ],
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Implement `takeToken(store, key, now, policy)`: one token-bucket check, run by whichever app server received the request. Every server shares one Redis-like `store`, so the bucket must live there, and concurrent requests must never spend the same token.\n\nBucket rules (integers only; times in milliseconds):\n\n- `policy` is `{ capacity, refillMs }`: a bucket holds at most `capacity` tokens and gains one every `refillMs`.\n- Store each bucket under `key` as `{ tokens, last }`. A missing bucket starts full: `tokens = capacity`, `last = now`.\n- Refill: `gained = floor(max(0, now - last) / refillMs)`. If `gained > 0`, set `tokens = min(capacity, tokens + gained)` and move `last` forward by `gained * refillMs`, or to `now` if the bucket is now full. A server whose clock is behind (`now < last`) gains nothing and never moves `last` backwards.\n- If `tokens >= 1`, spend one and return `{ allowed: true, remaining: <tokens left>, retryAfter: 0 }`.\n- Otherwise return `{ allowed: false, remaining: 0, retryAfter }`, where `retryAfter = ceil((last + refillMs - now) / 1000)`: the whole seconds until the next token, which is what you'd send in the 429's `Retry-After` header. Rejected requests don't spend anything.\n- Save the bucket either way.\n\nThe store's methods are all async, like network calls:\n\n- `store.get(key)` and `store.set(key, value)`: plain reads and writes.\n- `store.eval(key, fn)`: reads the current value (`undefined` if missing), calls `fn(current)` synchronously, saves the `value` it returns and resolves with its `result`. Nothing else can touch `key` in between, like a Redis Lua script. `fn` must return `{ value, result }`.\n\nThe driver fires requests that share a timestamp concurrently, as if they hit different servers at the same instant. Notice that a `get`, compute, `set` version lets two of them read the same bucket and both spend its last token.",
        starterCode: "/**\n * Token-bucket check for one request, run by any of several app servers that share `store`.\n * @param {{ get: Function, set: Function, eval: Function }} store shared, Redis-like, every call is async\n * @param {string} key bucket key, e.g. \"user:42\"\n * @param {number} now this server's clock, in ms\n * @param {{ capacity: number, refillMs: number }} policy\n * @returns {Promise<{ allowed: boolean, remaining: number, retryAfter: number }>}\n */\nasync function takeToken(store, key, now, policy) {\n  // Your code here\n}\n\n// ---- Test driver (leave as is) ----\nfunction createStore(seed) {\n  const data = new Map(Object.entries(seed ?? {}));\n  const copy = (v) => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));\n  const networkHop = async () => {\n    await null;\n    await null;\n  };\n  return {\n    async get(key) {\n      await networkHop();\n      return copy(data.get(key));\n    },\n    async set(key, value) {\n      await networkHop();\n      data.set(key, copy(value));\n    },\n    // Like a Redis Lua script: read, run fn, write, with nothing interleaved.\n    async eval(key, fn) {\n      await networkHop();\n      const { value, result } = fn(copy(data.get(key)));\n      if (value === undefined) data.delete(key);\n      else data.set(key, copy(value));\n      return copy(result);\n    },\n  };\n}\n\nasync function runLimiter(policy, requests, seed) {\n  const store = createStore(seed);\n  const results = [];\n  for (let i = 0; i < requests.length; ) {\n    let j = i;\n    while (j < requests.length && requests[j].at === requests[i].at) j++;\n    const batch = requests.slice(i, j); // same timestamp = concurrent requests on different servers\n    const answers = await Promise.all(batch.map((r) => takeToken(store, r.key, r.at, policy)));\n    results.push(...answers);\n    i = j;\n  }\n  return results;\n}\n",
        functionName: "runLimiter",
        testCases: [
          {
            description: "a burst spends the bucket, then the next request is rejected",
            args: [{ capacity: 3, refillMs: 1000 }, [{ at: 0, key: "user:1" }, { at: 1, key: "user:1" }, { at: 2, key: "user:1" }, { at: 3, key: "user:1" }]],
            expected: [{ allowed: true, remaining: 2, retryAfter: 0 }, { allowed: true, remaining: 1, retryAfter: 0 }, { allowed: true, remaining: 0, retryAfter: 0 }, { allowed: false, remaining: 0, retryAfter: 1 }],
          },
          {
            description: "tokens come back one per refill interval",
            args: [{ capacity: 3, refillMs: 1000 }, [{ at: 0, key: "user:1" }, { at: 1, key: "user:1" }, { at: 2, key: "user:1" }, { at: 999, key: "user:1" }, { at: 1000, key: "user:1" }, { at: 2500, key: "user:1" }, { at: 2600, key: "user:1" }]],
            expected: [{ allowed: true, remaining: 2, retryAfter: 0 }, { allowed: true, remaining: 1, retryAfter: 0 }, { allowed: true, remaining: 0, retryAfter: 0 }, { allowed: false, remaining: 0, retryAfter: 1 }, { allowed: true, remaining: 0, retryAfter: 0 }, { allowed: true, remaining: 0, retryAfter: 0 }, { allowed: false, remaining: 0, retryAfter: 1 }],
          },
          {
            description: "a long idle refills to capacity, never beyond",
            args: [{ capacity: 3, refillMs: 1000 }, [{ at: 0, key: "user:1" }, { at: 60000, key: "user:1" }, { at: 60001, key: "user:1" }, { at: 60002, key: "user:1" }, { at: 60003, key: "user:1" }]],
            expected: [{ allowed: true, remaining: 2, retryAfter: 0 }, { allowed: true, remaining: 2, retryAfter: 0 }, { allowed: true, remaining: 1, retryAfter: 0 }, { allowed: true, remaining: 0, retryAfter: 0 }, { allowed: false, remaining: 0, retryAfter: 1 }],
          },
          {
            description: "each key has its own bucket",
            args: [{ capacity: 3, refillMs: 1000 }, [{ at: 0, key: "user:1" }, { at: 1, key: "user:1" }, { at: 2, key: "user:1" }, { at: 3, key: "user:1" }, { at: 4, key: "user:2" }]],
            expected: [{ allowed: true, remaining: 2, retryAfter: 0 }, { allowed: true, remaining: 1, retryAfter: 0 }, { allowed: true, remaining: 0, retryAfter: 0 }, { allowed: false, remaining: 0, retryAfter: 1 }, { allowed: true, remaining: 2, retryAfter: 0 }],
          },
          {
            description: "5 concurrent requests from 5 servers with 3 tokens: exactly 3 pass",
            args: [{ capacity: 3, refillMs: 1000 }, [{ at: 0, key: "user:1" }, { at: 0, key: "user:1" }, { at: 0, key: "user:1" }, { at: 0, key: "user:1" }, { at: 0, key: "user:1" }]],
            expected: [{ allowed: true, remaining: 2, retryAfter: 0 }, { allowed: true, remaining: 1, retryAfter: 0 }, { allowed: true, remaining: 0, retryAfter: 0 }, { allowed: false, remaining: 0, retryAfter: 1 }, { allowed: false, remaining: 0, retryAfter: 1 }],
            isEdgeCase: true,
          },
          {
            description: "state lives in the shared store: another server already drained this bucket",
            args: [{ capacity: 3, refillMs: 1000 }, [{ at: 10000, key: "user:1" }, { at: 10500, key: "user:1" }], { "user:1": { tokens: 0, last: 9500 } }],
            expected: [{ allowed: false, remaining: 0, retryAfter: 1 }, { allowed: true, remaining: 0, retryAfter: 0 }],
            isEdgeCase: true,
          },
          {
            description: "Retry-After rounds up to whole seconds",
            args: [{ capacity: 2, refillMs: 30000 }, [{ at: 0, key: "user:1" }, { at: 1, key: "user:1" }, { at: 2, key: "user:1" }, { at: 29000, key: "user:1" }, { at: 29001, key: "user:1" }, { at: 30000, key: "user:1" }]],
            expected: [{ allowed: true, remaining: 1, retryAfter: 0 }, { allowed: true, remaining: 0, retryAfter: 0 }, { allowed: false, remaining: 0, retryAfter: 30 }, { allowed: false, remaining: 0, retryAfter: 1 }, { allowed: false, remaining: 0, retryAfter: 1 }, { allowed: true, remaining: 0, retryAfter: 0 }],
          },
          {
            description: "a server whose clock is behind must not move `last` backwards",
            args: [{ capacity: 3, refillMs: 1000 }, [{ at: 5000, key: "user:1" }, { at: 4000, key: "user:1" }, { at: 5500, key: "user:1" }, { at: 5600, key: "user:1" }]],
            expected: [{ allowed: true, remaining: 2, retryAfter: 0 }, { allowed: true, remaining: 1, retryAfter: 0 }, { allowed: true, remaining: 0, retryAfter: 0 }, { allowed: false, remaining: 0, retryAfter: 1 }],
            isEdgeCase: true,
          },
          {
            description: "rejected requests don't consume tokens or delay the refill",
            args: [{ capacity: 1, refillMs: 1000 }, [{ at: 0, key: "user:1" }, { at: 100, key: "user:1" }, { at: 200, key: "user:1" }, { at: 1000, key: "user:1" }]],
            expected: [{ allowed: true, remaining: 0, retryAfter: 0 }, { allowed: false, remaining: 0, retryAfter: 1 }, { allowed: false, remaining: 0, retryAfter: 1 }, { allowed: true, remaining: 0, retryAfter: 0 }],
            isEdgeCase: true,
          },
          {
            description: "1,000 concurrent requests against a bucket of 10",
            args: [{ capacity: 10, refillMs: 1000 }, Array.from({ length: 1000 }, () => ({ at: 0, key: "ip:10.0.0.1" }))],
            expected: Array.from({ length: 1000 }, (_, i) => (i < 10 ? { allowed: true, remaining: 9 - i, retryAfter: 0 } : { allowed: false, remaining: 0, retryAfter: 1 })),
            isEdgeCase: true,
          },
        ],
      },
    },
    {
      id: "sd-url-shortener",
      moduleId: "be-system-design",
      trackId: "backend",
      title: "Designing a URL Shortener",
      summary:
        "A URL shortener is the classic interview design: simple to state, full of tradeoffs. Start with numbers: say 100 million new links a month and 100 redirects per link created. That's about 40 writes and 4,000 redirects per second on average, several times more at peak, and 6 billion links over five years, about 3 TB at 500 bytes each before replication. Six base62 characters give 62^6 ≈ 56.8 billion codes; seven give about 3.5 trillion. The workload is overwhelmingly reads and redirects are latency-sensitive, so the read path is a cache (or CDN) in front of a key-value lookup.\n\nCode generation is the heart of it. Hashing the long URL and truncating it to 7 characters makes codes deterministic but needs collision checks, and truncation collides sooner than intuition says: by the birthday bound, collisions become likely once you've stored about the square root of the code space, roughly 2 million links for 7 characters. A counter encoded in base62 never collides, but one global counter is a bottleneck and produces sequential, guessable codes. The usual fix leases blocks of IDs to each app server from a central counter (Redis `INCRBY`, a ticket table or ZooKeeper), and can scramble them reversibly if enumeration matters. Custom aliases share the namespace, so the allocator must skip codes an alias has already claimed.\n\nRedirect semantics decide your analytics. A 301 is cacheable by default, so browsers and CDNs may stop asking you, great for load, bad for click counts and hard to change later; a 302 or 307 keeps every click flowing through you. Many services use 302 with a short cache lifetime and log clicks asynchronously, off the redirect's critical path. Add abuse controls (malware checks, creation rate limits), expiry, and a 404 or 410 for deleted links.",
      level: "expert",
      estMinutes: 100,
      isMilestone: true,
      webRefs: [
        { label: "RFC 9110: 301 Moved Permanently (and the other 3xx codes)", url: "https://www.rfc-editor.org/rfc/rfc9110.html#name-301-moved-permanently", kind: "spec" },
        { label: "MDN: 301 Moved Permanently", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/301", kind: "docs" },
        { label: "Hello Interview: Design a URL Shortener Like Bit.ly", url: "https://www.hellointerview.com/learn/system-design/problem-breakdowns/bitly", kind: "article" },
        {
          label: "System Design Primer: Pastebin / Bit.ly solution",
          url: "https://github.com/donnemartin/system-design-primer/blob/master/solutions/system_design/pastebin/README.md",
          kind: "interview-prep",
        },
      ],
      video: {
        title: "Beginner System Design Interview: Design Bitly w/ a Ex-Meta Staff Engineer",
        channel: "Hello Interview",
        url: "https://www.youtube.com/watch?v=iUU4O1sWtJA",
        videoId: "iUU4O1sWtJA",
        durationLabel: "59:30",
      },
      alternateVideos: [
        {
          title: "How Does a URL Shortener Work?",
          channel: "ByteByteGo",
          url: "https://www.youtube.com/watch?v=HHUi8F_qAXM",
          videoId: "HHUi8F_qAXM",
          durationLabel: "6:44",
        },
      ],
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Build the core of a URL shortener: base62 codes, a collision-free ID allocator shared by several app servers, and custom aliases.\n\nBase62 uses `ALPHABET` (provided): `0-9`, then `a-z`, then `A-Z`, so `\"Z\"` is 61 and `\"10\"` is 62.\n\n- `toBase62(n)`: `n` is a non-negative safe integer. Return its canonical encoding: `0` is `\"0\"`, and there are no leading zeros.\n- `fromBase62(s)`: return the number, or `null` if `s` is empty, contains a character outside the alphabet, starts with `0` while being longer than one character (non-canonical: two codes would map to one ID), or decodes to more than `Number.MAX_SAFE_INTEGER`.\n\n`createShortener({ minLength, blockSize })` returns `{ shorten, resolve }`:\n\n- IDs come from one central counter that starts at `62 ** (minLength - 1)`, the smallest number with `minLength` base62 digits, so generated codes are never shorter than that.\n- App servers don't touch the counter on every request. When a server (identified by the `server` string) has no IDs left, it leases the next `blockSize` IDs, `[counter, counter + blockSize)`, and the counter advances by `blockSize`. Each server hands out its own block in order, so codes from different servers interleave.\n- `shorten(url, server)` generates the code for the server's next ID. If an alias already took that code, burn the ID and move to the next one. Store the link and return `{ code }`.\n- `shorten(url, server, alias)`: an alias must be 3–30 base62 characters, otherwise return `{ error: \"invalid alias\" }`. If any link (generated or custom) already uses it, return `{ error: \"alias taken\" }`. Otherwise store it and return `{ code: alias }`. Aliases don't use up IDs.\n- Check the URL first: it must be `http://` or `https://` followed by at least one character, with no whitespace, otherwise return `{ error: \"invalid url\" }`.\n- `resolve(code)` returns the stored URL, or `null`.\n- Shortening the same URL twice creates two codes.\n\nThe driver runs a list of operations (`encode`, `decode`, `shorten`, `resolve`) against one shortener and returns their results.",
        starterCode: "const ALPHABET = \"0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ\";\n\n/**\n * @param {number} n a non-negative safe integer\n * @returns {string} the canonical base62 encoding\n */\nfunction toBase62(n) {\n  // Your code here\n}\n\n/**\n * @param {string} s\n * @returns {number | null} the decoded number, or null if `s` isn't a valid canonical code\n */\nfunction fromBase62(s) {\n  // Your code here\n}\n\n/**\n * @param {{ minLength: number, blockSize: number }} options\n * @returns {{ shorten: Function, resolve: Function }}\n */\nfunction createShortener({ minLength, blockSize }) {\n  // Your code here\n  return {\n    /** @returns {{ code: string } | { error: string }} */\n    shorten(url, server, alias) {},\n    /** @returns {string | null} */\n    resolve(code) {},\n  };\n}\n\n// ---- Test driver (leave as is) ----\nfunction runShortener(options, ops) {\n  const shortener = createShortener(options);\n  return ops.map(([op, ...args]) => {\n    if (op === \"encode\") return toBase62(args[0]);\n    if (op === \"decode\") return fromBase62(args[0]);\n    if (op === \"shorten\") return shortener.shorten(...args);\n    if (op === \"resolve\") return shortener.resolve(args[0]);\n    throw new Error(\"unknown op \" + op);\n  });\n}\n",
        functionName: "runShortener",
        testCases: [
          {
            description: "base62 encodes with digits, then a-z, then A-Z",
            args: [{ minLength: 4, blockSize: 3 }, [["encode", 0], ["encode", 61], ["encode", 62], ["encode", 3844], ["encode", 238328]]],
            expected: ["0", "Z", "10", "100", "1000"],
          },
          {
            description: "decode is the inverse",
            args: [{ minLength: 4, blockSize: 3 }, [["decode", "Z"], ["decode", "10"], ["decode", "ZZZZZZZ"], ["decode", "0"]]],
            expected: [61, 62, 3521614606207, 0],
          },
          {
            description: "decode rejects empty, foreign characters, leading zeros and overflow",
            args: [{ minLength: 4, blockSize: 3 }, [["decode", ""], ["decode", "ab-c"], ["decode", "0abc"], ["decode", "ZZZZZZZZZZ"]]],
            expected: [null, null, null, null],
            isEdgeCase: true,
          },
          {
            description: "round-trips Number.MAX_SAFE_INTEGER and rejects one past it",
            args: [{ minLength: 4, blockSize: 3 }, [["encode", 9007199254740991], ["decode", "FfGNdXsE7"], ["decode", "FfGNdXsE8"]]],
            expected: ["FfGNdXsE7", 9007199254740991, null],
            isEdgeCase: true,
          },
          {
            description: "the counter starts at 62^(minLength-1), so every code has minLength characters",
            args: [{ minLength: 4, blockSize: 3 }, [["shorten", "https://example.com/articles/42", "a"], ["shorten", "https://example.com/articles/42", "a"], ["shorten", "https://example.com/articles/42", "a"], ["resolve", "1001"]]],
            expected: [{ code: "1000" }, { code: "1001" }, { code: "1002" }, "https://example.com/articles/42"],
          },
          {
            description: "each server leases its own block of IDs, so codes interleave across servers",
            args: [{ minLength: 4, blockSize: 3 }, [["shorten", "https://example.com/articles/42", "a"], ["shorten", "https://example.com/articles/42", "b"], ["shorten", "https://example.com/articles/42", "a"], ["shorten", "https://example.com/articles/42", "a"], ["shorten", "https://example.com/articles/42", "a"], ["shorten", "https://example.com/articles/42", "b"]]],
            expected: [{ code: "1000" }, { code: "1003" }, { code: "1001" }, { code: "1002" }, { code: "1006" }, { code: "1004" }],
          },
          {
            description: "custom aliases: stored, resolvable, unique and validated",
            args: [{ minLength: 4, blockSize: 3 }, [["shorten", "https://example.com/articles/42", "a", "promo"], ["resolve", "promo"], ["shorten", "https://other.example", "b", "promo"], ["shorten", "https://example.com/articles/42", "a", "no!"], ["shorten", "https://example.com/articles/42", "a", "ab"]]],
            expected: [{ code: "promo" }, "https://example.com/articles/42", { error: "alias taken" }, { error: "invalid alias" }, { error: "invalid alias" }],
          },
          {
            description: "an alias that equals a future generated code is skipped by the allocator",
            args: [{ minLength: 4, blockSize: 3 }, [["shorten", "https://vip.example", "a", "1001"], ["shorten", "https://example.com/articles/42", "a"], ["shorten", "https://example.com/articles/42", "a"], ["resolve", "1001"], ["resolve", "1002"]]],
            expected: [{ code: "1001" }, { code: "1000" }, { code: "1002" }, "https://vip.example", "https://example.com/articles/42"],
            isEdgeCase: true,
          },
          {
            description: "an alias can't take a code that was already generated",
            args: [{ minLength: 4, blockSize: 3 }, [["shorten", "https://example.com/articles/42", "a"], ["shorten", "https://evil.example", "b", "1000"], ["resolve", "1000"]]],
            expected: [{ code: "1000" }, { error: "alias taken" }, "https://example.com/articles/42"],
            isEdgeCase: true,
          },
          {
            description: "only absolute http(s) URLs without spaces are accepted",
            args: [{ minLength: 4, blockSize: 3 }, [["shorten", "ftp://files.example.com/x", "a"], ["shorten", "https://", "a"], ["shorten", "example.com/page", "a"], ["shorten", "https://ok.example/a b", "a"]]],
            expected: [{ error: "invalid url" }, { error: "invalid url" }, { error: "invalid url" }, { error: "invalid url" }],
            isEdgeCase: true,
          },
          {
            description: "unknown and non-canonical codes resolve to null",
            args: [{ minLength: 4, blockSize: 3 }, [["shorten", "https://example.com/articles/42", "a"], ["resolve", "zzzz"], ["resolve", "01000"]]],
            expected: [{ code: "1000" }, null, null],
            isEdgeCase: true,
          },
          {
            description: "minLength 1 and blockSize 1: every shorten leases a fresh ID",
            args: [{ minLength: 1, blockSize: 1 }, [["shorten", "https://example.com/articles/42", "a"], ["shorten", "https://example.com/articles/42", "b"], ["shorten", "https://example.com/articles/42", "a"]]],
            expected: [{ code: "1" }, { code: "2" }, { code: "3" }],
          },
          {
            description: "minLength 7 starts at 62^6 = 56,800,235,584",
            args: [{ minLength: 7, blockSize: 1000 }, [["shorten", "https://example.com/articles/42", "api-1"], ["shorten", "https://example.com/articles/42", "api-2"], ["shorten", "https://example.com/articles/42", "api-1"]]],
            expected: [{ code: "1000000" }, { code: "10000g8" }, { code: "1000001" }],
          },
        ],
      },
    },
  ],
} satisfies Module;
