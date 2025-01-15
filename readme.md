# Node.js Bot Deployment on DigitalOcean

This guide outlines the steps to deploy a Node.js bot on a DigitalOcean server using **nginx**, **pm2**, **git**, **PostgreSQL**, and **Redis**. It also includes instructions for configuring environment variables, adding webhooks, and updating the bot.

---

## Prerequisites

Ensure the following software is installed on your DigitalOcean server:
- create .env file with the help of .env.test file and use correct env variables
- **Node.js v22.12: Installed using `nvm` or directly.
- **PM2**: Process manager for Node.js.
- **Nginx**: Reverse proxy and load balancer.
- **Git**: For version control.

Install Common Dependencies
---

## 1. Install Node.js (v22.12)

## 2. Install PM2 Globally
```bash
npm install -g pm2
```

---
## 3. Clone Your Bot Repository

Use Git to pull the bot code from your repository.

```bash
cd /var/www
sudo git clone https://github.com/your-repo/bot-project.git
cd bot-project
npm install
```

---

## 4. Add Environment Variables

Create a `.env` file in the project root:

```bash
touch .env
nano .env
```

Add the necessary variables:
```env
MICROSOFT_TENANT_ID=<Tenant ID>
MICROSOFT_CLIENT_ID=<Client ID>
MICROSOFT_CLIENT_SECRET=<Client Secret>
NOTIFICATION_URL=<END POINT of your deployment>
MICROSOFT_USER_ID <user id>
MICROSOFT_GRAPH_API https://graph.microsoft.com/v1.0
SPACES_ACCESS_KEY DO00K9Q9DGYAQRR2B8G2
SERVER_URL https://meetv.herokuapp.com
SPACES_SECRET_KEY
56YoRDHOEIuUJJa8MwUjnCXDJfEIBpF+WhkBYmw
NxFA
SPACE_ENDPOINT https://ams3.digitaloceanspaces.com/
BUCKET_NAME meetv
PORT=3000 # or any port
```

---

## 5. Set Up Nginx

Configure Nginx as a reverse proxy to route traffic to your bot.

### Create an Nginx Configuration File
```bash
sudo nano /etc/nginx/sites-available/bot
```

### Add the Configuration
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    error_page 404 /404.html;
    location = /404.html {
        root /var/www/html;
    }
}
```

### Enable the Configuration
```bash
sudo ln -s /etc/nginx/sites-available/bot /etc/nginx/sites-enabled/
sudo nginx -t  # Test the configuration
sudo systemctl reload nginx
```

---

## 6. Start the Bot with PM2

Use PM2 to run and manage your bot process.

### Start the Bot
```bash
pm2 start server.js --name "bot"
```

### Save the PM2 Process List
```bash
pm2 save
```

### Enable PM2 Startup on Boot
```bash
pm2 startup
```

---

Reload Nginx:
```bash
sudo systemctl reload nginx
```

---

## 7. Monitor and Debug

### Check Logs
```bash
pm2 logs bot
```

## 8. Restart the Bot
```bash
pm2 restart bot
```

### View Nginx Logs
```bash
sudo tail -f /var/log/nginx/access.log /var/log/nginx/error.log
```

---

## 9. Update the Bot

When you need to update the bot code:

```bash
cd /var/www/bot-project
git pull origin main
npm install
pm2 restart bot
```

---

## 10. Secure Your Server

### Install SSL Certificates Using Let’s Encrypt
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## 11. Set Up a Firewall
```bash
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

