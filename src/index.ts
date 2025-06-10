import { Game } from "./game/Game.js";

document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("game-canvas") as HTMLCanvasElement;

  if (!canvas) {
    console.error("Game canvas not found!");
    return;
  }

  const game = new Game(canvas);
  console.log("Game loaded", game);
});
