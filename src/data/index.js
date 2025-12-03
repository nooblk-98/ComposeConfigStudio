// List of all available apps
// Each app has its own folder with an app.js configuration file

/**
 * @typedef {Object} AppDefinition
 * @property {string} id
 * @property {string} name
 * @property {string} category
 * @property {string} description
 * @property {string} logo
 * @property {string} [version]
 * @property {number} [defaultPort]
 */

/** @type {AppDefinition[]} */
export const appsList = [
  {
    id: "wordpress",
    name: "WordPress",
    category: "CMS",
    description: "Popular CMS platform for websites and blogs",
    logo: "https://e7.pngegg.com/pngimages/510/1010/png-clipart-wordpress-com-blog-wordpress.png"
  },
  {
    id: "nginx-proxy-manager",
    name: "Nginx Proxy Manager",
    category: "Networking",
    description: "Easy-to-use reverse proxy management with SSL support",
    logo: "https://nginxproxymanager.com/logo.svg"
  },
    {
    id: "portainer",
    name: "Portainer",
    category: "Management",
    description: "Popular Docker container management UI",
    logo: "https://cdn.jsdelivr.net/gh/selfhst/icons@main/svg/portainer.svg"
  },
  {
    id: "uptime-kuma",
    name: "Uptime Kuma",
    category: "Monitoring",
    description: "Self-hosted monitoring tool like Uptime Robot",
    logo: "https://uptime.kuma.pet/img/icon.svg"
  },
  {
    id: "qbittorrent",
    name: "qBittorrent",
    category: "Media",
    description: "Torrent client with a modern web UI",
    logo: "https://cdn.jsdelivr.net/gh/selfhst/icons@main/svg/qbittorrent.svg"
  }
];

// Export helper to get app config dynamically
/**
 * @param {string} appId
 * @returns {Promise<AppDefinition | null>}
 */
export async function getAppConfig(appId) {
  try {
    // Try to load main.js first (for multi-variant apps)
    try {
      const module = await import(`./${appId}/main.js`);
      return module.default;
    } catch {
      // Fallback to app.js for simple apps
      const module = await import(`./${appId}/app.js`);
      return module.default;
    }
  } catch (error) {
    console.error(`Failed to load app config for ${appId}:`, error);
    return null;
  }
}
