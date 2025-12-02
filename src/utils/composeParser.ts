// Very lightweight partial parser for docker-compose YAML focused on known sections.
// This avoids full YAML parsing complexity; it is heuristic-based.
// For production, replace with js-yaml and deeper validation.

export interface PartialComposeResult {
  environment?: Record<string,string>;
  ports?: string[];
  volumes?: string[];
  labels?: string[];
  networks?: string[];
}

export function parseComposePartial(yaml: string): PartialComposeResult {
  const result: PartialComposeResult = {};
  // Normalize line endings
  const lines = yaml.replace(/\r/g,'').split('\n');

  let currentSection: string | null = null;
  const env: Record<string,string> = {};
  const ports: string[] = [];
  const volumes: string[] = [];
  const labels: string[] = [];
  const networks: string[] = [];

  for (let raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    // Detect section headers (environment:, ports:, volumes:, labels:, networks:)
    if (/^(environment|ports|volumes|labels|networks):\s*$/.test(line)) {
      currentSection = line.slice(0, line.indexOf(':'));
      continue;
    }
    // Reset section on new top-level service or other header
    if (/^[a-zA-Z0-9_-]+:$/.test(line) && !/^(environment|ports|volumes|labels|networks):$/.test(line)) {
      currentSection = null;
    }
    if (!currentSection) continue;

    // Handle list items and key: value pairs
    if (currentSection === 'environment') {
      // environment supports key: value pairs (not dash form usually)
      if (/^[A-Za-z0-9_]+:\s*.+$/.test(line)) {
        const idx = line.indexOf(':');
        const k = line.slice(0, idx).trim();
        const v = line.slice(idx+1).trim();
        env[k] = v;
      } else if (/^-\s*[A-Za-z0-9_]+=.+$/.test(line)) {
        // dash style KEY=value
        const kv = line.replace(/^-/,'').trim();
        const eq = kv.indexOf('=');
        if (eq > -1) env[kv.slice(0,eq)] = kv.slice(eq+1);
      }
    } else if (currentSection === 'ports') {
      if (/^-\s*"?\d+:\d+"?$/.test(line)) {
        const val = line.replace(/^-\s*/,'').replace(/"/g,'').trim();
        ports.push(val);
      }
    } else if (currentSection === 'volumes') {
      if (/^-\s*.+:.+$/.test(line)) {
        const val = line.replace(/^-\s*/,'').trim();
        volumes.push(val);
      }
    } else if (currentSection === 'labels') {
      if (/^-\s*.+=.+$/.test(line)) {
        const val = line.replace(/^-\s*/,'').trim();
        labels.push(val);
      }
    } else if (currentSection === 'networks') {
      if (/^-\s*[A-Za-z0-9_-]+$/.test(line)) {
        const val = line.replace(/^-\s*/,'').trim();
        networks.push(val);
      }
    }
  }

  if (Object.keys(env).length) result.environment = env;
  if (ports.length) result.ports = ports;
  if (volumes.length) result.volumes = volumes;
  if (labels.length) result.labels = labels;
  if (networks.length) result.networks = networks;
  return result;
}
