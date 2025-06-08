export class Game {
    private readonly video: HTMLVideoElement
    private readonly ctx: CanvasRenderingContext2D | null
    private playing: boolean

    constructor(private canvas: HTMLCanvasElement) {
        this.ctx = canvas.getContext("2d")
        this.video = document.createElement("video")
        this.video.src = "../assets/game.mp4"
        this.playing = false;
    }
    // lets convert the video to the correct aspect ratio
    // converting still

    start() {
        console.log("Started", this.canvas, this.video, this.ctx)
        this.video.play().then(_ => {
            this.playing = true;
            this.drawVideo()
        });
    }

    stop() {
        this.video.currentTime = 0;
        this.video.pause();
        this.playing = false;
    }

    drawVideo() {
        this.ctx?.drawImage(
            this.video,
            0,
            0,
            this.canvas.width,
            this.canvas.height
        )
        if (this.playing) {
            requestAnimationFrame(() => {this.drawVideo()})
        }
    }

}