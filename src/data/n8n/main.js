import variant1 from './variant1.js';
import variant2 from './variant2.js';
import variant3 from './variant3.js';

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
  multiDbVariant: true,
  variants: [
    {
      id: "sqlite",
      label: "Built-in (SQLite)",
      config: variant1
    },
    {
      id: "postgres-redis",
      label: "PostgreSQL + Redis",
      config: variant2
    },
    {
      id: "mysql",
      label: "MySQL/MariaDB",
      config: variant3
    }
  ]
};
