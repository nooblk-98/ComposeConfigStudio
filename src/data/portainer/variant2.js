export default {
  id: "portainer",
  name: "Portainer",
  description: "Popular Docker container management UI",
  category: "Management",
  logo: "https://cdn.jsdelivr.net/gh/selfhst/icons@main/svg/portainer.svg",
  version: "latest",
  defaultPort: 9443,
  databases: [],
  tools: [{ name: "Docker", version: "24+" }],

  services: [
    {
      name: "portainer",
      mandatory: true,
      images: [
        "portainer/portainer-ce:latest",
        "portainer/portainer-ce:2.20.0",
        "portainer/portainer-ce:2.19.0"
      ],
      defaultImage: "portainer/portainer-ce:latest",
      containerName: "portainer",
      restart: "always",
      ports: ["8000:8000", "9443:9443"],
      volumes: ["./portainer_data:/data", "/var/run/docker.sock:/var/run/docker.sock"]
    }
  ],
  
  networks: ["portainer"],
  namedVolumes: ["portainer_data"]
};
