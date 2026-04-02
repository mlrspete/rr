import { defineConfig } from "vite";

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? "/rr/" : "/",
  build: {
    chunkSizeWarningLimit: 650,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("three/examples/jsm")) {
            return "three-extras";
          }

          if (id.includes(`${"node_modules"}${"/"}three${"/"}`) || id.includes(`${"node_modules"}\\three\\`)) {
            return "three-core";
          }

          if (id.includes(`${"node_modules"}${"/"}gsap${"/"}`) || id.includes(`${"node_modules"}\\gsap\\`)) {
            return "gsap";
          }
        },
      },
    },
  },
});
