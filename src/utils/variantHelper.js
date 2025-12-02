/**
 * Variant Configuration Helper
 * 
 * This utility helps create app configurations with database variants.
 * Instead of manually defining duplicate services for each database type,
 * you define variants and the helper generates the services automatically.
 * 
 * @example
 * const app = createVariantApp({
 *   id: "myapp",
 *   name: "My App",
 *   mainContainer: { ... },
 *   variants: [
 *     { id: "sqlite", label: "SQLite", mainEnv: { ... } },
 *     { id: "postgres", label: "Postgres", mainEnv: { ... }, database: { ... } }
 *   ]
 * });
 */

/**
 * Transforms variant-based config to service array
 * @param {Object} config - App configuration with variants
 * @returns {Array} Array of service definitions
 */
export function variantsToServices(config) {
    const services = [];

    config.variants.forEach((variant, index) => {
        const isDefault = variant.default || index === 0;

        // Create main container service
        const mainService = {
            name: variant.id === 'sqlite' || variant.id === config.id
                ? `${config.id}-${variant.id}`
                : `${config.id.split('-')[0]}-${variant.id}`,
            displayName: config.mainContainer.displayName || config.name,
            selectorLabel: variant.label,
            group: `${config.id}-flavor`,
            mandatory: isDefault,
            images: config.mainContainer.images,
            defaultImage: config.mainContainer.defaultImage,
            containerName: config.mainContainer.containerName,
            restart: config.mainContainer.restart || "always",
            ports: config.mainContainer.ports || [],
            environment: {
                ...(config.mainContainer.commonEnv || {}),
                ...(variant.mainEnv || {})
            },
            volumes: [
                ...(config.mainContainer.volumes || []),
                ...(variant.mainVolumes || [])
            ]
        };

        // Add database dependency if exists
        if (variant.database) {
            mainService.dependsOn = [`${config.id}-db-${variant.id}`];
        }

        services.push(mainService);

        // Create database service if specified
        if (variant.database) {
            const dbService = {
                name: `${config.id}-db-${variant.id}`,
                group: `${config.id}-flavor`,
                mandatory: false,
                images: variant.database.images,
                defaultImage: variant.database.defaultImage,
                containerName: variant.database.containerName || "db",
                restart: variant.database.restart || "always",
                environment: variant.database.environment || {},
                volumes: variant.database.volumes || []
            };

            // Add ports if database exposes them
            if (variant.database.ports) {
                dbService.ports = variant.database.ports;
            }

            services.push(dbService);
        }
    });

    return services;
}

/**
 * Creates an app definition from variant-based config
 * @param {Object} config - Variant-based app configuration
 * @returns {Object} Complete app definition
 */
export function createVariantApp(config) {
    return {
        id: config.id,
        name: config.name,
        description: config.description,
        category: config.category,
        logo: config.logo,
        version: config.version || "latest",
        defaultPort: config.defaultPort,
        databases: config.variants.map(v => v.id),
        tools: config.tools || [],
        multiDb: true,
        services: variantsToServices(config),
        namedVolumes: config.namedVolumes || []
    };
}

/**
 * Common database variant templates
 * Use these to quickly add standard database configurations
 */
