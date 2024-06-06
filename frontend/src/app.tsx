import { MetaProvider, Title } from "@solidjs/meta";
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";
import "@styles/global.css";

export default function App() {

  const myWorker = new Worker("worker.js");
  
  myWorker.onmessage = (e) => {
    console.log("Message received from worker", e.data);
  };

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
