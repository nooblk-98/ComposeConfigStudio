import { AppDefinition, AppConfig } from '@/types/app';

export function generateDockerCompose(app: AppDefinition, config: AppConfig): string {
  const serviceName = config.name.toLowerCase().replace(/\s+/g, '-');
  
  // Build volumes array
  const volumes: string[] = [];
  const appVolumes = app.volumes ?? {};
  Object.entries(config.volumes).forEach(([key, enabled]) => {
    const volumeDef = appVolumes[key];
    if (enabled && volumeDef) {
        const override = config.volumeOverrides?.[key];
        if (override) {
          // If hostPath provided treat as bind mount, else named volume
          if (override.hostPath) {
            volumes.push(`      - ${override.hostPath}:${override.containerPath || volumeDef.path}`);
          } else {
            volumes.push(`      - ${serviceName}_${key}:${override.containerPath || volumeDef.path}`);
          }
        } else {
          volumes.push(`      - ${serviceName}_${key}:${volumeDef.path}`);
        }
    }
  });

  // Build environment variables
  const envVars: string[] = [];
  Object.entries(config.env).forEach(([key, value]) => {
    if (value) {
      // If using external DB, override DB related env vars if they match known patterns
      if (config.useExternalDb && config.externalDbConfig) {
        if (key.includes('DB_HOST') || key.includes('MYSQL_HOST') || key.includes('POSTGRES_HOST')) {
           envVars.push(`      ${key}: ${config.externalDbConfig.host}`);
           return;
        }
        if (key.includes('DB_PORT')) {
           envVars.push(`      ${key}: ${config.externalDbConfig.port}`);
           return;
        }
        if (key.includes('DB_USER') || key.includes('MYSQL_USER') || key.includes('POSTGRES_USER')) {
           envVars.push(`      ${key}: ${config.externalDbConfig.user}`);
           return;
        }
        if (key.includes('DB_PASSWORD') || key.includes('MYSQL_PASSWORD') || key.includes('POSTGRES_PASSWORD')) {
           envVars.push(`      ${key}: ${config.externalDbConfig.password}`);
           return;
        }
        if (key.includes('DB_NAME') || key.includes('MYSQL_DATABASE') || key.includes('POSTGRES_DB')) {
           envVars.push(`      ${key}: ${config.externalDbConfig.name}`);
           return;
        }
      }
      envVars.push(`      ${key}: ${value}`);
    }
  });
    // Optional env vars (user-enabled)
    if (config.optionalEnv) {
      Object.entries(config.optionalEnv).forEach(([key, value]) => {
        if (value) envVars.push(`      ${key}: ${value}`);
      });
    }
    // Custom env vars
    config.customEnv.forEach(e => {
      if (e.key && e.value) envVars.push(`      ${e.key}: ${e.value}`);
    });

    // Build ports (base + custom)
    const ports: string[] = [`      - "${config.port}:${app.defaultPort}"`];
    config.customPorts.forEach(p => {
      if (p.host && p.container) ports.push(`      - "${p.host}:${p.container}"`);
    });

    // Custom volumes binds
    config.customVolumes.forEach(v => {
      if (v.name && v.containerPath) {
        const host = v.hostPath ? v.hostPath : v.name; // if hostPath blank treat name as named volume
        volumes.push(`      - ${host}:${v.containerPath}`);
      }
    });

    // Labels
    const labels: string[] = [];
    config.labels.forEach(l => {
      if (l.key && l.value) labels.push(`      - ${l.key}=${l.value}`);
    });

    // Attached Services
    const attachedServicesYaml: string[] = [];
    const dependsOn: string[] = [];
    
    if (config.attachedServices.length > 0 && app.attachable_services) {
      config.attachedServices.forEach(serviceId => {
        const serviceDef = app.attachable_services?.find(s => s.id === serviceId);
        if (serviceDef) {
          const attachedServiceName = `${serviceName}_${serviceDef.id}`;
          const serviceConfig = config.attachedServiceConfigs?.[serviceId] || {};
          
          dependsOn.push(attachedServiceName);
          
          let serviceBlock = `  ${attachedServiceName}:
    image: ${serviceDef.image}
    container_name: ${attachedServiceName}
    restart: unless-stopped`;
          
          if (serviceDef.defaultPort) {
             const port = serviceConfig.port || serviceDef.defaultPort;
             // For phpMyAdmin or if user customized port, map it
             if (serviceDef.id === 'phpmyadmin' || serviceConfig.port) {
               serviceBlock += `\n    ports:\n      - "${port}:80"`; // Assuming internal port is 80 for web UIs, might need to be dynamic if serviceDef specifies internal port
             }
          }

          if (serviceDef.env) {
            serviceBlock += `\n    environment:`;
            Object.entries(serviceDef.env).forEach(([k, v]) => {
               // Check for override
               let val = serviceConfig.env?.[k] || v;
               
               // Replace placeholders if any (and if not overridden by user)
               if (!serviceConfig.env?.[k]) {
                   if (v === 'db') val = config.useExternalDb ? config.externalDbConfig?.host || 'db' : serviceName; 
               }
               
               serviceBlock += `\n      ${k}: ${val}`;
            });
          }
          attachedServicesYaml.push(serviceBlock);
        }
      });
    }

    // DB Service Generation (Internal)
    let dbServiceYaml = '';
    const appDatabases = app.databases ?? [];
    if (!config.useExternalDb && (appDatabases.length > 0 || app.needs_db)) {
       // We need to generate a DB service.
       // Default to the first supported DB or the selected one.
       const dbType = config.database || appDatabases[0] || 'mysql';
       const dbServiceName = `${serviceName}_db`;
       
       // Update main app env to point to this DB
       // This is tricky because we already generated envVars above.
       // We might need to overwrite them.
       // Actually, the `env` in config is what populates envVars.
       // If we are using internal DB, the `env` values for DB_HOST should be `dbServiceName`.
       // The user might have already set them in the UI?
       // In `ConfigPanel`, `initialEnv` is set from `app.env`.
       // `WORDPRESS_DB_HOST` default value is `db`.
       // So if we name the service `db` or match the value, it works.
       // Let's name the service `db` to match default env vars, but scope it to the project if possible?
       // Or just use the value from the config.
       
       // Let's find the DB host env var key
       const dbHostKey = Object.keys(config.env).find(k => k.includes('DB_HOST') || k.includes('MYSQL_HOST') || k.includes('POSTGRES_HOST'));
       const dbHostValue = dbHostKey ? config.env[dbHostKey] : 'db';
       
       // If the value is 'localhost' or something, we might want to change it? 
       // But let's assume the default 'db' is what we want for internal.
       
       // Use user-selected database image or default
       let dbImage = config.dbImage || 'mysql:8.0'; // Default to MySQL 8.0
       let dbEnv = '';
       
       if (dbType === 'mysql' || dbType === 'mariadb') {
         // Use the selected MySQL version from config
         if (!config.dbImage) {
           dbImage = 'mysql:8.0'; // Fallback
         }
         dbEnv = `      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: ${config.env.WORDPRESS_DB_NAME || config.externalDbConfig?.name || 'wordpress'}
      MYSQL_USER: ${config.env.WORDPRESS_DB_USER || config.externalDbConfig?.user || 'wordpress'}
      MYSQL_PASSWORD: ${config.env.WORDPRESS_DB_PASSWORD || config.externalDbConfig?.password || 'wordpress'}`;
       } else if (dbType === 'postgres') {
         // Use the selected Postgres version from config
         if (!config.dbImage) {
           dbImage = 'postgres:16'; // Fallback
         }
          dbEnv = `      POSTGRES_PASSWORD: ${config.externalDbConfig?.password || 'rootpassword'}
      POSTGRES_DB: ${config.env.DB_NAME || config.externalDbConfig?.name || 'app'}
      POSTGRES_USER: ${config.env.DB_USER || config.externalDbConfig?.user || 'app'}`;
       }
       
       const dbDataPath = dbType === 'postgres' ? '/var/lib/postgresql/data' : '/var/lib/mysql';
       
       dbServiceYaml = `  ${dbHostValue}:
    image: ${dbImage}
    container_name: ${serviceName}_${dbHostValue}
    restart: unless-stopped
    environment:
${dbEnv}
    volumes:
      - ${serviceName}_db_data:${dbDataPath}`;
      
       dependsOn.push(dbHostValue);
    }

  // Build the compose YAML
    const yaml = `version: '3.8'

  services:
    ${serviceName}:
      image: ${app.image}:${config.version}
      container_name: ${serviceName}
      ports:
  ${ports.join('\n')}
  ${envVars.length > 0 ? `    environment:\n${envVars.join('\n')}` : ''}
  ${volumes.length > 0 ? `    volumes:\n${volumes.join('\n')}` : ''}
  ${labels.length > 0 ? `    labels:\n${labels.join('\n')}` : ''}
  ${config.networks.length > 0 ? `    networks:\n${config.networks.map(n => `      - ${n}`).join('\n')}` : ''}
      restart: ${config.restartPolicy || 'unless-stopped'}
      ${dependsOn.length > 0 ? `depends_on:\n${dependsOn.map(d => `        - ${d}`).join('\n')}` : ''}

${dbServiceYaml}
${attachedServicesYaml.join('\n')}

  ${config.networks.length > 0 ? `networks:\n${config.networks.map(n => `  ${n}:`).join('\n')}` : ''}
  ${volumes.length > 0 || (dbServiceYaml && !config.useExternalDb) ? `
  volumes:
${Object.entries(config.volumes)
    .filter(([_, enabled]) => enabled)
    .map(([key]) => `  ${serviceName}_${key}:`)
    .join('\n')}
${dbServiceYaml ? `  ${serviceName}_db_data:` : ''}` : ''}`;

  return yaml;
}

