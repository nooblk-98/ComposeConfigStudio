export default {
  id: "n8n",
  name: "n8n",
  description: "Workflow automation tool with a visual editor",
  category: "Automation",
  logo: "https://n8n.io/favicon.ico",
  version: "latest",
  defaultPort: 5678,
  databases: [],
  tools: [{ name: "Docker", version: "24+" }],

  services: [
    {
      name: "n8n",
      displayName: "n8n",
      mandatory: true,
      images: ["n8nio/n8n:latest"],
      defaultImage: "n8nio/n8n:latest",
      containerName: "n8n",
      restart: "unless-stopped",
      ports: ["5678:5678"],
      environment: {},
      optionalEnv: [
        { key: "N8N_ENCRYPTION_KEY", defaultValue: "", description: "Encryption key for credentials", category: "Security" },
        { key: "N8N_BASIC_AUTH_ACTIVE", defaultValue: "false", description: "Enable basic auth", category: "Security" },
        { key: "N8N_HOST", defaultValue: "localhost", description: "Public host for callbacks", category: "Networking" },
        { key: "WEBHOOK_URL", defaultValue: "http://localhost:5678/", description: "Public webhook URL", category: "Networking" },
        { key: "GENERIC_TIMEZONE", defaultValue: "UTC", description: "Container timezone", category: "General" }
      ],
      volumes: [
        "./n8n_data:/home/node/.n8n"
      ]
    }
  ],

  networks: ["n8n"],
  namedVolumes: ["n8n_data"]
};
