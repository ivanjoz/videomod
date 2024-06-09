"use client";
import Dexie from 'dexie'
import { createSignal } from 'solid-js'
import { IChatMessage, setChatMessages } from '~/components/chat';
import { GetWorker, TimeMToB64Encode } from '~/core/halpers';

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

export interface IConnStatus { 
  isLoading?: boolean, status?: string, iceStatus?: string, msg?: string, error?: string 
  newMessages?: number
}

export interface IClient {
  id: string
  connID: string
  messages: IChatMessage[]
  error?: string
  connStatus?: IConnStatus
  _updated?: number
  _updater?: () => void
}

export const [clientsMap, setClientsMap] = createSignal<Map<string,IClient>>(new Map())
export const [clientSelectedID, setClientSelectedID] = createSignal<string>()
export const [clientSelectedStatus, setClientSelectedStatus] = createSignal<IConnStatus>()

interface WsResponse { accion: string, body: any }

const setClientStatus = (id: string, msg: string, error?: string, 
  conn?: RTCPeerConnection) => {
  if(!id){ return }
  const client = clientsMap().get(id)
  if(!client.connStatus){ client.connStatus = {} }
  client.connStatus.msg = client.connStatus.msg || msg
  client.connStatus.isLoading = true
  client.connStatus.error = client.connStatus.error || error
  if(conn){
    client.connStatus.iceStatus = conn.iceConnectionState
    client.connStatus.status = conn.connectionState
  }
  const connState = (client.connStatus.status||"").toLowerCase()
  if(connState === "connected" || connState === "disconnected"){ 
    client.connStatus.isLoading = false
    client.connStatus.msg = ""
  }
  if(clientSelectedID() === id){
    setClientSelectedStatus({... client.connStatus})
  }
  if(client._updater){ client._updater() }
}

export class RTCManager {

  offerString: string
  connection: RTCPeerConnection
  channel: RTCDataChannel
  promiseOngoing: Promise<string>
  clientID: string

  constructor(isOffer?: boolean, clientID?: string){
    this.clientID = clientID || ""

    this.connection = new RTCPeerConnection({ 
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] 
    })

    this.connection.onconnectionstatechange = (event) => {
      // console.log("connectionstatechange", event)
      setClientStatus(this.clientID, "","",this.connection)
    }
  
    this.connection.oniceconnectionstatechange = (event) => {
      // console.log("oniceconnectionstatechange", event)
      setClientStatus(this.clientID, "","",this.connection)
    }

    let iceCandidateResolve: (offerString: string) => void

    if(isOffer){
      this.promiseOngoing = new Promise(r => { iceCandidateResolve = r })
    }
    
    this.connection.onicecandidate = () => {
      if(this.connection.localDescription.type == 'offer'){
        const offer =  JSON.stringify(this.connection.localDescription)
        const IP = getIpFromCandidate(offer).split(".").filter(x => x)
        if(IP[0] === 'localhost' || IP[0] === '0' || IP[0] === '127'){ 
          return
        }
        // The offer with the correct public IP is ready here (previuos offers are generated with private IP)
        this.offerString = JSON.stringify(this.connection.localDescription)
        console.log("resolviendo offer string...")
        iceCandidateResolve(this.offerString)
        this.promiseOngoing = null
      }
    }

    this.connection.ondatachannel = (event) => {
      console.log('ondatachannel')
      this.channel = event.channel
      this.channel.onmessage = ev => this.onMessage(ev,1)
    }
  
    this.connection.onnegotiationneeded = async (ev) => {
      console.log('onnegotiationneeded', ev)
    }

