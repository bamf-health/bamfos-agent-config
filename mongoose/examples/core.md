# Mongoose - Core Examples

> Connection, schema definition, JSDoc typing, model creation, CRUD, and validation. See [SKILL.md](../SKILL.md) for core concepts.

**Middleware & lifecycle:** See [middleware.md](middleware.md). **Population & relationships:** See [population.md](population.md). **Transactions & advanced:** See [transactions.md](transactions.md).

---

## Pattern 1: Connection Setup

### Good Example -- Production Connection

```javascript
import mongoose from 'mongoose';

const POOL_SIZE_MAX = 10;
const POOL_SIZE_MIN = 2;
const SERVER_SELECTION_TIMEOUT_MS = 5000;
const SOCKET_TIMEOUT_MS = 45000;

/**
 * @returns {Promise<typeof mongoose>}
 */
async function connectDatabase() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI environment variable is required');
  }

  try {
    const connection = await mongoose.connect(uri, {
      maxPoolSize: POOL_SIZE_MAX,
      minPoolSize: POOL_SIZE_MIN,
      serverSelectionTimeoutMS: SERVER_SELECTION_TIMEOUT_MS,
      socketTimeoutMS: SOCKET_TIMEOUT_MS,
      retryWrites: true,
      retryReads: true,
    });

    console.log(`Connected to MongoDB: ${mongoose.connection.name}`);

    return connection;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

export {connectDatabase};
```

**Why good:** Environment variable for URI, named constants for all numeric values, try/catch for initial connection, JSDoc-documented return type

### Good Example -- Connection Events and Graceful Shutdown

```javascript
function setupConnectionEvents() {
  mongoose.connection.on('connected', () => {
    console.log('MongoDB connected');
  });

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected');
  });
}

async function disconnectDatabase() {
  await mongoose.connection.close();
  console.log('MongoDB connection closed');
}

process.on('SIGINT', async() => {
  await disconnectDatabase();
  process.exit(0);
});

export {setupConnectionEvents, disconnectDatabase};
```

**Why good:** Handles all critical lifecycle events, different log levels for severity, graceful shutdown on SIGINT

### Good Example -- Multiple Connections (Multi-Database)

```javascript
import mongoose from 'mongoose';

// createConnection() returns a separate Connection object
// Each connection has its own pool, models, and middleware
const primaryDb = await mongoose
.createConnection(process.env.PRIMARY_MONGODB_URI)
.asPromise();

const analyticsDb = await mongoose
.createConnection(process.env.ANALYTICS_MONGODB_URI)
.asPromise();

const User = primaryDb.model('User', userSchema);
const AnalyticsEvent = analyticsDb.model('AnalyticsEvent', eventSchema);

export {User, AnalyticsEvent};
```

**Why good:** Separate pools for different workloads, `.asPromise()` for await support, models explicitly bound to connections

### Bad Example -- Hardcoded Connection

```javascript
// BAD: Everything wrong
mongoose.connect('mongodb://admin:password123@localhost:27017/mydb');
```

**Why bad:** Hardcoded credentials in source code, `localhost` fails on Node.js 18+ (IPv6 preference), no pool configuration, no error handling

---

## Pattern 2: Schema Definition with Validation

### Good Example -- Complete Schema

```javascript
import {Schema, model} from 'mongoose';

const MIN_NAME_LENGTH = 2;
const MAX_NAME_LENGTH = 100;
const MIN_PRICE = 0;
const SKU_PATTERN = /^[A-Z]{2}-\d{6}$/;

const productSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    minlength: [
      MIN_NAME_LENGTH,
      `Name must be at least ${MIN_NAME_LENGTH} characters`,
    ],
    maxlength: [
      MAX_NAME_LENGTH,
      `Name must be at most ${MAX_NAME_LENGTH} characters`,
    ],
    trim: true,
    index: true,
  },
  sku: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    match: [SKU_PATTERN, 'SKU must match format XX-000000'],
  },
  price: {
    type: Number,
    required: true,
    min: [MIN_PRICE, 'Price cannot be negative'],
    validate: {
      validator: (v) => Number.isFinite(v),
      message: 'Price must be a finite number',
    },
  },
  category: {
    type: String,
    required: true,
    enum: {
      values: ['electronics', 'clothing', 'food', 'books'],
      message: '{VALUE} is not a valid category',
    },
  },
  tags: {type: [String], default: []},
  specifications: {type: Map, of: Schema.Types.Mixed},
  isActive: {type: Boolean, default: true},
},
{
  timestamps: true,
  toJSON: {virtuals: true},
  toObject: {virtuals: true},
});

const Product = model('Product', productSchema);

export {Product, productSchema};
```

**Why good:** Named constants for validation limits, custom error messages on every validator, trim/uppercase transforms, Map for flexible key-value data, schema options for timestamps and virtual serialization

### Good Example -- Subdocument Schema

