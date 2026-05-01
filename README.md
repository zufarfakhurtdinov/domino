# Domino

A browser prototype for a language-learning domino game. The core game logic is kept separate from rendering so it can be tested without graphics or real media assets.

## Run

```bash
npm install
npm run dev
```

Open:

```txt
http://127.0.0.1:5173/
```

Useful fixtures:

```txt
?fixture=demo
?fixture=basic
?fixture=snap
?fixture=snap-rotated
?fixture=linked
```

## Test

```bash
npm test
npm run test:e2e
npx tsc --noEmit
```

## Publish Artifact

The checked-in browser artifact for GitHub Pages lives in `docs/`.

GitHub Pages should publish from the repository `docs/` directory.

After any change that affects the web app, rebuild and refresh that directory before pushing:

```bash
npm run build:docs
```

This command rebuilds the app and copies the final static output into `docs/`. Treat `docs/` as the checked-in GitHub Pages artifact directory that should stay in sync with the source.

## Structure

- `src/core/`: testable game logic for geometry, matching, snapping, links, and layout.
- `src/main.ts`: minimal Konva browser renderer.
- `docs/`: checked-in GitHub Pages build artifact.
- `test/`: Vitest unit tests and Playwright browser tests.
