# ─── Base ────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# ─── Development ─────────────────────────────────────────────────────────────
FROM node:22-alpine AS development
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 5000
CMD ["npm", "run", "dev"]

# ─── Production ──────────────────────────────────────────────────────────────
FROM node:22-alpine AS production
ENV NODE_ENV=production
WORKDIR /app

# Copy only production deps from base
COPY --from=base /app/node_modules ./node_modules
COPY package*.json ./
COPY src ./src
COPY swagger.yaml ./swagger.yaml

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 5000
CMD ["node", "src/app.js"]
