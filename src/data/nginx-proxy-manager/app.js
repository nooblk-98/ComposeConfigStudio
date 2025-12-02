import { databases } from './db.js';

export default {
  id: "nginx-proxy-manager",
  name: "Nginx Proxy Manager",
  description: "Easy-to-use reverse proxy management with SSL support",
  category: "Networking",
  logo: "https://nginxproxymanager.com/logo.svg",
  version: "latest",
  defaultPort: 81,
  databases: ["sqlite", "mariadb", "postgres"],
  tools: [{ name: "Nginx", version: "latest" }],
  multiDb: true,

  services: [
    // ============================================
    // VARIANT 1: SQLite
    // ============================================
    {
      name: "nginx_proxy_manager-sqlite",
      displayName: "Nginx Proxy Manager",
      selectorLabel: "SQLite",
      group: "npm-flavor",
      mandatory: true,
      images: [
        "jc21/nginx-proxy-manager:latest",
        "jc21/nginx-proxy-manager:2.10.4"
      ],
      defaultImage: "jc21/nginx-proxy-manager:latest",
      containerName: "nginx_proxy_manager",
      restart: "always",
      ports: ["80:80", "81:81", "443:443"],
      environment: {
        TZ: "Asia/Colombo",
        DB_SQLITE_FILE: "/data/database.sqlite"
      },
      volumes: [
        "./data:/data",
        "./letsencrypt:/etc/letsencrypt",
        "./database.sqlite:/data/database.sqlite"
      ]
    },

    // ============================================
    // VARIANT 2: MariaDB
    // ============================================
    {
      name: "npm-mariadb",
      displayName: "Nginx Proxy Manager",
      selectorLabel: "MariaDB",
      group: "npm-flavor",
      mandatory: false,
      images: [
        "jc21/nginx-proxy-manager:latest",
        "jc21/nginx-proxy-manager:2.10.4"
      ],
      defaultImage: "jc21/nginx-proxy-manager:latest",
      containerName: "nginx_proxy_manager",
      restart: "always",
      ports: ["80:80", "81:81", "443:443"],
      environment: {
        TZ: "UTC",
        DB_MYSQL_HOST: "mariadb",
        DB_MYSQL_USER: "npm",
        DB_MYSQL_PASSWORD: "npm",
        DB_MYSQL_NAME: "npm"
      },
      volumes: [
        "./data:/data",
        "./letsencrypt:/etc/letsencrypt"
      ],
      dependsOn: ["mariadb"]  // Links to database below
    },

    // ============================================
    // VARIANT 3: Postgres
    // ============================================
    {
      name: "npm-postgres",
      displayName: "Nginx Proxy Manager",
      selectorLabel: "Postgres",
      group: "npm-flavor",
      mandatory: false,
      images: [
        "jc21/nginx-proxy-manager:latest",
        "jc21/nginx-proxy-manager:2.10.4"
      ],
      defaultImage: "jc21/nginx-proxy-manager:latest",
      containerName: "nginx_proxy_manager",
      restart: "always",
      ports: ["80:80", "81:81", "443:443"],
      environment: {
        TZ: "UTC",
        DB_POSTGRES_HOST: "db",
        DB_POSTGRES_USER: "npm",
        DB_POSTGRES_PASSWORD: "npmpass",
        DB_POSTGRES_NAME: "npm"
      },
      volumes: [
        "./data:/data",
        "./letsencrypt:/etc/letsencrypt"
      ],
      dependsOn: ["postgres"]  // Links to database below
    },

    // ============================================
    // Database Containers (from db.js)
    // ============================================

    // MariaDB Container
    {
      name: "mariadb",
      group: "npm-flavor",
      mandatory: false,
      ...databases.mariadb.container
    },

    // Postgres Container
    {
      name: "postgres",
      group: "npm-flavor",
      mandatory: false,
      ...databases.postgres.container
    }
  ],

  namedVolumes: []
};
