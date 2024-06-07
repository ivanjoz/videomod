interface ILoadingBar {
  msg: string
}

export const LoadingBar = (props: ILoadingBar) => {

  return <div class="pm-loading flex-center p-rel py-06 px-06 mt-08">
    <div class="bg"></div>
    <div class="mr-auto ff-bold h3 c-yellow">{props.msg}</div>
  </div>

}