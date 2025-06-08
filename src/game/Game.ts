import {Video} from "./Video.js";
import {Audio} from "./Audio.js";

export class Game {
    private readonly ctx: CanvasRenderingContext2D;
    private readonly video: Video;
    private readonly audio: Audio;
    private active: boolean;

    constructor(private canvas: HTMLCanvasElement) {
        const context = canvas.getContext("2d");
        if (!context) {
            throw new Error("Failed to get 2D context");
        }
        this.ctx = context;
        this.video = new Video(this.canvas, this.ctx);
        this.audio = new Audio();
        this.active = false;
    }

    start() {
        this.video.play();
        this.audio.play();
        this.active = true;
        this.render()
    }

    stop() {
        this.active = false;
        this.video.stop();
        this.audio.stop();
    }

    render() {
        if (this.active) {
            this.video.drawFrame();
            requestAnimationFrame(() => this.render());
        }
    }
}