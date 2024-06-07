"use client";
import { For, Show, createEffect, createSignal } from "solid-js";
import "video.js/dist/video-js.min.css";
import { connectionManager } from "~/services/connection";
import s1 from '../styles/components.module.css';
import { LoadingBar } from "~/components/layout";

interface IUserSelected {
  userID: string
  connID: string
  connStatus: number
  messages: string[]
  error?: string
}

export default function Home() {

  const [localDescription, setLocalDescription] = createSignal("")
  const [createdAnswer, setCreatedAnswer] = createSignal("----------")
  const [loadingClients, setLoadingClients] = createSignal(true)
  const [clients, setClients] = createSignal([])
  const [userSelected, setUserSelected] = createSignal<IUserSelected>()

  if(typeof window === 'undefined'){ return <div>!</div> }

  connectionManager.on('PostRtcOffer', users => {
    const usersFiltered = []
    for(let user of users){
      if(user.id === connectionManager.clientID){ continue }
      user._updated = parseInt(user.updated,36) * 2
      usersFiltered.push(user)
    }
    setClients(usersFiltered)
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
          <LoadingBar msg="Cargando Usuarios..." />
        </Show>
        <Show when={!loadingClients()}>
          <For each={clients()}>
            {client => {
              const haceMin = Math.ceil((nowTime - client._updated)/60)

              return <div class={"px-06 py-06 mt-08 " + s1.card_c1} onClick={ev => {
                ev.stopPropagation()
                connectionManager.askConnection(client.id, "")
                setUserSelected(client)
              }}>
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
        <Show when={userSelected() && !userSelected().connStatus}>
          <LoadingBar msg="Conectando con usuario..." />
        </Show>
      </div>
    </div>
  </div>
}
