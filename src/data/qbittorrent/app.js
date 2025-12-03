export default {
  id: "qbittorrent",
  name: "qBittorrent",
  description: "Torrent client with a modern web UI",
  category: "Media",
  logo: "https://cdn.jsdelivr.net/gh/selfhst/icons@main/svg/qbittorrent.svg",
  version: "latest",
  defaultPort: 8080,
  databases: [],
  tools: [{ name: "Docker", version: "24+" }],

  services: [
    {
      name: "qbittorrent",
      displayName: "qBittorrent",
      mandatory: true,
      images: [
        "lscr.io/linuxserver/qbittorrent:latest"
      ],
      defaultImage: "lscr.io/linuxserver/qbittorrent:latest",
      containerName: "qbittorrent",
      restart: "unless-stopped",
      ports: ["8080:8080", "6881:6881", "6881:6881/udp"],
      environment: {
        TZ: "Asia/Colombo"
      },
      optionalEnv: [
        { key: "PUID", defaultValue: "1000", description: "User ID for file permissions", category: "Permissions" },
        { key: "PGID", defaultValue: "1000", description: "Group ID for file permissions", category: "Permissions" },
        { key: "WEBUI_PORT", defaultValue: "8080", description: "Web UI port inside the container", category: "Networking" },
        { key: "TORRENTING_PORT", defaultValue: "6881", description: "Torrenting port inside the container", category: "Networking" }
      ],
      volumes: [
        "./qbittorrent/config:/config",
        "./qbittorrent/downloads:/downloads"
      ]
    }
  ],

  networks: ["qbittorrent"]
};
