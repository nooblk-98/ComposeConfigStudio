import variant1 from './variant1.js';
import variant2 from './variant2.js';
import variant3 from './variant3.js';

export default {
  id: "portainer",
  name: "Portainer",
  description: "Popular Docker container management UI",
  category: "Management",
  logo: "https://cdn.jsdelivr.net/gh/selfhst/icons@main/svg/portainer.svg",
  version: "latest",
  defaultPort: 9443,
  databases: [],
  tools: [{ name: "Docker", version: "24+" }],
  multiDbVariant: true,
  variants: [
    {
      id: "business-edition",
      label: "Business Edition",
      config: variant1
    },
    {
      id: "community-edition",
      label: "Community Edition",
      config: variant2
    },
        {
      id: "portainer-agent",
      label: "Portainer Agent",
      config: variant3
    }
  ]
};
