"use client";
import Dexie from 'dexie'
import { createSignal } from 'solid-js'

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
  const ix1 = offer.indexOf('nc=IN IP4')
  const ix2 = offer.indexOf('\\r',ix1+10)
  const IP  = offer.substring(ix1+10,ix2).trim()
  return IP
}

export const [iceConnectionState, setIceConnectionState] = createSignal("Pending")
export const [recivedMessages, setRecivedMessages] = createSignal([])
export const [connectionState, setConnectionState] = createSignal("Pending")

interface WsResponse { accion: string, body: any }

export class RTCManager {

  offerString: string
  connection: RTCPeerConnection
  channel: RTCDataChannel
  promiseOngoing: Promise<string>

  constructor(isOffer?: boolean){
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
    
    this.connection.onicecandidate = () => {
      if(this.connection.localDescription.type == 'offer'){
        const offer =  JSON.stringify(this.connection.localDescription)
        const IP = getIpFromCandidate(offer).split(".").filter(x => x)
        if(IP[0] === 'localhost' || IP[0] === '0' || IP[0] === '127'){ 
          return
        }
        // The offer with the correct public IP is ready here (previuos offers are generated with private IP)
        this.offerString = JSON.stringify(this.connection.localDescription)
        console.log("resolviendo offer string::", this.offerString)
        iceCandidateResolve(this.offerString)
        this.promiseOngoing = null
      }
    }

    this.connection.ondatachannel = (event) => {
      console.log('ondatachannel')
      this.channel = event.channel
      this.channel.onmessage = ev => this.onMessage(ev)
    }
  
    this.connection.onnegotiationneeded = async (ev) => {
      console.log('onnegotiationneeded', ev)
    }

    this.channel = this.connection.createDataChannel('data')
    this.channel.onopen = event => console.log('onopen', event)
    this.channel.onmessage = ev => this.onMessage(ev)

    if(isOffer){
      this.connection.createOffer().then((offer) => {
        console.log("offer generated::", offer)
        this.connection.setLocalDescription(offer)
      })
    }
  }
  
  async getOffer(){
    return this.promiseOngoing ? await this.promiseOngoing : this.offerString
  }

  async acceptOfferRequest(remoteOffer: string): Promise<string> {
    await this.connection.setRemoteDescription(JSON.parse(remoteOffer))
    console.log("Waiting for answer...")
    let iceAnswer = ""
    const promise = new Promise<string>(r => {
      this.connection.onicecandidate = () => {
        if(this.connection.localDescription.type == 'answer'){
          iceAnswer = JSON.stringify(this.connection.localDescription)
          r(iceAnswer)
        }
      }
    })
    const localAnswer = await this.connection.createAnswer()
    await this.connection.setLocalDescription(localAnswer)
    return iceAnswer ? iceAnswer : await promise
  }

  async acceptRemoteAnswer(remoteAnswer: string){
    if(!remoteAnswer){ return }
    try {
      await this.connection.setRemoteDescription(JSON.parse(remoteAnswer)) 
      localStorage.setItem("savedRemoteAnswer", remoteAnswer)
    } catch (error) {
      console.error(error)
      console.error('Remote Answer no pudo ser parseada', remoteAnswer)
    }
    console.log("Conexión establecida mediante Remote Answer!!")
  }
  
  onMessage(event: MessageEvent){
    
  }
}

interface IConnectionRequest {
  ClientAskID: string
  ClientFromID: string
  ConnID: string
  Offer: string
  Answer?: string
}

export class ConnectionManager {

  clientID: string
  onOpenPromise: Promise<any>
  worker: SharedWorker
  ws: WebSocket
  wsConnectionStatus: number = 0
  suscriptions: Map<string, (response: any) => void> = new Map()
  onMessage: (e: any) => void
  workerPromiseResolver: () => void
  // WebRTC
  rtcManager: RTCManager
  userRTCConnectionMap: Map<string,RTCManager> = new Map()
 
