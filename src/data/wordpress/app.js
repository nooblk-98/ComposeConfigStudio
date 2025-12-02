export default {
  id: "wordpress",
  name: "WordPress",
  description: "Popular CMS platform for websites and blogs",
  category: "CMS",
  logo: "https://e7.pngegg.com/pngimages/510/1010/png-clipart-wordpress-com-blog-wordpress.png",
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
        "wordpress:php8.2-apache",
        "wordpress:php8.3-apache",
        "wordpress:php8.4-apache",
        "wordpress:latest"
      ],
      defaultImage: "wordpress:php8.2-apache",
      containerName: "wordpress",
      restart: "always",
      ports: ["8080:80"],
      environment: {
        WORDPRESS_DB_HOST: "db",
        WORDPRESS_DB_USER: "wordpress",
        WORDPRESS_DB_PASSWORD: "wordpress",
        WORDPRESS_DB_NAME: "wordpress"
      },
      volumes: ["./wordpress:/var/www/html"],
      dependsOn: ["db"]
    },
    {
      name: "database",
      displayName: "Database",
      mandatory: false,
      images: [
        "mariadb:10.6",
        "mariadb:11",
        "mysql:8.0",
        "mysql:8.4",
        "mysql:5.7"
      ],
      defaultImage: "mariadb:10.6",
      containerName: "wordpress_db",
      restart: "always",
      ports: [],
      environment: {
        MYSQL_ROOT_PASSWORD: "root",
        MYSQL_DATABASE: "wordpress",
        MYSQL_USER: "wordpress",
        MYSQL_PASSWORD: "wordpress"
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
      containerName: "wordpress_phpmyadmin",
      restart: "always",
      ports: ["8081:80"],
      environment: {
        PMA_HOST: "db",
        PMA_USER: "root",
        PMA_PASSWORD: "root"
      },
      dependsOn: ["db"]
    }
  ],
  
  namedVolumes: ["db_data"]
};