    this.channel = this.connection.createDataChannel('data')
    this.channel.onopen = event => console.log('onopen', event)
    this.channel.onmessage = ev => this.onMessage(ev,2)

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
    if(this.promiseOngoing){ await this.promiseOngoing }
    console.log("Aceptarndo Remote Offer...")
    await this.connection.setRemoteDescription(JSON.parse(remoteOffer))
    console.log("Generando Answer...")
    setClientStatus(this.clientID, "4. Creating RTC Answer...","",this.connection)
    let iceAnswer = ""
    const promise = new Promise<string>(r => {
      this.connection.onicecandidate = () => {
        if(this.connection.localDescription.type == 'answer'){
          iceAnswer = JSON.stringify(this.connection.localDescription)
          // console.log("iceAnswer::",iceAnswer)
          console.log("Answer Generada!!")
          setClientStatus(this.clientID, "5. RTC answer created, sending...","",this.connection)
          r(iceAnswer)
        }
      }
    })
    const localAnswer = await this.connection.createAnswer()
    await this.connection.setLocalDescription(localAnswer)
    return iceAnswer ? iceAnswer : await promise
  }

  async acceptRemoteAnswer(remoteAnswer: string){
    console.log("Conexion Status::",this.connection.connectionState,"|",this.connection.iceConnectionState)
    setClientStatus(this.clientID, "6. Acepting RTC remote answer...","",this.connection)

    if(!remoteAnswer){ return }
    try {
      await this.connection.setRemoteDescription(JSON.parse(remoteAnswer)) 
    } catch (error) {
      console.error(error)
      setClientStatus(this.clientID, `Failed to set remote answer:: ${error}`)
      return
    }
    console.log("Conexion Status::",this.connection.connectionState,"|",this.connection.iceConnectionState)
    console.log("Conexión establecida mediante Remote Answer!!")
    setClientStatus(this.clientID,"","",this.connection)
  }
  
  onMessage(event: MessageEvent, channel?: number){
    if(!channel){ throw new Error("Channel not defined") }
    let msg = event.data
    console.log("Mensaje Recibido::", channel, msg)
    try {
      msg = JSON.parse(msg) 
    } catch (error) {
      console.warn("Mensaje no es un JSON válido::", msg)
      return
    }
    const accion = msg.ac
    delete msg.ac
    console.log("accion:: ", accion)
    if(accion === 1){ // Mensaje de chat
      msg.ss = 5
      const client = clientsMap().get(this.clientID)
      if(!client){
        console.warn("Client not found::", this.clientID)
        return
      }
      client.messages = client.messages || []
      client.connStatus.newMessages = client.connStatus.newMessages || 0
      console.log("cliente actualizado:: ", client)
      if(!client.messages.some(x => x.id === msg.id)){
        client.connStatus.newMessages++
        client.messages.unshift(msg)
        console.log("actualizando client::", clientSelectedID(), this.clientID)
        if(clientSelectedID() === this.clientID){
          setChatMessages([...client.messages])
        }
        if(client._updater){ client._updater() }
      }
    }
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
    this.worker = GetWorker()
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
          this.handleRTCConnectionAnswer(response.body)
        } else {
          const callback = this.suscriptions.get(response.accion)
          if(callback){
            callback(response.body)
          } else {
            if(this.onMessage){ this.onMessage(response) }
          }
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

  async sendWorkerMessage(accion: string, messageBody: string){
    if(this.onOpenPromise){ await this.onOpenPromise }
    console.log('Client-ID a enviar::', this.clientID)
    const message = { a: accion, b: messageBody, c: this.clientID }
    this.worker.port.postMessage(['sendMessage', message])
  }

  getRtcManager(ClientID: string, isOffer?: boolean, recreate?: boolean){
    if(!this.userRTCConnectionMap.has(ClientID) || recreate){
      console.log("Creando nuevo RTCManager para::", ClientID)
      this.userRTCConnectionMap.set(ClientID, new RTCManager(isOffer, ClientID))
    }
    return this.userRTCConnectionMap.get(ClientID)
  }

  async sendOffer(){
    console.log("Waiting for offer...")
    const offerString = await this.rtcManager.getOffer()
    const message = { offer: offerString }
    console.log("Sending offer...")
    await this.sendWorkerMessage("PostRtcOffer", JSON.stringify(message))
  }

  // Paso 1: Enviar Offer hacia ClientAskID
  async askConnection(ClientAskID: string, ConnID: string){
    console.log("Generando RTC Offer...", ClientAskID)
    setClientStatus(ClientAskID, "1. Generating RTC Offer...")
    let rtcManager = this.getRtcManager(ClientAskID, true)
    const connState = rtcManager.connection?.connectionState?.toLocaleLowerCase() || ""
    if(connState === 'connected' || connState === 'connecting'){
      console.log("RTC Connection already established!!")
      return
    } else if (rtcManager.connection.connectionState !== 'new'){
      rtcManager = this.getRtcManager(ClientAskID, true, true)
    }

    const rtcOffer = await rtcManager.getOffer()
    console.log("rtc offer generado:: ", rtcOffer)
    const connRequest = { ClientAskID, ConnID, Offer: rtcOffer }
    setClientStatus(ClientAskID, "2. Asking RTC Peer Connection...")
    await this.sendWorkerMessage("AskRTCConnection", JSON.stringify(connRequest))
    setClientStatus(ClientAskID, "3. Waiting RTC Peer Answer...")
  }

  // Paso 2: Recibir Offer y enviar Answer hacia ClientFromID
  async handleRTCConnectionRequest(req: IConnectionRequest){
    if(!req.ClientFromID || !req.Offer){
      console.warn("No ClientFromID in request::", req)
      return
    }
    setClientStatus(req.ClientFromID, "4. Creating RTC connection...")
    const rtcManager = this.getRtcManager(req.ClientFromID)
    console.log("Acepting RTC Offer...")
    req.Answer = await rtcManager.acceptOfferRequest(req.Offer)
    req.Offer = ""
    console.log("Enviando respuesta a RTC Offer::", req.Answer)
    setClientStatus(req.ClientFromID, "5. Sending back RTC answer...")
    this.sendWorkerMessage("AnswerRTCConnection", JSON.stringify(req))
  }

  // Paso 3: Recibir Answer y establecer conexión
  async handleRTCConnectionAnswer(req: IConnectionRequest){
    if(!req.ClientAskID || !req.Answer){
      console.warn("No ClientFromID in request::", req)
      return
    }
    const rtcManager = this.getRtcManager(req.ClientAskID)
    console.log("Aceptando remote answer y estableciendo conexión...")
    await rtcManager.acceptRemoteAnswer(req.Answer)
  }

  async sendRtcMessage(clientID: string, message: any, accion: number){
    const rtcManager = this.getRtcManager(clientID)
    const client = clientsMap().get(clientID)
    client.messages = client.messages || []
    const messageObject = { id: TimeMToB64Encode(Date.now()), cn: message, ss: 1 }
    client.messages.unshift(messageObject)
    if(clientSelectedID() === clientID){
      setChatMessages([...client.messages])
    }
    const messageString = JSON.stringify({...messageObject, ac: accion})
    rtcManager.channel.send(messageString)
    const compressed = await compressStringWithGzip(messageString)
    rtcManager.channel.send(compressed)
  }
}

export const connectionManager = new ConnectionManager()

export const Connect = async ()=> {
  await connectionManager.sendWorkerMessage("SendHello","Hello Server")
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