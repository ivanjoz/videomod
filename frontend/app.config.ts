import { defineConfig } from "@solidjs/start/config";
import type { Options } from "vite-plugin-solid"
import path from 'path'

const IS_PRD = process.env.npm_lifecycle_event !== 'dev'
console.log("IS_PROD:", IS_PRD)

if (import.meta.hot){
  import.meta.hot.accept(() => import.meta.hot.invalidate())
}

export default defineConfig({
  ssr: false, // IS_PRD,
  server: {
    renderer: "false",
    /*
    preset: "githubPages",
    prerender: {
      routes: ["/"],
    }
    */
  },  
  devOverlay: false,
  solid: {
    hot: false,
    ssr: false,
    dev: true,
  } as Options,
  vite() {
    return { 
      resolve: {
        alias: {
          "@styles": path.resolve(process.env.PWD as string,'src/styles'),
        }
      },
      server: {
        hmr: { overlay: false }
      },
    }
  }
})