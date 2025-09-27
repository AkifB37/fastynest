# fastynest Framework

⚠️ **EXPERIMENTAL - ALPHA VERSION** ⚠️

A powerful TypeScript decorator-based web framework built on top of Fastify. This framework provides a clean, modern approach to building REST APIs with built-in validation, authentication, file upload handling, and middleware management.

## Features

- 🚀 **Decorator-based routing** - Clean and intuitive route definitions
- 🛡️ **Built-in authentication & guards** - Flexible security layer
- 📋 **Zod validation** - Type-safe request/response validation
- 📁 **File upload handling** - Single and multiple file uploads with validation
- 🔧 **Global middleware** - Framework-wide request/response handling
- 🏷️ **Custom headers** - Per-route and class-level header management
- ⚡ **Fastify powered** - High performance HTTP server

## Quick Start

### 1. Basic Controller

```typescript
import { Get, Post, Body, Query, Params } from './src/lib/framework';
import { z } from 'zod';

class UserController {
  @Get('/users')
  async getAllUsers() {
    return { users: ['John', 'Jane'] };
  }

  @Get('/users/:id')
  async getUser(@Params(z.object({ id: z.string() })) params: any) {
    const { id } = params;
    return { user: { id, name: 'John Doe' } };
  }

  @Post('/users')
  @Body(z.object({
    name: z.string().min(2),
    email: z.string().email()
  }))
  async createUser(req, reply) {
    const { name, email } = req.body;
    return { user: { id: '123', name, email } };
  }
}
```

### 2. Register Controller

```typescript
import Fastify from 'fastify';
import { registerController } from './src/lib/framework';

const app = Fastify();

// Register single controller
registerController(app, UserController, '/api');

app.listen({ port: 3000 }, () => {
  console.log('Server running on port 3000');
});
```

## API Reference

### HTTP Method Decorators

```typescript
@Get(path?: string)
@Post(path?: string)
@Put(path?: string)
@Delete(path?: string)
@Patch(path?: string)
```

**Example:**
```typescript
class ProductController {
  @Get('/products')
  async list() { /* ... */ }

  @Post('/products')
  async create() { /* ... */ }

  @Put('/products/:id')
  async update() { /* ... */ }

  @Delete('/products/:id')
  async delete() { /* ... */ }
}
```

### Validation Decorators

```typescript
@Body(schema: ZodSchema)     // Validate request body
@Query(schema: ZodSchema)    // Validate query parameters
@Params(schema: ZodSchema)   // Validate route parameters
```

**Example:**
```typescript
const CreateProductSchema = z.object({
  name: z.string().min(1),
  price: z.number().positive(),
  category: z.string()
});

const QuerySchema = z.object({
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional()
});

class ProductController {
  @Post('/products')
  async createProduct(
    @Body(CreateProductSchema) body: any,
    @Query(QuerySchema) query: any
  ) {
    // body is typed and validated
    // query is typed and validated
    const { name, price, category } = body;
    const { page = 1, limit = 10 } = query;

    return { product: { id: '123', name, price, category } };
  }
}
```

### Authentication & Guards

```typescript
@AuthGuard()           // Default Bearer token validation
@AuthGuard(customFn)   // Custom auth function
@UseGuard(guardFn)     // Custom guard function
```

**Example:**
```typescript
// Custom auth guard
const apiKeyGuard = async (req, reply) => {
  const apiKey = req.headers['x-api-key'];
  return apiKey === 'valid-api-key';
};

// Admin role guard
const adminGuard = async (req, reply) => {
  const user = req.user; // Assuming user is set by auth middleware
  return user && user.role === 'admin';
};

@AuthGuard() // Apply to entire class
class UserController {
  @Get('/users')
  async getUsers() { /* Only authenticated users */ }

  @Delete('/users/:id')
  @UseGuard(adminGuard) // Additional guard for this route
  async deleteUser() { /* Only admin users */ }
}
```

### File Upload

```typescript
@FileUpload(config)                    // Custom file upload configuration
@SingleFile(fieldName, options)       // Single file upload
@MultipleFiles(options)                // Multiple files upload
```

**Single File Upload:**
```typescript
class FileController {
  @Post('/upload')
  @SingleFile('document', {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'application/pdf']
  })
  async uploadFile(req, reply) {
    const file = req.file; // UploadedFile object
    const formData = req.body; // Other form fields

    console.log('File info:', {
      filename: file.filename,
      size: file.size,
      mimetype: file.mimetype
    });

    // Process file.buffer
    return { message: 'File uploaded successfully', filename: file.filename };
  }
}
```

**Multiple Files Upload:**
```typescript
class FileController {
  @Post('/upload-multiple')
  @MultipleFiles({
    maxFiles: 5,
    maxFileSize: 2 * 1024 * 1024, // 2MB per file
    allowedMimeTypes: ['image/*']
  })
  async uploadMultiple(req, reply) {
    const files = req.files; // Array of UploadedFile
    const formData = req.body; // Other form fields

    return {
      message: `${files.length} files uploaded`,
      files: files.map(f => ({ name: f.filename, size: f.size }))
    };
  }
}
```

