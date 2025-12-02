export interface Tool {
  name: string;
  version: string;
}

export interface EnvVar {
  key: string;
  value: string;
  description: string;
}

export interface OptionalEnvVar {
  key: string;
  defaultValue: string;
  description: string;
  category?: string; // e.g., "Performance", "Security", "Logging"
}

export interface Volume {
  path: string;
  description: string;
}

export interface AttachableService {
  id: string;
  name: string;
  image: string;
  defaultPort?: number;
  env?: Record<string, string>;
  description?: string;
}

export interface ServiceDefinition {
  name: string; // Service name (e.g., "wordpress", "db", "phpmyadmin")
  displayName?: string; // Display name in UI (e.g., "Database")
  mandatory: boolean; // Whether this service is required
  images: string[]; // Available Docker images (e.g., ["wordpress:php8.2-apache", "wordpress:php8.3-apache"])
  defaultImage: string; // Default image to use
  containerName?: string; // Container name template
  restart?: string; // Restart policy
  ports?: string[]; // Port mappings (e.g., ["8080:80"])
  environment?: Record<string, string>; // Environment variables
  volumes?: string[]; // Volume mappings (e.g., ["./wordpress:/var/www/html"])
  dependsOn?: string[]; // Service dependencies
}

export interface AppDefinition {
  id: string;
  name: string;
  version: string;
  description: string;
  category: string;
  logo: string;
  versions: string[];
  defaultPort: number;
  image: string;
  tools: Tool[];
  
  // New simplified service-based structure
  services?: ServiceDefinition[]; // All services (main app, database, addons)
  namedVolumes?: string[]; // Named volumes to create (e.g., ["db_data"])
  
  // Legacy fields (keeping for backward compatibility)
  env: Record<string, EnvVar>;
  optionalEnv?: OptionalEnvVar[];
  volumes: Record<string, Volume>;
  databases: string[];
  features: {
    runner?: boolean;
  };
  needs_db?: boolean;
  supports_external_db?: boolean;
  attachable_services?: AttachableService[];
}

export interface AppConfig {
  name: string;
  version: string;
  port: number;
  env: Record<string, string>;
  optionalEnv?: Record<string, string>; // User-enabled optional env vars
  volumes: Record<string, boolean>;
  // Per-named volume override paths
  volumeOverrides?: Record<string, { hostPath: string; containerPath: string }>;
  database: string;
  dbVersion?: string; // Database version (e.g., "8.0", "5.7" for MySQL)
  dbImage?: string; // Full database image name (e.g., "mysql:8.0")
  useExternalDb: boolean;
  externalDbConfig?: {
    host?: string;
    port?: string;
    user?: string;
    password?: string;
    name?: string;
  };
  attachedServices: string[];
  attachedServiceConfigs: Record<string, {
    port?: number;
    env?: Record<string, string>;
  }>;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
  adminLogin: string;
  enableRunner: boolean;
  // Advanced options
  customEnv: { key: string; value: string }[];
  customPorts: { host: number; container: number }[];
  customVolumes: { name: string; hostPath: string; containerPath: string }[];
  labels: { key: string; value: string }[];
  networks: string[];
  restartPolicy: string;
}

// Optional advanced overrides per app (future use)
export interface AppAdvancedDefaults {
  labels?: { key: string; value: string }[];
  networks?: string[];
  restartPolicy?: string;
  customEnv?: { key: string; value: string }[];
  customPorts?: { host: number; container: number }[];
  customVolumes?: { name: string; hostPath: string; containerPath: string }[];
}
