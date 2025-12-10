import variant1 from './variant1.js';
import variant2 from './variant2.js';
import variant3 from './variant3.js';

export default {
  id: "portainer",
  name: "Portainer",
  description: "Portainer is a lightweight, open-source management UI for Docker environments. It provides an easy-to-use web interface for managing containers, images, networks, and volumes, making Docker administration accessible to users of all skill levels.",
  category: "Management",
  logo: "/images/portainer.png",
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
