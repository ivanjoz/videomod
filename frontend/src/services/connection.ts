import Dexie from 'dexie'
import { createSignal } from 'solid-js'
import { IChatMessage, setChatMessages } from '~/components/chat';
import { GetWorker, TimeMToB64Encode } from '~/core/halpers';

let dexieInitPromise: Promise<void>
let dexiedb: Dexie

export const getDexieInstance = async (): Promise<Dexie> => {
  if(dexieInitPromise){
    await dexieInitPromise
  }
  if(dexiedb){ return dexiedb }

  dexiedb = new Dexie('videomod')
  dexiedb.version(1).stores({
    config: 'key',
    messages: '[cid+id],cid',
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

const addHeaderToUint8Array = (uint8Value: number, array: Uint8Array): Uint8Array => {
  const newArray = new Uint8Array(array.length + 1)
  newArray.set([uint8Value],0)
  newArray.set(array,1)
  return newArray
}

const extractHeaderFromUint8Array = (array: Uint8Array): [number,Uint8Array] => {
  const header = array[0]
  const newArray = new Uint8Array(array.length - 1)
  newArray.set(array.slice(1),0)
  return [header,newArray]
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

export const mimeCodec = 'video/webm; codecs="vp9,opus"'

export class RTCManager {

  offerString: string
  connection: RTCPeerConnection
  channel: RTCDataChannel
  promiseOngoing: Promise<string>
  clientID: string
  onVideoChunk: (chunk: Uint8Array, header: number) => void
  onIncommingMediaStream: (mediaStream: MediaStream) => void
  
  // Conection for video streaming
  streamConnection: RTCPeerConnection
  streamIncommingConn: RTCPeerConnection
  streamIncomming: MediaStream

  rtcConfig: { 
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] 
  }

  constructor(isOffer?: boolean, clientID?: string){
    this.clientID = clientID || ""

    this.connection = new RTCPeerConnection(this.rtcConfig)

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

    console.log("instanciando RTC Manager::",isOffer, clientID)
    
    this.connection.onicecandidate = () => {
      console.log("RTC: onicecandidate", this.connection.localDescription.type)
      if(this.connection.localDescription.type == 'offer'){
        const offer =  JSON.stringify(this.connection.localDescription)
        const IP = getIpFromCandidate(offer).split(".").filter(x => x)
        if(IP[0] === 'localhost' || IP[0] === '0' || IP[0] === '127'){ 
          console.log("offer con IP privada (esperando)::",IP.join("."))
          // return
        } else {
          console.log("IP offer (ok)::",IP.join("."))
        }
        // The offer with the correct public IP is ready here (previuos offers are generated with private IP)
        this.offerString = JSON.stringify(this.connection.localDescription)
        console.log("resolviendo offer string:: ",this.offerString)
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
    if(this.promiseOngoing){ await this.promiseOngoing }
    console.log("devolviendo offer::", this.offerString)
    return this.offerString
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

  async sendJson(message: any){
    if(typeof message !== "string"){ message = JSON.stringify(message) }
    const compressed = await compressStringWithGzip(message)
    this.channel.send(addHeaderToUint8Array(1,compressed))
  }

  async sendBinary(type: number, message: Uint8Array){
    this.channel.send(addHeaderToUint8Array(type,message))
  }

  async sendStreamRequest(mediaStream: MediaStream){

    this.streamConnection = new RTCPeerConnection(this.rtcConfig)
    console.log("StreamConnection::", this.streamConnection)
    
    this.streamConnection.onconnectionstatechange = (event) => {
      console.log("STREAM inc. connectionstatechange", event,  this.streamConnection.connectionState)
    }

    this.streamConnection.onnegotiationneeded = async (event) => {
      console.log('STREAM inc. onnegotiationneeded', event, this.streamConnection.connectionState)

      const offer = await this.streamConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      })
  
      await this.streamConnection.setLocalDescription(offer)
      
      await this.sendJson({ 
        ac: 3, // Offer para video stream
        offer: this.streamConnection.localDescription,
      })
    }  

    mediaStream.getTracks().forEach(track => {
      this.streamConnection.addTrack(track, mediaStream)
    })
  }
  
  async onMessage(event: MessageEvent, channel?: number){
    if(!channel){ throw new Error("Channel not defined") }
    let msg = event.data
    // Revisa si es un mensaje comprimido
    if(msg instanceof ArrayBuffer){
      const [header, binaryMessage] = extractHeaderFromUint8Array(new Uint8Array(msg))
      // console.log("header + binaryMessage::", header, binaryMessage)
      if(header === 1){ // Mensaje de Texto comprimido con Gzip
        console.log("binary size::", binaryMessage.length,"|",msg.byteLength)
        msg = await decompressWithGzip(binaryMessage)
        console.log("Mensaje descomprimido::", msg)
      } else if(header === 2){ // Chucnk de video
        if(this.onVideoChunk){ 
          this.onVideoChunk(binaryMessage, header)
        }
        return
      }
    }

    console.log("Mensaje Recibido::", channel, msg, " | Client:", this.clientID)
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
        // Guarda el mensaje en la base de datos
        getDexieInstance().then(db => {
          db.table('messages').put({ cid: this.clientID, id: msg.id, ...msg })
        })
        // Envia confirmación del mensaje recibido
        const msgConfirm = JSON.stringify({ ac: 2, id: msg.id, ss: 2 })
        this.channel.send(msgConfirm)
      }
    } else if(accion === 2){ // Confirmación de recepción de mensaje
      console.log("confirmación recibida::!")
    // Solicitud de incoming video stream
    } else if(accion === 3){
      if(!msg.offer){
        console.warn("No offer in message::", msg)
        return
      }
      this.streamIncommingConn = new RTCPeerConnection(this.rtcConfig)
      console.log("StreamIncommingConn::", this.streamIncommingConn)

      this.streamIncommingConn.onicecandidate = () => {
        console.log("STREAM inc. onicecandidate", this.streamIncommingConn.iceConnectionState)
        
        if(this.streamIncommingConn.localDescription.type == 'answer'){
          this.sendJson({ 
            ac: 4, // Answer para video stream
            answer: this.streamIncommingConn.localDescription,
          })
        }
      }

      this.streamIncommingConn.onconnectionstatechange = (event) => {
        console.log("STREAM inc. connectionstatechange", event,  this.streamIncommingConn.connectionState)
      }
  
      this.streamIncommingConn.onnegotiationneeded = async (event) => {
        console.log('STREAM inc. onnegotiationneeded', event, this.streamIncommingConn.connectionState)
      }  

      this.streamIncommingConn.ontrack = event => {
        console.log("Recibido media stream::", event.streams[0])
        if(this.onIncommingMediaStream){ 
          this.onIncommingMediaStream(event.streams[0]) 
        } else {
          this.streamIncomming = event.streams[0]
        }
      } 
      
      await this.streamIncommingConn.setRemoteDescription(msg.offer)
      
      const answer = await this.streamIncommingConn.createAnswer()
      await this.streamIncommingConn.setLocalDescription(answer)
    
    // Maneja la respuesta a la solicitud de video stream
    } else if(accion === 4){
      if(!msg.answer){
        console.warn("No offer in message::", msg)
        return
      }
      const session = new RTCSessionDescription(msg.answer)
      await this.streamConnection.setRemoteDescription(session)
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
  worker: Worker
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
    // this.worker.port.start()

    // this.worker.port.onmessage = (e) => {
    this.worker.onmessage = (e) => {
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
        this.worker/*.port*/.postMessage(['getConnectionStatus'])
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
    console.log("Enviando worker message...")
    if(this.onOpenPromise){ await this.onOpenPromise }
    console.log('Client-ID a enviar::', this.clientID)
    const message = { a: accion, b: messageBody, c: this.clientID }
    this.worker/*.port*/.postMessage(['sendMessage', message])
  }

  #videoChunkHandlers: Map<string, (c: Uint8Array, h: number) => void> = new Map()

  onVideoChunk(ClientID: string, callback: (chunk: Uint8Array, h: number) => void){
    this.#videoChunkHandlers.set(ClientID, callback)
  }

  #videoStreamHandlers: Map<string, (s: MediaStream) => void> = new Map()

  onVideoStream(ClientID: string, callback: (mediaStream: MediaStream) => void){
    this.#videoStreamHandlers.set(ClientID, callback)
  }

  getRtcManager(ClientID: string, isOffer?: boolean, recreate?: boolean){
    if(!this.userRTCConnectionMap.has(ClientID) || recreate){
      console.log("Creando nuevo RTCManager para::", ClientID)
      this.userRTCConnectionMap.set(ClientID, new RTCManager(isOffer, ClientID))
    }
    const rtcManager = this.userRTCConnectionMap.get(ClientID)
    // on video chunk
    rtcManager.onVideoChunk = (chunk, header) => {
      const callback = this.#videoChunkHandlers.get(ClientID)
      if(callback){ callback(chunk, header) }
    }
    // on incomming mediastream
    rtcManager.onIncommingMediaStream = (mediaStream) => {
      const callback = this.#videoStreamHandlers.get(ClientID)
      if(callback){ callback(mediaStream) }
    }
    return rtcManager
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
    rtcManager.sendJson({...messageObject, ac: accion})
    // Guarda el mensaje en la base de datos
    getDexieInstance().then(db => {
      db.table('messages').put({ cid: clientID, ...messageObject })
    })
  }
  
  async sendMediaStream(clientID: string, stream: MediaStream){
    const rtcManager = this.getRtcManager(clientID)
    const mediaRecorder = new MediaRecorder(stream, { 
      mimeType: mimeCodec, videoBitsPerSecond: 100000, audioBitsPerSecond: 10000 });

    mediaRecorder.ondataavailable = event => {
      event.data.arrayBuffer().then(buffer => {
        rtcManager.sendBinary(2,new Uint8Array(buffer))
      })
    }
    mediaRecorder.start(120)
  }

  async sendStreamRequest(clientID: string, mediaStream: MediaStream){
    const rtcManager = this.getRtcManager(clientID)
    rtcManager.sendStreamRequest(mediaStream)
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

//create decompress with gzip function
export const decompressWithGzip = async (compressedData: Uint8Array): Promise<string> => {
  // Create a ReadableStream from the compressed Uint8Array
  const compressedStream = new ReadableStream({
    start(controller) {
      controller.enqueue(compressedData)
      controller.close()
    }
  })

  // Create a DecompressionStream for gzip
  const decompressionStream = new DecompressionStream('gzip')
  // Pipe the compressed stream through the decompression stream
  const decompressedStream = compressedStream.pipeThrough(decompressionStream)

  // Convert the decompressed stream to a Uint8Array
  const decompressedArrayBuffer = await new Response(decompressedStream).arrayBuffer()
  const decompressedUint8Array = new Uint8Array(decompressedArrayBuffer)

  return (new TextDecoder('utf-8')).decode(decompressedUint8Array)
}