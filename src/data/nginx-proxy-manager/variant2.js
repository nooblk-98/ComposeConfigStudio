export default {
  id: "nginx-proxy-manager-mysql",
  name: "Nginx Proxy Manager (MySQL)",
  description: "Easy-to-use reverse proxy management with MySQL/MariaDB database",
  category: "Networking",
  logo: "https://nginxproxymanager.com/logo.svg",
  version: "latest",
  defaultPort: 81,
  databases: ["mysql", "mariadb"],
  tools: [{ name: "Nginx", version: "latest" }],

  services: [
    {
      name: "nginx_proxy_manager",
      mandatory: true,
      images: [
        "jc21/nginx-proxy-manager:latest",
        "jc21/nginx-proxy-manager:2.10.4",
        "jc21/nginx-proxy-manager:2.9.22"
      ],
      defaultImage: "jc21/nginx-proxy-manager:latest",
      containerName: "nginx_proxy_manager",
      restart: "always",
      ports: ["80:80", "81:81", "443:443"],
      environment: {
        TZ: "UTC",
        DB_MYSQL_HOST: "mariadb",
        DB_MYSQL_USER: "dbuser",
        DB_MYSQL_PASSWORD: "user@123+",
        DB_MYSQL_NAME: "nginxproxymanager"
      },
      optionalEnv: [
        { key: "DB_MYSQL_PORT", defaultValue: "", description: "Change Only When Use Without default Port", category: "Network" },
      ],
      volumes: [
        "./data:/data",
        "./letsencrypt:/etc/letsencrypt"
      ],
      dependsOn: ["mariadb"]
    },
    {
      name: "mariadb",
      mandatory: false,
      images: [
        "mariadb:latest",
        "mariadb:11",
        "mariadb:10.6",
        "mysql:8.0",
        "mysql:8.4"
      ],
      defaultImage: "mariadb:latest",
      containerName: "mariadb",
      restart: "always",
      ports: [],
      environment: {
        MYSQL_ROOT_PASSWORD: "root@123+",
        MYSQL_DATABASE: "${nginx_proxy_manager.DB_MYSQL_NAME}",
        MYSQL_USER: "${nginx_proxy_manager.DB_MYSQL_USER}",
        MYSQL_PASSWORD: "${nginx_proxy_manager.DB_MYSQL_PASSWORD}"
      },
      volumes: ["./mysql:/var/lib/mysql"]
    }
  ],

  namedVolumes: []
};
