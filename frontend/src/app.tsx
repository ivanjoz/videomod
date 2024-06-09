"use client";
import { MetaProvider } from "@solidjs/meta";
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import "@styles/global.css";
import "@styles/layout.css";
import { Suspense } from "solid-js";
import { Base64, TimeMToB64Decode, TimeMToB64Encode } from "./core/halpers";

export const GetWssAPI = () => {
  if(typeof window === 'undefined'){
    return ""
  }
  if(window.location.hostname === "0.0.0.0" || !window.location.port){
    return "wss://pv5s7gfoge.execute-api.us-east-1.amazonaws.com/p/"
  } else {
    return "ws://127.0.0.1:3589/ws"
  }
}

export default function App() {

  return (
    <Router
      root={props => (
        <MetaProvider>
          <Suspense>{props.children}</Suspense>
        </MetaProvider>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
