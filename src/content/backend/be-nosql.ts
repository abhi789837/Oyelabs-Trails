import type { Module } from "@/types/curriculum";

// Shared fixture for the aggregation pipeline challenge.
const orders = [
  { _id: 1, customer: { name: "Ada", city: "Pune" }, status: "paid", total: 120, items: ["kb", "mouse"], tags: ["sale"] },
  { _id: 2, customer: { name: "Bo", city: "Delhi" }, status: "paid", total: 80, items: ["monitor"], coupon: null },
  { _id: 3, customer: { name: "Cy", city: "Pune" }, status: "refunded", total: 200, items: [], tags: ["sale", "vip"] },
  { _id: 4, customer: { name: "Di", city: "Delhi" }, status: "paid", total: "n/a", items: ["kb"], coupon: "SPRING" },
  { _id: 5, customer: { name: "Ed", city: "Pune" }, status: "pending", items: ["cable", "kb"] },
];

export default {
  id: "be-nosql",
  trackId: "backend",
  name: "NoSQL & Caching",
  description:
    "Document databases and caches as engineering decisions rather than defaults: MongoDB schema design around access patterns, Mongoose, the aggregation pipeline, when a relational database is the better choice, Redis as a cache and session store, and the genuinely hard part, keeping caches correct and the database alive under concurrency. Examples use MongoDB 8 and Redis 8.",
  refs: [
    { label: "MongoDB: Documentation", url: "https://www.mongodb.com/docs/", kind: "docs" },
    { label: "Redis: Documentation", url: "https://redis.io/docs/latest/", kind: "docs" },
  ],
  topics: [
    {
      id: "nosql-document-modeling",
      moduleId: "be-nosql",
      trackId: "backend",
      title: "Document Modeling in MongoDB: Embed vs Reference",
      summary:
        "Relational modeling starts from the data and normalizes it; document modeling starts from the queries. MongoDB's guidance is that data accessed together should be stored together, because the document is the unit of atomicity and retrieval: a single-document write is atomic without a transaction, and one read can return an order with its line items and shipping address. The decision per relationship is embed or reference. Embed when the child is owned by the parent, read with it, and bounded in size (an order's items, a user's two addresses). Reference when it's unbounded, shared, updated independently or queried on its own (comments on a viral post, products that appear in many orders).\n\nThe hard limit is 16 MiB per BSON document, but the practical limit arrives much sooner: an ever-growing array (the unbounded array anti-pattern) makes every read of the parent fetch data it doesn't need and bloats multikey indexes. The standard patterns: subset (embed the latest 10 reviews, reference the rest), extended reference (copy the author's name into each post and accept updating many posts on a rename), bucket (group readings per device per hour, which time series collections now do natively), computed (store a maintained total), and schema versioning (a `schemaVersion` field so old and new shapes coexist during a migration).\n\nDuplication is a tradeoff, not a sin: each copied field buys a faster read with a fan-out update and a window of staleness, so copy fields that rarely change. Mind the indexing quirks too: an index on an array field is multikey (one entry per element), and a compound index can't include two array-valued fields of the same document.",
      level: "advanced",
      estMinutes: 50,
      webRefs: [
        { label: "MongoDB docs: Data Modeling", url: "https://www.mongodb.com/docs/manual/data-modeling/", kind: "docs" },
        { label: "MongoDB docs: Avoid Unbounded Arrays", url: "https://www.mongodb.com/docs/manual/data-modeling/design-antipatterns/unbounded-arrays/", kind: "docs" },
        { label: "MongoDB docs: MongoDB Limits and Thresholds", url: "https://www.mongodb.com/docs/manual/reference/limits/", kind: "docs" },
        { label: "MongoDB blog: Building With Patterns: A Summary", url: "https://www.mongodb.com/company/blog/building-with-patterns-a-summary", kind: "article" },
      ],
      video: {
        title: "MongoDB with Python Crash Course - Tutorial for Beginners",
        channel: "freeCodeCamp.org",
        url: "https://www.youtube.com/watch?v=E-1xI85Zog8",
        videoId: "E-1xI85Zog8",
        durationLabel: "1:57:34",
        startSeconds: 782,
        chapterLabel: "Data modeling",
      },
      alternateVideos: [
        {
          title: "MongoDB Data Modeling and Schema Fundamentals | From Relational to Document Model",
          channel: "MongoDB",
          url: "https://www.youtube.com/watch?v=hmGz79ae2AY",
          videoId: "hmGz79ae2AY",
          durationLabel: "7:26",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "nosql-document-modeling-q1",
          prompt:
            "A blog stores comments as an array inside each post document. One post goes viral and collects 400,000 comments. What's the right model?",
          options: [
            "Move comments to their own collection with an indexed `postId`, optionally embedding the latest few in the post (the subset pattern)",
            "Keep embedding: MongoDB documents can grow without limit",
            "Split the post into several documents named `post_1`, `post_2` and so on",
            "Store all the comments as one large string field",
          ],
          correctIndex: 0,
          explanation:
            "An unbounded array eventually hits the 16 MiB limit, and long before that every read of the post drags all the comments along and the multikey index balloons. Referencing plus a small embedded subset keeps the common read (the post and its recent comments) to one document.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "nosql-document-modeling-q2",
          prompt: "What happens when an update would grow a document past 16 MiB?",
          options: [
            "The write fails with an error and the document is left unchanged",
            "MongoDB splits the document into chunks automatically",
            "The oldest array elements are trimmed silently",
            "The document is converted to GridFS",
          ],
          correctIndex: 0,
          explanation:
            "The BSON size limit is enforced on every write. GridFS exists for storing large files, but you have to use it deliberately; nothing converts documents automatically.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "nosql-document-modeling-q3",
          prompt:
            "Which are genuine advantages of embedding an order's line items in the order document? (Select all that apply.)",
          options: [
            "The order and its items come back in one read, with no `$lookup`",
            "Updating the order and its items together is atomic without a multi-document transaction",
            "Line items shared by many orders can be updated in one place",
            "The document can grow without limit",
            "Each line item gets its own index automatically",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "Single-document reads and writes are the payoff. Shared data is exactly what embedding makes expensive (every copy must be updated), the 16 MiB limit still applies, and embedded fields are only indexed if you create an index on their path.",
        },
        {
          id: "nosql-document-modeling-q4",
          prompt:
            "Posts store a copy of the author's display name (the extended reference pattern) so feeds don't need a `$lookup`. What are you signing up for?",
          options: [
            "When an author renames themselves, you must update every post they wrote or accept stale names, so copy only fields that rarely change",
            "Nothing: MongoDB keeps the copies in sync automatically",
            "Every feed read now needs a multi-document transaction",
            "The author document can no longer be updated",
          ],
          correctIndex: 0,
          explanation:
            "Denormalization moves cost from reads to writes and introduces a staleness window. It's a good trade for fields that change rarely and are read constantly, and a bad one for volatile data such as counters or statuses.",
        },
        {
          id: "nosql-document-modeling-q5",
          prompt:
            "A collection has an index on `{ tags: 1, categories: 1 }`. You insert a document where both `tags` and `categories` are arrays. What happens?",
          options: [
            "The insert fails: a compound multikey index allows at most one array-valued indexed field per document",
            "It succeeds, and the index stores every tag and category combination",
            "It succeeds, but only the first element of each array is indexed",
            "It succeeds, and MongoDB silently drops the index",
          ],
          correctIndex: 0,
          explanation:
            "Indexing the cross product of two arrays could explode, so MongoDB refuses these parallel arrays in one compound index. Index the fields separately or model one of them differently.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "nosql-document-modeling-q6",
          prompt: "What does `db.posts.find({ tags: 'mongodb' })` match when `tags` is an array?",
          options: [
            "Documents whose `tags` array contains `'mongodb'` as an element (or whose `tags` is exactly `'mongodb'`)",
            "Only documents where `tags` equals the array `['mongodb']` exactly",
            "Nothing, because array fields need `$elemMatch` for every query",
            "Documents whose first `tags` element is `'mongodb'`",
          ],
          correctIndex: 0,
          explanation:
            "Equality on an array field matches any element. Querying with an array value (`{ tags: ['a', 'b'] }`) matches the whole array exactly, order included, and `$elemMatch` applies several conditions to the same element.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "nosql-document-modeling-q7",
          prompt:
            "Devices send a reading every second. Which model avoids both one ever-growing document per device and one tiny document per reading?",
          options: [
            "A time series collection, or the bucket pattern: one document per device per hour holding that hour's readings",
            "One document per device with every reading in an array",
            "One collection per device",
            "Readings encoded into the device document's `_id`",
          ],
          correctIndex: 0,
          explanation:
            "Buckets bound document size and cut index entries by orders of magnitude. MongoDB's native time series collections apply the same bucketing for you.",
        },
        {
          id: "nosql-document-modeling-q8",
          prompt: "What does an ObjectId `_id` reveal, and what's a common consequence?",
          options: [
            "It starts with a 4-byte creation timestamp in seconds, so sorting by `_id` roughly follows insertion order and anyone holding an id can read when it was created",
            "Nothing: it's 12 random bytes",
            "The id of the server that created it, which clients use to route queries",
            "An auto-incrementing counter, so ids are gap-free",
          ],
          correctIndex: 0,
          explanation:
            "An ObjectId is a timestamp, a per-process random value and a counter. Don't treat ids as secret or unguessable, and don't rely on `_id` order being exact across machines.",
        },
        {
          id: "nosql-document-modeling-q9",
          prompt: "Which relationships are usually better referenced than embedded? (Select all that apply.)",
          options: [
            "Products that appear in many orders",
            "Comments on posts with no upper bound on their number",
            "Users who belong to many groups, where groups have many users",
            "A user's two shipping addresses",
            "An order's line items",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Reference data that's shared, unbounded or queried on its own; embed data that's owned, bounded and read together. Many-to-many relationships usually keep an array of ids on one side (if bounded) or a separate membership collection.",
        },
        {
          id: "nosql-document-modeling-q10",
          prompt:
            "A team says MongoDB lets them skip schema design because it's schemaless. What's the more accurate view?",
          options: [
            "The schema moves into application code and the data itself: you still need validation (such as `$jsonSchema`), a versioning strategy like a `schemaVersion` field, and migrations for old documents",
            "MongoDB infers a schema from the first document and enforces it",
            "Without a declared schema, queries can't use indexes",
            "Schemaless means documents can't be changed after they're inserted",
          ],
          correctIndex: 0,
          explanation:
            "Flexible schemas make evolution cheaper, not unnecessary. Every reader has to cope with every shape that has ever been written, so shapes need to be deliberate and versioned.",
        },
      ],
    },
    {
      id: "nosql-mongoose-schemas",
      moduleId: "be-nosql",
      trackId: "backend",
      title: "Mongoose Schemas, Validation & Middleware",
      summary:
        "Mongoose gives MongoDB, which accepts any document shape, an application-side schema: type casting, validation, defaults, middleware (hooks), virtuals, and `populate()` for references. It's the right layer for business rules that need application context. It is not a guarantee: anything that writes without going through the model (another service, a script, the shell, an update query without validators) skips it. For invariants that must always hold, add server-side `$jsonSchema` validation and real unique indexes.\n\nThe sharp edges are documented and still bite. Validation runs on `save()` as the first `pre('save')` hook, so a later hook can write invalid data. Update validators are off by default: `findOneAndUpdate`, `updateOne` and `updateMany` skip validation unless you pass `runValidators: true`, and even then they only check the paths being updated, for a limited set of operators. `unique: true` isn't a validator but an index declaration, so duplicates surface as E11000 errors from the server, and only once the index exists. Casting happens before validation: `'42'` becomes `42`, while a malformed id passed to `findById` rejects with a `CastError`. And with `strictQuery: true`, a filter on a path that isn't in the schema (a typo) is silently removed, so `deleteMany({ emial: x })` becomes `deleteMany({})`.\n\nOn performance, `populate()` runs one extra query per populated path (using `$in`), an application-side join rather than an N+1, and `.lean()` returns plain objects several times smaller than documents, at the cost of getters, virtuals and `save()`. Mongoose 9 (November 2025) removed `next()` from pre middleware in favour of async functions and deprecates `new: true` in favour of `returnDocument: 'after'`.",
      level: "intermediate",
      estMinutes: 50,
      webRefs: [
        { label: "Mongoose docs: Validation", url: "https://mongoosejs.com/docs/validation.html", kind: "docs" },
        { label: "Mongoose docs: Middleware", url: "https://mongoosejs.com/docs/middleware.html", kind: "docs" },
        { label: "MongoDB docs: Schema Validation", url: "https://www.mongodb.com/docs/manual/core/schema-validation/", kind: "docs" },
        { label: "Mongoose docs: Faster Mongoose Queries With Lean", url: "https://mongoosejs.com/docs/tutorials/lean.html", kind: "docs" },
      ],
      video: {
        title: "Mongoose Crash Course - Beginner Through Advanced",
        channel: "Web Dev Simplified",
        url: "https://www.youtube.com/watch?v=DZBGEVgL2eE",
        videoId: "DZBGEVgL2eE",
        durationLabel: "33:35",
      },
      alternateVideos: [
        {
          title: "MongoDB Full Tutorial w/ Node.js, Express, & Mongoose",
          channel: "freeCodeCamp.org",
          url: "https://www.youtube.com/watch?v=4yqu8YF29cU",
          videoId: "4yqu8YF29cU",
          durationLabel: "1:15:17",
          startSeconds: 659,
          chapterLabel: "3. Profile Schema",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "nosql-mongoose-schemas-q1",
          prompt:
            "The schema declares `email: { type: String, unique: true }`. Two concurrent requests create users with the same email. What happens?",
          options: [
            "If the unique index exists, the second insert fails with a duplicate key error (E11000) from MongoDB; `unique` isn't a Mongoose validator",
            "Mongoose validation rejects the second document before it's sent",
            "Both are saved, and Mongoose removes the duplicate later",
            "The second document silently overwrites the first",
          ],
          correctIndex: 0,
          explanation:
            "`unique` only tells Mongoose to build a unique index. Until that index exists (or if building it failed because duplicates were already present), nothing stops duplicates. Handle E11000 explicitly and map it to a 409.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "nosql-mongoose-schemas-q2",
          prompt:
            "The schema has `age: { type: Number, min: 0 }`. What does this do?\n\n```js\nawait User.findOneAndUpdate({ _id: id }, { age: -5 });\n```",
          options: [
            "It saves `age: -5`, because update validators are off by default; pass `runValidators: true`",
            "It throws a `ValidationError`",
            "It silently clamps the value to 0",
            "It ignores the update because `age` fails validation",
          ],
          correctIndex: 0,
          explanation:
            "Validation runs on `save()`. `findOneAndUpdate`, `updateOne` and `updateMany` skip it unless `runValidators: true` is set, and even then only the paths in the update are checked.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "nosql-mongoose-schemas-q3",
          prompt:
            "A `pre('save')` hook normalizes `username`, and a bug sets it to an empty string. The schema says `username: { type: String, required: true }`. Is the empty username rejected?",
          options: [
            "No: validation runs as the first `pre('save')` hook, so changes made by later hooks aren't validated",
            "Yes: validation always runs after every hook",
            "Yes: `required` is enforced by MongoDB itself",
            "No: `required` doesn't apply to strings",
          ],
          correctIndex: 0,
          explanation:
            "The Mongoose docs say so explicitly. Put normalization in setters or `pre('validate')` hooks, which run before validation.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "nosql-mongoose-schemas-q4",
          prompt: "Which pre-save hook is written correctly for Mongoose 9?",
          options: [
            "`schema.pre('save', async function () { this.slug = slugify(this.title); })`",
            "`schema.pre('save', function (next) { this.slug = slugify(this.title); next(); })`, where calling `next()` is required",
            "`schema.pre('save', (next) => { this.slug = slugify(this.title); next(); })`",
            "`schema.pre('save', function (done, next) { next(); })`",
          ],
          correctIndex: 0,
          explanation:
            "Mongoose 9 removed `next()` from pre middleware: use a normal or async function and throw (or reject) to abort. Arrow functions never work here, because `this` must be the document.",
        },
        {
          id: "nosql-mongoose-schemas-q5",
          prompt: "How many queries does `Post.find().limit(20).populate('author')` send to MongoDB?",
          options: [
            "Two: one for the posts, then one `find` on users with `_id: { $in: [...] }`",
            "21: one per post",
            "One: `populate` is a server-side join",
            "Three: posts, authors and a count",
          ],
          correctIndex: 0,
          explanation:
            "`populate` is an application-side join batched per path, so it isn't an N+1, but each populated path (and each nested populate) adds a round trip. For a server-side join, use `$lookup` in an aggregation.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "nosql-mongoose-schemas-q6",
          prompt: "What does `.lean()` change about a query's results? (Select all that apply.)",
          options: [
            "They're plain JavaScript objects instead of Mongoose documents, several times smaller in memory",
            "Getters, setters and virtuals don't run by default",
            "The results have no `save()` method or change tracking",
            "The query no longer goes to MongoDB",
            "Mongoose caches the results in memory for the next identical query",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Lean skips hydrating documents, which suits read-only endpoints where you'd only serialize the result anyway. The query still runs on the server every time; Mongoose has no result cache.",
        },
        {
          id: "nosql-mongoose-schemas-q7",
          prompt:
            "The schema uses `strictQuery: true`. What does `User.deleteMany({ emial: 'old@example.com' })` (note the typo) do?",
          options: [
            "Deletes every user: the unknown path is stripped from the filter, leaving `{}`",
            "Throws a `StrictModeError`",
            "Deletes nothing, because no document has an `emial` field",
            "Deletes only the first matching user",
          ],
          correctIndex: 0,
          explanation:
            "With `strictQuery: true`, Mongoose silently removes filter paths that aren't in the schema, so the query can match far more than intended. With `strictQuery: false` the typo reaches the server and matches nothing, and `strictQuery: 'throw'` raises an error, the safest setting for destructive operations.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "nosql-mongoose-schemas-q8",
          prompt:
            "Every write in your service goes through Mongoose models. Why add MongoDB's server-side `$jsonSchema` validation as well?",
          options: [
            "Because not every write does: other services, scripts, the shell and updates without validators bypass Mongoose, while server-side validation applies to every client",
            "Because Mongoose can't validate required fields",
            "Because `$jsonSchema` makes queries faster",
            "Because Mongoose disables validation in production",
          ],
          correctIndex: 0,
          explanation:
            "Application validation is where rich, contextual rules live; database validation is the backstop that holds no matter who writes. Its `validationLevel` controls whether existing invalid documents are checked on update.",
        },
        {
          id: "nosql-mongoose-schemas-q9",
          prompt: "What happens with `User.findById('not-an-objectid')` when `_id` is an ObjectId?",
          options: [
            "The query rejects with a `CastError` before anything is sent to MongoDB",
            "It returns `null`",
            "It returns every user, because the invalid filter is dropped",
            "MongoDB converts the string to an ObjectId automatically and finds nothing",
          ],
          correctIndex: 0,
          explanation:
            "Casting happens before the query runs. Route handlers that take ids from URLs should validate them, or map `CastError` to a 400 or 404, instead of letting it surface as a 500.",
        },
        {
          id: "nosql-mongoose-schemas-q10",
          prompt:
            "In Mongoose 9, what does `findOneAndUpdate` return by default, and how do you get the updated document?",
          options: [
            "The document as it was before the update; pass `returnDocument: 'after'` (the older `new: true` option is deprecated in 9)",
            "The updated document",
            "Only the number of modified documents",
            "`undefined` unless you call `.exec()`",
          ],
          correctIndex: 0,
          explanation:
            "Returning the pre-update document is MongoDB's default. Code that forgets the option sends stale data back to clients; Mongoose 9 points everyone to `returnDocument`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },
    {
      id: "nosql-aggregation-pipeline",
      moduleId: "be-nosql",
      trackId: "backend",
      title: "The Aggregation Pipeline",
      summary:
        "The aggregation pipeline is MongoDB's query language for anything beyond filtering: documents flow through stages, each transforming the stream (`$match` filters, `$project`/`$set` reshape, `$unwind` flattens arrays, `$group` aggregates, `$sort`/`$limit` order and cut, `$lookup` joins another collection, `$facet` runs several sub-pipelines over the same input). It behaves more like a Unix pipe than like SQL: stage order is both semantics and performance.\n\nOnly the start of a pipeline can use indexes, so `$match` and `$sort` go first. The optimizer moves filters ahead of projections when it can, coalesces `$sort` + `$limit` into a top-k sort, and folds an `$unwind` into the preceding `$lookup`, but it can't rescue a `$match` on fields computed by `$group`, and a `$facet` placed first scans the whole collection. `$lookup` is a left outer join executed per input document, so the foreign field needs an index, and it's the signal to ask whether the data should have been embedded. `$group` and `$sort` are blocking stages with a 100 MB memory limit per stage; since MongoDB 6.0 they spill to disk by default (`allowDiskUseByDefault`), which is slower but doesn't fail. Every output document must still fit in 16 MiB, which is what breaks a `$facet` or a `$push` over huge groups.\n\nThe semantics differ from SQL in ways that produce silent bugs. `$group` over zero input documents emits nothing (SQL returns one row with `count` 0). `{ field: null }` matches documents where the field is missing as well as null. Equality against an array field matches if any element matches. `$sum` and `$avg` ignore non-numeric values. And `$unwind` drops documents whose array is missing or empty unless you pass `preserveNullAndEmptyArrays`. The challenge makes you implement exactly those rules.",
      level: "advanced",
      estMinutes: 70,
      webRefs: [
        { label: "MongoDB docs: Aggregation Pipeline", url: "https://www.mongodb.com/docs/manual/core/aggregation-pipeline/", kind: "docs" },
        { label: "MongoDB docs: Aggregation Pipeline Optimization", url: "https://www.mongodb.com/docs/manual/core/aggregation-pipeline-optimization/", kind: "docs" },
        { label: "MongoDB docs: Aggregation Pipeline Limits", url: "https://www.mongodb.com/docs/manual/core/aggregation-pipeline-limits/", kind: "docs" },
        { label: "Paul Done: Practical MongoDB Aggregations (free book)", url: "https://www.practical-mongodb-aggregations.com/", kind: "article" },
      ],
      video: {
        title: "Master MongoDB Aggregation Pipeline: $match, $unwind, $group, $project",
        channel: "MongoDB",
        url: "https://www.youtube.com/watch?v=acvyf-Im-NU",
        videoId: "acvyf-Im-NU",
        durationLabel: "5:19",
      },
      alternateVideos: [
        {
          title: "Learn Mongodb aggregation pipelines",
          channel: "Chai aur Code",
          url: "https://www.youtube.com/watch?v=fDTf1mk-jQg",
          videoId: "fDTf1mk-jQg",
          durationLabel: "36:44",
        },
      ],
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Implement `aggregate(docs, pipeline)` for a subset of MongoDB's aggregation stages. Return a new array and never mutate the input documents. Paths such as `\"customer.city\"` walk nested objects (not arrays); a field that isn't there is missing.\n\n- `{ $match: filter }`: every key in `filter` is a path, and all conditions must hold. A plain value means equality; an object of operators may use `$eq`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte`, `$in` and `$exists`. Mongo rules apply: equality with `null` also matches a missing field; when the field holds an array, equality and `$in` match if any element matches; `$ne` is the negation of equality, so it matches missing fields; `$gt`, `$gte`, `$lt` and `$lte` only match when field and operand are both numbers or both strings; `$exists: true` means present, even if `null`.\n- `{ $group: { _id, field: { accumulator: expr } } }`: an expression is a `\"$path\"` string or a constant (such as `null` or `1`); `_id` may also be an object of `\"$path\"` expressions. A missing path evaluates to `null`. Accumulators: `$sum` adds numeric values and ignores everything else (`$sum: 1` counts documents); `$avg` averages numeric values (`null` if there are none); `$min` and `$max` ignore `null` and missing values (`null` if nothing is left); `$push` collects values in input order. Output one document per group, `{ _id, ...fields }`, in order of first appearance. No input documents means no output documents.\n- `{ $sort: { path: 1 or -1, ... } }`: keys in priority order; stable for ties; ascending order puts `null` and missing first, then numbers, then strings.\n- `{ $skip: n }` and `{ $limit: n }`.\n- `{ $unwind: \"$path\" }`: one output document per array element, with the field replaced by that element. Documents where the field is missing, `null` or `[]` are dropped; a non-array value passes through unchanged.\n- `{ $project: spec }` with top-level field names: `1` or `true` includes a field (skipped if missing), a `\"$path\"` string computes one (skipped if missing), `0` or `false` excludes one. `_id` is kept unless it's set to `0`. Excluding a field other than `_id` can't be mixed with inclusions or computed fields: throw an `Error`.\n- Any other stage or operator throws an `Error`.\n\nThe tests call `runPipeline(docs, pipeline)`, which returns `{ docs, inputUnchanged }`, or `{ threw: true }` if `aggregate` throws. Leave the driver as it is.",
        starterCode: `/**
 * @param {object[]} docs
 * @param {object[]} pipeline
 * @returns {object[]}
 */
function aggregate(docs, pipeline) {
  // Your code here
}

// ---- Test driver (leave as is) ----
function runPipeline(docs, pipeline) {
  const before = JSON.stringify(docs);
  let out;
  try {
    out = aggregate(docs, pipeline);
  } catch (e) {
    return { threw: true };
  }
  return {
    docs: out === undefined ? null : JSON.parse(JSON.stringify(out)),
    inputUnchanged: JSON.stringify(docs) === before,
  };
}
`,
        functionName: "runPipeline",
        testCases: [
          {
            description: "$match, $group and $sort: paid revenue per city ($sum skips the non-numeric total)",
            args: [
              orders,
              [
                { $match: { status: "paid" } },
                { $group: { _id: "$customer.city", revenue: { $sum: "$total" }, orders: { $sum: 1 } } },
                { $sort: { revenue: -1 } },
              ],
            ],
            expected: {
              docs: [
                { _id: "Pune", revenue: 120, orders: 1 },
                { _id: "Delhi", revenue: 80, orders: 2 },
              ],
              inputUnchanged: true,
            },
          },
          {
            description: "equality against an array field matches any element",
            args: [orders, [{ $match: { tags: "sale" } }, { $project: { _id: 1 } }]],
            expected: { docs: [{ _id: 1 }, { _id: 3 }], inputUnchanged: true },
          },
          {
            description: "$unwind, $group, multi-key $sort and $limit: top items",
            args: [
              orders,
              [
                { $unwind: "$items" },
                { $group: { _id: "$items", n: { $sum: 1 } } },
                { $sort: { n: -1, _id: 1 } },
                { $limit: 2 },
              ],
            ],
            expected: {
              docs: [
                { _id: "kb", n: 3 },
                { _id: "cable", n: 1 },
              ],
              inputUnchanged: true,
            },
          },
          {
            description: "_id: null groups everything; $avg and $sum ignore non-numeric and missing values",
            args: [
              orders,
              [{ $group: { _id: null, avgTotal: { $avg: "$total" }, sumTotal: { $sum: "$total" }, n: { $sum: 1 } } }],
            ],
            expected: { docs: [{ _id: null, avgTotal: 400 / 3, sumTotal: 400, n: 5 }], inputUnchanged: true },
          },
          {
            description: "$min and $max ignore null and missing values, and give null when nothing is left",
            args: [
              [{ g: "a", v: 3 }, { g: "a", v: null }, { g: "a" }, { g: "a", v: 7 }, { g: "b" }],
              [{ $group: { _id: "$g", lo: { $min: "$v" }, hi: { $max: "$v" } } }],
            ],
            expected: {
              docs: [
                { _id: "a", lo: 3, hi: 7 },
                { _id: "b", lo: null, hi: null },
              ],
              inputUnchanged: true,
            },
          },
          {
            description: "a composite _id, $push and a numeric $gt (which skips the string total)",
            args: [
              orders,
              [
                { $match: { total: { $gt: 50 } } },
                { $group: { _id: { city: "$customer.city", status: "$status" }, ids: { $push: "$_id" } } },
              ],
            ],
            expected: {
              docs: [
                { _id: { city: "Pune", status: "paid" }, ids: [1] },
                { _id: { city: "Delhi", status: "paid" }, ids: [2] },
                { _id: { city: "Pune", status: "refunded" }, ids: [3] },
              ],
              inputUnchanged: true,
            },
          },
          {
            description: "$in against an array field matches if any element is in the list",
            args: [orders, [{ $match: { items: { $in: ["monitor", "cable"] } } }, { $project: { _id: 1 } }]],
            expected: { docs: [{ _id: 2 }, { _id: 5 }], inputUnchanged: true },
          },
          {
            description: "$project with a computed path and _id: 0",
            args: [orders, [{ $match: { "customer.city": "Delhi" } }, { $project: { _id: 0, name: "$customer.name", total: 1 } }]],
            expected: {
              docs: [
                { name: "Bo", total: 80 },
                { name: "Di", total: "n/a" },
              ],
              inputUnchanged: true,
            },
          },
          {
            description: "$group over zero documents returns nothing (not a zero-count document)",
            args: [orders, [{ $match: { status: "cancelled" } }, { $group: { _id: null, n: { $sum: 1 } } }]],
            expected: { docs: [], inputUnchanged: true },
            isEdgeCase: true,
          },
          {
            description: "{ field: null } matches missing fields as well as null",
            args: [orders, [{ $match: { coupon: null } }, { $project: { _id: 1 } }]],
            expected: { docs: [{ _id: 1 }, { _id: 2 }, { _id: 3 }, { _id: 5 }], inputUnchanged: true },
            isEdgeCase: true,
          },
          {
            description: "$exists: true counts a field set to null as present",
            args: [orders, [{ $match: { coupon: { $exists: true } } }, { $project: { _id: 1 } }]],
            expected: { docs: [{ _id: 2 }, { _id: 4 }], inputUnchanged: true },
            isEdgeCase: true,
          },
          {
            description: "$sort puts missing first, then numbers, then strings; $skip and $limit apply after",
            args: [orders, [{ $sort: { total: 1 } }, { $skip: 1 }, { $limit: 3 }, { $project: { _id: 1 } }]],
            expected: { docs: [{ _id: 2 }, { _id: 1 }, { _id: 3 }], inputUnchanged: true },
            isEdgeCase: true,
          },
          {
            description: "$unwind drops missing, null and empty arrays, passes scalars through, and doesn't mutate input",
            args: [
              [{ _id: 1, t: ["a", "b"] }, { _id: 2, t: "c" }, { _id: 3 }, { _id: 4, t: null }, { _id: 5, t: [] }],
              [{ $unwind: "$t" }],
            ],
            expected: {
              docs: [
                { _id: 1, t: "a" },
                { _id: 1, t: "b" },
                { _id: 2, t: "c" },
              ],
              inputUnchanged: true,
            },
            isEdgeCase: true,
          },
          {
            description: "mixing inclusion and exclusion in $project throws",
            args: [orders, [{ $project: { total: 1, items: 0 } }]],
            expected: { threw: true },
            isEdgeCase: true,
          },
          {
            description: "an unsupported stage throws",
            args: [orders, [{ $lookup: { from: "customers", localField: "cid", foreignField: "_id", as: "c" } }]],
            expected: { threw: true },
            isEdgeCase: true,
          },
        ],
      },
    },
    {
      id: "nosql-sql-vs-nosql",
      moduleId: "be-nosql",
      trackId: "backend",
      title: "SQL vs NoSQL: Making the Architectural Decision",
      summary:
        "\"SQL vs NoSQL\" is really several separate questions: what shape your data and queries have, which consistency guarantees each operation needs, how you'll scale, and what your team can operate at 3 a.m. Relational databases win when data is highly connected and queried in ways you can't predict yet (ad-hoc reporting, new features joining old tables), when invariants span many rows (money, inventory, bookings), and when you want the database to enforce constraints. PostgreSQL's `jsonb` also covers much of the document use case, so \"we need flexible fields\" alone rarely justifies a second database.\n\nDocument stores like MongoDB win when access patterns are known and aggregate-shaped (fetch an order with its items in one read), when the shape varies per record or evolves quickly, and when horizontal scaling through sharding is a requirement rather than a hope. Key-value and wide-column stores (DynamoDB, Cassandra) trade query flexibility for predictable latency at very large scale: tables are designed around the queries up front, and a new access pattern can mean a new index or a data migration. Graph databases fit deep relationship traversal; search engines and caches complement a primary store rather than replace it.\n\nThe consistency gap is narrower than the folklore. MongoDB has multi-document ACID transactions (replica sets since 4.0, sharded clusters since 4.2) and, since 5.0, a default write concern of `majority` in most deployments; but reads default to the `local` read concern, secondary reads can be stale, and many NoSQL systems are eventually consistent by default, so a read right after a write can miss it. Meanwhile a relational database at READ COMMITTED allows lost updates. Decide per operation from the guarantees it needs, test with your real access patterns, and prefer the boring option your team already knows how to run.",
      level: "advanced",
      estMinutes: 45,
      webRefs: [
        { label: "MongoDB docs: Transactions", url: "https://www.mongodb.com/docs/manual/core/transactions/", kind: "docs" },
        { label: "MongoDB docs: Read Concern", url: "https://www.mongodb.com/docs/manual/reference/read-concern/", kind: "docs" },
        { label: "Jepsen: MongoDB 4.2.6", url: "https://jepsen.io/analyses/mongodb-4.2.6", kind: "article" },
        { label: "Alex DeBrie: SQL, NoSQL, and Scale: How DynamoDB scales where relational databases don't", url: "https://www.alexdebrie.com/posts/dynamodb-no-bad-queries/", kind: "article" },
      ],
      video: {
        title: "How To Choose The Right Database?",
        channel: "ByteByteGo",
        url: "https://www.youtube.com/watch?v=kkeFE6iRfMM",
        videoId: "kkeFE6iRfMM",
        durationLabel: "6:58",
      },
      alternateVideos: [
        {
          title: "NoSQL Database Tutorial – Full Course for Beginners",
          channel: "freeCodeCamp.org",
          url: "https://www.youtube.com/watch?v=xh4gy1lbL2k",
          videoId: "xh4gy1lbL2k",
          durationLabel: "2:54:53",
          startSeconds: 78,
          chapterLabel: "What is NoSQL?",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "nosql-sql-vs-nosql-q1",
          prompt:
            "A payments service moves money between accounts, must never create or lose money, and auditors ask ad-hoc questions across accounts and time. Which default fits best?",
          options: [
            "A relational database: multi-row invariants, constraints and ad-hoc queries are its core strengths",
            "A key-value store, because transfers are simple lookups",
            "A document database that embeds each account's full history in one document",
            "An in-memory cache with periodic snapshots to disk",
          ],
          correctIndex: 0,
          explanation:
            "A transfer changes two rows atomically, balances need constraints, and audits ask questions nobody planned for. Document databases can run multi-document transactions, but a relational design makes these properties the default rather than the exception.",
        },
        {
          id: "nosql-sql-vs-nosql-q2",
          prompt:
            "A product catalogue has a few common fields plus category-specific attributes (voltage for chargers, fabric for shirts), and pages always load one product by id. Which designs fit well? (Select all that apply.)",
          options: [
            "A document database, storing each product as one document",
            "PostgreSQL with columns for the common fields plus a `jsonb` column for the attributes",
            "One table with a nullable column for every attribute of every category",
            "An entity-attribute-value table storing every attribute as a row of strings",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "Both a document per product and a `jsonb` attributes column keep variable data together and are read in one lookup. The wide nullable table becomes unmanageable as categories grow, and EAV loses types, constraints and sane queries.",
        },
        {
          id: "nosql-sql-vs-nosql-q3",
          prompt: "Which statements about MongoDB transactions and consistency are true? (Select all that apply.)",
          options: [
            "Multi-document ACID transactions work on replica sets (since 4.0) and sharded clusters (since 4.2)",
            "A single-document write is atomic without a transaction",
            "Multi-document transactions don't work on a standalone server",
            "Transactions cost nothing extra, so every write should use one",
            "The default read concern only returns data acknowledged by a majority of the replica set",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "MongoDB recommends modeling so most operations touch one document, because multi-document transactions add latency and contention. The default read concern is `local`, which can return data that's later rolled back after a failover.",
        },
        {
          id: "nosql-sql-vs-nosql-q4",
          prompt:
            "A user saves their profile, and the next page load, served from a secondary replica, still shows the old name. What's happening, and what fixes it?",
          options: [
            "Replication lag: the read hit a replica that hadn't applied the write yet; route that user's reads to the primary for a while, or use causally consistent sessions",
            "The write failed silently and must be retried",
            "The browser cached the old page",
            "The primary rejected the write because of a lock",
          ],
          correctIndex: 0,
          explanation:
            "Asynchronous replicas trade freshness for read scale. Read-your-writes has to be designed in: primary reads after a write, sticky routing, or a session token (MongoDB's causal consistency) that makes the replica wait until it has caught up.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "nosql-sql-vs-nosql-q5",
          prompt:
            "A DynamoDB-style table was designed around its access patterns up front. Product now wants a new query: all orders over 500 in a region, sorted by date. What does that typically require?",
          options: [
            "A new secondary index (or a backfilled copy of the data) shaped for that query, because there are no efficient joins or ad-hoc scans",
            "Nothing: writing the new query is enough",
            "Switching the table to strongly consistent reads",
            "Increasing the table's read capacity",
          ],
          correctIndex: 0,
          explanation:
            "Key-value and wide-column stores deliver predictable latency at scale by serving only the queries their keys and indexes were designed for. That's a real cost while requirements are still moving.",
        },
        {
          id: "nosql-sql-vs-nosql-q6",
          prompt:
            "Why is a monotonically increasing shard key, such as a timestamp or an ObjectId, a problem with ranged sharding in MongoDB?",
          options: [
            "Every new insert lands in the chunk holding the highest key, so one shard takes all the write load",
            "Monotonic keys can't be indexed",
            "MongoDB rejects shard keys whose values increase",
            "It makes range queries on the key impossible",
          ],
          correctIndex: 0,
          explanation:
            "Hashed sharding, or a compound key led by a well-distributed field, spreads inserts, at the cost of range queries on the key touching every shard.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "nosql-sql-vs-nosql-q7",
          prompt: "What does the CAP theorem actually constrain?",
          options: [
            "What a replicated system can do during a network partition: keep answering with possibly stale or divergent data, or refuse some requests to stay consistent",
            "That every database offers only two of consistency, availability and partition tolerance at all times",
            "That SQL databases are CP and NoSQL databases are AP",
            "How fast a database can be when nothing has failed",
          ],
          correctIndex: 0,
          explanation:
            "Partitions aren't optional, so the real choice is consistency or availability while one lasts. PACELC adds the everyday tradeoff: without a partition you still trade latency against consistency, for example synchronous versus asynchronous replication.",
        },
        {
          id: "nosql-sql-vs-nosql-q8",
          prompt:
            "A service writes an order to PostgreSQL, then publishes an event that updates a search index; occasionally the publish fails after the commit. What's the standard fix?",
          options: [
            "A transactional outbox: write the event to an outbox table in the same transaction and have a relay (or change data capture) publish it, retrying until it succeeds",
            "Publish the event first, then write to PostgreSQL",
            "Wrap both calls in one database transaction",
            "Retry the publish three times inside the request handler",
          ],
          correctIndex: 0,
          explanation:
            "Two systems can't commit atomically without a distributed protocol. The outbox makes the event part of the database transaction and moves delivery to an at-least-once process, so consumers must be idempotent.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "nosql-sql-vs-nosql-q9",
          prompt: "What does \"eventual consistency\" promise?",
          options: [
            "If writes stop, all replicas eventually converge to the same value; until then reads may be stale, with no bound on how stale",
            "Every read returns the latest write after a short, fixed delay",
            "Writes are applied in the same order on every replica immediately",
            "Conflicting writes are always merged without losing data",
          ],
          correctIndex: 0,
          explanation:
            "It's a liveness guarantee, not a freshness one. Applications usually need to add stronger session guarantees on top, such as read-your-writes, monotonic reads or causal consistency.",
        },
        {
          id: "nosql-sql-vs-nosql-q10",
          prompt: "Which signals push a new service toward a relational database? (Select all that apply.)",
          options: [
            "Business rules that span several entities, like inventory reserved against orders",
            "Reporting and ad-hoc queries whose shape isn't known yet",
            "Many-to-many relationships that are queried from both sides",
            "Each request reads and writes exactly one self-contained aggregate by id",
            "Write volume that needs dozens of shards from day one",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Cross-entity invariants, unknown queries and many-to-many access are where joins and constraints earn their keep. Single-aggregate access and extreme write scale are the classic arguments for document or wide-column stores.",
        },
      ],
    },
    {
      id: "nosql-redis-caching",
      moduleId: "be-nosql",
      trackId: "backend",
      title: "Redis for Caching & Session Storage",
      summary:
        "Redis is an in-memory data structure server: strings, hashes, lists, sets, sorted sets, streams, bitmaps, HyperLogLogs, geospatial indexes and JSON, manipulated by atomic commands. That combination is why it's the default cache, session store, rate limiter and leaderboard: `INCR`, `SET key value NX PX 30000` and `ZADD` are atomic without any locking in your code. Licensing changed underneath it: Redis 7.4 (2024) moved to source-available licences, which prompted Valkey, a BSD-licensed fork of 7.2.4 under the Linux Foundation, and Redis 8 (2025) is tri-licensed under RSALv2, SSPLv1 or AGPLv3.\n\nAs a cache, Redis usually sits in a cache-aside arrangement: read Redis, fall back to the database on a miss, write the result back with a TTL. Two settings decide how it behaves under pressure. `maxmemory` caps memory (`0`, unlimited, is the 64-bit default), and `maxmemory-policy` picks what to evict: the default `noeviction` returns errors on writes once full, which suits a primary store and breaks a cache, where `allkeys-lru` or `allkeys-lfu` is the usual choice. The `volatile-*` policies only consider keys with a TTL and behave like `noeviction` if none have one. Expiry is easy to lose: `SET` on an existing key clears its TTL unless you pass `KEEPTTL`, while `INCR` or `HSET` keep it.\n\nFor sessions, put an opaque random id in an `HttpOnly`, `Secure`, `SameSite` cookie and the session data in Redis under that id with a TTL refreshed on activity. Deleting the key revokes the session instantly, which a stateless JWT can't do. Be realistic about durability: AOF with `everysec` fsync can lose about a second of writes, and replication is asynchronous, so a failover can drop acknowledged writes.",
      level: "intermediate",
      estMinutes: 50,
      webRefs: [
        { label: "Redis docs: Understand Redis data types", url: "https://redis.io/docs/latest/develop/data-types/", kind: "docs" },
        { label: "Redis docs: Key eviction", url: "https://redis.io/docs/latest/develop/reference/eviction/", kind: "docs" },
        { label: "Redis docs: EXPIRE", url: "https://redis.io/docs/latest/commands/expire/", kind: "docs" },
        { label: "Redis: Licenses", url: "https://redis.io/legal/licenses/", kind: "docs" },
      ],
      video: {
        title: "Redis Crash Course",
        channel: "Web Dev Simplified",
        url: "https://www.youtube.com/watch?v=jgpVdJB2sKQ",
        videoId: "jgpVdJB2sKQ",
        durationLabel: "27:30",
      },
      alternateVideos: [
        {
          title: "Redis Deep Dive w/ a Ex-Meta Senior Manager",
          channel: "Hello Interview",
          url: "https://www.youtube.com/watch?v=fmT5nlEkl3U",
          videoId: "fmT5nlEkl3U",
          durationLabel: "31:00",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "nosql-redis-caching-q1",
          prompt:
            "What does the last command return?\n\n```text\nSET session:abc \"{...}\" EX 1800\nSET session:abc \"{...updated...}\"\nTTL session:abc\n```",
          options: [
            "`-1`: the second `SET` replaced the value and cleared the expiry, so the session now never expires",
            "About `1800`: overwriting a key keeps its expiry",
            "`-2`: the key was deleted",
            "`0`: the key expires immediately",
          ],
          correctIndex: 0,
          explanation:
            "Commands that replace a value (`SET`, `GETSET`, the `*STORE` commands) clear the TTL. Pass `EX` again, or `KEEPTTL` to keep the existing one; sessions that silently never expire are both a memory leak and a security problem.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "nosql-redis-caching-q2",
          prompt:
            "A rate-limit counter `rl:user:7` was given `EXPIRE rl:user:7 60`. Does `INCR rl:user:7` reset or remove that expiry?",
          options: [
            "No: commands that alter a value without replacing it, like `INCR`, `LPUSH` and `HSET`, leave the TTL untouched",
            "Yes: every write clears the TTL",
            "Yes: `INCR` resets the TTL back to 60 seconds",
            "It depends on the eviction policy",
          ],
          correctIndex: 0,
          explanation:
            "That's what makes the fixed-window limiter work: `INCR`, then set `EXPIRE` only when the count is 1 (or use `EXPIRE ... NX`), and the window ends on schedule however many increments happen.",
        },
        {
          id: "nosql-redis-caching-q3",
          prompt: "A cache instance reaches `maxmemory` while using the default eviction policy. What happens?",
          options: [
            "Writes that need more memory fail with an out-of-memory error while reads keep working, because the default policy is `noeviction`",
            "Redis evicts the least recently used keys automatically",
            "Redis crashes and restarts",
            "Redis writes the overflow to disk and keeps accepting writes",
          ],
          correctIndex: 0,
          explanation:
            "`noeviction` is right when Redis holds data you can't lose and wrong for a cache. Set `maxmemory-policy` explicitly, usually `allkeys-lru` or `allkeys-lfu`, whenever you deploy a cache.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "nosql-redis-caching-q4",
          prompt:
            "Which settings make sense for an instance used purely as a cache, where every key has a TTL? (Select all that apply.)",
          options: [
            "`maxmemory-policy allkeys-lru`",
            "`maxmemory-policy allkeys-lfu`",
            "`maxmemory-policy volatile-lru`, since every key has a TTL",
            "`maxmemory-policy noeviction`",
            "`maxmemory 0`, so the cache never runs out of room",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Any LRU or LFU policy works when every key is a candidate; `volatile-*` only considers keys with a TTL. `noeviction` turns a full cache into write errors, and `maxmemory 0` (unlimited, the 64-bit default) leaves the operating system's OOM killer to decide.",
        },
        {
          id: "nosql-redis-caching-q5",
          prompt:
            "An instance uses `volatile-lru`, but the application stores cache entries without TTLs. What happens when memory fills up?",
          options: [
            "No key is eligible for eviction, so it behaves like `noeviction` and writes start failing",
            "It falls back to evicting any key by LRU",
            "It evicts keys at random",
            "It starts expiring the oldest keys",
          ],
          correctIndex: 0,
          explanation:
            "The `volatile-*` policies only consider keys with an expiry and act like `noeviction` when there are none. If you need both persistent keys and a cache, the Redis docs suggest two separate instances.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "nosql-redis-caching-q6",
          prompt:
            "Why keep sessions server-side in Redis, with an opaque id in an `HttpOnly` cookie, rather than in a self-contained JWT?",
          options: [
            "Deleting the Redis key revokes the session instantly and the cookie stays small; the cost is a Redis lookup on every request and Redis becoming a dependency",
            "JWTs can't carry a user id",
            "Redis sessions don't need cookies at all",
            "Server-side sessions are immune to XSS and CSRF",
          ],
          correctIndex: 0,
          explanation:
            "A JWT stays valid until it expires unless you add a denylist, which brings server-side state back. Server-side sessions still need `Secure`, `SameSite` and CSRF protection; they just make logout and \"sign out everywhere\" trivial.",
        },
        {
          id: "nosql-redis-caching-q7",
          prompt:
            "Two app servers implement a counter by running `GET views`, adding 1 in code, then `SET views`. What goes wrong, and what's the fix?",
          options: [
            "Concurrent requests read the same value and overwrite each other's increments; use `INCR`, which is atomic, or a Lua script for multi-step logic",
            "Nothing: Redis runs commands one at a time, so the sequence is atomic",
            "Redis rejects the second `SET`",
            "Redis merges the two values automatically",
          ],
          correctIndex: 0,
          explanation:
            "Each command is atomic, but a read-modify-write across two commands isn't: other clients' commands run in between. `INCR`, `SET ... NX`, `MULTI`/`EXEC` with `WATCH`, or a Lua script make the whole operation atomic.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "nosql-redis-caching-q8",
          prompt: "Why is `KEYS user:*` dangerous on a production instance?",
          options: [
            "It walks the whole keyspace in one blocking call, stalling every other client; use `SCAN`, which iterates incrementally",
            "It deletes the matching keys as well as listing them",
            "It only works on replicas, so on a primary it returns an error",
            "It's deprecated in Redis 8 and always returns an empty list",
          ],
          correctIndex: 0,
          explanation:
            "Redis executes commands one at a time, so an O(N) command over millions of keys blocks everything else. The same applies to `DEL` on a huge key (prefer `UNLINK`) and to unbounded `HGETALL` or `SMEMBERS` calls.",
        },
        {
          id: "nosql-redis-caching-q9",
          prompt:
            "A team plans to keep shopping carts only in Redis, with AOF persistence (`appendfsync everysec`) and one asynchronous replica. What should they know?",
          options: [
            "A crash can lose roughly the last second of writes, and a failover can drop writes the old primary acknowledged but hadn't replicated",
            "Once Redis acknowledges a write it can never be lost",
            "AOF makes replication synchronous",
            "Redis can't persist data to disk at all",
          ],
          correctIndex: 0,
          explanation:
            "Redis favours latency: `everysec` batches fsyncs and replication is asynchronous (`WAIT` narrows the window but doesn't make it a consensus system). That's acceptable for carts you can afford to lose, not for orders or payments.",
        },
        {
          id: "nosql-redis-caching-q10",
          prompt: "Which statements about Redis licensing are accurate? (Select all that apply.)",
          options: [
            "Redis 8 is available under a choice of RSALv2, SSPLv1 or AGPLv3",
            "Redis 7.4 was available only under RSALv2 or SSPLv1",
            "Valkey is a BSD-licensed fork of Redis 7.2.4, hosted by the Linux Foundation",
            "Valkey is a fork of Redis 8 under the AGPL",
            "Redis 7.2 and earlier were proprietary",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Redis moved from BSD to source-available licences with 7.4, which prompted the Valkey fork in March 2024; Redis 8 added AGPLv3 as an open source option. Versions up to 7.2 were BSD-3-Clause.",
        },
      ],
    },
    {
      id: "nosql-cache-invalidation",
      moduleId: "be-nosql",
      trackId: "backend",
      title: "Cache Invalidation, Stampedes & Consistency",
      summary:
        "A cache is a second copy of data with no transaction tying it to the first, so every caching strategy is a decision about how stale and how wrong you're willing to be. Cache-aside (load on a miss, invalidate on write) is the default because the cache only holds what's read and a cache outage degrades to extra database load. Write-through updates the cache alongside the database, keeping hot data fresh at the cost of write latency and caching data nobody reads; write-behind acknowledges writes once they're in the cache and flushes later, which is fast and risks losing acknowledged writes. TTLs bound the staleness of everything the invalidation logic misses.\n\nOrdering is where correct-looking code goes wrong. Updating the cache on write lets two concurrent writers leave the older value behind, so delete instead. Even delete-on-write races with a slow reader: the reader misses and reads the old row, the writer updates the database and deletes the key, then the reader stores its stale value, where it stays until the TTL. Fixes include versions or leases (Facebook's memcache leases reject a set whose lease was invalidated), a second delayed delete, or invalidating from the database's change stream.\n\nThe other failure is load. When a hot key expires, every concurrent request misses and hits the database at once: a cache stampede, or thundering herd, which can take the database down and keep it down. The defences: single-flight (one request per key recomputes while the others await the same promise; a per-key lock does this across servers), stale-while-revalidate (serve the expired value for a grace period while one background refresh runs, as in RFC 5861), probabilistic early expiration, TTL jitter so keys don't expire together, and caching misses so non-existent keys can't bypass the cache.",
      level: "expert",
      estMinutes: 80,
      isMilestone: true,
      webRefs: [
        { label: "AWS whitepaper: Caching patterns (Database Caching Strategies Using Redis)", url: "https://docs.aws.amazon.com/whitepapers/latest/database-caching-strategies-using-redis/caching-patterns.html", kind: "docs" },
        { label: "Nishtala et al.: Scaling Memcache at Facebook (NSDI 2013)", url: "https://www.usenix.org/system/files/conference/nsdi13/nsdi13-final170_update.pdf", kind: "article" },
        { label: "Vattani, Chierichetti, Lowenstein: Optimal Probabilistic Cache Stampede Prevention (VLDB 2015)", url: "https://cseweb.ucsd.edu/~avattani/papers/cache_stampede.pdf", kind: "article" },
        { label: "RFC 5861: HTTP Cache-Control Extensions for Stale Content", url: "https://www.rfc-editor.org/rfc/rfc5861.html", kind: "spec" },
      ],
      video: {
        title: "Caching Pitfalls Every Developer Should Know",
        channel: "ByteByteGo",
        url: "https://www.youtube.com/watch?v=wh98s0XhMmQ",
        videoId: "wh98s0XhMmQ",
        durationLabel: "6:40",
      },
      alternateVideos: [
        {
          title: "Caching in System Design Interviews w/ Meta Staff Engineer",
          channel: "Hello Interview",
          url: "https://www.youtube.com/watch?v=1NngTUYPdpI",
          videoId: "1NngTUYPdpI",
          durationLabel: "30:13",
        },
      ],
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Implement `createCache(load, options)`: a cache-aside wrapper around a slow, async `load(key)` with TTLs, stampede protection and race-safe invalidation. It returns `{ get(key), invalidate(key) }`. `options` has `ttl` and `swr` (milliseconds; `swr` may be 0) and `now()`, a fake clock. Don't use `Date.now()` or timers.\n\n`get(key)` returns a Promise for the value:\n\n- Fresh hit: an entry stored at time `s` is fresh while `now() < s + ttl`. Resolve with the cached value without calling `load`.\n- Stale-while-revalidate: while `s + ttl <= now() < s + ttl + swr`, resolve with the stale value immediately and start one background refresh for that key, unless a load for it is already in flight. A failed refresh leaves the stale entry in place.\n- Miss (no entry, or one older than `s + ttl + swr`): call `load(key)` and resolve with its result, storing it with the time the load finished. `null` is a value like any other and is cached too.\n- Single-flight: while a load for a key is in flight, other `get` calls for that key share it instead of calling `load` again.\n- Errors: if `load` rejects, every caller waiting on it rejects with that error, and nothing is cached.\n\n`invalidate(key)` is called right after the database is written. It removes the entry and makes any in-flight load for that key obsolete: an obsolete load must never write to the cache, and later `get` calls must not join it (they start a new load). Callers already waiting on it still receive its result.\n\nThe tests call `runCacheScenario(config, events, endTime)`, which runs a fake clock. Its `load` reads the database when it starts and resolves `config.latency` ms later, so a slow read can return a value that was overwritten meanwhile; `config.failLoads` lists 1-based load calls that reject. Events are `[time, \"get\", key]`, `[time, \"write\", key, value]` (update the database, then call `invalidate`), and `[time, \"dbWrite\", key, value]` (update the database without invalidating, as another service might). It reports each `get` with the time it resolved, plus every `load` call. Leave the driver as it is.",
        starterCode: `/**
 * @param {(key: string) => Promise<unknown>} load
 * @param {{ ttl: number, swr: number, now: () => number }} options
 * @returns {{ get: (key: string) => Promise<unknown>, invalidate: (key: string) => void }}
 */
function createCache(load, options) {
  // Your code here
  return {
    get(key) {
      // Your code here
    },
    invalidate(key) {
      // Your code here
    },
  };
}

// ---- Test driver (leave as is) ----
async function runCacheScenario(config, events, endTime) {
  const clock = createFakeClock();
  const db = new Map(Object.entries(config.data || {}));
  const failLoads = config.failLoads || [];
  const loads = [];
  function load(key) {
    loads.push({ at: clock.now(), key });
    const loadNumber = loads.length;
    const value = db.has(key) ? db.get(key) : null; // read happens when the load starts
    return new Promise((resolve, reject) => {
      clock.setTimeout(() => {
        if (failLoads.includes(loadNumber)) reject(new Error("db timeout"));
        else resolve(value);
      }, config.latency);
    });
  }
  const cache = createCache(load, { ttl: config.ttl, swr: config.swr || 0, now: clock.now });
  const results = [];
  for (const [at, op, key, value] of events) {
    clock.at(at, () => {
      if (op === "write" || op === "dbWrite") {
        db.set(key, value);
        if (op === "write") cache.invalidate(key);
        return;
      }
      const slot = { at, key };
      results.push(slot);
      let promise;
      try {
        promise = cache.get(key);
      } catch (e) {
        slot.error = "threw synchronously";
        return;
      }
      Promise.resolve(promise).then(
        (v) => {
          slot.value = v;
          slot.doneAt = clock.now();
        },
        (e) => {
          slot.error = String((e && e.message) || e);
          slot.doneAt = clock.now();
        },
      );
    });
  }
  await clock.runUntil(endTime);
  return { results, loads };
}

function createFakeClock() {
  let now = 0;
  let nextId = 1;
  let seq = 0;
  let queue = [];
  const schedule = (time, cb) => {
    const id = nextId++;
    queue.push({ id, time, seq: seq++, cb });
    return id;
  };
  const flushMicrotasks = async () => {
    for (let i = 0; i < 100; i++) await null;
  };
  return {
    now: () => now,
    setTimeout: (cb, ms = 0) => schedule(now + Math.max(0, ms), cb),
    clearTimeout: (id) => {
      queue = queue.filter((t) => t.id !== id);
    },
    at: (time, cb) => schedule(time, cb),
    async runUntil(end) {
      for (;;) {
        await flushMicrotasks();
        queue.sort((a, b) => a.time - b.time || a.seq - b.seq);
        const next = queue[0];
        if (!next || next.time > end) break;
        queue.shift();
        now = next.time;
        next.cb();
      }
      now = end;
      await flushMicrotasks();
    },
  };
}
`,
        functionName: "runCacheScenario",
        testCases: [
          {
            description: "a miss loads once; a get inside the TTL is a hit",
            args: [{ latency: 50, ttl: 100, data: { a: "v1" } }, [[0, "get", "a"], [60, "get", "a"]], 300],
            expected: {
              results: [
                { at: 0, key: "a", value: "v1", doneAt: 50 },
                { at: 60, key: "a", value: "v1", doneAt: 60 },
              ],
              loads: [{ at: 0, key: "a" }],
            },
          },
          {
            description: "single-flight: concurrent misses share one load",
            args: [
              { latency: 50, ttl: 100, data: { a: "v1" } },
              [[0, "get", "a"], [5, "get", "a"], [10, "get", "a"], [20, "get", "a"], [40, "get", "a"]],
              300,
            ],
            expected: {
              results: [
                { at: 0, key: "a", value: "v1", doneAt: 50 },
                { at: 5, key: "a", value: "v1", doneAt: 50 },
                { at: 10, key: "a", value: "v1", doneAt: 50 },
                { at: 20, key: "a", value: "v1", doneAt: 50 },
                { at: 40, key: "a", value: "v1", doneAt: 50 },
              ],
              loads: [{ at: 0, key: "a" }],
            },
          },
          {
            description: "entries expire at stored time + ttl (stale until then, even if the DB changed)",
            args: [
              { latency: 50, ttl: 100, data: { a: "v1" } },
              [[0, "get", "a"], [100, "dbWrite", "a", "v2"], [149, "get", "a"], [150, "get", "a"]],
              400,
            ],
            expected: {
              results: [
                { at: 0, key: "a", value: "v1", doneAt: 50 },
                { at: 149, key: "a", value: "v1", doneAt: 149 },
                { at: 150, key: "a", value: "v2", doneAt: 200 },
              ],
              loads: [
                { at: 0, key: "a" },
                { at: 150, key: "a" },
              ],
            },
          },
          {
            description: "a write invalidates, so the next get reloads the new value",
            args: [
              { latency: 50, ttl: 100, data: { a: "v1" } },
              [[0, "get", "a"], [60, "get", "a"], [80, "write", "a", "v2"], [90, "get", "a"]],
              300,
            ],
            expected: {
              results: [
                { at: 0, key: "a", value: "v1", doneAt: 50 },
                { at: 60, key: "a", value: "v1", doneAt: 60 },
                { at: 90, key: "a", value: "v2", doneAt: 140 },
              ],
              loads: [
                { at: 0, key: "a" },
                { at: 90, key: "a" },
              ],
            },
          },
          {
            description: "keys are independent: invalidating one doesn't touch another",
            args: [
              { latency: 50, ttl: 100, data: { a: "a1", b: "b1" } },
              [[0, "get", "a"], [0, "get", "b"], [60, "write", "a", "a2"], [70, "get", "a"], [70, "get", "b"]],
              300,
            ],
            expected: {
              results: [
                { at: 0, key: "a", value: "a1", doneAt: 50 },
                { at: 0, key: "b", value: "b1", doneAt: 50 },
                { at: 70, key: "a", value: "a2", doneAt: 120 },
                { at: 70, key: "b", value: "b1", doneAt: 70 },
              ],
              loads: [
                { at: 0, key: "a" },
                { at: 0, key: "b" },
                { at: 70, key: "a" },
              ],
            },
          },
          {
            description: "stale-while-revalidate serves the old value instantly and refreshes once in the background",
            args: [
              { latency: 50, ttl: 100, swr: 100, data: { a: "v1" } },
              [[0, "get", "a"], [120, "dbWrite", "a", "v2"], [160, "get", "a"], [170, "get", "a"], [220, "get", "a"]],
              400,
            ],
            expected: {
              results: [
                { at: 0, key: "a", value: "v1", doneAt: 50 },
                { at: 160, key: "a", value: "v1", doneAt: 160 },
                { at: 170, key: "a", value: "v1", doneAt: 170 },
                { at: 220, key: "a", value: "v2", doneAt: 220 },
              ],
              loads: [
                { at: 0, key: "a" },
                { at: 160, key: "a" },
              ],
            },
          },
          {
            description: "a failed load rejects every waiter and isn't cached; the next get retries",
            args: [
              { latency: 50, ttl: 100, data: { a: "v1" }, failLoads: [1] },
              [[0, "get", "a"], [10, "get", "a"], [60, "get", "a"]],
              300,
            ],
            expected: {
              results: [
                { at: 0, key: "a", error: "db timeout", doneAt: 50 },
                { at: 10, key: "a", error: "db timeout", doneAt: 50 },
                { at: 60, key: "a", value: "v1", doneAt: 110 },
              ],
              loads: [
                { at: 0, key: "a" },
                { at: 60, key: "a" },
              ],
            },
            isEdgeCase: true,
          },
          {
            description: "race: a slow read that started before a write must not repopulate the cache, and later gets don't join it",
            args: [
              { latency: 50, ttl: 100, data: { a: "v1" } },
              [[0, "get", "a"], [10, "write", "a", "v2"], [20, "get", "a"], [55, "get", "a"], [100, "get", "a"]],
              300,
            ],
            expected: {
              results: [
                { at: 0, key: "a", value: "v1", doneAt: 50 },
                { at: 20, key: "a", value: "v2", doneAt: 70 },
                { at: 55, key: "a", value: "v2", doneAt: 70 },
                { at: 100, key: "a", value: "v2", doneAt: 100 },
              ],
              loads: [
                { at: 0, key: "a" },
                { at: 20, key: "a" },
              ],
            },
            isEdgeCase: true,
          },
          {
            description: "at exactly stored time + ttl + swr the entry is too old to serve: a blocking load",
            args: [
              { latency: 50, ttl: 100, swr: 100, data: { a: "v1" } },
              [[0, "get", "a"], [120, "dbWrite", "a", "v2"], [250, "get", "a"]],
              400,
            ],
            expected: {
              results: [
                { at: 0, key: "a", value: "v1", doneAt: 50 },
                { at: 250, key: "a", value: "v2", doneAt: 300 },
              ],
              loads: [
                { at: 0, key: "a" },
                { at: 250, key: "a" },
              ],
            },
            isEdgeCase: true,
          },
          {
            description: "a failed background refresh keeps serving the stale value and a later get retries",
            args: [
              { latency: 50, ttl: 100, swr: 100, data: { a: "v1" }, failLoads: [2] },
              [[0, "get", "a"], [160, "get", "a"], [170, "get", "a"], [215, "get", "a"]],
              400,
            ],
            expected: {
              results: [
                { at: 0, key: "a", value: "v1", doneAt: 50 },
                { at: 160, key: "a", value: "v1", doneAt: 160 },
                { at: 170, key: "a", value: "v1", doneAt: 170 },
                { at: 215, key: "a", value: "v1", doneAt: 215 },
              ],
              loads: [
                { at: 0, key: "a" },
                { at: 160, key: "a" },
                { at: 215, key: "a" },
              ],
            },
            isEdgeCase: true,
          },
          {
            description: "a missing row (null) is cached, so repeated lookups don't hit the database",
            args: [{ latency: 50, ttl: 100, data: {} }, [[0, "get", "ghost"], [60, "get", "ghost"]], 300],
            expected: {
              results: [
                { at: 0, key: "ghost", value: null, doneAt: 50 },
                { at: 60, key: "ghost", value: null, doneAt: 60 },
              ],
              loads: [{ at: 0, key: "ghost" }],
            },
            isEdgeCase: true,
          },
          {
            description: "1,000 simultaneous gets for a hot key cause exactly one load",
            args: [
              { latency: 50, ttl: 100, data: { hot: "v1" } },
              Array.from({ length: 1000 }, () => [0, "get", "hot"]),
              300,
            ],
            expected: {
              results: Array.from({ length: 1000 }, () => ({ at: 0, key: "hot", value: "v1", doneAt: 50 })),
              loads: [{ at: 0, key: "hot" }],
            },
            isEdgeCase: true,
          },
        ],
      },
    },
  ],
} satisfies Module;
