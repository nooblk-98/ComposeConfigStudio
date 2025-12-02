# Variant-Based App Configuration

## Overview

The variant system makes it incredibly easy to create Docker app configurations with multiple database options. Instead of manually duplicating services for each database type, you define **variants** and the system automatically generates the services.

## Why Use Variants?

### ❌ Old Way (150+ lines, lots of duplication)
```javascript
export default {
  services: [
    { name: "app-sqlite", environment: {...}, ... },
    { name: "app-mariadb", environment: {...}, ... },
    { name: "db-mariadb", environment: {...}, ... },
    { name: "app-postgres", environment: {...}, ... },
    { name: "db-postgres", environment: {...}, ... }
  ]
}
```

### ✅ New Way (50 lines, no duplication)
```javascript
import { createVariantApp, DatabaseTemplates } from '../../utils/variantHelper.js';

export default createVariantApp({
  id: "myapp",
  mainContainer: { ... },
  variants: [
    DatabaseTemplates.sqlite(),
    DatabaseTemplates.mariadb(),
    DatabaseTemplates.postgres()
  ]
});
```

## Quick Start

### Example: Creating a New App with Database Variants

```javascript
import { createVariantApp, DatabaseTemplates } from '../../utils/variantHelper.js';

const config = {
  id: "nextcloud",
  name: "Nextcloud",
  description: "Self-hosted cloud storage",
  category: "Storage",
  logo: "https://example.com/logo.svg",
  version: "latest",
  defaultPort: 8080,
  tools: [{ name: "PHP", version: "8.2" }],
  
  // Main container (shared by all variants)
  mainContainer: {
    images: [
      "nextcloud:latest",
      "nextcloud:28",
      "nextcloud:27"
    ],
    defaultImage: "nextcloud:latest",
    containerName: "nextcloud",
    restart: "always",
    ports: ["8080:80"],
    volumes: ["./data:/var/www/html"],
    commonEnv: {
      TZ: "UTC"
    }
  },

  // Just list the database variants you want!
  variants: [
    DatabaseTemplates.sqlite(),
    DatabaseTemplates.mariadb({ 
      user: "nextcloud",
      password: "nextcloud",
      database: "nextcloud"
    }),
    DatabaseTemplates.postgres({ 
      user: "nextcloud",
      password: "nextcloud",
      database: "nextcloud"
    })
  ]
};

export default createVariantApp(config);
```

## Available Database Templates

### SQLite
```javascript
DatabaseTemplates.sqlite({ 
  dbFile: "/data/database.sqlite",  // Database file path
  mountDb: true                      // Mount database file as volume
})
```

### MariaDB
```javascript
DatabaseTemplates.mariadb({ 
  user: "app",
  password: "password",
  database: "app",
  rootPassword: "rootpass"  // Optional, defaults to password
})
```

### PostgreSQL
```javascript
DatabaseTemplates.postgres({ 
  user: "app",
  password: "password",
  database: "app"
})
```

### MySQL
```javascript
DatabaseTemplates.mysql({ 
  user: "app",
  password: "password",
  database: "app",
  rootPassword: "rootpass"
})
```

### MongoDB
```javascript
DatabaseTemplates.mongodb({ 
  user: "app",
  password: "password",
  database: "app"
})
```

### Redis
```javascript
DatabaseTemplates.redis({ 
  password: "password"  // Optional
})
```

## Custom Variants

Need a custom database configuration? No problem!

```javascript
variants: [
  {
    id: "custom-db",
    label: "Custom Database",
    
    // Environment for main app
    mainEnv: {
      DB_HOST: "custom-db",
      DB_PORT: "9999",
      DB_NAME: "mydb"
    },
    
    // Optional: Extra volumes for main container
    mainVolumes: ["./config:/config"],
    
    // Database container (optional)
    database: {
      type: "custom",
      containerName: "custom-db",
      images: ["custom-db:latest"],
      defaultImage: "custom-db:latest",
      restart: "always",
      environment: {
        CUSTOM_VAR: "value"
      },
      volumes: ["./db-data:/data"],
      ports: ["9999:9999"]  // Optional
    }
  }
]
```

## Benefits

1. ✅ **Easy to Add Variants**: Just one line to add a new database
2. ✅ **No Duplication**: Main container config defined once
3. ✅ **Auto-Linking**: Database env and main app env stay in sync
4. ✅ **Type-Safe**: Works with existing type system
5. ✅ **Flexible**: Use templates or create custom variants
6. ✅ **Clean Code**: 60% less code than old method

## Migration Guide

### Before
```javascript
export default {
  services: [
    {
      name: "app-mariadb",
      environment: {
        DB_HOST: "db",
        DB_USER: "user",
        // ... lots of duplication
      }
    },
    {
      name: "db-mariadb",
      environment: {
        MYSQL_USER: "user",
        // ... more config
      }
    }
  ]
}
```

### After
```javascript
import { createVariantApp, DatabaseTemplates } from '../../utils/variantHelper.js';

export default createVariantApp({
  mainContainer: { ... },
  variants: [
    DatabaseTemplates.mariadb({ user: "user" })
  ]
});
```

## Advanced: Override Database Template

```javascript
variants: [
  {
    ...DatabaseTemplates.mariadb({ user: "app" }),
    // Override or extend
    mainEnv: {
      ...DatabaseTemplates.mariadb({ user: "app" }).mainEnv,
      CUSTOM_VAR: "value"
    },
    database: {
      ...DatabaseTemplates.mariadb({ user: "app" }).database,
      ports: ["3306:3306"]  // Expose database port
    }
  }
]
```

## Pro Tips

1. **Use Templates First**: Start with `DatabaseTemplates` before creating custom variants
2. **Keep It Simple**: Only add variants users actually need
3. **Consistent Naming**: Use `user`, `password`, `database` for credentials
4. **Test Each Variant**: Ensure each database variant actually works
5. **Document Special Cases**: Add comments for non-obvious configurations

## Example Apps Using Variants

- ✅ `nginx-proxy-manager` - SQLite, MariaDB, Postgres
- 🔜 `wordpress` - Can be migrated
- 🔜 `nextcloud` - Can be migrated
- 🔜 `ghost` - Can be migrated

## Need Help?

Check the source code:
- `src/utils/variantHelper.js` - Helper functions and templates
- `src/data/nginx-proxy-manager/app.js` - Complete working example
