export default {
  id: "traefik",
  name: "Traefik",
  description: "Modern HTTP reverse proxy and load balancer",
  category: "Networking",
  logo: "https://raw.githubusercontent.com/traefik/traefik/master/docs/content/assets/img/traefik.logo.png",
  version: "latest",
  defaultPort: 8080,
  databases: [],
  tools: [
    { name: "Traefik", version: "v3.0" }
  ],
  
  services: [
    {
      name: "traefik",
      displayName: "Traefik",
      mandatory: true,
      images: [
        "traefik:latest",
        "traefik:v2.10",
        "traefik:v3.0"
      ],
      defaultImage: "traefik:latest",
      containerName: "traefik",
      restart: "always",
      ports: [
        "80:80",
        "443:443",
        "8080:8080"
      ],
      environment: {},
      volumes: [
        "/var/run/docker.sock:/var/run/docker.sock:ro",
        "./traefik_config:/etc/traefik"
      ],
      command: "--api.insecure=true --providers.docker=true --providers.docker.exposedbydefault=false"
    }
  ],
  
  namedVolumes: []
};
