# Node 20 LTS Alpine Base Image
FROM node:20-alpine AS builder

WORKDIR /app

# Install OpenSSL required by Prisma
RUN apk add --no-cache openssl

# Copy package files and install dependencies
COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

# Copy source code and build TypeScript
COPY . .
RUN npx prisma generate
RUN npm run build

# Production Stage
FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src/config ./dist/config

EXPOSE 8080

# Entrypoint script to sync schema, seed database, and start server
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && node prisma/seed.js && node dist/server.js"]
