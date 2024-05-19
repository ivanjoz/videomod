import { Title } from "@solidjs/meta";
import Counter from "~/components/Counter";
import videojs from "video.js";
import { createEffect } from "solid-js";
import "video.js/dist/video-js.min.css"

export default function Video() {

  createEffect(() => {
    videojs(document.getElementById("player-main") as Element)
  })

  return (
    <main>
      <video class="video-js" controls autoplay preload="auto" id="player-main">
        <source src="/videos/dune_part_2_2024.webm" type="video/webm"/>
      </video>
    </main>
  );
}
