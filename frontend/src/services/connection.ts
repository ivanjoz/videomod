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
  // const ix1 = offer.indexOf('webrtc-datachannel')
  const ix1 = offer.indexOf('nc=IN IP4')
  const ix2 = offer.indexOf('\\r',ix1+10)
  const IP = offer.substring(ix1+10,ix2).trim()
  return IP
}

export const [iceConnectionState, setIceConnectionState] = createSignal("Pending")
export const [recivedMessages, setRecivedMessages] = createSignal([])
export const [connectionState, setConnectionState] = createSignal("Pending")

export class WebRTCManager {

  connection: RTCPeerConnection
  channel: RTCDataChannel
  offerString: string
  promiseOngoing: Promise<string>

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

  async getOffer() {
    if(this.promiseOngoing){ return await this.promiseOngoing }
    if(this.offerString){ return this.offerString }
  }
}

export const webRTCManager = new WebRTCManager()

export const Connect = async ()=> {
  const clientID = await getClientID()
  console.log("offer string::", webRTCManager.getOffer())

  console.log("client id obtenido::", clientID)
  const ws = new WebSocket('wss://pv5s7gfoge.execute-api.us-east-1.amazonaws.com/p/')

  ws.onopen = () => {
    console.log('WebSocket is connected')
    ws.send('Hello Server!')
  }

  ws.onmessage = (event) => {
    console.log(`Received: ${event.data}`)
  }

  ws.onerror = (error) => {
    console.log(`WebSocket error: ${error}`)
  }

  ws.onclose = () => {
    console.log('WebSocket connection closed')
  }
}