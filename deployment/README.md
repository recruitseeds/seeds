# Deployment Guide

## GitHub Actions Secrets Required

Set these secrets in your GitHub repository settings:

- `DROPLET_HOST` - Your droplet IP address or domain
- `DROPLET_USER` - SSH username (usually `root` or your user)
- `DROPLET_SSH_KEY` - Your private SSH key for accessing the droplet

## Initial Server Setup

1. Clone the repository to your droplet:
```bash
sudo mkdir -p /var/www
cd /var/www
sudo git clone https://github.com/yourusername/recruit-seeds.git
cd recruit-seeds
```

2. Install Node.js and npm:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

3. Install dependencies and build:
```bash
npm ci
cd apps/api && npm ci && npm run build && cd ..
cd apps/web && npm ci && npm run build && cd ..  
cd apps/jobs && npm ci && npm run build && cd ..
```

4. Set up environment variables:
```bash
# Copy and configure your environment files
sudo cp apps/api/.env.example apps/api/.env
sudo cp apps/web/.env.example apps/web/.env
sudo cp apps/jobs/.env.example apps/jobs/.env

# Edit each .env file with your production values
sudo nano apps/api/.env
sudo nano apps/web/.env
sudo nano apps/jobs/.env
```

5. Set up systemd services:
```bash
chmod +x deployment/setup-services.sh
./deployment/setup-services.sh
```

6. Start the services:
```bash
sudo systemctl start recruit-seeds-api
sudo systemctl start recruit-seeds-web
sudo systemctl start recruit-seeds-jobs
```

7. Verify services are running:
```bash
sudo systemctl status recruit-seeds-api
sudo systemctl status recruit-seeds-web
sudo systemctl status recruit-seeds-jobs

# Test endpoints
curl http://localhost:3001/api/v1/health
curl http://localhost:3000
curl http://localhost:3002
```

## How CI/CD Works

1. **Continuous Integration (CI):**
   - Runs on every push to `main` or `develop`
   - Runs on every pull request to `main`
   - Installs dependencies for all apps
   - Runs Biome linting checks
   - Runs TypeScript type checking
   - Builds all applications

2. **Continuous Deployment (CD):**
   - Runs only on pushes to `main` branch
   - Only runs if CI tests pass
   - SSHs into your droplet
   - Pulls latest code changes
   - Installs dependencies
   - Builds applications
   - Restarts systemd services
   - Runs health checks

## Service Management

```bash
# Start services
sudo systemctl start recruit-seeds-api
sudo systemctl start recruit-seeds-web
sudo systemctl start recruit-seeds-jobs

# Stop services
sudo systemctl stop recruit-seeds-api
sudo systemctl stop recruit-seeds-web
sudo systemctl stop recruit-seeds-jobs

# Restart services
sudo systemctl restart recruit-seeds-api
sudo systemctl restart recruit-seeds-web
sudo systemctl restart recruit-seeds-jobs

# View logs
sudo journalctl -u recruit-seeds-api -f
sudo journalctl -u recruit-seeds-web -f
sudo journalctl -u recruit-seeds-jobs -f

# Check service status
sudo systemctl status recruit-seeds-api
sudo systemctl status recruit-seeds-web
sudo systemctl status recruit-seeds-jobs
```

## Nginx Configuration (Optional)

If using Nginx as a reverse proxy:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Jobs app
    location /jobs {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Main web app (default)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Troubleshooting

1. **Services failing to start:**
   ```bash
   sudo journalctl -u recruit-seeds-api -n 50
   sudo journalctl -u recruit-seeds-web -n 50
   sudo journalctl -u recruit-seeds-jobs -n 50
   ```

2. **Build failures:**
   - Check Node.js version: `node --version`
   - Clear npm cache: `npm cache clean --force`
   - Remove node_modules: `rm -rf node_modules package-lock.json && npm install`

3. **Permission issues:**
   ```bash
   sudo chown -R www-data:www-data /var/www/recruit-seeds
   ```

4. **Port conflicts:**
   - Check what's using ports: `sudo lsof -i :3001`, `sudo lsof -i :3000`, `sudo lsof -i :3002`
   - Kill processes if needed: `sudo kill -9 <PID>`