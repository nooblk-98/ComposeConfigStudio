import variant1 from './variant1.js';
import variant2 from './variant2.js';
import variant3 from './variant3.js';

export default {
  id: "nginx-proxy-manager",
  name: "Nginx Proxy Manager",
  description: "Nginx Proxy Manager is an easy-to-use web-based interface for managing Nginx proxy hosts, SSL certificates, and access lists. It simplifies reverse proxy setup with automatic SSL from Let's Encrypt, making it ideal for self-hosted applications.",
  category: "Networking",
  logo: "/images/nginx.png",
  version: "latest",
  defaultPort: 81,
  databases: ["sqlite", "mysql", "mariadb", "postgres"],
  tools: [{ name: "Nginx", version: "latest" }],
  multiDbVariant: true,

  variants: [
    {
      id: "sqlite",
      label: "SQLite (No external database)",
      config: variant1
    },
    {
      id: "mysql",
      label: "MySQL/MariaDB",
      config: variant2
    },
    {
      id: "postgres",
      label: "PostgreSQL",
      config: variant3
    }
  ]
};
