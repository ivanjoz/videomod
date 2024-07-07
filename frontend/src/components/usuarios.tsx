"use client";
import { For, Show, createEffect, createMemo, createSignal, on } from "solid-js";
import "video.js/dist/video-js.min.css";
import { setChatMessages } from "~/components/chat";
import { LoadingBar } from "~/components/layout";
import { IClient, clientSelectedID, clientsMap, connectionManager, setClientSelectedID } from "~/services/connection";
import s1 from '../styles/components.module.css';
import { setButtonLayerShow } from "./menus";

export const [loadingClients, setLoadingClients] = createSignal(true)

export interface IUsuariosConectados {
  onClientSelect?: (cid: string) => void
}

export const UsuariosConectados = (props: IUsuariosConectados) => {
  const clientsList = createMemo(() => {
    console.log("loading clients...", loadingClients())
    let clientsAll = Array.from(clientsMap().values())
    clientsAll = clientsAll.sort((a,b) => b._updated - a._updated)
    return clientsAll
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

interface IClientCard {
  client: IClient
}

export const ClientCard = (props: IClientCard) => {

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
    setButtonLayerShow(0)
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