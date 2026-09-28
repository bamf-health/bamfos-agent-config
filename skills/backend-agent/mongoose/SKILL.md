---
name: mongoose
description: MongoDB ODM with schemas, validation, and middleware
metadata:
  source_repo: https://github.com/agents-inc/skills/blob/main/src/skills/api-database-mongoose/SKILL.md
  forked: 2026-04-30
---

# Mongoose ODM Patterns

> **Quick Guide:** Use Mongoose as the ODM layer for MongoDB. Document schemas with JSDoc `@typedef` for editor intellisense — no need for TypeScript. Prefer `session.withTransaction()` over manual commit/abort (or enable `transactionAsyncLocalStorage`). Follow the critical rules below.

## CRITICAL: Before Using This Skill

- **All code must follow project conventions** (kebab-case files, named exports, import ordering, named constants)
- **You MUST define all middleware (pre/post hooks) BEFORE calling** `model()`: **hooks registered after model compilation are silently ignored with no error** ([middleware.md](examples/middleware.md) Pattern 1)
- **You MUST pass** `{ session }` **to EVERY operation inside a transaction: missing session causes that operation to run outside the transaction silently** ([transactions.md](examples/transactions.md) Pattern 1)
- **You MUST use** `.lean()` **for read-only queries returning API responses: skipping lean wastes 3x memory on hydration overhead** ([resources.md](references/resources.md#when-to-use-lean))
- **You MUST use** `127.0.0.1` **instead of** `localhost` **in connection strings: Node.js 18+ prefers IPv6 and** `localhost` **causes connection timeouts** ([core.md](examples/core.md) Pattern 1)
- **You MUST NOT use** `findOneAndUpdate`**/**`updateOne` **and expect** `pre('save')` **to fire: only** `save()` **and** `create()` **trigger document middleware** ([resources.md](references/resources.md#middleware-execution-matrix))
- **You MUST NOT use** `next()` **callbacks in pre hooks on Mongoose 9: use async/await instead;** `next()` **was removed in v9** ([middleware.md](examples/middleware.md) Pattern 1)
- **Failure to follow these rules will cause silent middleware bypass, transaction isolation failures, or connection timeouts.**

## Overview

**Auto-detection:** Mongoose, mongoose, mongoose.connect, Schema, model, ObjectId, populate, pre('save'), post('save'), lean, mongoose.startSession, withTransaction, discriminator, virtual, Schema.Types.ObjectId, Types.ObjectId

**When to use:**

- Defining MongoDB schemas and models with Mongoose
- Middleware hooks (pre/post save, validate, find, delete)
- Population (resolving references between collections)
- Transactions with session management
- Virtuals and instance/static methods
- Discriminators (single collection inheritance)
- Connection management (single and multi-database)

**Key patterns covered:**

- Schema definition with custom validation
- Documenting schemas with JSDoc `@typedef`
- CRUD operations (create, find, update, delete, lean vs hydrated)
- Middleware hooks and their execution rules
- Population with field selection and limits
- Transactions (withTransaction, transactionAsyncLocalStorage)
- Validation (built-in validators, custom validators, error messages)
- Virtuals (computed, populate virtuals)
- Discriminators (inheritance pattern)
- Connection setup and multi-database

**When NOT to use:**

- Raw MongoDB driver queries without schema enforcement (use the native driver)
- Performance-critical bulk operations where the ODM overhead matters (use the native driver)
- Heavy aggregation-only workloads (aggregation pipelines bypass most Mongoose features)
- Relational data with complex joins and foreign key constraints (use a relational database)
- Simple key-value storage (use a dedicated key-value store)

## References & Examples

**Detailed Resources:**

- For decision frameworks, quick reference tables, and migration notes, see [references/resources.md](references/resources.md)

**Core Patterns:**

- [examples/core.md](examples/core.md): Connection, schema definition, JSDoc typing, model creation, CRUD, validation

**Middleware & Lifecycle:**

- [examples/middleware.md](examples/middleware.md): Pre/post hooks, error handling middleware, query middleware, soft delete

**Relationships & Population:**

- [examples/population.md](examples/population.md): Populate, virtual populate, discriminators, embedding vs referencing

**Transactions & Advanced:**

- [examples/transactions.md](examples/transactions.md): Sessions, withTransaction, transactionAsyncLocalStorage, connection management

## Philosophy

Mongoose provides schema-based modeling for MongoDB. Its value is the **application-layer enforcement** of structure, validation, middleware, and type safety on top of MongoDB's flexible document model.

**Core principles:**

1. **Schema-first**: Define schemas before models. Schemas enforce structure, validation, defaults, and middleware at the application layer.
2. **Document with JSDoc, don't duplicate**: Use JSDoc `@typedef` blocks alongside schema definitions to give editors intellisense without compile-time overhead. Keep the schema as the single source of truth.
3. **Middleware before model, lean for reads, session discipline**: see the critical rules above. Registering hooks after `model()` is the single most common Mongoose bug.
4. **Validate at the schema**: Push validation into schema definitions (required, min, max, enum, custom validators with error messages). Don't validate in application code what the schema can enforce.

## Core Patterns

### Pattern 1: Connection Setup

Establish a single connection at application startup. Use environment variables for credentials. Never hardcode connection strings.

```javascript
const connection = await mongoose.connect(process.env.MONGODB_URI, {
  maxPoolSize: POOL_SIZE_MAX,
  serverSelectionTimeoutMS: SERVER_SELECTION_TIMEOUT_MS,
});
```

See [examples/core.md](examples/core.md) Pattern 1 for production connection setup, event handling, graceful shutdown, and multi-database connections.

### Pattern 2: Schema Definition

Define schemas with explicit field types, validation rules, and custom error messages. Use named constants for any numeric limits or repeated strings.

```javascript
const userSchema = new Schema(
  {
    email: {type: String, required: true, unique: true, lowercase: true},
    role: {type: String, enum: ['admin', 'user'], default: 'user'},
  },
  {timestamps: true},
);
const User = model('User', userSchema);
```

See [examples/core.md](examples/core.md) Patterns 2-3 for complete schemas with validation, subdocuments, and JSDoc-documented document shapes.

### Pattern 3: Documenting Schemas with JSDoc

Document each document shape with a JSDoc `@typedef` block placed alongside the schema. Annotate methods and statics with `@this` and `@param` so editors can offer intellisense without TypeScript.

```javascript
/**
 * @typedef {object} UserDoc
 * @property {string} email
 * @property {string} firstName
 * @property {string} lastName
 * @property {'admin' | 'user' | 'moderator'} [role]
 */

/**
 * @this {import('mongoose').HydratedDocument<UserDoc>}
 * @returns {Promise<void>}
 */
userSchema.methods.updateLastLogin = async function() {
  this.lastLoginAt = new Date();
  await this.save();
};
```

See [examples/core.md](examples/core.md) Pattern 3 for the complete implementation with `@typedef` blocks, methods, virtuals, statics, and middleware ordering.

### Pattern 4: CRUD Operations

Key rules: `.lean()` for read-only queries, `save()` when middleware must fire, `{ new: true, runValidators: true }` on direct updates.

```javascript
const users = await User.find({isActive: true}).select('name email').lean();

await User.findByIdAndUpdate(
  id,
  {$set: {name: 'New'}},
  {new: true, runValidators: true},
);
```

See [examples/core.md](examples/core.md) Pattern 5 for create, read, update, delete, bulk operations, and common mistakes.

### Pattern 5: Schema Validation

Push validation into schema definitions: use `required` with messages, `min`/`max`/`minlength`/`maxlength` with messages, `match` for regex, `enum` with `{VALUE}` message template, and custom `validate` functions. Use named constants for all numeric limits.

```javascript
const userSchema = new Schema(
  {
    name: {type: String, required: [true, 'Name is required'], minlength: [MIN_LEN, 'Too short']},
    status: {type: String, enum: {values: ['draft', 'active'], message: '{VALUE} invalid'}},
  },
  {timestamps: true},
);
```

See [examples/core.md](examples/core.md) Pattern 2 for complete validation schemas, subdocuments, and array validation.

## RED FLAGS

The critical rules above are the highest-priority red flags. Additional gotchas (details in the linked files):

**High Priority Issues:**

- `Promise.all()` inside a transaction: MongoDB does not support parallel operations within a single transaction session ([transactions.md](examples/transactions.md) Pattern 1)
- Calling `.save()` on a `.lean()` result: lean returns plain objects without Mongoose methods ([core.md](examples/core.md) Pattern 5)

**Medium Priority Issues:**

- Unbounded `.populate()` without `limit` or field selection ([population.md](examples/population.md) Pattern 1)
- Missing `runValidators: true` on `findOneAndUpdate`: validation is skipped by default ([core.md](examples/core.md) Pattern 5)
- `Schema.Types.ObjectId` is for schema definitions; `Types.ObjectId` is the runtime constructor ([core.md](examples/core.md) Pattern 4)
- Creating indexes in production application code instead of migration scripts: index builds can lock the collection; disable `autoIndex` in production ([core.md](examples/core.md) Pattern 6)

**Common Mistakes:**

- Forgetting `{ new: true }` on `findOneAndUpdate`: returns the old document by default
- Not handling duplicate key errors (code 11000) from unique indexes ([middleware.md](examples/middleware.md) Pattern 2)
- Using `.lean()` on write operations: lean is for reads only
- Checking `doc.isNew` in `post('save')`: always `false`; capture `this.$locals.wasNew` in `pre('save')` ([middleware.md](examples/middleware.md) Pattern 1)
- Registering the same hook multiple times: they stack, all run ([middleware.md](examples/middleware.md) Pattern 5)

**Gotchas & Edge Cases:**

- MongoDB has a 16 MB document size limit: deeply embedded arrays can silently hit this ([population.md](examples/population.md) Pattern 5)
- Mongoose buffers all operations until connected: queries queue silently if connection fails, which can mask connection issues in development
- `Model.deleteOne()`/`deleteMany()` trigger query middleware, not document middleware; `insertMany()` does not trigger `save` middleware ([resources.md](references/resources.md#middleware-execution-matrix))
- Virtuals are excluded from `toJSON()`/`toObject()` unless `{toJSON: {virtuals: true}}` is set ([population.md](examples/population.md) Pattern 3)
- Mongoose 9 disallows pipeline-style updates unless `{ updatePipeline: true }` is passed ([resources.md](references/resources.md#mongoose-9-migration-notes))
- In transactions, use `Model.create([data], { session })` (array form) ([transactions.md](examples/transactions.md) Pattern 3)
