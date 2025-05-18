# build
FROM golang:1.24.1-alpine AS builder

# Install dependencies
RUN apk add --no-cache git

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

# Compile the Go application
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o server ./cmd/server.go

# Set proper ownership for uploads to match distroless nonroot user (UID 65532)
RUN chown -R 65532:65532 /app/uploads

# Final image
FROM gcr.io/distroless/static:nonroot

WORKDIR /app

# Copy the migrations from the builder
COPY --from=builder /app/pkg/db/migrations /app/pkg/db/migrations

# Copy the uploads folder with correct ownership
COPY --chown=65532:65532 --from=builder /app/uploads /app/uploads

# Copy the server binary
COPY --from=builder /app/server .

# Set environment variable for migration files
ENV MIGRATION_DIR=/app/pkg/db/migrations

# Use non-root user by default
USER nonroot:nonroot

EXPOSE 8000

ENTRYPOINT ["/app/server"]
