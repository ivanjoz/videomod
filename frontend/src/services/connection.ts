import Dexie from 'dexie'
import { createSignal } from 'solid-js'
import { GetWssAPI } from '~/app'

let dexieInitPromise: Promise<void>
let dexiedb: Dexie

const getDexieInstance = async (): Promise<Dexie> => {
  if(dexieInitPromise){
    await dexieInitPromise
  }
  if(dexiedb){ return dexiedb }

  dexiedb = new Dexie('videomod')
  dexiedb.version(1).stores({
    config: 'key'
  })

  console.log("creando db dexie::", dexiedb)

  dexieInitPromise = new Promise((resolve, reject) => {
    dexiedb.open().then(()=>{
      resolve()
    }).catch((error) => {
      console.log('Error opening dexie', error)
      reject()
    })
  })
  
  await dexieInitPromise
  return dexiedb
}

const getClientID = async () => {
  const db = await getDexieInstance()
  const clientInfo = await db.table('config').get('clientInfo')
  if(!clientInfo){
    const id = Date.now().toString(36).substring(2) + Math.random().toString(36).substring(2,6)
    await db.table('config').put({key: 'clientInfo', id })
    return id
  } else {
    return clientInfo.id
  }
}

const getIpFromCandidate = (offer: string) => {
  // const ix1 = offer.indexOf('webrtc-datachannel')
  const ix1 = offer.indexOf('nc=IN IP4')
  const ix2 = offer.indexOf('\\r',ix1+10)
  const IP = offer.substring(ix1+10,ix2).trim()
  return IP
}

export const [iceConnectionState, setIceConnectionState] = createSignal("Pending")
export const [recivedMessages, setRecivedMessages] = createSignal([])
export const [connectionState, setConnectionState] = createSignal("Pending")

interface WsResponse {
  accion: string
  body: any
}

export class WebRTCManager {

  connection: RTCPeerConnection
  channel: RTCDataChannel
  offerString: string
  promiseOngoing: Promise<string>
  suscriptions: Map<string, WeakRef<(response: any) => void>> = new Map()

  constructor(){
    this.connection = new RTCPeerConnection({ 
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] 
    })

    this.connection.onconnectionstatechange = (event) => {
      console.log("connectionstatechange", event)
      setConnectionState(this.connection.connectionState)
    }
  
    this.connection.oniceconnectionstatechange = (event) => {
      console.log("oniceconnectionstatechange", event)
      setIceConnectionState(this.connection.iceConnectionState)
    }

    let iceCandidateResolve: (offerString: string) => void
    this.promiseOngoing = new Promise(r => { iceCandidateResolve = r })
    
    this.connection.onicecandidate = (event) => {
      const offer =  JSON.stringify(this.connection.localDescription)
      const IP = getIpFromCandidate(offer).split(".").filter(x => x)
      if(IP[0] === 'localhost' || IP[0] === '0' || IP[0] === '127'){ 
        return
      }
      //LA OFFER QUE VALE ES LA DE AQUÍ!!
      // console.log('offer ip', getIpFromCandidate(offer))
      // console.log('onicecandidate', JSON.stringify(this.connection.localDescription))
      this.offerString = JSON.stringify(this.connection.localDescription)
      console.log("resolviendo offer string::", this.offerString)
      iceCandidateResolve(this.offerString)
      this.promiseOngoing = null
    }
    
    const onmessage = (event: MessageEvent) => {
      setRecivedMessages([...recivedMessages(), event.data])
    }

    this.connection.ondatachannel = (event) => {
      console.log('ondatachannel')
      this.channel = event.channel
      this.channel.onmessage = onmessage
    }
  
    this.connection.onnegotiationneeded = async (ev) => {
      console.log('onnegotiationneeded', ev)
    }

    this.channel = this.connection.createDataChannel('data')
    this.channel.onopen = event => console.log('onopen', event)
    this.channel.onmessage = onmessage

    this.connection.createOffer().
    then((offer) => {
      this.connection.setLocalDescription(offer)
    })
  }

  on(accion: string, callback: (response: any) => void){
    this.suscriptions.set(accion, new WeakRef(callback))
  }

  async getOffer() {
    if(this.promiseOngoing){ return await this.promiseOngoing }
    if(this.offerString){ return this.offerString }
  }
}

export const webRTCManager = new WebRTCManager()

export class ConnectionManager {

  clientID: string
  offerString: string
  onOpenPromise: Promise<any>
  ws: WebSocket
  suscriptions: Map<string, WeakRef<(response: any) => void>> = new Map()
  onMessage: (e: any) => void

  constructor(){
    this.ws = new WebSocket(GetWssAPI())
    
    this.onOpenPromise = Promise.all([
      new Promise<void>((resolve) => {
        this.ws.onopen = async () => {
          console.log('WebSocket is connected')
          resolve()
        }
      }),
      new Promise<void>((resolve) => {
        getClientID().then(id => {
          this.clientID = id
          console.log('Client-ID obtenido::', this.clientID)
          resolve()
        })
      }),
    ]).then(() => {
      delete this.onOpenPromise
    })

    this.ws.onmessage = (event) => {
      const blob = event.data
      const ds = new DecompressionStream('gzip');
      const decompressedStream = blob.stream().pipeThrough(ds);
      new Response(decompressedStream).blob().then((blob) => {
        return blob.text()
      }).then((responseText) => {
        let response: WsResponse
        try {
          response = JSON.parse(responseText)
        } catch (error) {
          console.warn("La respuesta no es un JSON válido: ",response)
          return
        }
        if(response.accion && typeof response.body !== 'undefined'){
          const callback = this.suscriptions.get(response.accion)
          if(callback?.deref()){
            callback.deref()(response.body)
          } else {
            if(this.onMessage){ this.onMessage(response) }
          }
        } else {
          if(this.onMessage){ this.onMessage(response) }
        }
      })
    }
  
    this.ws.onerror = (error) => {
      console.log(error)
      console.log(`WebSocket error: ${error}`)
    }
  
    this.ws.onclose = () => {
      console.log('WebSocket connection closed')
    }
  }

  on(accion: string, callback: (response: any) => void){
    this.suscriptions.set(accion, new WeakRef(callback))
  }

  async sendMessage(accion: string, messageBody: string){
    if(this.onOpenPromise){ await this.onOpenPromise }
    console.log('Client-ID a enviar::', this.clientID)
    const message = { a: accion, b: messageBody, c: this.clientID }
    // const array8int = await compressStringWithGzip(JSON.stringify(message))
    this.ws.send(JSON.stringify(message))
  }

  async sendOffer(){
    const offerString = await webRTCManager.getOffer()
    const message = { offer: offerString }
    await this.sendMessage("PostRtcOffer", JSON.stringify(message))
  }
}

export const connectionManager = new ConnectionManager()

export const Connect = async ()=> {
  await connectionManager.sendMessage("SendHello","Hello Server")
  await connectionManager.sendOffer()
}

export const compressStringWithGzip =  async (inputString: string): Promise<Uint8Array> => {
  const encoder = new TextEncoder()
  const data = encoder.encode(inputString)

  const compressionStream = new window.CompressionStream('gzip')
  const writer = compressionStream.writable.getWriter()

  writer.write(data)
  writer.close()

  const reader = compressionStream.readable.getReader()
  const chunks = []

  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    chunks.push(value)
  }

  const compressedData = new Blob(chunks, { type: 'application/gzip' })
  const compressedArray = await compressedData.arrayBuffer()
  return  new Uint8Array(compressedArray)
}