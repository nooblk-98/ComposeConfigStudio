export default {
  id: "grafana",
  name: "Grafana",
  description: "Analytics and monitoring platform with beautiful dashboards",
  category: "Monitoring",
  logo: "https://raw.githubusercontent.com/grafana/grafana/main/public/img/grafana_icon.svg",
  version: "latest",
  defaultPort: 3000,
  databases: ["sqlite", "mysql", "postgres"],
  tools: [
    { name: "Grafana", version: "10.x" }
  ],
  
  services: [
    {
      name: "grafana",
      displayName: "Grafana",
      mandatory: true,
      images: [
        "grafana/grafana:latest",
        "grafana/grafana:10.2.0",
        "grafana/grafana:10.1.0"
      ],
      defaultImage: "grafana/grafana:latest",
      containerName: "grafana",
      restart: "always",
      ports: ["3000:3000"],
      environment: {
        GF_SECURITY_ADMIN_USER: "admin",
        GF_SECURITY_ADMIN_PASSWORD: "admin",
        GF_INSTALL_PLUGINS: "",
        GF_SERVER_ROOT_URL: "http://localhost:3000"
      },
      volumes: ["./grafana_data:/var/lib/grafana"]
    }
  ],
  
  namedVolumes: ["grafana_data"]
};
