import { AppDefinition, AppConfig } from '@/types/app';

export function generateDockerCompose(app: AppDefinition, config: AppConfig): string {
  const serviceName = config.name.toLowerCase().replace(/\s+/g, '-');
  
  // Build volumes array
  const volumes: string[] = [];
  Object.entries(config.volumes).forEach(([key, enabled]) => {
    if (enabled && app.volumes[key]) {
      volumes.push(`      - ${serviceName}_${key}:${app.volumes[key].path}`);
    }
  });

  // Build environment variables
  const envVars: string[] = [];
  Object.entries(config.env).forEach(([key, value]) => {
    if (value) {
      envVars.push(`      ${key}: ${value}`);
    }
  });
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

  ${config.networks.length > 0 ? `networks:\n${config.networks.map(n => `  ${n}:`).join('\n')}` : ''}
  ${volumes.length > 0 ? `
  volumes:\n${Object.entries(config.volumes)
    .filter(([_, enabled]) => enabled)
    .map(([key]) => `  ${serviceName}_${key}:`)
    .join('\n')}` : ''}`;

  return yaml;
}

export function generateDockerRun(app: AppDefinition, config: AppConfig): string {
  const containerName = config.name.toLowerCase().replace(/\s+/g, '-');
  
  let command = `docker run -d \\
  --name ${containerName} \\
  -p ${config.port}:${app.defaultPort}`;

  // Add environment variables
  Object.entries(config.env).forEach(([key, value]) => {
    if (value) {
      command += ` \\\n  -e ${key}="${value}"`;
    }
  });

  // Add volumes
  Object.entries(config.volumes).forEach(([key, enabled]) => {
    if (enabled && app.volumes[key]) {
      command += ` \\\n  -v ${containerName}_${key}:${app.volumes[key].path}`;
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
