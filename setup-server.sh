#!/bin/bash
# ============================================================
#  mFlow POS v2 — Hetzner VPS One-Time Setup Script
#  Server: CX23 | IP: 77.42.66.157 | Ubuntu 22.04
#  Run as root:  bash setup-server.sh
# ============================================================

set -e

echo ""
echo "========================================"
echo "  mFlow POS v2 — Server Setup"
echo "========================================"
echo ""

# ─── 1. System Update ────────────────────────────────────────
echo "==> Updating system packages..."
apt-get update -y && apt-get upgrade -y

# ─── 2. Install Node.js 20 LTS ───────────────────────────────
echo "==> Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

echo "Node version: $(node -v)"
echo "NPM version:  $(npm -v)"

# ─── 3. Install PM2 (Process Manager) ────────────────────────
echo "==> Installing PM2..."
npm install -g pm2
pm2 startup systemd -u root --hp /root

# ─── 4. Install Git ──────────────────────────────────────────
echo "==> Installing Git..."
apt-get install -y git

# ─── 5. Install PostgreSQL 16 ────────────────────────────────
echo "==> Installing PostgreSQL 16..."
apt-get install -y postgresql postgresql-contrib

# Start and enable PostgreSQL
systemctl start postgresql
systemctl enable postgresql

# Create DB user and database
echo "==> Creating PostgreSQL database and user..."
sudo -u postgres psql <<EOF
CREATE USER mflow WITH PASSWORD 'mflow_secure_pass_2026';
CREATE DATABASE mflowpos OWNER mflow;
GRANT ALL PRIVILEGES ON DATABASE mflowpos TO mflow;
EOF

echo "PostgreSQL ready: mflowpos (user: mflow)"

# ─── 6. Clone the repository ─────────────────────────────────
echo "==> Cloning repository..."
mkdir -p /var/www
cd /var/www
git clone https://github.com/Flasky06/mflowpos-v2.git mflow-v2
cd mflow-v2/mflow-v2-backend

# ─── 7. Create production .env ───────────────────────────────
echo "==> Creating .env file..."
cat > .env <<'ENVEOF'
PORT=8080
NODE_ENV=production

# PostgreSQL — local server
DATABASE_URL="postgresql://mflow:mflow_secure_pass_2026@localhost:5432/mflowpos?schema=public"

# Security Secrets — CHANGE THESE!
JWT_ACCESS_SECRET="CHANGE_THIS_ACCESS_SECRET_MIN_32_CHARS"
JWT_REFRESH_SECRET="CHANGE_THIS_REFRESH_SECRET_MIN_32_CHARS"
JWT_ACCESS_EXPIRATION="15m"
JWT_REFRESH_EXPIRATION="7d"

# Email (Resend) — set your real key from https://resend.com/api-keys
RESEND_API_KEY="YOUR_RESEND_API_KEY_HERE"
FROM_EMAIL="noreply@mflowpos.com"
FROM_NAME="mflow POS"

# CORS
FRONTEND_URL="https://mflowpos.com"

# WhatsApp (OpenWA) — fill in after connecting WhatsApp
OPENWA_BASE_URL=""
OPENWA_API_KEY=""
OPENWA_SESSION_ID="main"
ENVEOF

echo "⚠️  Edit /var/www/mflow-v2/mflow-v2-backend/.env and set your JWT secrets!"

# ─── 8. Install dependencies & build ─────────────────────────
echo "==> Installing npm dependencies..."
npm ci

echo "==> Generating Prisma client..."
npx prisma generate

echo "==> Pushing schema to database..."
npx prisma db push --accept-data-loss

echo "==> Seeding database..."
node prisma/seed.js || true

echo "==> Building TypeScript..."
npm run build

# ─── 9. Start with PM2 ───────────────────────────────────────
echo "==> Starting API with PM2..."
pm2 start dist/server.js --name mflow-backend
pm2 save

# ─── 10. Install & configure Nginx reverse proxy ─────────────
echo "==> Installing Nginx..."
apt-get install -y nginx

cat > /etc/nginx/sites-available/mflow-api <<'NGINXEOF'
server {
    listen 80;
    server_name api.mflowpos.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINXEOF

ln -sf /etc/nginx/sites-available/mflow-api /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# ─── 11. SSL with Certbot ────────────────────────────────────
echo "==> Installing Certbot for SSL..."
apt-get install -y certbot python3-certbot-nginx
echo ""
echo "==> Run this command after pointing api.mflowpos.com DNS to this server:"
echo "    certbot --nginx -d api.mflowpos.com"
echo ""

# ─── 12. Open firewall ports ─────────────────────────────────
echo "==> Configuring UFW firewall..."
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo ""
echo "========================================"
echo "  ✅ Server setup complete!"
echo "========================================"
echo ""
echo "  API running at:  http://77.42.66.157:8080"
echo "  Nginx proxy:     http://api.mflowpos.com  (after DNS)"
echo "  PM2 status:      pm2 status"
echo "  API logs:        pm2 logs mflow-backend"
echo ""
echo "  Next steps:"
echo "  1. Edit .env and set real JWT secrets"
echo "  2. Point api.mflowpos.com DNS → 77.42.66.157"
echo "  3. Run: certbot --nginx -d api.mflowpos.com"
echo "  4. Add GitHub Secrets for CD (see README)"
echo ""
