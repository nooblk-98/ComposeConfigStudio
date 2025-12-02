export default {
  id: "redis",
  name: "Redis",
  description: "In-memory data structure store, cache, and message broker",
  category: "Database",
  logo: "https://cdn.worldvectorlogo.com/logos/redis.svg",
  version: "7-alpine",
  defaultPort: 6379,
  databases: [],
  tools: [
    { name: "Redis", version: "7.x" }
  ],
  
  services: [
    {
      name: "redis",
      displayName: "Redis",
      mandatory: true,
      images: [
        "redis:latest",
        "redis:7-alpine",
        "redis:6-alpine"
      ],
      defaultImage: "redis:7-alpine",
      containerName: "redis",
      restart: "always",
      ports: ["6379:6379"],
      environment: {},
      volumes: ["./redis_data:/data"],
      command: "redis-server --appendonly yes"
    }
  ],
  
  namedVolumes: ["redis_data"]
};
