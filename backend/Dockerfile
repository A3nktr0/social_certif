# build
FROM golang:1.24.1-alpine AS builder

# Install dependencies
RUN apk add --no-cache git

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

# Compile the Go application
# Use CGO_ENABLED=0 for a statically linked binary
# GOOS=linux and GOARCH=amd64 for cross-compilation
# This is useful if you want to run the binary in a different environment
# (e.g., a Docker container)
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o server ./cmd/server.go

# Final image
# Use a minimal base image
# This reduces the size of the final image
# and improves security by minimizing the attack surface
FROM alpine:3.18

WORKDIR /app

# Create the directory structure for migrations
RUN mkdir -p /app/pkg/db/migrations

# Copy the migrations from the builder
COPY --from=builder /app/pkg/db/migrations /app/pkg/db/migrations

# Copy static upload folder (used by file upload handling)
COPY --from=builder /app/uploads /app/uploads


# Copy the server binary
COPY --from=builder /app/server .

# Set environment variable for migration files
ENV MIGRATION_DIR=/app/pkg/db/migrations

EXPOSE 8000

ENTRYPOINT ["/app/server"]
