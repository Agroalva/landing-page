# Landing Page Monorepo

This is a Turborepo monorepo containing multiple applications and shared packages.

## Structure

```
├── apps/
│   ├── web/          # Next.js web application
│   └── app/          # Expo React Native application
├── packages/
│   ├── ui/           # Shared UI components
│   ├── utils/        # Shared utilities
│   └── types/        # Shared TypeScript types
└── turbo.json        # Turborepo configuration
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm

### Installation

```bash
# Install dependencies
pnpm install

# Or with npm
npm install
```

### Development

```bash
# Start all applications in development mode
pnpm dev

# Start specific application
pnpm dev --filter=web
pnpm dev --filter=app

# Build all applications
pnpm build

# Lint all packages
pnpm lint

# Type check all packages
pnpm type-check
```

### Available Scripts

- `pnpm dev` - Start all applications in development mode
- `pnpm build` - Build all applications
- `pnpm lint` - Lint all packages
- `pnpm type-check` - Type check all packages
- `pnpm clean` - Clean all build artifacts

## Applications

### Web App (`apps/web`)
Next.js application with Tailwind CSS and shadcn/ui components.

### Mobile App (`apps/app`)
Expo React Native application with Convex backend integration.

## Packages

### UI Package (`packages/ui`)
Shared UI components that can be used across applications.

### Utils Package (`packages/utils`)
Shared utility functions and helpers.

### Types Package (`packages/types`)
Shared TypeScript type definitions.

## Development Workflow

1. Make changes to shared packages in `packages/`
2. Changes are automatically reflected in applications that depend on them
3. Use `pnpm dev` to start all applications and see changes in real-time
4. Use `pnpm build` to build all applications for production

## Adding New Packages

1. Create a new directory in `packages/`
2. Add a `package.json` with appropriate dependencies
3. Add TypeScript configuration
4. Update workspace dependencies in applications that need the package

## Adding New Applications

1. Create a new directory in `apps/`
2. Add a `package.json` with appropriate dependencies
3. Add the application to the workspace configuration
4. Update the turbo.json pipeline if needed