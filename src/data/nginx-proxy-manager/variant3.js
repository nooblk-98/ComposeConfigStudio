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
        "jc21/nginx-proxy-manager:2.10.4",
        "jc21/nginx-proxy-manager:2.9.22"
      ],
      defaultImage: "jc21/nginx-proxy-manager:latest",
      containerName: "nginx_proxy_manager",
      restart: "always",
      ports: ["80:80", "81:81", "443:443"],
      environment: {
        TZ: "UTC",
        DB_POSTGRES_HOST: "postgres",
        DB_POSTGRES_PORT: "5432",
        DB_POSTGRES_USER: "npm",
        DB_POSTGRES_PASSWORD: "npmpass",
        DB_POSTGRES_NAME: "npm"
      },
      optionalEnv: [
        { key: "DISABLE_IPV6", defaultValue: "true", description: "Disable IPv6 support", category: "Network" },
        { key: "X_FRAME_OPTIONS", defaultValue: "sameorigin", description: "X-Frame-Options header", category: "Security" }
      ],
      volumes: [
        "./data:/data",
        "./letsencrypt:/etc/letsencrypt"
      ],
      dependsOn: ["postgres"]
    },
    {
      name: "postgres",
      mandatory: true,
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
        POSTGRES_DB: "npm",
        POSTGRES_USER: "npm",
        POSTGRES_PASSWORD: "npmpass"
      },
      volumes: ["./postgres:/var/lib/postgresql/data"]
    }
  ],

  namedVolumes: []
};
