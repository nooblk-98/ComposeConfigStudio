export default {
  id: "uptime-kuma",
  name: "Uptime Kuma",
  description: "Uptime Kuma is a self-hosted monitoring tool that allows you to monitor your websites, APIs, and services with beautiful status pages and notifications. It offers features similar to Uptime Robot, including uptime monitoring, response time tracking, and alerting via various channels.",
  category: "Monitoring",
  logo: "/images/uptime-kuma.png",
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
        "louislam/uptime-kuma:2.0.2",
        "louislam/uptime-kuma:1.0.1"
      ],
      defaultImage: "louislam/uptime-kuma:latest",
      containerName: "uptime_kuma",
      restart: "always",
      ports: ["3001:3001"],
      environment: {
        TZ: "Asia/Colombo",
      },
      volumes: ["./opt/apps/uptime:/app/data"]
    }
  ],
  
  networks: ["uptime-kuma"],
  namedVolumes: ["uptime_kuma_data"]
};
