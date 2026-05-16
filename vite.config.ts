import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  base: "/domino/",
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        svg: resolve(__dirname, "svg.html"),
      },
    },
  },
});
