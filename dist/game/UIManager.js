export class UIManager {
    constructor(canvas, onStartGame, onStopGame) {
        this.currentState = "menu";
        this.canvas = canvas;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
            throw new Error("Failed to get 2D context for UI");
        }
        this.ctx = ctx;
        this.onStartGame = onStartGame;
        this.onStopGame = onStopGame;
        this.setupEventListeners();
    }
    setState(state) {
        this.currentState = state;
    }
    getState() {
        return this.currentState;
    }
    render() {
        if (this.currentState === "playing") {
            return;
        }
        this.ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        switch (this.currentState) {
            case "menu":
                this.renderMainMenu();
                break;
            case "instructions":
                this.renderInstructions();
                break;
            case "paused":
                this.renderPauseMenu();
                break;
            case "gameOver":
                this.renderGameOver();
                break;
        }
    }
    setupEventListeners() {
        document.addEventListener("keydown", (event) => {
            this.handleKeyPress(event.key);
        });
        this.canvas.addEventListener("click", (event) => {
            this.handleCanvasClick(event);
        });
        this.canvas.addEventListener("touchstart", (event) => {
            event.preventDefault();
            const touch = event.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            this.handleCanvasTouch(x * scaleX, y * scaleY);
        });
    }
    handleKeyPress(key) {
        switch (this.currentState) {
            case "menu":
                if (key === "Enter" || key === " ") {
                    this.setState("instructions");
                }
                break;
            case "instructions":
                if (key === "Enter" || key === " ") {
                    this.setState("playing");
                    this.onStartGame();
                }
                else if (key === "Escape") {
                    this.setState("menu");
                }
                break;
            case "playing":
                if (key === "Escape") {
                    this.setState("paused");
                }
                break;
            case "paused":
                if (key === "Escape") {
                    this.setState("playing");
                }
                else if (key === "q" || key === "Q") {
                    this.setState("menu");
                    this.onStopGame();
                }
                break;
        }
    }
    handleCanvasClick(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        this.handleCanvasTouch(x * scaleX, y * scaleY);
    }
    handleCanvasTouch(x, y) {
        switch (this.currentState) {
            case "menu":
                if (this.isInButtonArea(x, y, this.canvas.width / 2, 300, 200, 50)) {
                    this.setState("instructions");
                }
                break;
            case "instructions":
                if (this.isInButtonArea(x, y, this.canvas.width / 2, 350, 200, 50)) {
                    this.setState("playing");
                    this.onStartGame();
                }
                if (this.isInButtonArea(x, y, 100, 50, 80, 40)) {
                    this.setState("menu");
                }
                break;
            case "paused":
                if (this.isInButtonArea(x, y, this.canvas.width / 2, 250, 200, 50)) {
                    this.setState("playing");
                }
                if (this.isInButtonArea(x, y, this.canvas.width / 2, 320, 200, 50)) {
                    this.setState("menu");
                    this.onStopGame();
                }
                break;
        }
    }
    isInButtonArea(x, y, centerX, centerY, width, height) {
        return (x >= centerX - width / 2 &&
            x <= centerX + width / 2 &&
            y >= centerY - height / 2 &&
            y <= centerY + height / 2);
    }
    renderMainMenu() {
        this.ctx.fillStyle = "#ffffff";
        this.ctx.font = "bold 48px Arial";
        this.ctx.textAlign = "center";
        this.ctx.fillText("DELTARUNE ROCK BAND", this.canvas.width / 2, 150);
        this.renderButton(this.canvas.width / 2, 300, 200, 50, "CLICK TO START", "#4CAF50");
    }
    renderInstructions() {
        this.ctx.fillStyle = "#ffffff";
        this.ctx.font = "bold 36px Arial";
        this.ctx.textAlign = "center";
        this.ctx.fillText("HOW TO PLAY", this.canvas.width / 2, 80);
        this.ctx.font = "20px Arial";
        this.ctx.textAlign = "left";
        const instructions = [
            "• Hit the falling notes when they reach the target line",
            "• Use keyboard: ← → or Z X",
            "• On mobile: Tap the green and blue areas",
            "• Hold buttons for long notes (notes with tails)",
            "• Perfect timing gives more points",
            "• Build combos for bonus score multipliers",
        ];
        let y = 140;
        instructions.forEach((instruction) => {
            this.ctx.fillText(instruction, 80, y);
            y += 30;
        });
        this.renderButton(100, 50, 80, 40, "BACK", "#757575");
        this.renderButton(this.canvas.width / 2, 350, 200, 50, "START GAME", "#4CAF50");
        this.ctx.font = "16px Arial";
        this.ctx.fillStyle = "#aaaaaa";
        this.ctx.textAlign = "center";
        this.ctx.fillText("Press ENTER to start or ESC to go back", this.canvas.width / 2, 420);
    }
    renderPauseMenu() {
        this.ctx.fillStyle = "#ffffff";
        this.ctx.font = "bold 36px Arial";
        this.ctx.textAlign = "center";
        this.ctx.fillText("GAME PAUSED", this.canvas.width / 2, 150);
        this.renderButton(this.canvas.width / 2, 250, 200, 50, "RESUME", "#4CAF50");
        this.renderButton(this.canvas.width / 2, 320, 200, 50, "QUIT TO MENU", "#f44336");
        this.ctx.font = "16px Arial";
        this.ctx.fillStyle = "#aaaaaa";
        this.ctx.fillText("Press ESC to resume or Q to quit", this.canvas.width / 2, 380);
    }
    renderGameOver() {
        this.ctx.fillStyle = "#ffffff";
        this.ctx.font = "bold 36px Arial";
        this.ctx.textAlign = "center";
        this.ctx.fillText("GAME OVER", this.canvas.width / 2, 150);
        this.renderButton(this.canvas.width / 2, 250, 200, 50, "PLAY AGAIN", "#4CAF50");
        this.renderButton(this.canvas.width / 2, 320, 200, 50, "MAIN MENU", "#757575");
    }
    renderButton(x, y, width, height, text, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x - width / 2, y - height / 2, width, height);
        this.ctx.strokeStyle = "#ffffff";
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x - width / 2, y - height / 2, width, height);
        this.ctx.fillStyle = "#ffffff";
        this.ctx.font = "bold 18px Arial";
        this.ctx.textAlign = "center";
        this.ctx.fillText(text, x, y + 6);
    }
}
//# sourceMappingURL=UIManager.js.map