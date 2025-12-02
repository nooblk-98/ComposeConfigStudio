export default {
  id: "uptime-kuma",
  name: "Uptime Kuma",
  description: "Self-hosted monitoring tool like Uptime Robot",
  category: "Monitoring",
  logo: "https://uptime.kuma.pet/img/icon.svg",
  version: "latest",
  defaultPort: 3001,
  databases: ["sqlite"],
  tools: [
    { name: "Node.js", version: "latest" }
  ],
  
  services: [
    {
      name: "uptime-kuma",
      displayName: "Uptime Kuma",
      mandatory: true,
      images: [
        "louislam/uptime-kuma:latest",
        "louislam/uptime-kuma:1"
      ],
      defaultImage: "louislam/uptime-kuma:latest",
      containerName: "uptime_kuma",
      restart: "always",
      ports: ["3001:3001"],
      environment: {},
      volumes: ["./uptime_kuma_data:/app/data"]
    }
  ],
  
  namedVolumes: ["uptime_kuma_data"]
};
