# ---------- Base Image ----------
FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# ---------- Build Stage ----------
FROM base AS builder
WORKDIR /app

# Copy workspace configuration
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/database/package.json ./packages/database/
COPY apps/api/package.json ./apps/api/

# Fetch dependencies
RUN pnpm fetch

# Copy the rest of the application code
COPY . .

# Install dependencies offline
RUN pnpm install -r --offline

# Generate Prisma Client & Build API
WORKDIR /app/packages/database
RUN npx prisma generate

WORKDIR /app/apps/api
RUN pnpm build

# ---------- Production Image ----------
FROM base AS runner
WORKDIR /app

# Copy relevant files from builder
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/packages/database/package.json ./packages/database/
COPY --from=builder /app/apps/api/package.json ./apps/api/

# Copy built API files
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# Copy generated Prisma Client and Schema
COPY --from=builder /app/packages/database/schema.prisma ./packages/database/
COPY --from=builder /app/packages/database/generated ./packages/database/generated

# Install Production Dependencies only
RUN pnpm install -r --prod

# Copy prisma migration files for deploy-time migration
COPY --from=builder /app/packages/database/migrations ./packages/database/migrations

# Expose Port and Run
EXPOSE 3000
ENV NODE_ENV=production
WORKDIR /app/apps/api
# Run DB migrations then start the server
CMD ["sh", "-c", "cd /app/packages/database && npx prisma migrate deploy && cd /app/apps/api && node dist/main.js"]
