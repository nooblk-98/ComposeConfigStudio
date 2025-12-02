export default {
  id: "nginx-proxy-manager-postgres",
  name: "Nginx Proxy Manager (PostgreSQL)",
  description: "Easy-to-use reverse proxy management with PostgreSQL database",
  category: "Networking",
  logo: "https://nginxproxymanager.com/logo.svg",
  version: "latest",
  defaultPort: 81,
  databases: ["postgres"],
  tools: [{ name: "Nginx", version: "latest" }],

  services: [
    {
      name: "nginx_proxy_manager",
      mandatory: true,
      images: [
        "jc21/nginx-proxy-manager:latest",
      ],
      defaultImage: "jc21/nginx-proxy-manager:latest",
      containerName: "nginx",
      restart: "always",
      ports: ["80:80", "81:81", "443:443"],
      environment: {
        TZ: "UTC",
        DB_POSTGRES_HOST: "postgres",
        DB_POSTGRES_USER: "dbuser",
        DB_POSTGRES_PASSWORD: "dbpass@123+",
        DB_POSTGRES_NAME: "database"
      },
optionalEnv: [
        { key: "DB_POSTGRES_PORT", defaultValue: "", description: "Change Only When Use Without default Port", category: "Network" },
      ],
      volumes: [
        "./data:/data",
        "./letsencrypt:/etc/letsencrypt"
      ],
      dependsOn: ["postgres"]
    },
    {
      name: "postgres",
      mandatory: false,
      defaultEnabled: true,
      images: [
        "postgres:latest",
        "postgres:16",
        "postgres:15",
        "postgres:14"
      ],
      defaultImage: "postgres:latest",
      containerName: "postgres",
      restart: "always",
      ports: [],
      environment: {
        POSTGRES_DB: "${nginx_proxy_manager.DB_POSTGRES_NAME}",
        POSTGRES_USER: "${nginx_proxy_manager.DB_POSTGRES_USER}",
        POSTGRES_PASSWORD: "${nginx_proxy_manager.DB_POSTGRES_PASSWORD}"
      },
      volumes: ["./postgres:/var/lib/postgresql/data"]
    }
  ],

  networks: ["nginx"],
  namedVolumes: []
};
