# Docker Deployment Guide

This document provides instructions for deploying the MoneyTrack application using Docker and Docker Compose.

## Quick Start

```bash
# Start all services (MongoDB + App)
docker compose up -d

# View logs
docker compose logs -f

# Stop services
docker compose down
```

Access the application at: **http://localhost:3001**

## Architecture

The Docker setup consists of two services:

1. **mongodb**: MongoDB 7.0 database with persistent storage
2. **app**: Combined frontend + backend server

### Service Details

#### MongoDB Service
- **Image**: mongo:7.0
- **Port**: 27017
- **Volumes**: 
  - `mongodb_data`: Database files
  - `mongodb_config`: Configuration files
- **Database**: moneytrack

#### App Service
- **Build**: Multi-stage build from Dockerfile
- **Port**: 3001
- **Environment**:
  - `PORT=3001`
  - `MONGODB_URI=mongodb://mongodb:27017/moneytrack`
  - `NODE_ENV=production`

## Persistent Data

Database data is stored in Docker volumes:
- `mongodb_data`: Contains all MongoDB data
- `mongodb_config`: Contains MongoDB configuration

These volumes persist even when containers are stopped. To completely remove all data:

```bash
docker compose down -v
```

⚠️ **Warning**: This command will delete all database data!

## Environment Variables

Optional environment variables can be configured in the `docker-compose.yml` file or via a `.env` file:

```env
CLOVA_API_KEY=your-api-key-here
CLOVA_API_URL=https://clovastudio.stream.ntruss.com/v1/openai/chat/completions
CLOVA_OCR_API_URL=your-ocr-api-url
CLOVA_OCR_SECRET_KEY=your-ocr-secret-key
NAVER_CLIENT_ID=your-client-id
NAVER_CLIENT_SECRET=your-client-secret
```

## Useful Commands

### View Service Status
```bash
docker compose ps
```

### View Logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f app
docker compose logs -f mongodb
```

### Restart Services
```bash
# Restart all
docker compose restart

# Restart specific service
docker compose restart app
```

### Update Application
```bash
# Pull latest changes and rebuild
git pull
docker compose down
docker compose build
docker compose up -d
```

### Access MongoDB CLI
```bash
docker compose exec mongodb mongosh moneytrack
```

### Rebuild After Code Changes
```bash
docker compose build --no-cache
docker compose up -d
```

## Troubleshooting

### Container Keeps Restarting
Check the logs:
```bash
docker compose logs app
```

### Cannot Connect to Database
1. Ensure MongoDB container is running:
   ```bash
   docker compose ps
   ```
2. Check MongoDB logs:
   ```bash
   docker compose logs mongodb
   ```

### Port Already in Use
If port 3001 or 27017 is already in use, modify the ports in `docker-compose.yml`:
```yaml
services:
  app:
    ports:
      - "8080:3001"  # Change 3001 to 8080 on host
```

### Clear Everything and Start Fresh
```bash
docker compose down -v
docker system prune -a
docker compose up -d
```

## Production Deployment

For production deployment, consider:

1. **Use environment variables for secrets**
2. **Enable authentication for MongoDB**
3. **Use HTTPS with a reverse proxy (nginx)**
4. **Set up automated backups for MongoDB**
5. **Configure logging and monitoring**

Example with MongoDB authentication:
```yaml
mongodb:
  environment:
    MONGO_INITDB_ROOT_USERNAME: admin
    MONGO_INITDB_ROOT_PASSWORD: secure_password
```

## Network

Services communicate via the `moneytrack-network` bridge network:
- **mongodb**: Accessible at `mongodb:27017` from app container
- **app**: Exposed to host at `localhost:3001`

## Health Checks

Check if services are healthy:
```bash
# API health check
curl http://localhost:3001/api/health

# Should return: {"status":"ok","message":"Backend server is running"}
```
