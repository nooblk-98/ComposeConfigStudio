export default {
  id: "wordpress",
  name: "WordPress",
  description: "Popular CMS platform for websites and blogs",
  category: "CMS",
  logo: "https://cdn.jsdelivr.net/gh/selfhst/icons@main/svg/wordpress.svg",
  version: "latest",
  defaultPort: 8080,
  databases: ["mysql", "mariadb"],
  tools: [
    { name: "PHP", version: "8.2" },
    { name: "Apache", version: "2.4" }
  ],

  services: [
    {
      name: "wordpress",
      mandatory: true,
      images: [
        "wordpress:apache",
        "wordpress:php8.1-apache",
        "wordpress:php8.2-apache",
        "wordpress:php8.3-apache",
        "wordpress:php8.4-apache",
      ],
      defaultImage: "wordpress:apache",
      containerName: "wordpress",
      restart: "always",
      ports: ["8080:80"],
      environment: {
        WORDPRESS_DB_HOST: "database",
        WORDPRESS_DB_USER: "wpuser",
        WORDPRESS_DB_PASSWORD: "wppass",
        WORDPRESS_DB_NAME: "wordpress"
      },
      optionalEnv: [
        { key: "WORDPRESS_TABLE_PREFIX", defaultValue: "wp_", description: "Database table prefix", category: "Database" },
        { key: "WORDPRESS_DEBUG", defaultValue: "0", description: "Enable debug mode (1/0)", category: "Development" }
      ],
      volumes: ["./wordpress:/var/www/html"],
      dependsOn: ["database"]
    },
    {
      name: "database",
      mandatory: false,
      defaultEnabled: true,
      images: [
        "mariadb:10.6",
        "mariadb:11",
        "mysql:8.0",
        "mysql:8.4",
        "mysql:5.7"
      ],
      defaultImage: "mariadb:10.6",
      containerName: "database",
      restart: "always",
      ports: [],
      environment: {
        MYSQL_ROOT_PASSWORD: "rootpass",
        MYSQL_DATABASE: "${wordpress.WORDPRESS_DB_NAME}",
        MYSQL_USER: "${wordpress.WORDPRESS_DB_USER}",
        MYSQL_PASSWORD: "${wordpress.WORDPRESS_DB_PASSWORD}"
      },
      volumes: ["./db_data:/var/lib/mysql"]
    },
    {
      name: "phpmyadmin",
      mandatory: false,
      images: [
        "phpmyadmin/phpmyadmin:latest",
        "phpmyadmin/phpmyadmin:5.2"
      ],
      defaultImage: "phpmyadmin/phpmyadmin:latest",
      containerName: "phpmyadmin",
      restart: "always",
      ports: ["8081:80"],
      environment: {
        PMA_HOST: "database",
        PMA_USER: "root",
        PMA_PASSWORD: "${database.MYSQL_ROOT_PASSWORD}"
      },
      optionalEnv: [
        { key: "UPLOAD_LIMIT", defaultValue: "", description: "Upload limit (e.g., 64M)", category: "phpMyAdmin" },
        { key: "MEMORY_LIMIT", defaultValue: "", description: "Memory limit (e.g., 256M)", category: "phpMyAdmin" },
        { key: "MAX_EXECUTION_TIME", defaultValue: "", description: "Max execution time (seconds)", category: "phpMyAdmin" },
        { key: "TZ", defaultValue: "", description: "Timezone (e.g., UTC)", category: "phpMyAdmin" }
      ],
      dependsOn: ["database"]
    }
  ],
  
  networks: ["wordpress"],
  namedVolumes: ["db_data"]
};
