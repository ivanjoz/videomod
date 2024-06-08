import { For, createSignal } from "solid-js"
import { IClient } from "~/services/connection"

export interface IChatContainer {
  client: IClient
}

export interface IChatMessage {
  id: number
  cn: string // contenido
  ss: number // estado (1 = enviado, 2 = confirmado, 3 = recibido)
}

export const ChatContainer = (props: IChatContainer) => {

  const [messages, setMessages] = createSignal([{ cn: "hola mundo" }] as IChatMessage[])
  
  let message = ""

  return <div class="h100 p-rel flex-column">
    { 
    props.client && <>
      <div class="flex-column w100 grow-1">
        <For each={messages()}>
          {message => {
            return <div class="p-12">{message.cn}</div>
          }}
        </For>
      </div>
      <div class="flex w100 mt-auto">
        <textarea class="ttx" rows={3} style={{ width: "100%" }} 
          onChange={ev => { message = ev.currentTarget.value }}
        />
        <button>Enviar</button>
      </div>
    </>
    }
  </div>
}