```javascript
import {Schema, model} from 'mongoose';

const addressSchema = new Schema(
  {
    street: {type: String, required: true},
    city: {type: String, required: true},
    state: {type: String, required: true},
    zipCode: {type: String, required: true, match: /^\d{5}(-\d{4})?$/},
    country: {type: String, default: 'US'},
  },
  {_id: false}
);

const customerSchema = new Schema(
  {
    name: {type: String, required: true},
    email: {type: String, required: true, unique: true, lowercase: true},
    shippingAddress: {type: addressSchema, required: true},
    billingAddress: {type: addressSchema},
    addresses: {
      type: [addressSchema],
      validate: {
        validator: (v) => v.length <= 10,
        message: 'Maximum 10 addresses allowed',
      },
    },
  },
  {timestamps: true},
);

const Customer = model('Customer', customerSchema);

export {Customer, customerSchema, addressSchema};
```

**Why good:** Reusable subdocument schema, `{ _id: false }` avoids unnecessary ObjectIds on embedded documents, array-level validation to bound the array size, schema reused for both shipping and billing

### Bad Example -- No Validation

```javascript
// BAD: No validation, no constraints
const userSchema = new Schema({
  name: String,
  email: String,
  age: Number,
  role: String,
});
```

**Why bad:** No `required` constraints (all fields optional), no validation rules, no enum for role, no custom error messages, no trim/lowercase transforms

---

## Pattern 3: Documenting Schemas with JSDoc

Mongoose does not require types at runtime, but documenting your schemas with JSDoc gives editors and tooling useful intellisense without the overhead of TypeScript. Define a `@typedef` per document shape and reference it from the functions and methods that consume documents.

### Good Example -- Simple Model with JSDoc

```javascript
import {Schema, model} from 'mongoose';

const blogPostSchema = new Schema(
  {
    title: {type: String, required: true},
    slug: {type: String, required: true, unique: true},
    content: {type: String, required: true},
    authorId: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    tags: [{type: String}],
    isPublished: {type: Boolean, default: false},
    viewCount: {type: Number, default: 0},
  },
  {timestamps: true},
);

/**
 * @typedef {object} BlogPostDoc
 * @property {string} title
 * @property {string} slug
 * @property {string} content
 * @property {import('mongoose').Types.ObjectId} authorId
 * @property {string[]} [tags]
 * @property {boolean} [isPublished]
 * @property {number} [viewCount]
 * @property {Date} [createdAt]
 * @property {Date} [updatedAt]
 */

const BlogPost = model('BlogPost', blogPostSchema);

export {BlogPost, blogPostSchema};
```

**Why good:** No type duplication at runtime, JSDoc `@typedef` documents the shape for editors, optional fields marked with `[brackets]`, ObjectId references use the `Types.ObjectId` runtime type

### Good Example -- Methods, Statics, and Virtuals (JSDoc-Annotated)

```javascript
import {Schema, model} from 'mongoose';

const SALT_ROUNDS = 12;

/**
 * @typedef {object} UserDoc
 * @property {string} email
 * @property {string} passwordHash
 * @property {string} firstName
 * @property {string} lastName
 * @property {'admin' | 'user' | 'moderator'} [role]
 * @property {Date} [lastLoginAt]
 */

const userSchema = new Schema(
  {
    email: {type: String, required: true, unique: true, lowercase: true},
    passwordHash: {type: String, required: true},
    firstName: {type: String, required: true, trim: true},
    lastName: {type: String, required: true, trim: true},
    role: {
      type: String,
      enum: ['admin', 'user', 'moderator'],
      default: 'user',
    },
    lastLoginAt: {type: Date},
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        delete ret.passwordHash; // Never expose password hash

        return ret;
      },
    },
  },
);

/**
 * Compare a candidate password to the stored hash.
 * @this {import('mongoose').HydratedDocument<UserDoc>}
 * @param {string} candidate
 * @returns {Promise<boolean>}
 */
userSchema.methods.comparePassword = async function(candidate) {
  // Use bcrypt.compare(candidate, this.passwordHash) in production
  return candidate === this.passwordHash;
};

/**
 * Update the user's last login timestamp.
 * @this {import('mongoose').HydratedDocument<UserDoc>}
 * @returns {Promise<void>}
 */
userSchema.methods.updateLastLogin = async function() {
  this.lastLoginAt = new Date();
  await this.save();
};

userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

/**
 * Find a user by email (case-insensitive).
 * @param {string} email
 * @returns {Promise<import('mongoose').HydratedDocument<UserDoc> | null>}
 */
userSchema.statics.findByEmail = function(email) {
  return this.findOne({email: email.toLowerCase()});
};

// Middleware -- MUST be defined BEFORE model()
userSchema.pre('save', async function() {
  if (this.isModified('passwordHash')) {
    // Hash password here (e.g., bcrypt.hash(this.passwordHash, SALT_ROUNDS))
  }
});

// model() -- AFTER all middleware, methods, virtuals, and statics
const User = model('User', userSchema);

export {User, userSchema};
```

**Why good:** JSDoc `@typedef` and `@this` annotations give editor intellisense without compile-time overhead, password is excluded from JSON output, middleware registered before `model()`, named constants for tunable values

### Bad Example -- Undocumented, Unconstrained Schema

```javascript
// BAD: No JSDoc, no validation, no constraints
const productSchema = new Schema({
  name: String, // optional, no rules
  price: Number, // no minimum, no validator
});
```

