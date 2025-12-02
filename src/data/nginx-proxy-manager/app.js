export default {
  id: "nginx-proxy-manager",
  name: "Nginx Proxy Manager",
  description: "Easy-to-use reverse proxy management with SSL support",
  category: "Networking",
  logo: "https://nginxproxymanager.com/logo.svg",
  version: "latest",
  defaultPort: 81,
  databases: ["sqlite", "mysql", "postgres"],
  tools: [
    { name: "Nginx", version: "latest" }
  ],

  services: [
    {
      name: "nginx-proxy-manager",
      displayName: "Nginx Proxy Manager",
      mandatory: true,
      images: [
        "jc21/nginx-proxy-manager:latest",
        "jc21/nginx-proxy-manager:2.10.4"
      ],
      defaultImage: "jc21/nginx-proxy-manager:latest",
      containerName: "nginx_proxy_manager",
      restart: "always",
      ports: [
        "80:80",
        "81:81",
        "443:443"
      ],
      environment: {
        TZ: "UTC",
        // SQLite
        DB_SQLITE_FILE: "/data/database.sqlite",
        // MySQL/MariaDB
        DB_MYSQL_HOST: "db",
        DB_MYSQL_PORT: "3306",
        DB_MYSQL_USER: "npm",
        DB_MYSQL_PASSWORD: "npm",
        DB_MYSQL_NAME: "npm",
        // Postgres
        DB_POSTGRES_HOST: "db",
        DB_POSTGRES_PORT: "5432",
        DB_POSTGRES_USER: "npm",
        DB_POSTGRES_PASSWORD: "npmpass",
        DB_POSTGRES_NAME: "npm"
      },
      volumes: [
        "./data:/data",
        "./letsencrypt:/etc/letsencrypt"
      ]
    },
    {
      name: "sqlite",
      displayName: "SQLite",
      group: "database",
      mandatory: true,
      images: [""],
      defaultImage: "",
      containerName: "",
      environment: {
        DB_SQLITE_FILE: "/data/database.sqlite"
      },
      volumes: [
        "./database.sqlite:/data/database.sqlite"
      ]
    },
    {
      name: "mariadb",
      displayName: "MariaDB",
      group: "database",
      mandatory: true,
      images: [
        "jc21/mariadb-aria:latest",
        "mariadb:11",
        "mariadb:10.6"
      ],
      defaultImage: "jc21/mariadb-aria:latest",
      containerName: "npm_db",
      restart: "unless-stopped",
      environment: {
        MYSQL_ROOT_PASSWORD: "npm",
        MYSQL_DATABASE: "npm",
        MYSQL_USER: "npm",
        MYSQL_PASSWORD: "npm",
        MARIADB_AUTO_UPGRADE: "1"
      },
      volumes: ["./mysql:/var/lib/mysql"]
    },
    {
      name: "postgres",
      displayName: "PostgreSQL",
      group: "database",
      mandatory: false,
      images: [
        "postgres:17",
        "postgres:16",
        "postgres:15"
      ],
      defaultImage: "postgres:17",
      containerName: "npm_db_pg",
      restart: "unless-stopped",
      environment: {
        POSTGRES_USER: "npm",
        POSTGRES_PASSWORD: "npmpass",
        POSTGRES_DB: "npm"
      },
      volumes: ["./postgresql:/var/lib/postgresql/data"]
    }
  ],

  namedVolumes: ["mysql", "postgresql"]
};
