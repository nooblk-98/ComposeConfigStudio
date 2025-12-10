import variant1 from './variant1.js';
import variant2 from './variant2.js';
import variant3 from './variant3.js';

export default {
  id: "n8n",
  name: "n8n",
  description: "n8n is a free and open-source workflow automation tool that allows users to automate tasks and workflows using a visual drag-and-drop interface. It integrates with hundreds of apps and services, enabling no-code automation for productivity and business processes.",
  category: "Automation",
  logo: "/images/n8n.png",
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
