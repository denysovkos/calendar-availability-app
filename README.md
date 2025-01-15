# Service template

## Overview
This project is built using TypeScript and JavaScript, and it leverages AWS CDK for infrastructure as code. The project includes various stacks for deploying services, databases, and other resources.

## Prerequisites
1. **Node.js** <img src="https://nodejs.org/static/images/logo.svg" alt="Node.js" width="35"/>
2. **Yarn** <img src="https://raw.githubusercontent.com/yarnpkg/assets/master/yarn-kitten-full.png" alt="Yarn" width="35"/>
3. **AWS CLI** <img src="https://a0.awsstatic.com/libra-css/images/logos/aws_logo_smile_1200x630.png" alt="AWS CLI" width="30"/>
4. **Docker** <img src="https://www.docker.com/wp-content/uploads/2022/03/Moby-logo.png" alt="Docker" width="20"/>


## Usage

A template repository allows you to create a new repository with the same structure, files, and settings as the template. Follow these steps to get started:

## Steps to Create a New Repository from a Template

1. **Go to the Template Repository**  
   Navigate to the template repository on GitHub. For example: [Template Repository](https://github.com/owner/template-repo).

2. **Click the "Use this template" Button**  
   In the top-right corner of the repository page, click the green **"Use this template"** button.

3. **Set Up Your New Repository**
    - In the pop-up window, enter the name of your new repository.
    - (Optional) Add a description for your repository.
    - Choose whether the repository should be public or private.

4. **Click "Create Repository from Template"**  
   This will create a new repository in your account with the contents of the template.


## Configuration
### How to configure service in `infrastructure/bin/config.ts`
1. Set the deployment stage:
```typescript
const stage = process.env.STAGE;
```

2. Service name will be loaded from .git folder, hence you don't need to set it manually.

3. Configure the stack:
```typescript
export const config: StackConfig = {
    graphql: false, // Set to true when you need to enable GraphQL
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION,
        stage,
        isFeature: isFeatureEnvironment(stage),
    },
    serviceName: SERVICE_NAME,
    databases: {
        postgres: false, // Make true when you need to enable Postgres
        dynamo: false // Make true when you need to enable DynamoDB
    },
    domain: '',  // Optional (used as {domain}.{hostedZoneName}, e.g. domain.atlas-metrics.com)
    vpc: undefined
};
```

## Deployment

Run the command:
```bash
AWS_PROFILE=<profile> AWS_ACCOUNT=<account> AWS_REGION=eu-central-1 STAGE=<stage> GITHUB_PACKAGE_TOKEN=<token> cdk deploy --all --require-approval never --method=direct
```

## Stacks Description
### ECR Stack
The `EcrStack` creates an ECR repository with image scanning and lifecycle rules.

### RDS Stack
The `RdsStack` creates an RDS database if enabled in the configuration.
After the database is created, the stack will create a password in Secrets Manager.
Credentials will be automatically passed into docker containers:
```
process.env.DB_HOST
process.env.DB_PORT
process.env.DB_DATABASE
process.env.DB_USER
process.env.DB_PASSWORD
```

### DynamoDB Stack
The `DynamoStack` creates a DynamoDB table if enabled in the configuration.
Credentials will be automatically passed into docker containers:
```
process.env.DYNAMODB_TABLE
```

### Domain Stack
The `DomainStack` sets up a domain if configured.

### GraphQL Stack
The `GraphqlStack` sets up a GraphQL API if enabled.

### VPC Stack
The `VpcStack` creates a VPC for the application.

### Docker Image Deployment Stack
The `DockerImageDeploymentStack` builds and pushes a Docker image to the ECR repository.

### ECS Container Stack
The `EcsContainerStack` sets up an ECS Fargate service with load balancing, environment variables, and scaling policies.

## Clean Architecture
Clean Architecture is a software design philosophy that separates the elements of a design into ring levels. This approach emphasizes the separation of concerns, making the system easier to maintain and test.

### Project Structure
```plaintext
src/
├── application/             # Core application (Domain & Use Case layers)
│   ├── domain/              # Business entities and rules
│   └── usecases/            # Application services/use cases
├── presentation/            # Handles external interaction
│   ├── controllers/         # HTTP controllers (define routes, validation)
│   ├── resolvers/           # GQL resolvers and mutations
│   ├── viewmodels/          # Data transformations for external systems
│   └── openapi/             # OpenAPI schema definitions or generation logic
├── infrastructure/          # Frameworks, tools, and external details
│   ├── http/                # HTTP server setup (e.g., Fastify)
│   │   └── swagger-tools/   # Middleware for Swagger UI or schema generation
│   ├── graphql/             # GQL server setup (e.g., Fastify + Apollo)
│   └── database/            # DB connectors or ORMs
```

### Healthcheck route
By default, AWS use `/` as a healthcheck route. For both (http and gql) servers it is already implemented, so it mandatory to execute `Server`
class method: `.setHealthcheck()`

