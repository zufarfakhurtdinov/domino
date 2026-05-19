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

## Slot System

A slot is a connection opportunity on a domino where another matching domino half can attach. Slots include the half they belong to, the side they sit on, their geometric position, and whether that side is already occupied by a link.

Each domino exposes slots based on its orientation. End slots support straight connections between dominoes with the same orientation. Side-center slots support perpendicular connections, so a horizontal domino can attach to the side of a vertical domino, or the reverse.

During dragging, the game looks for compatible open slots near the dragged domino. If a compatible slot pair is within the snap threshold and the resulting placement does not collide with another domino, the game shows a snap highlight. Dropping the domino commits the snap and creates a link between the matched halves.

## Test

```bash
npm test
npm run test:e2e
npx tsc --noEmit
```

## Structure

- `src/core/`: testable game logic for geometry, matching, slots, snap placement, links, and layout.
- `src/main.ts`: browser entry that loads the SVG renderer by default, with `?renderer=dom` for the DOM renderer.
- `src/renderer-svg/` and `src/renderer-dom/`: browser renderers.
- `test/`: Vitest unit tests and Playwright browser tests.
