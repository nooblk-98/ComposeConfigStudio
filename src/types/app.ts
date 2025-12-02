export interface Tool {
  name: string;
  version: string;
}

export interface EnvVar {
  key: string;
  value: string;
  description: string;
}

export interface Volume {
  path: string;
  description: string;
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
  volumes: Record<string, Volume>;
  databases: string[];
  features: {
    runner?: boolean;
  };
}

export interface AppConfig {
  name: string;
  version: string;
  port: number;
  env: Record<string, string>;
  volumes: Record<string, boolean>;
  // Per-named volume override paths
  volumeOverrides?: Record<string, { hostPath: string; containerPath: string }>;
  database: string;
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
