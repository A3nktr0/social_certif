FROM golang:1.24.1

COPY . .

RUN go build -o server ./cmd/server.go
EXPOSE 8000
CMD ["./server"]
