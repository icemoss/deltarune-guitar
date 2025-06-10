export class MobileControls {
    constructor(canvas, onKeyPress, onKeyRelease) {
        this.isVisible = false;
        this.leftPressed = false;
        this.rightPressed = false;
        this.activeTouches = new Map();
        this.canvas = canvas;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
            throw new Error("Failed to get 2D context for mobile controls");
        }
        this.ctx = ctx;
        this.onKeyPress = onKeyPress;
        this.onKeyRelease = onKeyRelease;
        this.setupTouchListeners();
    }
    show() {
        this.isVisible = true;
    }
    hide() {
        this.isVisible = false;
        if (this.leftPressed) {
            this.leftPressed = false;
            this.onKeyRelease("ArrowLeft");
        }
        if (this.rightPressed) {
            this.rightPressed = false;
            this.onKeyRelease("ArrowRight");
        }
        this.activeTouches.clear();
    }
    render() {
        if (!this.isVisible)
            return;
        const buttonY = this.canvas.height - 80;
        const buttonHeight = 60;
        const buttonWidth = 100;
        const leftX = this.canvas.width / 4;
        this.renderButton(leftX, buttonY, buttonWidth, buttonHeight, "L", "#00ff00", this.leftPressed);
        const rightX = (this.canvas.width * 3) / 4;
        this.renderButton(rightX, buttonY, buttonWidth, buttonHeight, "R", "#0080ff", this.rightPressed);
    }
    setupTouchListeners() {
        this.canvas.addEventListener("touchstart", (event) => {
            if (!this.isVisible)
                return;
            event.preventDefault();
            for (let i = 0; i < event.changedTouches.length; i++) {
                const touch = event.changedTouches[i];
                const rect = this.canvas.getBoundingClientRect();
                const x = touch.clientX - rect.left;
                const y = touch.clientY - rect.top;
                const scaleX = this.canvas.width / rect.width;
                const scaleY = this.canvas.height / rect.height;
                const canvasX = x * scaleX;
                const canvasY = y * scaleY;
                const button = this.getTouchedButton(canvasX, canvasY);
                if (button) {
                    this.activeTouches.set(touch.identifier, button);
                    this.handleButtonPress(button);
                }
            }
        });
        this.canvas.addEventListener("touchend", (event) => {
            if (!this.isVisible)
                return;
            event.preventDefault();
            for (let i = 0; i < event.changedTouches.length; i++) {
                const touch = event.changedTouches[i];
                const button = this.activeTouches.get(touch.identifier);
                if (button) {
                    this.activeTouches.delete(touch.identifier);
                    this.handleButtonRelease(button);
                }
            }
        });
        this.canvas.addEventListener("touchcancel", (event) => {
            if (!this.isVisible)
                return;
            event.preventDefault();
            for (let i = 0; i < event.changedTouches.length; i++) {
                const touch = event.changedTouches[i];
                const button = this.activeTouches.get(touch.identifier);
                if (button) {
                    this.activeTouches.delete(touch.identifier);
                    this.handleButtonRelease(button);
                }
            }
        });
    }
    getTouchedButton(x, y) {
        const buttonY = this.canvas.height - 80;
        const buttonHeight = 60;
        const buttonWidth = 100;
        const leftX = this.canvas.width / 4;
        if (x >= leftX - buttonWidth / 2 &&
            x <= leftX + buttonWidth / 2 &&
            y >= buttonY - buttonHeight / 2 &&
            y <= buttonY + buttonHeight / 2) {
            return "left";
        }
        const rightX = (this.canvas.width * 3) / 4;
        if (x >= rightX - buttonWidth / 2 &&
            x <= rightX + buttonWidth / 2 &&
            y >= buttonY - buttonHeight / 2 &&
            y <= buttonY + buttonHeight / 2) {
            return "right";
        }
        return null;
    }
    handleButtonPress(button) {
        if (button === "left" && !this.leftPressed) {
            this.leftPressed = true;
            this.onKeyPress("ArrowLeft");
        }
        else if (button === "right" && !this.rightPressed) {
            this.rightPressed = true;
            this.onKeyPress("ArrowRight");
        }
    }
    handleButtonRelease(button) {
        if (button === "left" && this.leftPressed) {
            this.leftPressed = false;
            this.onKeyRelease("ArrowLeft");
        }
        else if (button === "right" && this.rightPressed) {
            this.rightPressed = false;
            this.onKeyRelease("ArrowRight");
        }
    }
    renderButton(x, y, width, height, text, color, pressed) {
        this.ctx.fillStyle = pressed ? color : `${color}80`;
        this.ctx.fillRect(x - width / 2, y - height / 2, width, height);
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = pressed ? 4 : 2;
        this.ctx.strokeRect(x - width / 2, y - height / 2, width, height);
        this.ctx.fillStyle = "#ffffff";
        this.ctx.font = "bold 24px Arial";
        this.ctx.textAlign = "center";
        this.ctx.fillText(text, x, y + 8);
    }
}
//# sourceMappingURL=MobileControls.js.map