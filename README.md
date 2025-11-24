# Vibers - AI-Powered Web App Builder

![Vibers Logo](/Users/thruthesky/.gemini/antigravity/brain/6c6af3e3-d86a-4afc-a1e9-2d59bf94c792/vibers_logo_1763965519669.png)

Vibers is a Lovable.dev-inspired platform that lets you create web applications through natural language prompts. Simply describe what you want, and AI will generate a complete, deployable web app accessible via a unique subdomain.

## Features

- 🤖 **AI-Powered Generation**: Uses Gemini 2.0 Flash Lite to generate complete HTML apps
- 🔐 **Firebase Authentication**: Sign in with Google or Apple
- 🌐 **Wildcard Subdomains**: Each app gets its own `xxx.vibers.kr` subdomain
- 💬 **Chat Interface**: Conversational UI for iterating on your ideas
- 🎨 **Beautiful Design**: Modern gradient backgrounds and smooth animations
- 🐳 **Docker Ready**: Easy deployment with Docker Compose and Traefik
- 📦 **Persistent Storage**: Generated apps are saved to persistent volumes

## Tech Stack

- **Frontend**: Svelte 5 + SvelteKit + TailwindCSS
- **Backend**: SvelteKit API routes + Node.js
- **Authentication**: Firebase Auth (Google & Apple)
- **AI**: Google Gemini 2.0 Flash Lite
- **Deployment**: Docker + Dokploy + Traefik
- **Routing**: Wildcard subdomain support via Traefik

## Prerequisites

- Node.js 20+
- npm or pnpm
- Docker (for deployment)
- Firebase project with Auth enabled
- Domain with wildcard DNS configured (\*.vibers.kr)

## Local Development

1. **Clone the repository**

   ```bash
   git clone <your-repo-url>
   cd vibers
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Run the development server**

   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

## Firebase Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Authentication with Google and Apple providers
3. Enable Firebase AI Logic (Vertex AI) in your project
4. Copy your web app configuration to `src/lib/firebase.ts`

## Docker Deployment

### Build the Docker image

```bash
docker build -t vibers-web .
```

### Run with Docker Compose

```bash
docker-compose up -d
```

## Dokploy Deployment

1. **DNS Configuration**
   - Set up wildcard DNS: `*.vibers.kr` → Your server IP
   - Main domain: `vibers.kr` → Your server IP

2. **Create Compose App in Dokploy**
   - Go to Dokploy dashboard
   - Create new "Compose" application
   - Connect your GitHub repository
   - Set the compose file path to `docker-compose.yml`

3. **Configure Volume Mounts**
   - In Dokploy, add volume mount: `/var/app/generated`
   - This ensures generated HTML files persist across deployments

4. **Traefik Configuration**
   The `docker-compose.yml` includes Traefik labels for:
   - Main domain routing: `vibers.kr`
   - Wildcard subdomain routing: `*.vibers.kr`
   - HTTPS/TLS support

5. **Deploy**
   - Push your code to GitHub
   - Dokploy will automatically build and deploy
   - Access your app at `https://vibers.kr`

## How It Works

1. **User Authentication**: Users sign in with Google or Apple via Firebase Auth
2. **Prompt Submission**: Users describe their desired app in natural language
3. **AI Generation**: The prompt is sent to Gemini AI with instructions to generate a complete HTML app
4. **File Storage**: Generated HTML is saved to `/var/app/generated/{subdomain}.html`
5. **Subdomain Routing**: SvelteKit server hooks detect subdomains and serve the corresponding HTML file
6. **Access**: Users can access their app at `https://{subdomain}.vibers.kr`

## Project Structure

```
vibers/
├── src/
│   ├── lib/
│   │   ├── components/
│   │   │   ├── Header.svelte
│   │   │   ├── LoginModal.svelte
│   │   │   ├── PromptInput.svelte
│   │   │   └── ChatSidebar.svelte
│   │   ├── stores/
│   │   │   └── auth.svelte.ts
│   │   ├── utils/
│   │   │   └── subdomain.ts
│   │   └── firebase.ts
│   ├── routes/
│   │   ├── api/
│   │   │   └── generate/
│   │   │       └── +server.ts
│   │   ├── +page.svelte
│   │   ├── +page.server.ts
│   │   ├── +layout.svelte
│   │   └── layout.css
│   ├── hooks.server.ts
│   └── app.d.ts
├── Dockerfile
├── docker-compose.yml
├── .dockerignore
└── package.json
```

## Environment Variables

- `PORT`: Server port (default: 3000)
- `OUT_DIR`: Directory for generated HTML files (default: /var/app/generated)

## Development Notes

- The app uses Svelte 5 runes (`$state`, `$props`, `$bindable`)
- Firebase AI Logic integration uses the Gemini API directly
- Subdomain detection happens in `src/hooks.server.ts`
- Generated HTML is served via `+page.server.ts` load function

## Troubleshooting

### Rollup Module Not Found

If you see errors about `@rollup/rollup-darwin-arm64`:

```bash
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors

Run type checking:

```bash
npm run check
```

### Volume Permissions

Ensure the Docker container has write access to `/var/app/generated`:

```bash
chmod 777 /var/app/generated
```

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.
