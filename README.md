# View360

A browser-based 360° equirectangular image viewer. Drop any equirectangular photo and explore it interactively in a full-screen spherical view.

## Features

- **Drag to pan** — click and drag to look around
- **Scroll / pinch to zoom** — mouse wheel or two-finger pinch, FOV range 20°–120°
- **Touch support** — single-finger pan and two-finger pinch zoom on mobile
- **FOV slider** — HUD control for precise zoom adjustment
- **Save view** — exports the current viewport as a PNG screenshot
- **Drag-and-drop or file browse** — no upload, images stay in the browser

## Supported formats

Any equirectangular image in JPG, PNG, or WebP. The image is mapped onto the inside of a sphere using Three.js.

## Running locally

Requires [Node.js](https://nodejs.org/) 20 (via nvm) or Docker.

### With nvm

```bash
./npm_run_dev.sh
```

Dev server starts at `http://localhost:5173`.

### With Docker

```bash
./run.sh
```

Builds a production image served via nginx at `http://localhost:5173`.

### E2E tests

```bash
npx playwright test
```

## Tech stack

- [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Three.js](https://threejs.org/) — WebGL sphere rendering
- [Vite 4](https://vitejs.dev/)
- [Playwright](https://playwright.dev/) — end-to-end tests
- [nginx](https://nginx.org/) (Docker production image)
