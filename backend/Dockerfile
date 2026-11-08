# Multi-stage Dockerfile for NestJS Backend

# Stage 1: Base & Dependencies
FROM node:22-alpine AS dependencies
WORKDIR /usr/src/app

# Install native dependencies required by Prisma engine on Alpine
RUN apk add --no-cache openssl libc6-compat

# Copy package manifests
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Generate Prisma Client if schema exists (optional in early setup)
RUN if [ -f "./prisma/schema.prisma" ]; then npx prisma generate 2>/dev/null || true; fi

# Stage 2: Development (Hot-reloading with source volume mount)
FROM node:22-alpine AS development
WORKDIR /usr/src/app
RUN apk add --no-cache openssl libc6-compat

COPY --from=dependencies /usr/src/app/node_modules ./node_modules
COPY . .

EXPOSE 3000
CMD ["npm", "run", "start:dev"]

# Stage 3: Build
FROM node:22-alpine AS build
WORKDIR /usr/src/app
RUN apk add --no-cache openssl libc6-compat

COPY --from=dependencies /usr/src/app/node_modules ./node_modules
COPY . .

RUN npm run build
RUN npm prune --production

# Stage 4: Production Runtime
FROM node:22-alpine AS production
WORKDIR /usr/src/app
RUN apk add --no-cache openssl libc6-compat

ENV NODE_ENV=production

# Security: Run as non-root user
USER node

COPY --chown=node:node --from=build /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=build /usr/src/app/dist ./dist
COPY --chown=node:node --from=build /usr/src/app/package*.json ./

EXPOSE 3000
CMD ["node", "dist/main.js"]

