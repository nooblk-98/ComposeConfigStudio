# Nginx Proxy Manager Configuration

## 📁 File Structure

```
nginx-proxy-manager/
├── db.js      ← All database configurations (EDIT THIS to add/change databases)
├── app.js     ← Links databases to main app (rarely needs editing)
└── README.md  ← This file
```

## 🎯 How It Works

1. **`db.js`** - Define your databases here
2. **`app.js`** - Automatically links them (no manual editing needed)

## 📝 Adding a New Database

### Just edit `db.js` and add your database:

```javascript
export const databases = {
  sqlite: { ... },
  mariadb: { ... },
  postgres: { ... },
  
  // ADD YOUR DATABASE HERE ↓
  mysql: {
    label: "MySQL",
    
    // Environment vars for main app
    env: {
      TZ: "UTC",
      DB_MYSQL_HOST: "db",
      DB_MYSQL_PORT: "3306",
      DB_MYSQL_USER: "npm",
      DB_MYSQL_PASSWORD: "npm",
      DB_MYSQL_NAME: "npm"
    },
    
    // Database container config
    container: {
      images: ["mysql:8.0", "mysql:8.4", "mysql:5.7"],
      defaultImage: "mysql:8.0",
      containerName: "db",
      restart: "always",
      environment: {
        MYSQL_ROOT_PASSWORD: "npm",
        MYSQL_DATABASE: "npm",
        MYSQL_USER: "npm",
        MYSQL_PASSWORD: "npm"
      },
      volumes: ["./mysql:/var/lib/mysql"]
    }
  }
};
```

**That's it!** ✅ The `app.js` will automatically pick it up!

## 📖 Database Config Structure

```javascript
{
  label: "Display Name",        // Shows in UI
  default: true,                // Optional: make this the default
  
  // Environment for MAIN app container
  env: {
    DB_HOST: "db",
    DB_PORT: "3306",
    DB_USER: "app",
    DB_PASSWORD: "password",
    DB_NAME: "app"
  },
  
  // Extra volumes for main app (optional)
  volumes: ["./extra:/path"],
  
  // Database container (set to null for SQLite)
  container: {
    images: ["mariadb:latest", "mariadb:11"],
    defaultImage: "mariadb:latest",
    containerName: "db",
    restart: "always",
    environment: {
      MYSQL_DATABASE: "app",
      MYSQL_USER: "app",
      MYSQL_PASSWORD: "password"
    },
    volumes: ["./db-data:/var/lib/mysql"]
  }
}
```

## 💡 Examples

### SQLite (No Database Container)
```javascript
sqlite: {
  label: "SQLite",
  default: true,
  env: {
    TZ: "Asia/Colombo",
    DB_SQLITE_FILE: "/data/database.sqlite"
  },
  volumes: ["./database.sqlite:/data/database.sqlite"],
  container: null  // No database container needed
}
```

### MariaDB (With Container)
```javascript
mariadb: {
  label: "MariaDB",
  env: {
    TZ: "UTC",
    DB_MYSQL_HOST: "db",
    DB_MYSQL_PORT: "3306",
    DB_MYSQL_USER: "npm",
    DB_MYSQL_PASSWORD: "npm",
    DB_MYSQL_NAME: "npm"
  },
  container: {
    images: ["mariadb:latest", "mariadb:11", "mariadb:10"],
    defaultImage: "mariadb:latest",
    containerName: "db",
    restart: "always",
    environment: {
      MYSQL_ROOT_PASSWORD: "npm",
      MYSQL_DATABASE: "npm",
      MYSQL_USER: "npm",
      MYSQL_PASSWORD: "npm"
    },
    volumes: ["./mysql:/var/lib/mysql"]
  }
}
```

### MongoDB (Different Database)
```javascript
mongodb: {
  label: "MongoDB",
  env: {
    TZ: "UTC",
    MONGO_HOST: "db",
    MONGO_PORT: "27017",
    MONGO_DATABASE: "npm"
  },
  container: {
    images: ["mongo:latest", "mongo:7", "mongo:6"],
    defaultImage: "mongo:latest",
    containerName: "db",
    restart: "always",
    environment: {
      MONGO_INITDB_DATABASE: "npm",
      MONGO_INITDB_ROOT_USERNAME: "npm",
      MONGO_INITDB_ROOT_PASSWORD: "npm"
    },
    volumes: ["./mongodb:/data/db"]
  }
}
```

## 🔧 Common Tasks

### Change Database Password
Edit `db.js`:
```javascript
env: {
  DB_MYSQL_PASSWORD: "new-password"  // Main app
},
container: {
  environment: {
    MYSQL_PASSWORD: "new-password"   // Database
  }
}
```

### Add More Database Versions
Edit `db.js`:
```javascript
container: {
  images: [
    "mariadb:latest",
    "mariadb:11",
    "mariadb:10.6"  // ← Add this
  ]
}
```

### Remove a Database
Just delete it from `db.js`:
```javascript
export const databases = {
  sqlite: { ... },
  // mariadb: { ... },  ← Comment out or delete
  postgres: { ... }
};
```

## ✨ Benefits

✅ **All database configs in one place** (`db.js`)  
✅ **Auto-linking** - `app.js` handles the rest  
✅ **Easy to copy** - Copy existing database config  
✅ **Clean separation** - Database logic separate from app logic  
✅ **Beginner-friendly** - Clear structure, easy to understand  

## 🚀 That's It!

To add/modify databases, **just edit `db.js`**. The `app.js` will automatically:
- Link main app to database
- Create database containers
- Set up dependencies
- Generate the UI selector

No need to touch `app.js` unless you're changing the main container configuration! 🎉
