# Application Layer

## Overview
The **Application Layer** is a crucial part of the Clean Architecture pattern. It acts as a mediator between the domain layer (business logic) and external interfaces, such as the user interface or infrastructure. This layer orchestrates use cases and ensures that the core domain logic is applied consistently across the system.

## Responsibilities
The Application Layer is responsible for:
1. **Orchestrating Use Cases**: Implementing application-specific business rules that use the domain layer to achieve specific outcomes.
2. **Managing Application Logic**: Handling workflows, tasks, or processes that don’t belong in the domain or infrastructure layers.
3. **Facilitating Communication**: Acting as the glue between the domain layer and the outer layers (UI, infrastructure, etc.).
4. **Data Transformation**: Converting data between external representations (DTOs) and domain models.
5. **Enforcing Security and Validation**: Ensuring role-based access control (RBAC), input validation, and any application-level policies.

## Features in the Application Layer
The following are common features you should find in this layer:

### 1. **Use Cases (Interactors)**
- Define specific workflows or operations (e.g., `CreateOrder`, `CalculateDiscount`).
- Encapsulate the steps required to execute a business process.
- Ensure domain objects remain unpolluted by application-specific concerns.

### 2. **DTOs (Data Transfer Objects)**
- Used for transferring data to and from the application layer.
- Simplify data exchange between the application and presentation layers.
- Should not include any business logic.

### 3. **Services**
- Handle non-domain-specific processes like notifications, scheduling, or interactions with APIs.
- Stay focused on application-level concerns without embedding business rules.

### 4. **Validators**
- Validate input data before passing it to use cases.
- Ensure that invalid data does not propagate into the system.

### 5. **Authorization**
- Implement role-based or permission-based access control for use cases.

## What Should NOT Be in the Application Layer
- **Business Rules**: These belong in the domain layer (e.g., domain models, entities, value objects).
- **Infrastructure Concerns**: Interactions with databases, APIs, or external systems should be delegated to the infrastructure layer.

## Examples
### Example Use Case: `CreateOrder`
```typescript
class CreateOrderUseCase {
  constructor(private orderRepository: OrderRepository, private paymentService: PaymentService) {}

  async execute(input: CreateOrderInput): Promise<CreateOrderOutput> {
    const { customerId, items } = input;

    // Validate input
    if (!items || items.length === 0) {
      throw new Error("Order must have at least one item.");
    }

    // Perform domain operations
    const order = Order.create({ customerId, items });
    await this.orderRepository.save(order);

    // Trigger application-level logic
    await this.paymentService.chargeCustomer(customerId, order.total);

    return { orderId: order.id, status: "success" };
  }
}
```

### Example DTO: `CreateOrderInput`
```typescript
interface CreateOrderInput {
  customerId: string;
  items: { productId: string; quantity: number }[];
}

interface CreateOrderOutput {
  orderId: string;
  status: string;
}
```

### Best Practices

* Keep It Simple: Each use case should focus on a single application workflow.
* Leverage Dependency Injection: Avoid tightly coupling use cases to implementations of repositories or services.
* Test Thoroughly: The application layer should have extensive test coverage to ensure workflows function as expected.