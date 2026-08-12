# ---- Build Stage ----
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

# ---- Production Stage ----
FROM node:20-alpine

WORKDIR /app

# Tạo user non-root để bảo mật
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/package.json ./package.json

USER appuser

EXPOSE 5000

CMD ["node", "src/server.js"]
