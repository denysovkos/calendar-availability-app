# Builder stage
FROM node:20-alpine as builder

# Enable yarn and set cache directory
RUN corepack enable && corepack prepare yarn@stable --activate
ENV YARN_CACHE_FOLDER=/root/.yarn-cache

WORKDIR /app

# Copy package files
COPY package.json yarn.lock .yarnrc.yml ./

# Install dependencies with cache mounting
RUN --mount=type=cache,target=/root/.yarn-cache \
    yarn install --frozen-lockfile

# Copy source code and build
COPY . .
RUN yarn build

# Production stage
FROM node:20-alpine

# Set environment variables
ENV NODE_ENV=production \
    DATABASE_HOST=db \
    DATABASE_PORT=5432 \
    DATABASE_NAME=coding-challenge \
    DATABASE_USER=postgres \
    DATABASE_PASSWORD=mypassword123!

# Enable yarn and set cache directory
RUN corepack enable && corepack prepare yarn@stable --activate
ENV YARN_CACHE_FOLDER=/root/.yarn-cache

WORKDIR /app

# Copy only necessary files from builder
COPY --from=builder /app/dist ./dist
COPY package.json yarn.lock .yarnrc.yml ./

# Install only production dependencies with cache mounting
RUN yarn install

# Expose port
EXPOSE 3000

# Use non-root user for better security
USER node

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

CMD ["node", "dist/main.js"]