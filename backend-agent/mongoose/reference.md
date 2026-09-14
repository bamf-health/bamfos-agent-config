# Mongoose Reference

> Decision frameworks, quick reference tables, schema types, query operators, and migration notes. See [SKILL.md](SKILL.md) for core concepts and [examples/](examples/) for code examples.

---

## Decision Framework

### When to Use `save()` vs Direct Update

```
Do you need pre('save') / post('save') middleware to fire?
|-- YES --> findById() then .save()
|-- NO --> Do you need schema validation on the update?
    |-- YES --> findByIdAndUpdate() with { runValidators: true }
    |-- NO --> findByIdAndUpdate() or updateOne()
```

### When to Use `.lean()`

```
Are you sending the result directly as an API response?
|-- YES --> Use .lean() (3x memory savings, plain objects)
|-- NO --> Do you need to call .save(), .populate(), or instance methods?
    |-- YES --> Do NOT use lean (need hydrated document)
    |-- NO --> Use .lean() (faster, less memory)
```

### Embed vs Reference

```
Is the related data always accessed with the parent?
|-- YES --> Is it bounded (won't grow without limit)?
|   |-- YES --> Is it small (< 100 items)?
|   |   |-- YES --> EMBED in the parent document
|   |   |-- NO --> Consider EMBED with pagination or REFERENCE
|   |-- NO --> REFERENCE (unbounded arrays hit 16 MB limit)
|-- NO --> Is the related data shared across many parents?
    |-- YES --> REFERENCE with ObjectId
    |-- NO --> Is it updated independently from the parent?
        |-- YES --> REFERENCE with ObjectId
        |-- NO --> EMBED in the parent document
```

### Populate vs Aggregation $lookup

```
Do you need to resolve references?
|-- YES --> Is it a simple parent-child with field selection?
|   |-- YES --> Use .populate() with select
|   |-- NO --> Do you need filtering/sorting on the joined data?
|       |-- YES --> Use aggregation $lookup + $match
|       |-- NO --> Use .populate() with match option
|-- NO --> Skip population, use IDs directly
```

---

## Schema Types Quick Reference

| Mongoose Type           | Schema Definition                        |
| ----------------------- | ---------------------------------------- |
| `String`                | `name: { type: String }`                 |
| `Number`                | `age: { type: Number }`                  |
| `Boolean`               | `isActive: { type: Boolean }`            |
| `Date`                  | `createdAt: { type: Date }`              |
| `Buffer`                | `data: { type: Buffer }`                 |
| `Schema.Types.ObjectId` | `ref: { type: Schema.Types.ObjectId }`   |
| `Schema.Types.Mixed`    | `metadata: { type: Schema.Types.Mixed }` |
| `[String]`              | `tags: [{ type: String }]`               |
| `Map`                   | `meta: { type: Map, of: String }`        |
| `Schema.Types.UUID`     | `uuid: { type: Schema.Types.UUID }`      |

**Critical distinction:** `Schema.Types.ObjectId` is the schema definition type. `Types.ObjectId` is the runtime constructor used to create ObjectId values (for example, `new Types.ObjectId(id)`). Mixing them up causes runtime errors.

---

## Middleware Execution Matrix

| Operation                  | Middleware Hook Triggered                  | Type      |
| -------------------------- | ------------------------------------------ | --------- |
| `doc.save()`               | `pre/post('validate')`, `pre/post('save')` | document  |
| `Model.create()`           | `pre/post('validate')`, `pre/post('save')` | document  |
| `Model.insertMany()`       | `pre/post('insertMany')`                   | model     |
| `Model.findOneAndUpdate()` | `pre/post('findOneAndUpdate')`             | query     |
| `Model.updateOne()`        | `pre/post('updateOne')`                    | query     |
| `doc.updateOne()`          | `pre/post('updateOne')`                    | document  |
| `Model.updateMany()`       | `pre/post('updateMany')`                   | query     |
| `Model.findOneAndDelete()` | `pre/post('findOneAndDelete')`             | query     |
| `Model.deleteOne()`        | `pre/post('deleteOne')`                    | query     |
| `doc.deleteOne()`          | `pre/post('deleteOne')`                    | document  |
| `Model.deleteMany()`       | `pre/post('deleteMany')`                   | query     |
| `Model.find()`             | `pre/post('find')`                         | query     |
| `Model.findOne()`          | `pre/post('findOne')`                      | query     |
| `Model.aggregate()`        | `pre/post('aggregate')`                    | aggregate |

