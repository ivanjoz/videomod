import { base94Decode, base94Encode } from "~/core/halpers";
import { compressStringWithGzip } from "~/services/connection";

setInterval(() => {
  console.log('worker.js is running');
  // self.postMessage({ connected: 2 })
},1000)

// console.log("webtransport::",self.WebTransport)

const GetWssAPI = () =>{
  if(self.location.hostname === "0.0.0.0" || !self.location.port){
    return "wss://pv5s7gfoge.execute-api.us-east-1.amazonaws.com/p/"
  } else {
    return "ws://127.0.0.1:3589/ws"
  }
}

const connectedPorts: Map<number,MessagePort> = new Map()

const wss = new WebSocket(GetWssAPI())

interface WsResponse {
  accion: string
  body: any
}

let connectionStatus = 0
let connectionStatusPromiseResolver: () => void
let connectionStatusPromise = new Promise<void>((r) => {
  connectionStatusPromiseResolver = r
})

wss.onopen = async () => {
  console.log('WebSocket is connected')
  connectionStatus = 1
  if(connectionStatusPromiseResolver){ connectionStatusPromiseResolver() }
  connectionStatusPromise = null
  connectionStatusPromiseResolver = null
  for(let [_, port] of connectedPorts){
    port.postMessage(["connectionStatus",connectionStatus]) 
  }
}

wss.onmessage = (event) => {
  const base94gzString = event.data
  console.log("bytes recibidos por decodificar::", base94gzString.length)
  const base94gzArray = base94Decode(base94gzString)
  console.log("bytes recibidos decodificados::", base94gzArray.length)
  const blob = new Blob([base94gzArray], { type: 'application/gzip' })
  const ds = new DecompressionStream('gzip');
  const decompressedStream = blob.stream().pipeThrough(ds);

  new Response(decompressedStream).blob()
  .then(blob => blob.text())
  .then(responseText => {
    let response: WsResponse
    try {
      response = JSON.parse(responseText)
    } catch (error) {
      console.warn("La respuesta no es un JSON válido: ",response)
      return
    }
    console.log("respuesta websocket::", response)
    for(let [_, port] of connectedPorts){
      port.postMessage(["wssMessage",response]) 
    }
    /*
    if(response.accion && typeof response.body !== 'undefined'){

    } else {
      
    }
    */
  })
}

const onmessage = (e: MessageEvent, port: MessagePort) => {
  const [accion,content] = e.data
  console.log("worker message recived::", accion, content)

  if(accion === 'getConnectionStatus'){ 
    if(connectionStatusPromise){
      connectionStatusPromise.then(() => {
        port.postMessage(["connectionStatus",connectionStatus])
      })
    } else {
      port.postMessage(["connectionStatus",connectionStatus])
    }
  } else if(accion === 'sendMessage'){
    const messageToSend = typeof content === 'string' ? content : JSON.stringify(content)
    compressStringWithGzip(messageToSend).then((compressed) => {
      console.log("bytes a enviar::", compressed.length)
      const base94string = base94Encode(compressed)
      wss.send(base94string)
    })
  }
}

self.addEventListener('connect', (ev) => {
  const port = (ev as any).ports[0] as MessagePort
  connectedPorts.set(connectedPorts.size + 1, port)
  port.addEventListener("message", (e) => onmessage(e, port))
  port.start()
})