export function generateDockerRun(app: AppDefinition, config: AppConfig): string {
  const containerName = config.name.toLowerCase().replace(/\s+/g, '-');
  const appVolumes = app.volumes ?? {};
  
  let command = `docker run -d \\
  --name ${containerName} \\
  -p ${config.port}:${app.defaultPort}`;

  // Add environment variables
  Object.entries(config.env).forEach(([key, value]) => {
    if (value) {
      command += ` \\\n  -e ${key}="${value}"`;
    }
  });
  
  // Add optional env vars
  if (config.optionalEnv) {
    Object.entries(config.optionalEnv).forEach(([key, value]) => {
      if (value) {
        command += ` \\\n  -e ${key}="${value}"`;
      }
    });
  }

  // Add volumes
  Object.entries(config.volumes).forEach(([key, enabled]) => {
    const volumeDef = appVolumes[key];
    if (enabled && volumeDef) {
        const override = config.volumeOverrides?.[key];
        if (override) {
          if (override.hostPath) {
            command += ` \\\n  -v ${override.hostPath}:${override.containerPath || volumeDef.path}`;
          } else {
            command += ` \\\n  -v ${containerName}_${key}:${override.containerPath || volumeDef.path}`;
          }
        } else {
          command += ` \\\n  -v ${containerName}_${key}:${volumeDef.path}`;
        }
    }
  });
    // Custom port mappings
    config.customPorts.forEach(p => {
      if (p.host && p.container) {
        command += ` \\\n  -p ${p.host}:${p.container}`;
      }
    });

    // Custom volumes
    config.customVolumes.forEach(v => {
      if (v.containerPath) {
        const host = v.hostPath ? v.hostPath : v.name;
        if (host) {
          command += ` \\\n  -v ${host}:${v.containerPath}`;
        }
      }
    });

    // Labels
    config.labels.forEach(l => {
      if (l.key && l.value) {
        command += ` \\\n  --label ${l.key}=${l.value}`;
      }
    });

    // Networks (only first for run command simplicity)
    if (config.networks[0]) {
      command += ` \\\n  --network ${config.networks[0]}`;
    }

  // Add restart policy
    command += ` \\\n  --restart ${config.restartPolicy || 'unless-stopped'}`;

  // Add image
  command += ` \\\n  ${app.image}:${config.version}`;

  return command;
}
