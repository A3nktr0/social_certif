
# Build Next.js
FROM node:22.14-bullseye-slim AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Either use npm run build or npx next build (not both)
RUN npx next build

# Lightweight image for production
FROM node:22.14-bullseye-slim

# Create a non-root user
# This is a good practice for security reasons
RUN useradd -m -u 1001 appuser

WORKDIR /app

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/next.config.* ./

# Add a non-root user to run the app
RUN chown -R appuser:appuser /app

USER appuser

EXPOSE 3000

CMD ["npx", "next", "start", "-p", "3000"]
