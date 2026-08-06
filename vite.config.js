import { resolve } from "node:path"
import { defineConfig } from "vite"
import glsl from "vite-plugin-glsl"

export default defineConfig({
  plugins: [glsl()],
  build: {
    rolldownOptions: {
      input: {
        home: resolve(import.meta.dirname, "index.html"),
        legal: resolve(import.meta.dirname, "mentions-legales/index.html"),
        playground: resolve(import.meta.dirname, "playground/index.html"),
        maeWebflow: resolve(import.meta.dirname, "projects/mae-webflow/index.html"),
        memoriesOfGhibli: resolve(
          import.meta.dirname,
          "projects/memories-of-ghibli/index.html",
        ),
        memoriesOfGhibliCredits: resolve(
          import.meta.dirname,
          "projects/memories-of-ghibli/credits/index.html",
        ),
        mirage: resolve(import.meta.dirname, "projects/mirage/index.html"),
        ornate: resolve(import.meta.dirname, "projects/ornate/index.html"),
        pulseFestival: resolve(
          import.meta.dirname,
          "projects/pulse-festival/index.html",
        ),
      },
    },
  },
})