### Headers

```typescript
@Header(key, value)                    // Single header
@Headers({ key1: value1, key2: value2 }) // Multiple headers
```

**Example:**
```typescript
@Headers({
  'X-API-Version': '1.0',
  'Cache-Control': 'no-cache'
})
class APIController {
  @Get('/data')
  @Header('Content-Type', 'application/json')
  async getData() {
    return { data: 'example' };
  }
}
```

### Global Handlers (Middleware)

Global handlers execute before route handlers and can be used for logging, authentication, rate limiting, etc.

```typescript
import { registerGlobalHandler, removeGlobalHandler } from './src/lib/framework';

// Logging middleware
registerGlobalHandler('logger', {
  handler: async (req, reply) => {
    console.log(`${req.method} ${req.url}`);
    return true; // Continue to next handler
  },
  priority: 100 // Higher priority executes first
});

// Rate limiting middleware
registerGlobalHandler('rateLimit', {
  handler: async (req, reply) => {
    // Rate limiting logic
    const isAllowed = checkRateLimit(req.ip);
    if (!isAllowed) {
      reply.status(429).send({ error: 'Rate limit exceeded' });
      return false; // Stop execution
    }
    return true;
  },
  methods: ['POST', 'PUT', 'DELETE'], // Only for these methods
  skipRoutes: ['/health', '/status'] // Skip these routes
});

// Remove handler when needed
removeGlobalHandler('rateLimit');
```

## Advanced Examples

### Complete CRUD Controller

```typescript
import {
  Get, Post, Put, Delete, Body, Query, Params,
  AuthGuard, UseGuard, Header
} from './src/lib/framework';
import { z } from 'zod';

const UserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  age: z.number().min(18).optional()
});

const UpdateUserSchema = UserSchema.partial();

const UserParamsSchema = z.object({
  id: z.string().uuid()
});

const QueryParamsSchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('10'),
  search: z.string().optional()
});

@AuthGuard()
@Header('X-Service', 'UserService')
class UserController {
  @Get('/users')
  @Query(QueryParamsSchema)
  async getUsers(req, reply) {
    const { page, limit, search } = req.query;
    // Fetch users with pagination and search
    return {
      users: [],
      pagination: { page, limit, total: 0 }
    };
  }

  @Get('/users/:id')
  async getUser(@Params(UserParamsSchema) params: any) {
    const { id } = params;
    // Fetch user by ID
    return { user: { id, name: 'John Doe' } };
  }

  @Post('/users')
  @Body(UserSchema)
  async createUser(req, reply) {
    const userData = req.body;
    // Create new user
    reply.status(201);
    return { user: { id: 'new-id', ...userData } };
  }

  @Put('/users/:id')
  async updateUser(
    @Params(UserParamsSchema) params: any,
    @Body(UpdateUserSchema) body: any
  ) {
    const { id } = params;
    const updates = body;
    // Update user
    return { user: { id, ...updates } };
  }

  @Delete('/users/:id')
  @UseGuard(adminGuard)
  async deleteUser(@Params(UserParamsSchema) params: any, reply) {
    const { id } = params;
    // Delete user (admin only)
    reply.status(204);
    return;
  }
}
```

### Error Handling

The framework provides built-in error responses:

```typescript
import { createErrorResponse } from './src/lib/framework';

class UserController {
  @Get('/users/:id')
  async getUser(req, reply) {
    const user = await findUser(req.params.id);

    if (!user) {
      reply.status(404).send(
        createErrorResponse('User not found')
      );
      return;
    }

    return { user };
  }
}
```

### Multiple Controllers Registration

```typescript
import { registerControllers } from './src/lib/framework';

const app = Fastify();

registerControllers(app, [
  { controller: UserController, prefix: '/api/v1' },
  { controller: ProductController, prefix: '/api/v1' },
  { controller: FileController, prefix: '/api/v1' }
]);
```

## TypeScript Support

The framework is fully typed with TypeScript. All decorators and types are exported:

```typescript
import type {
  RouteHandler,
  GuardFunction,
  FileUploadConfig,
  UploadedFile,
  GlobalHandlerConfig
} from './src/lib/framework';
```

## Best Practices

1. **Use Zod schemas** for all validation to ensure type safety
2. **Implement proper error handling** in route handlers
3. **Use guards** for authentication and authorization
4. **Leverage global handlers** for cross-cutting concerns
5. **Keep controllers focused** on a single resource or domain
6. **Use meaningful HTTP status codes** in responses

This framework provides a robust foundation for building scalable REST APIs with TypeScript, combining the performance of Fastify with the developer experience of decorators and strong typing.
