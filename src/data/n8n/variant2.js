export default {
  id: "n8n",
  name: "n8n (PostgreSQL + Redis)",
  description: "Workflow automation backed by PostgreSQL and Redis",
  category: "Automation",
  logo: "https://n8n.io/favicon.ico",
  version: "latest",
  defaultPort: 5678,
  databases: ["postgres", "redis"],
  tools: [{ name: "Docker", version: "24+" }],

  services: [
    {
      name: "n8n",
      displayName: "n8n",
      mandatory: true,
      images: ["n8nio/n8n:latest"],
      defaultImage: "n8nio/n8n:latest",
      containerName: "n8n",
      restart: "always",
      ports: ["5678:5678"],
      environment: {
        DB_TYPE: "postgresdb",
        DB_POSTGRESDB_HOST: "postgres",
        DB_POSTGRESDB_PORT: "5432",
        DB_POSTGRESDB_USER: "postgres",
        DB_POSTGRESDB_PASSWORD: "postgres@123",
        DB_POSTGRESDB_DATABASE: "n8n",
        QUEUE_BULL_REDIS_HOST: "redis"
      },
      optionalEnv: [
        { key: "N8N_ENCRYPTION_KEY", defaultValue: "", description: "Encryption key for credentials", category: "Security" },
        { key: "N8N_BASIC_AUTH_ACTIVE", defaultValue: "false", description: "Enable basic auth", category: "Security" },
        { key: "N8N_HOST", defaultValue: "localhost", description: "Public host for callbacks", category: "Networking" },
        { key: "WEBHOOK_URL", defaultValue: "http://localhost:5678/", description: "Public webhook URL", category: "Networking" },
        { key: "GENERIC_TIMEZONE", defaultValue: "UTC", description: "Container timezone", category: "General" }
      ],
      dependsOn: ["postgres", "redis"],
      volumes: [
        "./n8n_data:/home/node/.n8n"
      ]
    },
    {
      name: "postgres",
      displayName: "PostgreSQL",
      mandatory: false,
      images: ["postgres:14"],
      defaultImage: "postgres:14",
      containerName: "postgres",
      restart: "always",
      ports: [],
      environment: {
        POSTGRES_USER: "${n8n.DB_POSTGRESDB_USER}",
        POSTGRES_PASSWORD: "${n8n.DB_POSTGRESDB_PASSWORD}",
        POSTGRES_DB: "${n8n.DB_POSTGRESDB_DATABASE}"
      },
      volumes: ["./postgres_data:/var/lib/postgresql/data"]
    },
    {
      name: "redis",
      displayName: "Redis",
      mandatory: false,
      images: ["redis:6-alpine"],
      defaultImage: "redis:6-alpine",
      containerName: "redis",
      restart: "always",
      ports: []
    }
  ],

  networks: ["n8n"],
  namedVolumes: ["n8n_data", "postgres_data"]
};
