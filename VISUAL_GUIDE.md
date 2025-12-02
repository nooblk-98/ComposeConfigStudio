# Visual Guide - How to Use the Updated App

## 🎯 Step-by-Step Usage

### Step 1: Open the Application
```
Navigate to: http://localhost:3000
```

### Step 2: You'll See the App Selection Screen

```
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║              Docker Stack Generator                            ║
║    Select an application to generate Docker Compose           ║
║              and CLI commands                                  ║
║                                                                ║
║         🔵 10 Applications Available                           ║
║                                                                ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  🤖 Automation (1)                                             ║
║  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        ║
║  │ Semaphore    │  │              │  │              │        ║
║  │ Modern UI... │  │              │  │              │        ║
║  │ v2.16        │  │              │  │              │        ║
║  └──────────────┘  └──────────────┘  └──────────────┘        ║
║                                                                ║
║  ⚙️ Management (1)                                             ║
║  ┌──────────────┐                                             ║
║  │ Portainer    │                                             ║
║  │ Container... │                                             ║
║  │ latest       │                                             ║
║  └──────────────┘                                             ║
║                                                                ║
║  📁 Productivity (1)                                           ║
║  ┌──────────────┐                                             ║
║  │ Nextcloud    │                                             ║
║  │ Self-hosted..│                                             ║
║  │ latest       │                                             ║
║  └──────────────┘                                             ║
║                                                                ║
║  ... and more categories ...                                  ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
```

**Features on this screen:**
- Apps organized by category
- Each card shows app name, description, version
- Hover over a card to see "Configure" button
- Click any card to configure that app

### Step 3: Click on Any App (e.g., "Semaphore")

The screen transitions to:

```
╔════════════════════════════════════════════════════════════════╗
║ SIDEBAR         │ CONFIGURATION PANEL    │ OUTPUT PANEL       ║
║ (Left 20%)      │ (Middle 40%)           │ (Right 40%)        ║
║                 │                        │                    ║
║ ← Back to Apps  │ Docker Stack Generator │ [Docker Command]   ║
║                 │                        │ [Docker Compose]✓  ║
║ Semaphore 2.16  │ Container Settings     │                    ║
║                 │ ┌─────────────┐        │ [Copy Button]      ║
║ Built-in...     │ │Name: semaphor│        │                    ║
║                 │ │Port: 3000    │        │ version: '3.8'     ║
║ Image assembly  │ └─────────────┘        │                    ║
║ 📦 Ansible 2.16 │                        │ services:          ║
║ 💲 Bash 5.2     │ Docker Volumes         │   semaphore:       ║
║ 🔑 OpenSSH 9.6  │ ☑ Data volume          │     image:...      ║
║ 🔷 Terraform    │ ☑ Config volume        │     ports:...      ║
║ ⚡ PowerShell   │ ☑ Tmp volume           │     environment:... ║
║                 │                        │     volumes:...    ║
║                 │ Database Settings      │                    ║
║                 │ [SQLite✓][MySQL][...]  │ volumes:           ║
║                 │                        │   semaphore_data:  ║
║                 │ Admin User             │   semaphore_config ║
║                 │ ┌──────┬──────┐        │                    ║
║                 │ │Login │Name  │        │                    ║
║                 │ │Pass  │Email │        │                    ║
║                 │ └──────┴──────┘        │                    ║
║                 │                        │                    ║
║                 │ Runner                 │                    ║
║                 │ ☐ Enable runners       │                    ║
║                 │                        │                    ║
╚════════════════════════════════════════════════════════════════╝
```

**Features on this screen:**
- **Left**: App info, tools, back button
- **Center**: Configuration form (dynamic based on app)
- **Right**: Generated Docker output with syntax highlighting

### Step 4: Make Changes

Try changing values:
- Container name: "my-semaphore" → Updates everywhere
- Port: 8080 → Updates in output
- Database: Click "PostgreSQL" → Updates env vars
- Volumes: Uncheck "tmp" → Removes from compose

