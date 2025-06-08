import { Video } from "./Video.js";
import { Audio } from "./Audio.js";
import { createLogger } from "./Logger.js";
import { KeyVisualizer } from "./KeyVisualiser.js";
const ENABLE_LOGGING = false;
export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.PLAYBACKRATE = 1;
        this.keyVisualizer = null;
        const context = canvas.getContext("2d");
        if (!context) {
            throw new Error("Failed to get 2D context");
        }
        this.ctx = context;
        this.video = new Video(this.canvas, this.ctx);
        this.audio = new Audio();
        this.logger = createLogger(ENABLE_LOGGING);
        this.active = false;
        this.setupKeyListeners();
        this.loadVisualizer();
    }
    async loadVisualizer() {
        try {
            const response = await fetch("./assets/keyTimings.json");
            if (!response.ok) {
                console.warn("Could not load keyTimings.json - visualizer will be disabled");
                return;
            }
            const timingsJson = await response.text();
            this.keyVisualizer = new KeyVisualizer(this.canvas);
            this.keyVisualizer.loadTimings(timingsJson);
            this.keyVisualizer.setPlaybackRate(this.PLAYBACKRATE);
        }
        catch (error) {
            console.warn("Failed to load visualizer:", error);
        }
    }
    setupKeyListeners() {
        document.addEventListener("keydown", (event) => {
            if (!this.active)
                return;
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
    async start() {
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
        this.render();
    }
    stop() {
        this.active = false;
        this.video.stop();
        this.audio.stop();
        if (this.keyVisualizer) {
            this.keyVisualizer.stop();
        }
        if (ENABLE_LOGGING) {
            this.logger.exportTimings();
        }
    }
    render() {
        if (!this.active)
            return;
        this.video.drawFrame();
        if (this.keyVisualizer) {
            this.keyVisualizer.renderOverlay();
        }
        requestAnimationFrame(() => this.render());
    }
}
//# sourceMappingURL=Game.js.map