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
  env: Record<string, EnvVar>;
  optionalEnv?: OptionalEnvVar[]; // Optional environment variables with defaults
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