  constructor(){
    if(typeof window === 'undefined'){ 
      console.log("We are not in the browser"); return 
    }

    // WebRTC
    this.rtcManager = new RTCManager(true)

    // Shared Wss Worker
    this.worker = new SharedWorker(new URL('~/worker/worker.ts', import.meta.url), {
      type: 'module',
    })

    this.worker.port.start()

    this.worker.port.onmessage = (e) => {
      const [workerAccion,content] = e.data
      console.log("Worker Message Recived::", workerAccion, content) 
      if(workerAccion === 'connectionStatus'){
        this.wsConnectionStatus = content
        console.log("Recived ConnectionStatus::", content) 
        if(this.workerPromiseResolver){ this.workerPromiseResolver() }
      } else if(workerAccion === 'connectionError'){
        console.log("Recived ConnectionError::", content)
      // Respuesta del Websocket
      } else if(workerAccion === 'wssMessage'){
        const response = content as WsResponse
        console.log("Respuesta Websocket::", response)
        if(response.accion === "AskRTCConnection" && response.body){
          this.handleRTCConnectionRequest(response.body)
        } else if(response.accion === "AnswerRTCConnection" && response.body){
          this.handleRTCConnectionRequest(response.body)
        }

        const callback = this.suscriptions.get(response.accion)
        if(callback){
          callback(response.body)
        } else {
          if(this.onMessage){ this.onMessage(response) }
        }
      }
    }

    this.onOpenPromise = Promise.all([
      new Promise<void>((p) => {
        this.workerPromiseResolver = p
        this.worker.port.postMessage(['getConnectionStatus'])
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
  }

  on(accion: string, callback: (response: any) => void){
    this.suscriptions.set(accion, callback)
  }

  async sendMessage(accion: string, messageBody: string){
    if(this.onOpenPromise){ await this.onOpenPromise }
    console.log('Client-ID a enviar::', this.clientID)
    const message = { a: accion, b: messageBody, c: this.clientID }
    this.worker.port.postMessage(['sendMessage', message])
  }

  getRtcManager(ClientID: string, reload?: boolean){
    if(!this.userRTCConnectionMap.has(ClientID)){
      this.userRTCConnectionMap.set(ClientID, new RTCManager(true))
    }
    return this.userRTCConnectionMap.get(ClientID)
  }

  async sendOffer(){
    const offerString = await this.rtcManager.getOffer()
    const message = { offer: offerString }
    await this.sendMessage("PostRtcOffer", JSON.stringify(message))
  }

  // Paso 1: Enviar Offer hacia ClientAskID
  async askConnection(ClientAskID: string, ConnID: string){
    console.log("Generando RTC Offer...", ClientAskID)
    const rtcManager = this.getRtcManager(ClientAskID)
    const rtcOffer = await rtcManager.getOffer()
    console.log("rtc offer generado:: ", rtcOffer)
    const connRequest = { ClientAskID, ConnID, Offer: rtcOffer }
    await this.sendMessage("AskRTCConnection", JSON.stringify(connRequest))
  }

  // Paso 2: Recibir Offer y enviar Answer hacia ClientFromID
  async handleRTCConnectionRequest(req: IConnectionRequest){
    if(!req.ClientFromID || !req.Offer){
      console.warn("No ClientFromID in request::", req)
      return
    }
    const rtcManager = this.getRtcManager(req.ClientFromID)
    req.Answer = await rtcManager.acceptOfferRequest(req.Offer)
    req.Offer = ""
    this.sendMessage("AnswerRTCConnection", JSON.stringify(req))
  }

  // Paso 3: Recibir Answer y establecer conexión
  async handleRTCConnectionAnswer(req: IConnectionRequest){
    if(!req.ClientAskID || !req.Answer){
      console.warn("No ClientFromID in request::", req)
      return
    }
    const rtcManager = this.getRtcManager(req.ClientFromID)
    console.log("Aceptando remote answer y estableciendo conexión::",req.Answer)
    await rtcManager.acceptRemoteAnswer(req.Answer)
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

  const compressionStream = new self.CompressionStream('gzip')
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