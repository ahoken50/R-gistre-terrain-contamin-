import { defineConfig } from "vite";

export default defineConfig({
  base: "/R-gistre-terrain-contamin-/",
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        upload: "upload-data.html"
      }
    }
  }
});
