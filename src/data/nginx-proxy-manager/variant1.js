export default {
  id: "nginx-proxy-manager-sqlite",
  name: "Nginx Proxy Manager (SQLite)",
  description: "Easy-to-use reverse proxy management with SQLite database",
  category: "Networking",
  logo: "https://nginxproxymanager.com/logo.svg",
  version: "latest",
  defaultPort: 81,
  databases: ["sqlite"],
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
        DB_SQLITE_FILE: "/data/database.sqlite"
      },
    //   optionalEnv: [
    //     { key: "DISABLE_IPV6", defaultValue: "true", description: "Disable IPv6 support", category: "Network" },
    //     { key: "X_FRAME_OPTIONS", defaultValue: "sameorigin", description: "X-Frame-Options header", category: "Security" }
    //   ],
      volumes: [
        "./data:/data",
        "./letsencrypt:/etc/letsencrypt"
      ]
    }
  ],

  namedVolumes: []
};
