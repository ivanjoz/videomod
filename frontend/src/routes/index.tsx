"use client";
import { For, Show, createSignal } from "solid-js";
import "video.js/dist/video-js.min.css";

export default function Home() {

  const [localDescription, setLocalDescription] = createSignal("")
  const [createdAnswer, setCreatedAnswer] = createSignal("----------")
  const [connectionState, setConnectionState] = createSignal("Pending")
  const [iceConnectionState, setIceConnectionState] = createSignal("Pending")
  const [recivedMessages, setRecivedMessages] = createSignal([])

  let remoteOffer = ""
  let remoteAnswer = ""
  let messageTextArea: HTMLTextAreaElement

  if(typeof window === 'undefined'){ return <div>!</div> }
  let channel: RTCDataChannel

  const connection = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] })

  connection.onconnectionstatechange = (event) => {
    console.log("connectionstatechange", event)
    setConnectionState(connection.connectionState)
  }

  connection.oniceconnectionstatechange = (event) => {
    console.log("oniceconnectionstatechange", event)
    setIceConnectionState(connection.iceConnectionState)
  }

  const onmessage = (event: MessageEvent) => {
    setRecivedMessages([...recivedMessages(), event.data])
  }

  connection.ondatachannel = (event) => {
    console.log('ondatachannel')
    channel = event.channel
    channel.onmessage = onmessage
  }

  connection.onnegotiationneeded = async (ev) => {
    console.log('onnegotiationneeded', ev)
  }

  async function createOffer() {
    channel = connection.createDataChannel('data')
    channel.onopen = event => console.log('onopen', event)
    channel.onmessage = onmessage

    connection.onicecandidate = (event) => {
      console.log('localDescription Offer 1::', JSON.stringify(connection.localDescription))
      if(connection.localDescription.type == 'offer'){
        setLocalDescription(JSON.stringify(connection.localDescription))
      }
      if (!event.candidate) {
        console.log('localDescription Offer 2::', JSON.stringify(connection.localDescription))
      }
    }

    const offer = await connection.createOffer()
    await connection.setLocalDescription(offer)
  }

  createOffer()

  const acceptRemoteOffer = async () => {
    if(!remoteOffer){ return }
    try {
      const offer = JSON.parse(remoteOffer)
      await connection.setRemoteDescription(offer)

      connection.onicecandidate = (event) => {
        if(connection.localDescription.type == 'answer'){
          setCreatedAnswer(JSON.stringify(connection.localDescription))
        }
        console.log('localDescription Answer 1::', connection.localDescription)
        if (!event.candidate) {
          console.log('localDescription Answer 2::', JSON.stringify(connection.localDescription))
        }
      }

      const answer = await connection.createAnswer()
      await connection.setLocalDescription(answer)
    } catch (error) {
      console.error(error)
      console.error('Remote Offer no pudo ser parseada', remoteOffer)
    }
  }

  const acceptRemoteAnswer = async () => {
    if(!remoteAnswer){ return }
    try {
      await connection.setRemoteDescription(JSON.parse(remoteAnswer)) 
    } catch (error) {
      console.error(error)
      console.error('Remote Answer no pudo ser parseada', remoteAnswer)
    }
  }

  return <div>
    <h3>WebRTC Demo!</h3>
    <div style={{ display: 'flex' }}>
      Conecction State: {connectionState()} / ICE Conecction State: {iceConnectionState()}
    </div>
    <Show when={connectionState() !== 'connected'}> 
      <h4>Local Descripcion</h4>
      <div>{localDescription()}</div>
      <div style={{ "margin-bottom": "1rem" }}></div>
      <h4>Paste Remote Offer</h4>
      <textarea class="ttx" rows={5} style={{ width: "100%" }} 
        onChange={ev => { remoteOffer = ev.currentTarget.value }}
      />
      <button onClick={(ev) => {
        ev.stopPropagation()
        acceptRemoteOffer()
      }}>
        Accept Remote Offer
      </button>
      <h4>Created Answer</h4>
      <div>{createdAnswer()}</div>
      <h4>Paste Remote Answer</h4>
      <textarea class="ttx" rows={5} style={{ width: "100%" }} 
        onChange={ev => { remoteAnswer = ev.currentTarget.value }}
      />
      <button onClick={(ev) => {
        ev.stopPropagation()
        acceptRemoteAnswer()
      }}>
        Accept Remote Answer
      </button>
    </Show>
    <Show when={connectionState() === 'connected'}> 
      <h4>Message</h4>
      <textarea ref={messageTextArea} class="ttx" rows={2} style={{ width: "100%" }} 
        onChange={ev => { remoteAnswer = ev.currentTarget.value }}
      />
      <button onClick={(ev) => {
        ev.stopPropagation()
        if(messageTextArea && messageTextArea.value){
          channel.send(messageTextArea.value)
          messageTextArea.value = ""
        }
      }}>
        Send Message
      </button>

      <h4>Recived Messages</h4>
      <For each={recivedMessages()}>
      { e => {
          return <div>{e}</div>
        }
      }
      </For>
    </Show>
  </div>
}
