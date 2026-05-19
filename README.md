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

## Structure

- `src/core/`: testable game logic for geometry, matching, snapping, links, and layout.
- `src/main.ts`: browser entry that loads the SVG renderer by default, with `?renderer=dom` for the DOM renderer.
- `src/renderer-svg/` and `src/renderer-dom/`: browser renderers.
- `test/`: Vitest unit tests and Playwright browser tests.
