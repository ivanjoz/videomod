import { For, createSignal } from "solid-js"
import { IClient, connectionManager } from "~/services/connection"
// import s1 from '../styles/components.module.css';

export interface IChatContainer {
  client: IClient
}

export interface IChatMessage {
  id: string
  cn: string // contenido
  ss: number // estado (1 = enviado, 2 = confirmado, 3 = recibido)
}

export const [chatMessages, setChatMessages] = createSignal([] as IChatMessage[])

export const ChatContainer = (props: IChatContainer) => {

  let textArea: HTMLTextAreaElement

  const sendMessage = () => {
    const message = textArea?.value || ""
    if(!message){ return }
    connectionManager.sendRtcMessage(props.client.id, message, 1)
    textArea.value = ""
  }

  return <div class="h100 p-rel flex-column">
    { 
    props.client && <>
      <div class="flex w100 mt-06 mb-06">
        <textarea class="ttx chat_textarea w100" rows={2} ref={textArea} />
        <button onClick={ev => {
          ev.stopPropagation()
          sendMessage()
        }}>Enviar</button>
      </div>
      <div class="flex-column w100 grow-1">
        <For each={chatMessages()}>
          {message => {
            let contanerCss = message.ss === 5 ? "flex jc-start" : "flex jc-end"
            let cardCss = message.ss === 5 ? "message_card_received" : "message_card_sended"
            return <div class={contanerCss}>
              <div class={`message_card ${cardCss}`}>{message.cn}</div>
            </div>
          }}
        </For>
      </div>
    </>
    }
  </div>
}