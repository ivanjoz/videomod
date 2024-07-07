import { JSX, createSignal } from "solid-js"
import { UsuariosConectados } from "./usuarios"

interface ILayout1 {
  children: JSX.Element | JSX.Element[]
}

export const [buttonLayerShow, setButtonLayerShow] = createSignal(0)

export const Layout1 = (props: ILayout1) => {

  return <div class="layout-1">
    <div class="bar-1 flex ai-center w100">
      <ButtonLayer id={1} css="py-12 px-12">
        <UsuariosConectados/>
      </ButtonLayer>
      <div class="">WebRTC Open Chat</div>
    </div>
    {props.children}
  </div>
}

interface IButtonLayer {
  id: number
  children: JSX.Element | JSX.Element[]
  css?: string
}

export const ButtonLayer = (props: IButtonLayer) => {
  
  return <>
    <div class="bn2 mr-08 h100" style={{ padding: '0 12px' }} onClick={ev => {
      ev.stopPropagation()
      const showId = buttonLayerShow() === props.id ? 0 : props.id
      setButtonLayerShow(showId)
    }}>
      H
    </div>
    { buttonLayerShow() &&
      <div class={"layer-c1 "+(props.css||"")}>
        { props.children }
      </div>
    }
  </>
}