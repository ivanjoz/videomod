"use client";
import { For, Show, createEffect, createMemo, createSignal, on } from "solid-js";
import "video.js/dist/video-js.min.css";
import { IClient, IConnStatus, clientSelectedID, clientSelectedStatus, clientsMap, connectionManager, setClientSelectedID, setClientSelectedStatus, setClientsMap } from "~/services/connection";
import s1 from '../styles/components.module.css';
import { LoadingBar } from "~/components/layout";
import { ChatContainer, setChatMessages } from "~/components/chat";
import { deviceType } from "~/app";
import { Layout1 } from "~/components/menus";

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

interface IClientCard {
  client: IClient
}

const [loadingClients, setLoadingClients] = createSignal(true)

const UsuariosConectados = () => {
  const clientsList = createMemo(() => {
    let clientsAll = Array.from(clientsMap().values())
    clientsAll = clientsAll.sort((a,b) => b._updated - a._updated)
    return clientsAll
  })

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

  return <>
    <div class="h3">Usuarios Conectados 1</div>
    <Show when={loadingClients()}>
      <LoadingBar msg="Cargando Usuarios..." />
    </Show>
    <Show when={!loadingClients()}>
      <For each={clientsList()}>
        {client => {
          return <ClientCard client={client} />
        }}
      </For>
    </Show>
  </>
}


const ClientCard = (props: IClientCard) => {

  const [status, setStatus] = createSignal(props.client.connStatus||{})

  props.client._updater = () => {
    console.log("seteando client connStatus::",props.client.connStatus)
    setStatus({...(props.client.connStatus||{})})
  }

  const statusMessage = createMemo(() => {
    let message = status().status
    if(message !== status().iceStatus){
      message += " | " + status().iceStatus
    }
    return message
  })

  const nowTime = Math.floor(Date.now()/1000)
  const haceMin = Math.ceil((nowTime - props.client._updated)/60)

  return <div class={"px-06 py-06 mt-08 " + s1.card_c1} onClick={ev => {
    ev.stopPropagation()
    setClientSelectedID(props.client.id)
    setChatMessages(props.client.messages||[])
    connectionManager.askConnection(props.client.id, "")
  }}>
    <div class="w100 flex jc-between">
      <div>
        {props.client.id}
      </div>
      <div>Hace {haceMin} min</div>
    </div>
    <div class="w100 flex jc-between">
      <div>
        { statusMessage() &&
          <div>{statusMessage()}</div>
        }
      </div>
      <div class="flex a-center">
        { status().msg &&
          <div>{status().msg}</div>
        }
        { !status().msg &&
          <div>-</div>
        }
        { status().newMessages && !status().msg &&
          <div>{status().newMessages} nuevos!</div>
        }
      </div>
    </div>
  </div>
}
