# Social Network Platform - Deployment Guide

## ✨ Overview

This platform is a fully containerized full-stack social network with:

* Real-time chat and notifications via WebSocket
* Secure session-based authentication using JWT in cookies
* PostgreSQL for data persistence
* Next.js frontend with Tailwind CSS
* Go backend exposing REST API and WebSocket endpoints
* Caddy as reverse proxy and static file server

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/social-network-app.git
cd social-network-app
```

### 2. Environment Configuration

Create a `.env` file at the root of the project and set the following variables:

```env
DATABASE_URL=postgres://user:password@postgres:5432/socialdb?sslmode=disable
JWT_SECRET=your-super-secure-jwt-secret
BACKEND_PORT=8000
FRONTEND_PORT=3000
```

You can duplicate `.env.example` if provided.

---

## 🏗️ Dockerized Architecture

### Services:

* **frontend** (Next.js, TypeScript)
* **backend** (Go, REST + WebSocket API)
* **postgres** (PostgreSQL database)
* **caddy** (HTTPS reverse proxy, static file server)

### Folder Structure:

```
project-root/
├── backend/
├── frontend/
├── caddy/
├── uploads/          # Shared volume for images
├── docker-compose.yml
├── Caddyfile
└── .env
```

---

## 🚧 Build and Run

### 1. Build and start all containers

```bash
docker-compose up --build
```

### 2. Access the app

* Frontend: [https://localhost:8080](https://localhost:8080)
* Backend API: proxied via Caddy at `/api/*`
* WebSocket: proxied via `/ws/*`

---

## 🔒 Security Features

* JWT in HttpOnly cookies (SameSite=Strict, Secure)
* CSRF tokens (double-submit cookie strategy)
* Rate limiting on auth routes
* Secure CORS and CSP headers
* Sanitization against SQLi and XSS (Go + DOMPurify)
* Non-root containers with `cap_drop: ALL`

---

## 🪖 Database Migrations

Database schema is auto-initialized using [golang-migrate](https://github.com/golang-migrate/migrate) at server startup. Migrations are located in:

```
backend/pkg/db/migrations/
```

---

## 🚨 Health Checks

Each critical service includes Docker `healthcheck` configurations. You can verify status with:

```bash
docker-compose ps
```

---

## 🏙️ Caddy Configuration

`Caddyfile` example:

```caddyfile
localhost:8080 {
    reverse_proxy /api/* backend:8000
    reverse_proxy /ws/* backend:8000
    root * /app/out
    file_server

    handle_path /static/* {
        root * /go/uploads
        file_server
    }
}
```

---

## 🚫 Troubleshooting

* Check container logs with `docker-compose logs <service>`
* Ensure `.env` secrets are correctly set and mounted
* Verify Docker Desktop or compatible engine is running

---

## 💼 License

MIT License

---

## 📖 Documentation

More technical and security implementation details are documented in the `Social Network - Certification.docx` project report.

---

## ✨ Enjoy building scalable, secure social networks!
