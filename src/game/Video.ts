export class Video {
    private readonly video: HTMLVideoElement;

    constructor(private canvas: HTMLCanvasElement, private ctx: CanvasRenderingContext2D) {
        this.video = document.createElement("video");
        this.video.src = "../assets/game.mp4";
        this.video.muted = true;
        this.video.load();
    }

    play() {
        this.video.play().catch(err => console.error("Error loading video:", err));
    }

    stop() {
        console.log("Stopped playing");
        this.video.currentTime = 0;
        this.video.pause();
    }

    drawFrame() {
        this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
    }
}