# Dockerfile

# Builder stage
FROM node:20-alpine as builder

# Enable yarn
RUN corepack enable && corepack prepare yarn@stable --activate

WORKDIR /app

# Copy package files
COPY package.json yarn.lock .yarnrc.yml ./

# Install dependencies
ARG GITHUB_PACKAGE_TOKEN
ENV GITHUB_PACKAGE_TOKEN=$GITHUB_PACKAGE_TOKEN
RUN yarn install

# Copy source code
COPY . .

# Build the application
RUN yarn build

# Production stage
FROM node:20-alpine

# Enable yarn
RUN corepack enable && corepack prepare yarn@stable --activate

WORKDIR /app

# Copy production dependencies and application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json /app/yarn.lock /app/.yarnrc.yml ./

# Install only production dependencies
ARG GITHUB_PACKAGE_TOKEN
ENV GITHUB_PACKAGE_TOKEN=$GITHUB_PACKAGE_TOKEN
RUN yarn install

# Expose port
# HTTP Server port
EXPOSE 3000
# Apollo GQL Server port
EXPOSE 8080
# Default gRPC port
EXPOSE 5105

# Start the application
CMD ["node", "dist/main.js"]
