import { JSX } from "solid-js"

interface ILayout1 {
  children: JSX.Element | JSX.Element[]
}

export const Layout1 = (props: ILayout1) => {

  return <div class="layout-1">
    <div class="bar-1 flex ai-center w100">
      <div class="">WebRTC Open Chat</div>
    </div>
    {props.children}
  </div>
}