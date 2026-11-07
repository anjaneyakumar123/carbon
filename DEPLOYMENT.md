# IPRC CarbonTrack — Production Deployment Manual

**Project Reference:** RES-IPRC-2025-003  
**Organization:** ISRO Propulsion Complex (IPRC), Mahendragiri  
**System:** Carbon Footprint Monitoring and Measurement System  

---

## 1. Quick Start: One-Command Docker Deployment (Recommended)

The easiest and most reliable way to deploy the entire multi-tier system (PostgreSQL 15, Node.js Backend API, Python ML Service, and Nginx/React Frontend) is using Docker Compose:

### Prerequisites:
- Docker Engine $\ge 24.0$
- Docker Compose $\ge 2.20$

### Deployment Command:
```bash
# Clone or navigate to the project directory
cd Carbon

# Build and start all 4 microservices in detached mode
docker compose up -d --build
```

### Verification:
```bash
docker compose ps
```
The services will be active on:
- **Web Interface:** `http://<SERVER_IP>:3000`
- **Backend API:** `http://<SERVER_IP>:5000/api`
- **ML Engine:** `http://<SERVER_IP>:8000`
- **Database:** `localhost:5432`

---

## 2. Production Deployment on Linux Cloud VPS (Ubuntu 22.04 / 24.04 LTS)

If deploying directly onto bare metal or a cloud VM (AWS EC2, Azure VM, DigitalOcean Droplet, GCP Compute Engine):

### Step 1: Install System Dependencies
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git build-essential nginx postgresql postgresql-contrib python3 python3-pip python3-venv

# Install Node.js 22.x LTS
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

### Step 2: Configure PostgreSQL Database
```bash
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'YourSecurePassword123';"
sudo -u postgres psql -c "CREATE DATABASE carbontrack;"
```

### Step 3: Configure and Build Backend
```bash
cd /var/www/Carbon/backend
npm ci
cp .env.example .env

# Edit .env with your production database credentials:
# DATABASE_URL="postgresql://postgres:YourSecurePassword123@localhost:5432/carbontrack?schema=public"
# JWT_SECRET="your_custom_production_secret_32_characters_long"

# Apply Prisma Schema, seed official emission factors, and import dataset:
npx prisma db push --accept-data-loss
node src/scripts/seed.js
node src/scripts/importDataset.js
node src/scripts/seedOperationalActivities.js

# Start backend using PM2
pm2 start src/index.js --name "iprc-backend"
```

### Step 4: Configure and Launch Python ML Service
```bash
cd /var/www/Carbon/ml-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Train models and export joblib artifacts
python train_models.py

# Start ML service daemon via PM2
pm2 start "uvicorn app:app --host 127.0.0.1 --port 8000" --name "iprc-ml"
```

### Step 5: Build and Serve Frontend via Nginx
```bash
cd /var/www/Carbon/frontend
npm ci
npm run build

# Copy built bundle to webroot
sudo rm -rf /var/www/html/*
sudo cp -r dist/* /var/www/html/
```

### Step 6: Configure Nginx Reverse Proxy
Create `/etc/nginx/sites-available/carbontrack`:
```nginx
server {
    listen 80;
    server_name carbontrack.iprc.isro.gov.in your-domain.com;

    root /var/www/html;
    index index.html;

    # SPA Routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API Proxy to Express
    location /api/ {
        proxy_pass http://127.0.0.1:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable and reload Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/carbontrack /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 7: Enable SSL Certificate (Let's Encrypt HTTPS)
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### Step 8: Ensure Persistence on System Reboot
```bash
pm2 save
pm2 startup
```

---

## 3. Pre-Configured Demonstration Accounts

| Role | Email | Password | Access Capabilities |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@iprc.isro.gov.in` | `Admin@123` | Full access, user management, audit logs, retraining |
| **Environmental Officer** | `officer@iprc.isro.gov.in` | `Officer@123` | Activity logging, report downloads, recommendations |
| **Research Analyst** | `analyst@iprc.isro.gov.in` | `Analyst@123` | Analytics, prediction interface, dataset inspection |

---

## 4. Automated Backup & Maintenance Routine

### Automated Nightly Database Dump:
```bash
# Add to crontab (crontab -e):
0 2 * * * pg_dump -U postgres -d carbontrack -F c -b -v -f "/var/backups/carbontrack_$(date +\%Y\%m\%d).dump"
```

### Restoring from Backup:
```bash
pg_restore -U postgres -d carbontrack -v "/var/backups/carbontrack_20261107.dump"
```
