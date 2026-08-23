# MFlow POS v2.0 — Production Deployment Guide 🌐

This guide covers deploying the **MFlow POS v2.0 Enterprise Ecosystem** to a Linux production server (Ubuntu 22.04 LTS / Debian) using Docker Compose, Nginx, SSL certificates, and Expo Application Services (EAS) for mobile builds.

---

## 1. Prerequisites & Server Setup

Ensure your Linux server has:
- Ubuntu 22.04 LTS or Debian 12
- Docker & Docker Compose installed
- Nginx & Certbot (Let's Encrypt SSL)
- Node.js 18+ and Git

---

## 2. Docker Production Deployment

In the project root directory (`d:\Projects\mflow-v2`), run:

```bash
# Build and start PostgreSQL, Backend API, and Web Portal containers
docker-compose up -d --build
```

### Checking Container Logs
```bash
docker-compose logs -f mflow-backend
```

---

## 3. Database Migration & Prisma Sync

```bash
docker-compose exec mflow-backend npx prisma db push
```

---

## 4. Nginx Reverse Proxy & SSL Setup

Configure `/etc/nginx/sites-available/mflowpos.conf`:

```nginx
server {
    server_name www.mflowpos.com mflowpos.com;

    # Frontend Web App
    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend REST API
    location /api/v1 {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Enable SSL certificate with Certbot:
```bash
sudo certbot --nginx -d mflowpos.com -d www.mflowpos.com
```

---

## 5. Mobile App Production Build (Expo EAS)

To build APK (Android) or IPA (iOS) packages for `mflow-mobile`:

```bash
cd mflow-mobile

# Install EAS CLI globally
npm install -g eas-cli

# Login to Expo Account
eas login

# Build Android APK for direct distribution or Play Store submission
eas build -p android --profile production
```

---

## 6. Play Store & App Store Guidelines Reminder

- **Zero Mobile Payment Prompts**: Do NOT add in-app billing / subscription purchase UI in the mobile app. All subscription management must remain on the web portal to comply with Google Play / Apple App Store policies.
