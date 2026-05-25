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

## Slot System

A slot is a connection opportunity on a domino where another matching domino half can attach. Slots include the half they belong to, the side they sit on, their geometric position, and whether that side is already occupied by a link.

Each domino has six possible slots: three on each half-domino. A half-domino has a slot on every exposed side, but there is no slot on the internal side shared by the two halves.

For a horizontal domino, the left half has left, top, and bottom slots; the right half has right, top, and bottom slots. For a vertical domino, the top half has top, left, and right slots; the bottom half has bottom, left, and right slots.

During dragging, the game looks for compatible open slots near the dragged domino. Open slots can snap when they face each other. Dominoes with different orientations can use any compatible facing slots; dominoes with the same orientation can only use their long-axis end slots, so they form one longer straight line. If a compatible slot pair is within the snap threshold and the resulting placement does not collide with another domino, the game shows a snap highlight. Dropping the domino commits the snap and creates a link between the matched halves.

## Test

```bash
npm test
npm run test:e2e
npx tsc --noEmit
```

## Structure

- `src/core/`: testable game logic for geometry, matching, slots, snap placement, links, and layout.
- `src/main.ts`: browser entry that loads the DOM renderer, with `?mode=editor` for the activity editor.
- `src/renderer-dom/`: browser renderer.
- `test/`: Vitest unit tests and Playwright browser tests.
