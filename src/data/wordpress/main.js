import variant1 from './variant1.js';
import variant2 from './variant2.js';

export default {
  id: "wordpress",
  name: "wordpress",
  description: "WordPress is a powerful, open-source content management system (CMS) that enables users to create and manage websites, blogs, e-commerce stores, and more. It features a user-friendly interface, thousands of plugins for extended functionality, customizable themes, and strong community support.",
  category: "CMS",
  logo: "/images/Wordpress.mp4",
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
