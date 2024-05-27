"use client";
import { For, Show, createEffect, createSignal } from "solid-js";
import Dexie from 'dexie'
import "video.js/dist/video-js.min.css";
import { Connect, connectionManager, connectionState, iceConnectionState, recivedMessages, webRTCManager } from "~/services/connection";

export default function Home() {

  const [localDescription, setLocalDescription] = createSignal("")
  const [createdAnswer, setCreatedAnswer] = createSignal("----------")

  let remoteOffer = ""
  let remoteAnswer = ""
  let messageTextArea: HTMLTextAreaElement

  if(typeof window === 'undefined'){ return <div>!</div> }

  webRTCManager.getOffer().then(offerString => {
    setLocalDescription(offerString)
  })

  const acceptRemoteAnswer = async () => {
    if(!remoteAnswer){ return }
    try {
      await webRTCManager.connection.setRemoteDescription(JSON.parse(remoteAnswer)) 
      localStorage.setItem("savedRemoteAnswer", remoteAnswer)
    } catch (error) {
      console.error(error)
      console.error('Remote Answer no pudo ser parseada', remoteAnswer)
    }
  }

  const acceptRemoteOffer = async () => {
    if(!remoteOffer){ return }
    try {
      const offer = JSON.parse(remoteOffer)
      await webRTCManager.connection.setRemoteDescription(offer)

      webRTCManager.connection.onicecandidate = (event) => {
        if(webRTCManager.connection.localDescription.type == 'answer'){
          setCreatedAnswer(JSON.stringify(webRTCManager.connection.localDescription))
        }
        console.log('localDescription Answer 1::', webRTCManager.connection.localDescription)
        if (!event.candidate) {
          console.log('localDescription Answer 2::', JSON.stringify(webRTCManager.connection.localDescription))
        }
      }

      const answer = await webRTCManager.connection.createAnswer()
      await webRTCManager.connection.setLocalDescription(answer)
    } catch (error) {
      console.error(error)
      console.error('Remote Offer no pudo ser parseada', remoteOffer)
    }
  }

  createEffect(() => {
    connectionManager.onMessage = e => {
      console.log("respuesta recibida::", e)
    }
    Connect()
  },[])

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
          webRTCManager.channel.send(messageTextArea.value)
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
