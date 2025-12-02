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
    // SQLite flavor
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

    // MariaDB flavor (external DB connection)
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
        DB_MYSQL_HOST: "db",
        DB_MYSQL_PORT: "3306",
        DB_MYSQL_USER: "npm",
        DB_MYSQL_PASSWORD: "npm",
        DB_MYSQL_NAME: "npm"
      },
      volumes: [
        "./data:/data",
        "./letsencrypt:/etc/letsencrypt"
      ],
      dependsOn: ["npm-db-mariadb"]
    },

    // MariaDB Database Container
    {
      name: "npm-db-mariadb",
      group: "npm-flavor",
      mandatory: false,
      images: [
        "mariadb:latest",
        "mariadb:11",
        "mariadb:10"
      ],
      defaultImage: "mariadb:latest",
      containerName: "db",
      restart: "always",
      environment: {
        MYSQL_ROOT_PASSWORD: "npm",
        MYSQL_DATABASE: "npm",
        MYSQL_USER: "npm",
        MYSQL_PASSWORD: "npm"
      },
      volumes: [
        "./mysql:/var/lib/mysql"
      ]
    },

    // Postgres flavor (external DB connection)
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
        DB_POSTGRES_PORT: "5432",
        DB_POSTGRES_USER: "npm",
        DB_POSTGRES_PASSWORD: "npmpass",
        DB_POSTGRES_NAME: "npm"
      },
      volumes: [
        "./data:/data",
        "./letsencrypt:/etc/letsencrypt"
      ],
      dependsOn: ["npm-db-postgres"]
    },

    // Postgres Database Container
    {
      name: "npm-db-postgres",
      group: "npm-flavor",
      mandatory: false,
      images: [
        "postgres:latest",
        "postgres:16",
        "postgres:15"
      ],
      defaultImage: "postgres:latest",
      containerName: "db",
      restart: "always",
      environment: {
        POSTGRES_DB: "npm",
        POSTGRES_USER: "npm",
        POSTGRES_PASSWORD: "npmpass"
      },
      volumes: [
        "./postgres:/var/lib/postgresql/data"
      ]
    }
  ],

  namedVolumes: []
};
