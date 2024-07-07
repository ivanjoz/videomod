import { MetaProvider } from "@solidjs/meta";
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import "@styles/global.css";
import "@styles/layout.css";
import { Suspense, createSignal } from "solid-js";

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

const isClient = typeof window !== 'undefined'

export const checkDevice = () => {
  if(!isClient) return 1
  if(window.innerWidth <= 640) return 3
  else if(window.innerWidth <= 980) return 2
  else { 
    return 1 
  }
}

export const [deviceType, setDeviceType] = createSignal(checkDevice())

export default function App() {

  if(isClient){
    window.addEventListener('resize', ()=> {
      const newDeviceType = checkDevice()
      console.log('device type::', newDeviceType)
      if(newDeviceType !== deviceType()){ setDeviceType(newDeviceType) }
    })
  }

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
