import {Video} from "./Video.js";
import {Audio} from "./Audio.js";

export class Game {
    private readonly ctx: CanvasRenderingContext2D;
    private readonly video: Video;
    private readonly audio: Audio;
    private active: boolean;
    private PLAYBACKRATE: number = 0.5;

    private keyTimings: Map<string, {press: number, release?: number}[]> = new Map();
    private activeKeys: Map<string, number> = new Map();
    private startTime: number = 0;
    private HELD_THRESHOLD: number = 0.1;

    constructor(private canvas: HTMLCanvasElement) {
        const context = canvas.getContext("2d");
        if (!context) {
            throw new Error("Failed to get 2D context");
        }
        this.ctx = context;
        this.video = new Video(this.canvas, this.ctx);
        this.audio = new Audio();
        this.active = false;
        this.setupKeyListeners();
    }

    private setupKeyListeners() {
        document.addEventListener("keydown", (event) => {
            if (!this.active) return;
            event.preventDefault();

            const key = event.code;
            const currentTime = (Date.now() - this.startTime) / 1000 * this.PLAYBACKRATE;

            if (!this.activeKeys.has(key)) {
                this.activeKeys.set(key, currentTime);

                if (!this.keyTimings.has(key)) {
                    this.keyTimings.set(key, []);
                }

                this.keyTimings.get(key)?.push({ press: currentTime });
                console.log(`Key ${key} pressed at ${currentTime.toFixed(3)}s`);
            }
        });

        document.addEventListener("keyup", (event) => {
            if (!this.active) return;
            event.preventDefault();

            const key = event.code;
            const currentTime = (Date.now() - this.startTime) / 1000 * this.PLAYBACKRATE;

            if (this.activeKeys.has(key)) {
                const pressTime = this.activeKeys.get(key)!;
                const duration = currentTime - pressTime;
                const keyEntries = this.keyTimings.get(key);

                if (keyEntries && keyEntries.length > 0) {
                    const lastEntry = keyEntries[keyEntries.length - 1];
                    lastEntry.release = currentTime;

                    const isHeld = duration >= this.HELD_THRESHOLD;
                    console.log(`Key ${key} released at ${currentTime.toFixed(3)}s, duration: ${duration.toFixed(3)}s, held: ${isHeld}`);
                }

                this.activeKeys.delete(key);
            }
        });
    }

    start() {
        this.video.setPlaybackRate(this.PLAYBACKRATE);
        this.audio.setPlaybackRate(this.PLAYBACKRATE);

        this.video.play();

        // Delay of 0.5s to sync the audio
        setTimeout(() => {
            this.audio.play();
        }, 500 / this.PLAYBACKRATE);

        this.active = true;
        this.startTime = Date.now();
        this.render();
    }

    stop() {
        this.active = false;
        this.video.stop();
        this.audio.stop();

        this.exportTimings();
    }

    private render() {
        if (this.active) {
            this.video.drawFrame();
            requestAnimationFrame(() => this.render());
        }
    }

    private exportTimings() {
        const formattedTimings: Record<string, Array<{press: number, release?: number, held: boolean}>> = {};

        this.keyTimings.forEach((timings, key) => {
            formattedTimings[key] = timings.map(timing => {
                const duration = timing.release ? timing.release - timing.press : 0;
                return {
                    press: timing.press,
                    release: timing.release,
                    held: duration >= this.HELD_THRESHOLD
                };
            });
        });

        const json = JSON.stringify(formattedTimings, null, 2);

        const blob = new Blob([json], {type: 'application/json'});
        console.log(blob);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'keyTimings.json';
        a.click();
        URL.revokeObjectURL(url);
    }
}