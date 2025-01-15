# Infrastructure Layer

## Overview
The **Infrastructure Layer** is responsible for handling all technical concerns of the application. It provides implementations for the abstractions defined in the domain and application layers and manages external dependencies such as databases, APIs, file systems, and other third-party services.

This layer serves as the bridge between the application’s core logic and the outside world.

## Responsibilities
The Infrastructure Layer is responsible for:
1. **Persistence**: Managing the storage and retrieval of data, such as database interactions.
2. **External APIs**: Interfacing with third-party services and APIs.
3. **Messaging**: Handling message queues, pub/sub systems, or event-based communication.
4. **File Handling**: Reading and writing files to a filesystem or cloud storage.
5. **Configuration**: Managing environment-specific configurations and secrets.
6. **Cross-Cutting Concerns**: Logging, monitoring, and other utilities.

## Features in the Infrastructure Layer
The following components are typically part of this layer:

### 1. **Repository Implementations**
- Provide concrete implementations for the domain layer’s repository interfaces.
- Examples: `UserRepositoryPostgres`, `OrderRepositoryMongo`.

### 2. **API Clients**
- Interact with external systems or services.
- Examples: `PaymentGatewayClient`, `EmailServiceClient`.

### 3. **Message Brokers**
- Manage communication with message queues or pub/sub systems.
- Examples: `KafkaProducer`, `RabbitMQSubscriber`.

### 4. **Persistence Adapters**
- Abstract database interactions into manageable units.
- Examples: ORM integrations like `Prisma`, `TypeORM`, or raw SQL adapters.

### 5. **File Storage**
- Handle operations like uploading, downloading, and managing files.
- Examples: `S3FileStorage`, `LocalFileStorage`.

### 6. **Logging and Monitoring**
- Implement centralized logging mechanisms and monitoring integrations.
- Examples: `WinstonLogger`, `DatadogIntegration`.

### 7. **Configuration Management**
- Load and manage environment variables and configuration files.
- Examples: `dotenv`, `AWS Secrets Manager`.

## What Should NOT Be in the Infrastructure Layer
- **Business Rules**: These belong in the domain layer (e.g., domain models, entities, value objects).
- **Application Logic**: Workflows or processes belong in the application layer (e.g., use cases).
- **UI Logic**: Presentation concerns belong in the user interface or presentation layer.

## Examples

### Example Repository Implementation
```typescript
class UserRepositoryPostgres implements UserRepository {
  constructor(private readonly db: Pool) {}

  async findById(id: string): Promise<User | null> {
    const result = await this.db.query('SELECT * FROM users WHERE id = $1', [id]);
    if (result.rows.length === 0) return null;
    return new User(result.rows[0].id, result.rows[0].name);
  }

  async save(user: User): Promise<void> {
    await this.db.query('INSERT INTO users (id, name) VALUES ($1, $2)', [user.id, user.name]);
  }
}
```

### Example API Client
```typescript
class PaymentGatewayClient {
  constructor(private readonly httpClient: HttpClient) {}

  async chargeCustomer(customerId: string, amount: number): Promise<void> {
    await this.httpClient.post('/charge', { customerId, amount });
  }
}
```

### Example Configuration Loader
```typescript
class ConfigService {
  get(key: string): string {
    return process.env[key] || '';
  }
}
```

## Best Practices

* Follow Interface Segregation: Adhere to contracts defined in the domain or application layers.
* Abstract Dependencies: Use dependency injection to ensure infrastructure components are replaceable and testable.
* Centralize Configurations: Keep configurations environment-specific and out of the core codebase.
* Test Integrations: Use integration tests to ensure the infrastructure components work as expected.
* Avoid Business Logic: Keep the focus on technical implementations, deferring all business logic to the domain and application layers.