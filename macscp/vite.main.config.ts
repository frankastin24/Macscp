import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rollupOptions: {
      external: [
        "ssh2",
        "cpu-features",
        "sshcrypto",
      ],
    },
  },
});