**Why bad:** No `required` constraints, no validation, and no JSDoc means editors cannot infer the document shape and consumers cannot tell what is mandatory

---

## Pattern 4: ObjectId References

### Good Example -- ObjectId Foreign Keys

```javascript
import {Schema, model} from 'mongoose';

const MAX_COMMENT_LENGTH = 5000;

const commentSchema = new Schema(
  {
    postId: {
      type: Schema.Types.ObjectId, // Schema.Types.ObjectId in schema definition
      ref: 'BlogPost',
      required: true,
      index: true,
    },
    authorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
    }, // Self-reference for threads
    content: {type: String, required: true, maxlength: MAX_COMMENT_LENGTH},
    likes: {type: Number, default: 0},
  },
  {timestamps: true},
);

commentSchema.index({postId: 1, createdAt: -1});

const Comment = model('Comment', commentSchema);

export {Comment, commentSchema};
```

**Why good:** `Schema.Types.ObjectId` in schema (not `Types.ObjectId`), `ref` for populate support, indexes on foreign keys, compound index for common query, named constant for the maximum length

### Bad Example -- Wrong ObjectId Type

```javascript
import {Types} from 'mongoose';

// BAD: Using Types.ObjectId in schema definition
const schema = new Schema({
  userId: {type: Types.ObjectId, ref: 'User'}, // WRONG type for schema
});
```

**Why bad:** `Types.ObjectId` is the runtime constructor used to create ObjectId values. `Schema.Types.ObjectId` is the correct type for schema definitions.

---

## Pattern 5: CRUD Operations

### Good Example -- Create

```javascript
// Single document -- triggers pre('save') middleware
const user = await User.create({
  name: 'Alice',
  email: 'alice@example.com',
  role: 'admin',
});

// Bulk insert -- triggers insertMany middleware, NOT save middleware
const BATCH_SIZE = 1000;
const users = generateUsers(BATCH_SIZE);

await User.insertMany(users, {ordered: false});
// ordered: false continues inserting after errors (skips duplicates)
```

### Good Example -- Read with Lean

```javascript
const PAGE_SIZE = 20;

const user = await User.findById(id).lean();

const activeAdmins = await User.find({role: 'admin', isActive: true})
.select('name email role')
.sort({name: 1})
.limit(PAGE_SIZE)
.lean();
```

**Why good:** `.lean()` for read-only responses (3x memory savings), `.select()` for projection, named constant for page size

### Good Example -- Update

```javascript
// Update with save() -- triggers pre('save') middleware
const user = await User.findById(id);

if (!user) {
  throw new Error(`User not found: ${id}`);
}
user.name = 'Updated Name';
await user.save();

// Direct update -- does NOT trigger save middleware
await User.findByIdAndUpdate(
  id,
  {$set: {name: 'Updated'}},
  {new: true, runValidators: true},
);

await User.updateMany(
  {isActive: false},
  {$set: {archivedAt: new Date()}},
);
```

**Why good:** `save()` when middleware matters, `{ new: true }` returns updated document, `{ runValidators: true }` enforces schema validation on direct updates

### Good Example -- Delete

```javascript
await User.findByIdAndDelete(id);

const DAYS_TO_KEEP = 30;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const cutoffDate = new Date(Date.now() - DAYS_TO_KEEP * MS_PER_DAY);

await User.deleteMany({isActive: false, archivedAt: {$lt: cutoffDate}});
```

### Bad Example -- Lean Then Save

```javascript
// BAD: lean() returns plain objects -- no Mongoose methods
const user = await User.findById(id).lean();

user.name = 'Updated';
await user.save(); // TypeError: user.save is not a function
```

**Why bad:** `.lean()` returns plain JavaScript objects without Mongoose methods. Cannot call `.save()`, `.populate()`, or any instance method.

### Bad Example -- Missing runValidators

```javascript
// BAD: Schema validation skipped on direct updates by default
await User.findByIdAndUpdate(id, {
  $set: {email: 'not-an-email'}, // No validation! Saves invalid data
});
```

**Why bad:** `findByIdAndUpdate` skips schema validation by default. Always pass `{ runValidators: true }` to enforce validation on direct updates.

---

## Pattern 6: Schema Options

### Good Example -- Comprehensive Options

```javascript
const auditLogSchema = new Schema(
  {
    action: {type: String, required: true},
    userId: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    resource: {type: String, required: true},
    details: {type: Schema.Types.Mixed},
  },
  {
    timestamps: true,
    toJSON: {virtuals: true, versionKey: false},
    toObject: {virtuals: true},
    optimisticConcurrency: true,
    collection: 'audit_logs',
    autoIndex: process.env.NODE_ENV !== 'production',
  },
);

export {auditLogSchema};
```

**Why good:** Virtuals in serialization, version key hidden from JSON, optimistic concurrency for safe concurrent updates, explicit collection name, autoIndex disabled in production (create indexes via migration scripts instead)

---

_For middleware patterns, see [middleware.md](middleware.md). For population, see [population.md](population.md). For transactions, see [transactions.md](transactions.md)._
