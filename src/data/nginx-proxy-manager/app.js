export default {
  id: "nginx-proxy-manager",
  name: "Nginx Proxy Manager",
  description: "Easy-to-use reverse proxy management with SSL support",
  category: "Networking",
  logo: "https://nginxproxymanager.com/logo.svg",
  version: "latest",
  defaultPort: 81,
  databases: ["sqlite"],
  tools: [
    { name: "Nginx", version: "latest" }
  ],
  
  services: [
    {
      name: "nginx-proxy-manager",
      displayName: "Nginx Proxy Manager",
      mandatory: true,
      images: [
        "jc21/nginx-proxy-manager:latest",
        "jc21/nginx-proxy-manager:2.10.4"
      ],
      defaultImage: "jc21/nginx-proxy-manager:latest",
      containerName: "nginx_proxy_manager",
      restart: "always",
      ports: [
        "80:80",
        "81:81",
        "443:443"
      ],
      environment: {
        DB_SQLITE_FILE: "/data/database.sqlite"
      },
      volumes: [
        "./data:/data",
        "./letsencrypt:/etc/letsencrypt"
      ]
    }
  ],
  
  namedVolumes: []
};