**Key insights:**

- `insertMany()` triggers `insertMany` model middleware only -- NOT `save` or `validate` hooks
- `save()` and `create()` are the ONLY operations that trigger `pre('save')` and `pre('validate')`
- `Model.deleteOne()` triggers **query** middleware; `doc.deleteOne()` triggers **document** middleware -- same method name, different middleware type

---

## Common Query Operators

| Operator       | Description             | Example                                   |
| -------------- | ----------------------- | ----------------------------------------- |
| `$eq`          | Equal                   | `{ age: { $eq: 25 } }`                    |
| `$ne`          | Not equal               | `{ status: { $ne: "deleted" } }`          |
| `$gt` / `$gte` | Greater than (or equal) | `{ age: { $gte: 18 } }`                   |
| `$lt` / `$lte` | Less than (or equal)    | `{ price: { $lt: 100 } }`                 |
| `$in` / `$nin` | In / not in array       | `{ role: { $in: ["admin", "mod"] } }`     |
| `$exists`      | Field exists            | `{ avatar: { $exists: true } }`           |
| `$regex`       | Regular expression      | `{ name: { $regex: /^A/i } }`             |
| `$or`          | Logical OR              | `{ $or: [{ a: 1 }, { b: 2 }] }`           |
| `$and`         | Logical AND             | `{ $and: [{ a: 1 }, { b: 2 }] }`          |
| `$elemMatch`   | Array element match     | `{ tags: { $elemMatch: { $eq: "js" } } }` |

## Common Update Operators

| Operator        | Description            | Example                             |
| --------------- | ---------------------- | ----------------------------------- |
| `$set`          | Set field value        | `{ $set: { name: "New" } }`         |
| `$unset`        | Remove field           | `{ $unset: { temp: "" } }`          |
| `$inc`          | Increment              | `{ $inc: { count: 1 } }`            |
| `$push`         | Add to array           | `{ $push: { tags: "new" } }`        |
| `$pull`         | Remove from array      | `{ $pull: { tags: "old" } }`        |
| `$addToSet`     | Add unique to array    | `{ $addToSet: { tags: "unique" } }` |
| `$rename`       | Rename field           | `{ $rename: { old: "new" } }`       |
| `$min` / `$max` | Update if less/greater | `{ $min: { low: 5 } }`              |

---

## Connection Options

| Option                     | Default | Notes                                 |
| -------------------------- | ------- | ------------------------------------- |
| `maxPoolSize`              | 100     | Maximum sockets in connection pool    |
| `minPoolSize`              | 0       | Minimum sockets maintained            |
| `serverSelectionTimeoutMS` | 30000   | Time to find an available server      |
| `socketTimeoutMS`          | 0       | Time before killing inactive sockets  |
| `retryWrites`              | true    | Retry failed writes automatically     |
| `retryReads`               | true    | Retry failed reads automatically      |
| `family`                   | 0       | Force IPv4 (4) or IPv6 (6)            |
| `bufferCommands`           | true    | Queue operations before connection    |
| `autoIndex`                | true    | Auto-create indexes (disable in prod) |

---

## Mongoose 9 Migration Notes

Key breaking changes from Mongoose 8 to 9 (released November 2025):

| Change               | Before (v8)                               | After (v9)                          |
| -------------------- | ----------------------------------------- | ----------------------------------- |
| Pre hook callbacks   | `pre('save', function(next) { next(); })` | `pre('save', async function() { })` |
| Pipeline updates     | Allowed by default                        | Require `{ updatePipeline: true }`  |
| `isValidObjectId(6)` | Returns `true`                            | Returns `false`                     |
| Node.js minimum      | 16+                                       | 18+                                 |
| UUID representation  | String via getter                         | `bson.UUID` instances               |
