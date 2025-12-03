export default {
  id: "portainer",
  name: "Portainer Agent",
  description: "Lightweight agent to manage edge nodes with Portainer",
  category: "Management",
  logo: "https://cdn.jsdelivr.net/gh/selfhst/icons@main/svg/portainer.svg",
  version: "latest",
  defaultPort: 9001,
  databases: [],
  tools: [{ name: "Docker", version: "24+" }],

  services: [
    {
      name: "portainer-agent",
      mandatory: true,
      images: [
        "portainer/agent:latest",
        "portainer/agent:2.20.0",
        "portainer/agent:2.19.0"
      ],
      defaultImage: "portainer/agent:latest",
      containerName: "portainer_agent",
      restart: "always",
      ports: ["9001:9001"],
      environment: {},
      volumes: [
        "/var/run/docker.sock:/var/run/docker.sock",
        "/var/lib/docker/volumes:/var/lib/docker/volumes"
      ]
    }
  ],
  
  networks: ["portainer-agent"]
};
