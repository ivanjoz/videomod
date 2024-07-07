import { defineConfig } from "@solidjs/start/config";
import type { Options } from "vite-plugin-solid"
import path from 'path'

const IS_PRD = process.env.npm_lifecycle_event !== 'dev'
console.log("IS_PROD:", IS_PRD)

if (import.meta.hot){ 
  import.meta.hot.accept(() => import.meta.hot.invalidate())
}

export default defineConfig({
  ssr: false,
  server: IS_PRD ? undefined : {
    renderer: "false",
    static: true,
    dev: false,
  },  
  devOverlay: false,
  solid: IS_PRD ? undefined : {
    hot: false,
    ssr: false,
    dev: false,
    solid: {
      delegateEvents: false,
      wrapConditionals: false,
      contextToCustomElements: false,
      hydratable: false
    }
  } as Options,
  vite() {    
    return { 
      build: {},
      resolve: {
        alias: {
          "@styles": path.resolve(process.env.PWD as string,'src/styles'),
        }
      },
      server: {
        hmr: false
      },
    }
  }
})