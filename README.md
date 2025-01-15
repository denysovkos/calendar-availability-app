# Appointment Booking System

This project implements an appointment booking system that allows customers to schedule appointments with sales managers to discuss products like solar panels and heat pumps.

## Overview

The system provides an API endpoint that returns available appointment slots based on customer criteria:
- Language preference (German/English)
- Products of interest (SolarPanels/Heatpumps)
- Customer rating (Gold/Silver/Bronze)

### Key Features

- Finds available one-hour appointment slots
- Handles overlapping time slots (e.g., 10:30-11:30, 11:00-12:00, 11:30-12:30)
- Prevents double-booking of sales managers for overlapping slots
- Matches customers to sales managers based on language, products, and rating criteria
- Supports booking appointments for multiple products in one session

## Docker Deployment

You can run the application using Docker Compose, which will set up both the database and application containers.

### Prerequisites

- Docker
- Docker Compose

### Running with Docker Compose

1. Build and start both services:
```bash
docker compose up --build
```

2. Start in detached mode:
```bash
docker compose up -d
```

3. View logs:
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f app
docker compose logs -f db
```

4. Stop services:
```bash
docker compose down
```

### Available Services

After starting, the following services will be available:

- **API Application**: `http://localhost:3000`
    - API Documentation: `http://127.0.0.1:3000/api/docs`
    - OpenAPI Spec: `http://127.0.0.1:3000/api/docs/json`

- **Database**: `localhost:5432`
    - Database Name: `coding-challenge`

## Technical Implementation

## Prerequisites
1. **Node.js** <img src="https://nodejs.org/static/images/logo.svg" alt="Node.js" width="35"/>
2. **Yarn** <img src="https://raw.githubusercontent.com/yarnpkg/assets/master/yarn-kitten-full.png" alt="Yarn" width="35"/>
3. **AWS CLI** <img src="https://a0.awsstatic.com/libra-css/images/logos/aws_logo_smile_1200x630.png" alt="AWS CLI" width="30"/>
4. **Docker** <img src="https://www.docker.com/wp-content/uploads/2022/03/Moby-logo.png" alt="Docker" width="20"/>


##  The project is built using:
- TypeScript
- TypeORM for database interactions
- PostgreSQL for data storage
- Jest for testing

### Project Structure

```
src/
├── entities/
│   ├── salesManager.entity.ts
│   └── slot.entity.ts
├── infrastructure/
│   └── repositories/
│       ├── salesManager.repository.ts
│       └── slots.repository.ts
├── services/
│   └── managerAvailability.service.ts
└── tests/
    ├── main.test.ts
    ├── repositories/
    │   ├── salesManager.repository.test.ts
    │   └── slots.repository.test.ts
    └── services/
        └── managerAvailability.service.test.ts
```

## API Documentation

The API is documented using OpenAPI 3.0 specification and includes Swagger UI for interactive testing.

### Swagger UI Access

Access the Swagger UI documentation at:
```
http://127.0.0.1:3000/api/docs
```

### OpenAPI Specification

The OpenAPI specification is available at:
```
http://127.0.0.1:3000/api/docs/json
```

### API Endpoint

- **URL**: `http://localhost:3000/calendar/query`
- **Method**: POST
- **Request Body**:
```json
{
    "date": "2024-05-03",
    "products": ["SolarPanels", "Heatpumps"],
    "language": "German",
    "rating": "Gold"
}
```
- **Response**:
```json
[
    {
        "start_date": "2024-05-03T10:30:00.000Z",
        "available_count": 1
    },
    {
        "start_date": "2024-05-03T11:00:00.000Z",
        "available_count": 1
    }
]
```

### Implementation Approaches

The service provides two implementation methods:

1. **DB-Only Implementation** (`getAvailabilityFromDB`):
    - Uses a single complex SQL query
    - More efficient for large datasets
    - Handles all logic at the database level

2. **Runtime Implementation** (`getAvailabilityInRuntime`):
    - Processes data in TypeScript
    - More flexible for business logic changes
    - Easier to debug and modify

## Getting Started

### Prerequisites

- Node.js
- Docker
- PostgreSQL (if not using Docker)

### Setup

1. Clone the repository:
```bash
git clone <repository-url>
```

2. Install dependencies:
```bash
yarn install
```

3. Start the database using Docker:
```bash
cd database
docker build -t enpal-coding-challenge-db .
docker run --name enpal-coding-challenge-db -p 5432:5432 -d enpal-coding-challenge-db
```

4. Run the tests:
```bash
yarn test
```

### Database Connection

Default connection string:
```
postgres://postgres:mypassword123!@localhost:5432/coding-challenge
```

## Testing

The project includes comprehensive test coverage:

- Main integration tests in `main.test.ts`
- Repository tests:
    - `salesManager.repository.test.ts`
    - `slots.repository.test.ts`
- Service tests:
    - `managerAvailability.service.test.ts`

Run tests with:
```bash
yarn test
```

## Database Schema

### sales_managers
| Column           | Type              | Description                               |
|------------------|-------------------|-------------------------------------------|
| id (PK)         | serial            | ID of the sales manager                   |
| name            | varchar(250)      | Full name of sales manager                |
| languages       | varchar(100)[]    | List of languages spoken                  |
| products        | varchar(100)[]    | List of products they can discuss         |
| customer_ratings| varchar(100)[]    | List of customer ratings they can handle  |

### slots
| Column            | Type       | Description                               |
|-------------------|------------|-------------------------------------------|
| id (PK)          | serial     | ID of the slot                           |
| start_date       | timestampz | Start date and time of the slot          |
| end_date         | timestampz | End date and time of the slot            |
| booked           | bool       | Whether the slot is booked               |
| sales_manager_id | integer    | ID of the sales manager (Foreign Key)    |

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

## Notes

- The system only returns available slots and does not handle the actual booking process
- All times are handled in UTC
- The database schema includes indexes for optimized query performance

