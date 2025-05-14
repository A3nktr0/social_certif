# FROM golang:1.24.1

# COPY . .

# RUN go build -o server ./cmd/server.go
# EXPOSE 8000
# CMD ["./server"]

FROM golang:1.24.1

WORKDIR /backend
COPY . .
# RUN go build -o server ./cmd/server.go
EXPOSE 8000
CMD ["go", "run", "./cmd/server.go"]