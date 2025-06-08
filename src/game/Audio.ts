export class Audio {
    private readonly audio: HTMLAudioElement;

    constructor() {
        this.audio = document.createElement("audio");

        const sources = [{src: "../assets/music.opus", type: "audio/ogg; codes=opus"}, {
            src: "../assets/music.ogg", type: "audio/ogg"
        }, {src: "../assets/music.mp3", type: "audio/mpeg"}];

        sources.forEach(source => {
            const sourceElement = document.createElement("source");
            sourceElement.src = source.src;
            sourceElement.type = source.type;
            this.audio.appendChild(sourceElement);
        });

        this.audio.preload = "auto";
    }

    play() {
        this.audio.play().catch(err => console.error("Error playing audio:", err));
    }

    stop() {
        this.audio.pause();
        this.audio.currentTime = 0;
    }

    setVolume(volume: number) {
        this.audio.volume = volume;
    }
}