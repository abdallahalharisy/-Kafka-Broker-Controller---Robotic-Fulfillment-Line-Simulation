# 🐳 Docker Deployment Guide

## Quick Start

### Prerequisites
- Docker Desktop installed
- Docker Compose installed (comes with Docker Desktop)

---

## 🚀 Running with Docker Compose (Recommended)

### 1. Build and Run Everything

```bash
# Build and start both services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 2. Access the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001/api/metrics
- **WebSocket:** ws://localhost:3001

---

## 🔨 Building Individual Containers

### Backend Only

```bash
# Build
docker build -t kafka-broker-backend ./backend

# Run
docker run -d \
  -p 3001:3001 \
  --name kafka-backend \
  kafka-broker-backend

# View logs
docker logs -f kafka-backend
```

### Frontend Only

```bash
# Build with API URL
docker build -t kafka-broker-frontend \
  --build-arg VITE_API_URL=http://localhost:3001 \
  --build-arg VITE_WS_URL=ws://localhost:3001 \
  ./frontend

# Run
docker run -d \
  -p 3000:80 \
  --name kafka-frontend \
  kafka-broker-frontend

# View logs
docker logs -f kafka-frontend
```

---

## 🌐 Production Deployment

### With Custom Domain

```bash
# Build with production URLs
docker-compose -f docker-compose.prod.yml up -d
```

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
    environment:
      - NODE_ENV=production
      - PORT=3001
      - CORS_ORIGIN=https://your-domain.com
    restart: always

  frontend:
    build:
      context: ./frontend
      args:
        - VITE_API_URL=https://api.your-domain.com
        - VITE_WS_URL=wss://api.your-domain.com
    restart: always
```

---

## 🔧 Useful Commands

### View Running Containers
```bash
docker ps
```

### View All Containers (including stopped)
```bash
docker ps -a
```

### Stop All Containers
```bash
docker-compose down
```

### Remove All Containers and Images
```bash
docker-compose down --rmi all --volumes
```

### Rebuild Without Cache
```bash
docker-compose build --no-cache
docker-compose up -d
```

### View Resource Usage
```bash
docker stats
```

### Access Container Shell
```bash
# Backend
docker exec -it kafka-broker-backend sh

# Frontend
docker exec -it kafka-broker-frontend sh
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend

# Last 100 lines
docker-compose logs --tail=100
```

---

## 🐛 Troubleshooting

### Backend Not Starting

```bash
# Check logs
docker logs kafka-broker-backend

# Check if port is in use
netstat -ano | findstr :3001   # Windows
lsof -i :3001                   # Mac/Linux
```

### Frontend Not Connecting to Backend

1. Check if backend is running:
   ```bash
   curl http://localhost:3001/api/metrics
   ```

2. Check CORS settings in backend

3. Rebuild frontend with correct API URL:
   ```bash
   docker-compose down
   docker-compose build --no-cache frontend
   docker-compose up -d
   ```

### Container Health Check Failing

```bash
# Check health status
docker inspect kafka-broker-backend | grep Health -A 10

# Run health check manually
docker exec kafka-broker-backend wget --spider http://localhost:3001/api/metrics
```

### Out of Disk Space

```bash
# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Complete cleanup
docker system prune -a --volumes
```

---

## 📦 Multi-Stage Builds

Our Dockerfiles use multi-stage builds for:
- ✅ Smaller final images
- ✅ Better security (no build tools in production)
- ✅ Faster deployments

### Backend Image Size
- Builder stage: ~1.2 GB
- Final image: ~200 MB

### Frontend Image Size
- Builder stage: ~1.5 GB
- Final image (with nginx): ~50 MB

---

## 🔒 Security Best Practices

Our Docker setup includes:

1. **Multi-stage builds** - No dev dependencies in production
2. **Non-root user** - Services don't run as root (Alpine images)
3. **Health checks** - Automatic container restart on failure
4. **Resource limits** - Prevent container from consuming all resources
5. **Security headers** - Nginx configured with security headers
6. **Read-only filesystem** - Where possible

---

## 🚢 Deploy to Cloud

### Docker Hub

```bash
# Login
docker login

# Tag images
docker tag kafka-broker-backend your-username/kafka-broker-backend:latest
docker tag kafka-broker-frontend your-username/kafka-broker-frontend:latest

# Push
docker push your-username/kafka-broker-backend:latest
docker push your-username/kafka-broker-frontend:latest
```

### AWS ECS / Azure Container Instances / Google Cloud Run

Use the provided Dockerfiles with your cloud provider's container service.

---

## 📊 Monitoring

### Prometheus Metrics (Future Enhancement)

Add to `docker-compose.yml`:

```yaml
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
```

### Grafana Dashboard (Future Enhancement)

```yaml
  grafana:
    image: grafana/grafana
    ports:
      - "3002:3000"
    depends_on:
      - prometheus
```

---

## 💡 Tips

1. **Development Mode:** Use `docker-compose up` (without `-d`) to see logs in real-time
2. **Hot Reload:** Mount volumes for development:
   ```yaml
   volumes:
     - ./backend/src:/app/src
   ```
3. **Environment Variables:** Use `.env` file with docker-compose
4. **Network Debugging:** Access containers on the same network:
   ```bash
   docker network inspect kafka-broker-sim_kafka-network
   ```

---

**Happy Dockerizing! 🐳**
