// List of all available apps
// Each app has its own folder with an app.js configuration file

export const appsList = [
  {
    id: "wordpress",
    name: "WordPress",
    category: "CMS",
    description: "Popular CMS platform for websites and blogs",
    logo: "https://e7.pngegg.com/pngimages/510/1010/png-clipart-wordpress-com-blog-wordpress.png"
  },
  {
    id: "grafana",
    name: "Grafana",
    category: "Monitoring",
    description: "Analytics and monitoring platform with beautiful dashboards",
    logo: "https://raw.githubusercontent.com/grafana/grafana/main/public/img/grafana_icon.svg"
  },
  {
    id: "nginx-proxy-manager",
    name: "Nginx Proxy Manager",
    category: "Networking",
    description: "Easy-to-use reverse proxy management with SSL support",
    logo: "https://nginxproxymanager.com/logo.svg"
  },
  {
    id: "uptime-kuma",
    name: "Uptime Kuma",
    category: "Monitoring",
    description: "Self-hosted monitoring tool like Uptime Robot",
    logo: "https://uptime.kuma.pet/img/icon.svg"
  }
];

// Export helper to get app config dynamically
export async function getAppConfig(appId) {
  try {
    const module = await import(`./${appId}/app.js`);
    return module.default;
  } catch (error) {
    console.error(`Failed to load app config for ${appId}:`, error);
    return null;
  }
}
