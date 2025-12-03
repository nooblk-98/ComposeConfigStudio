export default {
  id: "n8n",
  name: "n8n (MySQL)",
  description: "Workflow automation backed by MySQL",
  category: "Automation",
  logo: "https://n8n.io/favicon.ico",
  version: "latest",
  defaultPort: 5678,
  databases: ["mysql"],
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
        DB_TYPE: "mysqldb",
        DB_MYSQLDB_HOST: "mysql",
        DB_MYSQLDB_PORT: "3306",
        DB_MYSQLDB_DATABASE: "n8n",
        DB_MYSQLDB_USER: "n8n",
        DB_MYSQLDB_PASSWORD: "n8n@123"
      },
      optionalEnv: [
        { key: "N8N_ENCRYPTION_KEY", defaultValue: "", description: "Encryption key for credentials", category: "Security" },
        { key: "N8N_BASIC_AUTH_ACTIVE", defaultValue: "false", description: "Enable basic auth", category: "Security" },
        { key: "N8N_HOST", defaultValue: "localhost", description: "Public host for callbacks", category: "Networking" },
        { key: "WEBHOOK_URL", defaultValue: "http://localhost:5678/", description: "Public webhook URL", category: "Networking" },
        { key: "GENERIC_TIMEZONE", defaultValue: "UTC", description: "Container timezone", category: "General" }
      ],
      dependsOn: ["mysql"],
      volumes: [
        "./n8n_data:/home/node/.n8n"
      ]
    },
    {
      name: "mysql",  
      displayName: "MySQL/MariaDB",
      mandatory: false,
      images: ["mysql:8","mariadb:10.6","mariadb:10.5","mariadb:10.4"],
      defaultImage: "mariadb:10.6",
      containerName: "mysql",
      restart: "always",
      ports: [],
      environment: {
        MYSQL_ROOT_PASSWORD: "root",
        MYSQL_DATABASE: "${n8n.DB_MYSQLDB_DATABASE}",
        MYSQL_USER: "${n8n.DB_MYSQLDB_USER}",
        MYSQL_PASSWORD: "${n8n.DB_MYSQLDB_PASSWORD}"
      },
      volumes: ["./mysql_data:/var/lib/mysql"]
    }
  ],

  networks: ["n8n"],
  namedVolumes: ["n8n_data", "mysql_data"]
};