**Output updates in real-time!** ⚡

### Step 5: Copy & Use

1. Switch to desired tab (Docker Command or Docker Compose)
2. Click the **Copy** button
3. Paste into your terminal or docker-compose.yml
4. Run it!

### Step 6: Try Another App

Click **← Back to Apps** in the sidebar → Returns to app selection screen

## 🎨 What Makes Each App Different?

### Semaphore (Full-featured)
- ✅ Container settings
- ✅ 3 volumes (data/config/tmp)
- ✅ Database selection (SQLite/MySQL/PostgreSQL)
- ✅ Admin user (4 fields)
- ✅ Runner toggle

### Portainer (Minimal)
- ✅ Container settings
- ✅ 2 volumes (data/docker socket)
- ❌ No database section
- ❌ No admin section
- ❌ No runner

### WordPress (CMS)
- ✅ Container settings
- ✅ 1 volume (data)
- ✅ Database section (MySQL only)
- ✅ Admin user (login/password)
- ❌ No runner

### Redis (Simple)
- ✅ Container settings
- ✅ 1 volume (data)
- ❌ No database section
- ❌ No admin section
- ❌ No runner

## 💡 Tips

### Quick Test Workflow
1. Select **Portainer** (simplest)
2. Leave defaults
3. Copy Docker Compose
4. Create `docker-compose.yml`
5. Run `docker-compose up -d`
6. Open http://localhost:9000

### Production Workflow
1. Select your app (e.g., **Nextcloud**)
2. Set strong admin password
3. Choose PostgreSQL database
4. Configure all volumes
5. Copy compose file
6. Add to your project
7. Deploy!

### Development Workflow
1. Select **Redis** or **Grafana**
2. Quick setup
3. Generate command
4. Run in terminal
5. Start developing

## 🎯 App Categories Explained

### 🤖 Automation
- **Semaphore**: Ansible automation, CI/CD workflows

### ⚙️ Management  
- **Portainer**: Manage all your containers visually

### 📁 Productivity
- **Nextcloud**: Your own Google Drive/Dropbox

### 📝 CMS
- **WordPress**: Build websites and blogs

### 🌐 Networking
- **Nginx Proxy Manager**: SSL certificates, reverse proxy
- **Traefik**: Modern load balancer

### 📊 Monitoring
- **Grafana**: Beautiful dashboards
- **Uptime Kuma**: Monitor website uptime

### 🎬 Media
- **Plex**: Stream your movies/music

### 💾 Database
- **Redis**: Fast caching layer

## 🚀 Common Use Cases

### Personal Home Server
1. **Portainer** - Manage containers
2. **Nextcloud** - Cloud storage
3. **Plex** - Media server
4. **Uptime Kuma** - Monitor services

### Development Environment
1. **Redis** - Cache
2. **Grafana** - Monitoring
3. **Traefik** - Routing
4. **WordPress** - Test CMS

### Production Stack
1. **Nginx Proxy Manager** - SSL termination
2. **WordPress** - Public website
3. **Nextcloud** - Internal file sharing
4. **Grafana** - System monitoring

### DevOps Setup
1. **Semaphore** - Automation
2. **Portainer** - Container management
3. **Traefik** - Load balancing
4. **Uptime Kuma** - Availability monitoring

## ✨ Key Features Recap

1. **10 Pre-configured Apps** - No manual YAML writing
2. **Smart Forms** - Only shows relevant options
3. **Real-time Generation** - See output as you type
4. **Copy Button** - One click to clipboard
5. **Back Navigation** - Easy to try multiple apps
6. **Category Organization** - Find apps quickly
7. **Professional UI** - Clean, modern design
8. **Syntax Highlighting** - Easy to read output

## 🎉 You're Ready!

Open **http://localhost:3000** and start generating Docker configurations!

**No more manual YAML editing. No more syntax errors. Just click, configure, and deploy!** 🚀
