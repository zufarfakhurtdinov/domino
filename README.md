# Domino

A browser prototype for a language-learning domino game. The core game logic is kept separate from rendering so it can be tested without graphics or real media assets.

## Run

```bash
npm install
npm run dev
```

Open:

```txt
http://127.0.0.1:5173/?fixture=basic
```

Useful fixtures:

```txt
?fixture=basic
?fixture=snap
?fixture=linked
```

## Test

```bash
npm test
npm run test:e2e
npx tsc --noEmit
```

## Publish Artifact

The checked-in browser artifact lives in `site/`.

After any change that affects the web app, rebuild and refresh that directory before pushing:

```bash
npm run build:docs
```

This command rebuilds the app and copies the final static output into `site/`. Treat `site/` as the final built web artifact directory that should stay in sync with the source.

## Structure

- `src/core/`: testable game logic for geometry, matching, snapping, links, and layout.
- `src/main.ts`: minimal Konva browser renderer.
- `site/`: checked-in built web artifact.
- `test/`: Vitest unit tests and Playwright browser tests.
