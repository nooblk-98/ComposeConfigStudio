export default {
  id: "plex",
  name: "Plex Media Server",
  description: "Stream your media library to any device",
  category: "Media",
  logo: "https://www.plex.tv/wp-content/uploads/2018/01/plex-logo-dark.svg",
  version: "latest",
  defaultPort: 32400,
  databases: [],
  tools: [
    { name: "Plex", version: "latest" }
  ],
  
  services: [
    {
      name: "plex",
      displayName: "Plex",
      mandatory: true,
      images: [
        "plexinc/pms-docker:latest",
        "plexinc/pms-docker:public"
      ],
      defaultImage: "plexinc/pms-docker:latest",
      containerName: "plex",
      restart: "always",
      ports: ["32400:32400"],
      environment: {
        PLEX_CLAIM: "",
        TZ: "UTC",
        PUID: "1000",
        PGID: "1000"
      },
      volumes: [
        "./plex_config:/config",
        "./media:/media"
      ]
    }
  ],
  
  namedVolumes: []
};
