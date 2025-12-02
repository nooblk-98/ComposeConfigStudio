/**
 * Database Configurations for Nginx Proxy Manager
 * 
 * Each database type has:
 * - env: Environment variables for the main app
 * - volumes: Extra volumes needed for this database
 * - container: Database container config (null for SQLite)
 */

export const databases = {
    mariadb: {
        label: "MariaDB",
        container: {
            images: ["mariadb:latest", "mariadb:11", "mariadb:10"],
            defaultImage: "mariadb:latest",
            containerName: "mariadb",
            restart: "always",
            environment: {
                MYSQL_ROOT_PASSWORD: "npm",
                MYSQL_DATABASE: "npm",
                MYSQL_USER: "npm",
                MYSQL_PASSWORD: "npm"
            },
            volumes: ["./mysql:/var/lib/mysql"]
        }
    },

    postgres: {
        label: "Postgres",

        // Environment for main nginx-proxy-manager container
        env: {
            TZ: "UTC",
            DB_POSTGRES_HOST: "db",
            DB_POSTGRES_PORT: "5432",
            DB_POSTGRES_USER: "npm",
            DB_POSTGRES_PASSWORD: "npmpass",
            DB_POSTGRES_NAME: "npm"
        },

        // Database container configuration
        container: {
            images: ["postgres:latest", "postgres:16", "postgres:15"],
            defaultImage: "postgres:latest",
            containerName: "db",
            restart: "always",
            environment: {
                POSTGRES_DB: "npm",
                POSTGRES_USER: "npm",
                POSTGRES_PASSWORD: "npmpass"
            },
            volumes: ["./postgres:/var/lib/postgresql/data"]
        }
    }
};
