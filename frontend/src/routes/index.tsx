"use client";
import { For, Show, createEffect, createSignal } from "solid-js";
import "video.js/dist/video-js.min.css";
import { Connect, connectionManager, connectionState, iceConnectionState, recivedMessages, webRTCManager } from "~/services/connection";
import s1 from '../styles/components.module.css'

export default function Home() {

  const [localDescription, setLocalDescription] = createSignal("")
  const [createdAnswer, setCreatedAnswer] = createSignal("----------")
  const [loadingClients, setLoadingClients] = createSignal(true)
  const [clients, setClients] = createSignal([])
  
  if(typeof window === 'undefined'){ return <div>!</div> }

  connectionManager.on('PostRtcOffer', users => {
    for(let user of users){
      user._updated = parseInt(user.updated,36) * 2
    }
    setClients(users)
    console.log('Usuarios conectados::', users)
    setLoadingClients(false)
  })

  connectionManager.sendOffer()

  createEffect(() => {
    connectionManager.onMessage = e => {
      console.log("respuesta recibida::", e)
    }
  },[])

  const nowTime = Math.floor(Date.now()/1000)

  return <div>
    <h3>WebRTC Open Chat Room</h3>
    <div class="w100 flex jc-between">
      <div class="px-12 py-12" style={{ width: '28%' }}>
        <div class="h3">Usuarios Conectados 1</div>
        <Show when={loadingClients()}>
          <div class="mt-08">Cargando usuarios...</div>
        </Show>
        <Show when={!loadingClients()}>
          <For each={clients()}>
            {client => {
              const haceMin = Math.ceil((nowTime - client._updated)/60)

              return <div class={"px-06 py-06 mt-08 " + s1.card_c1}>
                <div class="w100 flex jc-between">
                  <div>{client.id}</div>
                  <div>Hace {haceMin} min</div>
                </div>
              </div>
            }}
          </For>
        </Show>
      </div>
      <div class="px-12 py-12 grow-1">
        <div class="h3">Chat</div>
      </div>
    </div>
  </div>
}
