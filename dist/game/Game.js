import { Video } from "./Video.js";
import { Audio } from "./Audio.js";
import { createLogger } from "./Logger.js";
import { KeyVisualizer } from "./KeyVisualiser.js";
import { UIManager } from "./UIManager.js";
import { MobileControls } from "./MobileControls.js";
import { DeviceDetector } from "./DeviceDetector.js";
const ENABLE_LOGGING = false;
export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.PLAYBACKRATE = 1;
        this.keyVisualizer = null;
        this.mobileControls = null;
        const context = canvas.getContext("2d");
        if (!context) {
            throw new Error("Failed to get 2D context");
        }
        this.ctx = context;
        this.video = new Video(this.canvas, this.ctx);
        this.audio = new Audio();
        this.logger = createLogger(ENABLE_LOGGING);
        this.active = false;
        this.isMobile = DeviceDetector.isMobile();
        this.uiManager = new UIManager(this.canvas, () => this.startGame(), () => this.stopGame());
        if (this.isMobile) {
            this.mobileControls = new MobileControls(this.canvas, (key) => this.handleMobileKeyPress(key), (key) => this.handleMobileKeyRelease(key));
        }
        this.setupKeyListeners();
        this.loadVisualizer();
        this.startRenderLoop();
    }
    stop() {
        this.stopGame();
        this.uiManager.setState("menu");
    }
    handleMobileKeyPress(key) {
        if (!this.active)
            return;
        if (this.keyVisualizer) {
            this.keyVisualizer.handleKeyPress(key);
        }
        if (ENABLE_LOGGING) {
            const mockEvent = new KeyboardEvent("keydown", { code: key });
            this.logger.handleKeyDown(mockEvent);
        }
    }
    handleMobileKeyRelease(key) {
        if (!this.active)
            return;
        if (this.keyVisualizer) {
            this.keyVisualizer.handleKeyRelease(key);
        }
        if (ENABLE_LOGGING) {
            const mockEvent = new KeyboardEvent("keyup", { code: key });
            this.logger.handleKeyUp(mockEvent);
        }
    }
    async loadVisualizer() {
        try {
            const response = await fetch("./assets/keyTimings.json");
            if (!response.ok) {
                console.error("Could not fetch keyTimings.json");
                // Return early
                return;
            }
            const timingsJson = await response.text();
            this.keyVisualizer = new KeyVisualizer(this.canvas);
            this.keyVisualizer.loadTimings(timingsJson);
            this.keyVisualizer.setPlaybackRate(this.PLAYBACKRATE);
        }
        catch (error) {
            console.error("Failed to load visualizer:", error);
        }
    }
    setupKeyListeners() {
        document.addEventListener("keydown", (event) => {
            if (!this.active)
                return;
            if (event.key === "Escape" && this.uiManager.getState() === "playing") {
                this.pauseGame();
                return;
            }
            if (this.keyVisualizer) {
                this.keyVisualizer.handleKeyPress(event.code);
            }
            if (ENABLE_LOGGING) {
                this.logger.handleKeyDown(event);
            }
        });
        document.addEventListener("keyup", (event) => {
            if (!this.active)
                return;
            if (this.keyVisualizer) {
                this.keyVisualizer.handleKeyRelease(event.code);
            }
            if (ENABLE_LOGGING) {
                this.logger.handleKeyUp(event);
            }
        });
    }
    startRenderLoop() {
        const renderFrame = () => {
            this.render();
            requestAnimationFrame(renderFrame);
        };
        renderFrame();
    }
    startGame() {
        this.video.setPlaybackRate(this.PLAYBACKRATE);
        this.audio.setPlaybackRate(this.PLAYBACKRATE);
        if (ENABLE_LOGGING) {
            this.logger.setPlaybackRate(this.PLAYBACKRATE);
        }
        this.video.play();
        // Delay of 0.5s to sync the audio
        setTimeout(() => {
            this.audio.play();
        }, 500 / this.PLAYBACKRATE);
        this.active = true;
        if (this.keyVisualizer) {
            this.keyVisualizer.start();
        }
        if (ENABLE_LOGGING) {
            this.logger.startRecording();
        }
        if (this.mobileControls) {
            this.mobileControls.show();
        }
    }
    stopGame() {
        this.active = false;
        this.video.stop();
        this.audio.stop();
        if (this.keyVisualizer) {
            this.keyVisualizer.stop();
        }
        if (ENABLE_LOGGING) {
            this.logger.exportTimings();
        }
        if (this.mobileControls) {
            this.mobileControls.hide();
        }
    }
    pauseGame() {
        this.active = false;
        this.video.stop();
        this.audio.stop();
        if (this.mobileControls) {
            this.mobileControls.hide();
        }
        this.uiManager.setState("paused");
    }
    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        const currentState = this.uiManager.getState();
        if (currentState === "playing" && this.active) {
            this.video.drawFrame();
            if (this.keyVisualizer) {
                this.keyVisualizer.renderOverlay();
            }
            if (this.mobileControls) {
                this.mobileControls.render();
            }
        }
        else {
            this.uiManager.render();
        }
    }
}
//# sourceMappingURL=Game.js.map