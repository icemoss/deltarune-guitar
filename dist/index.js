import { Game } from "./game/Game.js";
document.addEventListener("DOMContentLoaded", () => {
    var _a, _b;
    const canvas = document.getElementById("game-canvas");
    const game = new Game(canvas);
    (_a = document.getElementById("start-button")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", () => {
        console.log("Start game button clicked");
        game.start();
    });
    (_b = document.getElementById("stop-button")) === null || _b === void 0 ? void 0 : _b.addEventListener("click", () => {
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
//# sourceMappingURL=index.js.map