# Docker Stack Generator

A modern web application that generates Docker Compose YAML and Docker CLI commands using an intuitive UI. Built with Next.js, TypeScript, TailwindCSS, and Monaco Editor.

## Features

- **Interactive UI**: Configure Docker containers with a clean, modern interface
- **Real-time Generation**: Instantly see Docker Compose YAML and CLI commands as you configure
- **Syntax Highlighting**: Monaco Editor provides VS Code-like code editing experience
- **Copy to Clipboard**: One-click copy of generated commands
- **Extensible**: Easily add new applications by editing JSON configuration
- **Responsive Design**: Works seamlessly on different screen sizes

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Code Editor**: Monaco Editor (powers VS Code)
- **State Management**: React Hooks

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Navigate to the project directory:
```bash
cd "c:\Users\suppo\Local Sites\wordpresstest\app\public\wp-content\plugins\docker-stack"
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open your browser and navigate to:
```
http://localhost:3000
```

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
docker-stack/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── apps/
│   │   │       └── route.ts          # API endpoint for app definitions
│   │   ├── globals.css               # Global styles
│   │   ├── layout.tsx                # Root layout
│   │   └── page.tsx                  # Main page component
│   ├── components/
│   │   ├── AppSidebar.tsx            # Left sidebar with app info
│   │   ├── ConfigPanel.tsx           # Configuration form panel
│   │   └── OutputPanel.tsx           # Docker output with tabs
│   ├── data/
│   │   └── apps.json                 # App definitions (easily extensible)
│   ├── types/
│   │   └── app.ts                    # TypeScript type definitions
│   └── utils/
│       └── dockerGenerator.ts        # Docker generation logic
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── next.config.js
```

## Adding New Applications

To add a new application, edit `src/data/apps.json`:

```json
{
  "apps": [
    {
      "id": "your-app",
      "name": "Your App",
      "version": "1.0.0",
      "description": "App description with features",
      "logo": "https://example.com/logo.png",
      "versions": ["1.0.0", "0.9.0"],
      "defaultPort": 8080,
      "image": "yourorg/yourapp",
      "tools": [
        { "name": "Tool 1", "version": "1.0.0" }
      ],
      "env": {
        "APP_ENV": {
          "key": "APP_ENV",
          "value": "production",
          "description": "Application environment"
        }
      },
      "volumes": {
        "data": {
          "path": "/var/lib/app",
          "description": "Data directory"
        }
      },
      "databases": ["sqlite", "postgres"],
      "features": {
        "runner": false
      }
    }
  ]
}
```

### Schema Explanation

- **id**: Unique identifier for the app
- **name**: Display name
- **version**: Current version
- **description**: Short description shown in sidebar
- **logo**: URL to app logo image
- **versions**: Array of available versions
- **defaultPort**: Default port number
- **image**: Docker image name (without tag)
- **tools**: List of included tools with versions
- **env**: Environment variables with defaults
- **volumes**: Volume mount points with descriptions
- **databases**: Supported database types
- **features**: Optional features (runner, etc.)

## Customization

### Styling

Modify `tailwind.config.js` to customize colors and theme:

```javascript
theme: {
  extend: {
    colors: {
      primary: '#3b82f6',
      secondary: '#1e293b',
    },
  },
}
```

### Generator Logic

Edit `src/utils/dockerGenerator.ts` to customize how Docker Compose and CLI commands are generated.

### Add Custom Sections

To add new configuration sections:

1. Update the `AppDefinition` type in `src/types/app.ts`
2. Add the section to your app definition in `apps.json`
3. Create a new component or add to `ConfigPanel.tsx`
4. Update generator functions to handle new configuration

## Features in Detail

### Container Settings
- Custom container name
- Port mapping configuration

### Docker Volumes
- Data volume (frequently changing files)
- Config volume (configuration files)
- Temporary volume (cloned repos, temp files)
- Each can be toggled on/off

### Database Settings
- SQLite, MySQL, and PostgreSQL support
- One-click database selection
- Automatically updates environment variables

### Admin User Configuration
- Login username
- Display name
- Password
- Email address

### Runner Settings
- Optional runner enablement
- Configurable per application

## API Endpoints

### GET /api/apps
Returns all available applications and their configurations.

**Response:**
```json
{
  "apps": [
    { ... }
  ]
}
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use this project for any purpose.

## Support

For issues, questions, or contributions, please open an issue on the repository.

## Example: Semaphore Configuration

The application comes with a pre-configured Semaphore example that demonstrates all features:

- Multiple version support (2.16, 2.15, 2.14)
- Complete tool listing (Ansible, Bash, OpenSSH, Terraform, PowerShell)
- Three volume types (data, config, tmp)
- Three database options (SQLite, MySQL, PostgreSQL)
- Admin user configuration
- Runner support

This serves as a reference for adding your own applications.
