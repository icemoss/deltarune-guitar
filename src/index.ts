import { Game } from "./game/Game.js";

document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("game-canvas") as HTMLCanvasElement;
  const game = new Game(canvas);

  document.getElementById("start-button")?.addEventListener("click", () => {
    console.log("Start game button clicked");
    game.start();
  });

  document.getElementById("stop-button")?.addEventListener("click", () => {
    console.log("Stop button clicked");
    game.stop();
  });

  document.addEventListener("keydown", (event) => {
    console.log(event.code);
    if (event.key === "'" || event.key === "/") {
      event.preventDefault();
    }
  });
});
