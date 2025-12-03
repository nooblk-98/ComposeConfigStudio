import variant1 from './variant1.js';
import variant2 from './variant2.js';

export default {
  id: "wordpress",
  name: "wordpress",
  description: "Popular CMS platform for websites and blogs",
  category: "CMS",
  logo: "https://cdn.jsdelivr.net/gh/selfhst/icons@main/svg/wordpress.svg",
  version: "latest",
  defaultPort: 80,
  databases: ["mysql", "mariadb"],
  tools: [
    { name: "PHP", version: "8.2" },
    { name: "Apache", version: "2.4" }
  ],
  multiDbVariant: true,
  variants: [
    {
      id: "mysql",
      label: "MySQL",
      config: variant1
    },
    {
      id: "mariadb",
      label: "MariaDB",
      config: variant2
    }
  ]
};
