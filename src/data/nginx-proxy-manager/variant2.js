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
        DB_MYSQL_PORT: "3306",
        DB_MYSQL_USER: "npm",
        DB_MYSQL_PASSWORD: "npm",
        DB_MYSQL_NAME: "npm"
      },
    //   optionalEnv: [
    //     { key: "DISABLE_IPV6", defaultValue: "true", description: "Disable IPv6 support", category: "Network" },
    //     { key: "X_FRAME_OPTIONS", defaultValue: "sameorigin", description: "X-Frame-Options header", category: "Security" }
    //   ],
      volumes: [
        "./data:/data",
        "./letsencrypt:/etc/letsencrypt"
      ],
      dependsOn: ["mariadb"]
    },
    {
      name: "mariadb",
      mandatory: true,
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
        MYSQL_ROOT_PASSWORD: "npm",
        MYSQL_DATABASE: "npm",
        MYSQL_USER: "npm",
        MYSQL_PASSWORD: "npm"
      },
      volumes: ["./mysql:/var/lib/mysql"]
    }
  ],

  namedVolumes: []
};
