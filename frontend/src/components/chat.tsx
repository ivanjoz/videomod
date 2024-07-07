import { For, createEffect, createSignal, on } from "solid-js"
import { IClient, connectionManager, mimeCodec } from "~/services/connection"
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
  let videoLocal: HTMLVideoElement
  let videoInput: HTMLVideoElement
  let localStream: MediaStream
  let sourceBuffer: SourceBuffer
  let queue: Uint8Array[] = []

  createEffect(() => {
    console.log("obteniendo mensajes::",props.client)
    /*
    getDexieInstance().then(db => {
      db.table('messages').where({ cid: props.client.id }).toArray().then(messages => {
        messages.sort((a,b) => a.id < b.id ? 1 : -1)
        props.client.messages = messages
        setChatMessages(messages)
      })
    })
    */
  })

  createEffect(on(() => props.client,() => {
    if(!videoInput){ return }
    console.log("seteando video input::", videoInput)
    videoInput.onloadedmetadata = () => {
      console.log(`Remote video width: ${videoLocal.videoWidth}px, height: ${videoLocal.videoHeight}px`);
    };

    videoInput.onplay = () => {
        console.log('Remote video is playing');
    };

    videoInput.onerror = (e) => {
        console.error('Remote video error', e);
    };

    connectionManager.onVideoStream(props.client.id, (mediaStream: MediaStream) => {
      console.log("stream recibido como source de vídeo::", mediaStream)
      const videoTracks = mediaStream.getVideoTracks();
      const audioTracks = mediaStream.getAudioTracks();
      console.log("video tracks and audio tracks", videoTracks, audioTracks)

      mediaStream.onaddtrack = (ev) => {
        console.log("track añadido::", ev)
      }
      mediaStream.onremovetrack = (ev) => {
        console.log("track removido::", ev)
      }

      if(videoInput.srcObject !== mediaStream){
        videoInput.srcObject = mediaStream
      }
    })

    /*
    const mediaSource = new MediaSource()
    console.log("generando media source::", mediaSource)

    videoInput.src = URL.createObjectURL(mediaSource)
    
    mediaSource.addEventListener('sourceopen', () => {
      sourceBuffer = mediaSource.addSourceBuffer(mimeCodec)
      sourceBuffer.mode = 'sequence'

      sourceBuffer.addEventListener('updateend', () => {
        if(queue.length > 0 && !sourceBuffer.updating){
          sourceBuffer.appendBuffer(queue.shift())
        }
      })
    })

    connectionManager.onVideoChunk(props.client.id, (chunk, header) => {
      console.log("chunk recibido::", chunk.length, header)
      if(sourceBuffer && !sourceBuffer.updating){
        sourceBuffer.appendBuffer(new Uint8Array(chunk))
      } else {
        queue.push(chunk)
      }
    })
    */
  },{ defer: true }))

  const sendMessage = () => {
    const message = textArea?.value || ""
    if(!message){ return }
    connectionManager.sendRtcMessage(props.client.id, message, 1)
    textArea.value = ""
  }

  const onvideoInit = async () => {
    const constraints: MediaStreamConstraints = {
      audio: true,
      video: { width: { ideal: 640 }, height: { ideal: 480 } }
    }
    
    localStream = await navigator.mediaDevices.getUserMedia(constraints)
    const localVideoStream = new MediaStream(localStream.getVideoTracks());
    videoLocal.srcObject = localVideoStream
    /*
    connectionManager.sendMediaStream(props.client.id, localStream)
    */
    connectionManager.sendStreamRequest(props.client.id, localStream)
  }

  return <div class="h100 p-rel flex-column">
    { 
    props.client && <>
      <div class="flex w100">
        <div class="video-v1 mr-08" onClick={ev => {
          ev.stopPropagation()
          onvideoInit()
        }}>
          <video class="w100 h100" ref={videoLocal} autoplay playsinline></video>
        </div>
        <div class="video-v1" onClick={ev => {
          ev.stopPropagation()
          onvideoInit()
        }}>
          <video class="w100 h100" ref={videoInput} autoplay playsinline></video>
        </div>
      </div>
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