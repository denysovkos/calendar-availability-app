# Presentation Layer

## Overview
The **Presentation Layer** is responsible for interacting with users or external clients. It handles how data is presented, user inputs are received, and application workflows are initiated. This layer communicates with the application layer to execute use cases and render results.

The presentation layer ensures that the user interface (UI) or external interface is decoupled from the core business logic, promoting flexibility and maintainability.

## Responsibilities
The Presentation Layer is responsible for:
1. **Rendering Data**: Formatting and displaying data to users or external systems.
2. **Handling Input**: Validating and processing user or client inputs.
3. **Triggering Use Cases**: Initiating application workflows via use cases.
4. **Error Handling**: Managing and displaying errors in a user-friendly manner.
5. **State Management**: Keeping track of the UI or external system's state.

## Features in the Presentation Layer
The following components are commonly found in the presentation layer:

### 1. **Controllers**
- Handle incoming requests (e.g., HTTP, CLI, or events) and forward them to the appropriate use case.
- Convert responses from the application layer into a format suitable for the client.

### 2. **Views or UI Components**
- Render data for the user in a meaningful way (e.g., web pages, mobile app screens).
- Handle user interactions like button clicks or form submissions.

### 3. **Presenters (Optional)**
- Prepare data for rendering, transforming raw application responses into UI-friendly formats.
- Serve as a middle layer between controllers and views.

### 4. **Request/Response Models**
- Define the structure of data exchanged between the presentation and application layers.
- Examples: `HTTP request/response`, `GraphQL queries/mutations`.

### 5. **Error Handling**
- Provide user-friendly error messages and fallback mechanisms.
- Examples: Displaying a "Something went wrong" page or retrying failed operations.

### 6. **State Management**
- Manage UI state or client-specific state.
- Examples: Frontend state management libraries like Redux or Vuex.

## What Should NOT Be in the Presentation Layer
- **Business Rules**: These belong in the domain layer (e.g., domain models, entities).
- **Application Logic**: Workflows and processes should reside in the application layer (e.g., use cases).
- **Infrastructure Concerns**: Database, file handling, or third-party integrations belong in the infrastructure layer.

## Examples

### Example Controller (REST API)
```typescript
class UserController {
  constructor(private readonly getUserUseCase: GetUserUseCase) {}

  async handleRequest(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.id;
      const user = await this.getUserUseCase.execute({ userId });
      res.status(200).json(user);
    } catch (error) {
      res.status(500).json({ error: 'An unexpected error occurred' });
    }
  }
}
```

### Example Presenter
```typescript
class UserPresenter {
  static toView(user: User): any {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
    };
  }
}
```

## Best Practices

* Keep It Decoupled: Avoid embedding business logic in controllers or UI components.
* Focus on the User: Ensure a seamless user experience with clear feedback and error messages.
* Test Extensively: Use unit and integration tests for controllers, views, and state management logic.
* Use DTOs: Isolate the presentation layer from domain models by using request/response models or view models.
* Follow SRP: Ensure each component in this layer has a single responsibility.