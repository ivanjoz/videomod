"use client";
import { Show, createEffect, createMemo, createSignal, on } from "solid-js";
import "video.js/dist/video-js.min.css";
import { deviceType } from "~/app";
import { ChatContainer } from "~/components/chat";
import { LoadingBar } from "~/components/layout";
import { Layout1 } from "~/components/menus";
import { UsuariosConectados, setLoadingClients } from "~/components/usuarios";
import { IConnStatus, clientSelectedID, clientSelectedStatus, clientsMap, connectionManager, setClientSelectedStatus, setClientsMap } from "~/services/connection";
import s1 from '../styles/components.module.css';

export default function Home() {
  const clientSelected = createMemo(() => {
    return clientsMap().get(clientSelectedID())
  })

  createEffect(on(clientSelectedID, (id) => {
    if(!id){ setClientSelectedStatus(); return }
    const client = clientsMap().get(id)
    client.connStatus = client.connStatus || { msg: "" } as IConnStatus
    setClientSelectedStatus(client.connStatus)
  }))

  if(typeof window === 'undefined'){ return <div>!</div> }

  connectionManager.on('PostRtcOffer', users => {
    const clientsMap = new Map()
    for(let user of users){
      if(user.id === connectionManager.clientID){ continue }
      user._updated = parseInt(user.updated,36) * 2
      clientsMap.set(user.id, user)
    }
    setClientsMap(clientsMap)
    console.log('Usuarios conectados::', users)
    setLoadingClients(false)
  })

  connectionManager.sendOffer()

  return <Layout1>
    <div class="w100 flex jc-between">
      { [1].includes(deviceType()) &&
        <div class="py-12 mr-16" style={{ width: '28%' }}>
          <UsuariosConectados />
        </div>
      }
      <div class={"py-12 px-08 p-rel flex-column grow-1 " + (s1.card_chat_c)}>
        <div class="h3">Chat</div>
        <ChatContainer client={clientSelected()}/>
        <Show when={clientSelectedStatus()?.isLoading}>
          <LoadingBar msg={clientSelectedStatus()?.msg} />
        </Show>
      </div>
    </div>
  </Layout1>
}