export const DatabaseTemplates = {
    /**
     * MariaDB database variant
     * @param {Object} options - Customization options
     * @returns {Object} Database variant config
     */
    mariadb: (options = {}) => ({
        id: "mariadb",
        label: "MariaDB",
        mainEnv: {
            DB_MYSQL_HOST: "db",
            DB_MYSQL_PORT: "3306",
            DB_MYSQL_USER: options.user || "app",
            DB_MYSQL_PASSWORD: options.password || "password",
            DB_MYSQL_NAME: options.database || "app",
            ...(options.mainEnv || {})
        },
        database: {
            type: "mariadb",
            containerName: "db",
            images: ["mariadb:latest", "mariadb:11", "mariadb:10"],
            defaultImage: "mariadb:latest",
            restart: "always",
            environment: {
                MYSQL_ROOT_PASSWORD: options.rootPassword || options.password || "password",
                MYSQL_DATABASE: options.database || "app",
                MYSQL_USER: options.user || "app",
                MYSQL_PASSWORD: options.password || "password"
            },
            volumes: ["./mysql:/var/lib/mysql"]
        }
    }),

    /**
     * PostgreSQL database variant
     * @param {Object} options - Customization options
     * @returns {Object} Database variant config
     */
    postgres: (options = {}) => ({
        id: "postgres",
        label: "Postgres",
        mainEnv: {
            DB_POSTGRES_HOST: "db",
            DB_POSTGRES_PORT: "5432",
            DB_POSTGRES_USER: options.user || "app",
            DB_POSTGRES_PASSWORD: options.password || "password",
            DB_POSTGRES_NAME: options.database || "app",
            ...(options.mainEnv || {})
        },
        database: {
            type: "postgres",
            containerName: "db",
            images: ["postgres:latest", "postgres:16", "postgres:15"],
            defaultImage: "postgres:latest",
            restart: "always",
            environment: {
                POSTGRES_DB: options.database || "app",
                POSTGRES_USER: options.user || "app",
                POSTGRES_PASSWORD: options.password || "password"
            },
            volumes: ["./postgres:/var/lib/postgresql/data"]
        }
    }),

    /**
     * MySQL database variant
     * @param {Object} options - Customization options
     * @returns {Object} Database variant config
     */
    mysql: (options = {}) => ({
        id: "mysql",
        label: "MySQL",
        mainEnv: {
            DB_MYSQL_HOST: "db",
            DB_MYSQL_PORT: "3306",
            DB_MYSQL_USER: options.user || "app",
            DB_MYSQL_PASSWORD: options.password || "password",
            DB_MYSQL_NAME: options.database || "app",
            ...(options.mainEnv || {})
        },
        database: {
            type: "mysql",
            containerName: "db",
            images: ["mysql:8.0", "mysql:8.4", "mysql:5.7"],
            defaultImage: "mysql:8.0",
            restart: "always",
            environment: {
                MYSQL_ROOT_PASSWORD: options.rootPassword || options.password || "password",
                MYSQL_DATABASE: options.database || "app",
                MYSQL_USER: options.user || "app",
                MYSQL_PASSWORD: options.password || "password"
            },
            volumes: ["./mysql:/var/lib/mysql"]
        }
    }),

    /**
     * SQLite variant (no separate database container)
     * @param {Object} options - Customization options
     * @returns {Object} Database variant config
     */
    sqlite: (options = {}) => ({
        id: "sqlite",
        label: "SQLite",
        default: true,
        mainEnv: {
            DB_SQLITE_FILE: options.dbFile || "/data/database.sqlite",
            ...(options.mainEnv || {})
        },
        mainVolumes: options.mountDb ? ["./database.sqlite:/data/database.sqlite"] : [],
        database: null
    }),

    /**
     * MongoDB database variant
     * @param {Object} options - Customization options
     * @returns {Object} Database variant config
     */
    mongodb: (options = {}) => ({
        id: "mongodb",
        label: "MongoDB",
        mainEnv: {
            MONGO_HOST: "db",
            MONGO_PORT: "27017",
            MONGO_DATABASE: options.database || "app",
            MONGO_USER: options.user || "app",
            MONGO_PASSWORD: options.password || "password",
            ...(options.mainEnv || {})
        },
        database: {
            type: "mongodb",
            containerName: "db",
            images: ["mongo:latest", "mongo:7", "mongo:6"],
            defaultImage: "mongo:latest",
            restart: "always",
            environment: {
                MONGO_INITDB_ROOT_USERNAME: options.user || "app",
                MONGO_INITDB_ROOT_PASSWORD: options.password || "password",
                MONGO_INITDB_DATABASE: options.database || "app"
            },
            volumes: ["./mongodb:/data/db"]
        }
    }),

    /**
     * Redis cache variant
     * @param {Object} options - Customization options
     * @returns {Object} Cache variant config
     */
    redis: (options = {}) => ({
        id: "redis",
        label: "Redis",
        mainEnv: {
            REDIS_HOST: "redis",
            REDIS_PORT: "6379",
            REDIS_PASSWORD: options.password || "",
            ...(options.mainEnv || {})
        },
        database: {
            type: "redis",
            containerName: "redis",
            images: ["redis:latest", "redis:7", "redis:6"],
            defaultImage: "redis:latest",
            restart: "always",
            environment: options.password ? {
                REDIS_PASSWORD: options.password
            } : {},
            volumes: ["./redis:/data"]
        }
    })
};
