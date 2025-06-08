import {Video} from "./Video.js";
import {Audio} from "./Audio.js";
import {createLogger, Logger, NullLogger} from "./Logger.js";

const ENABLE_LOGGING = false;

export class Game {
    private readonly ctx: CanvasRenderingContext2D;
    private readonly video: Video;
    private readonly audio: Audio;
    private active: boolean;
    private PLAYBACKRATE: number = 0.5;
    private logger: Logger | NullLogger

    constructor(private canvas: HTMLCanvasElement) {
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
    }

    private setupKeyListeners() {
        document.addEventListener("keydown", (event) => {
            if (!this.active) return;
            this.logger.handleKeyDown(event);
        });

        document.addEventListener("keyup", (event) => {
            if (!this.active) return;
            this.logger.handleKeyUp(event);
        });
    }

    start() {
        this.video.setPlaybackRate(this.PLAYBACKRATE);
        this.audio.setPlaybackRate(this.PLAYBACKRATE);
        this.logger.setPlaybackRate(this.PLAYBACKRATE);

        this.video.play();

        // Delay of 0.5s to sync the audio
        setTimeout(() => {
            this.audio.play();
        }, 500 / this.PLAYBACKRATE);

        this.active = true;
        this.logger.startRecording();
        this.render();
    }

    stop() {
        this.active = false;
        this.video.stop();
        this.audio.stop();
        this.logger.exportTimings();
    }

    private render() {
        if (this.active) {
            this.video.drawFrame();
            requestAnimationFrame(() => this.render());
        }
    }
}