import { Video } from "./Video.js";
import { Audio } from "./Audio.js";
import { createLogger, Logger, NullLogger } from "./Logger.js";
import { KeyVisualizer } from "./KeyVisualiser.js";

const ENABLE_LOGGING = false;

export class Game {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly video: Video;
  private readonly audio: Audio;
  private active: boolean;
  private PLAYBACKRATE: number = 1;
  private logger: Logger | NullLogger;
  private keyVisualizer: KeyVisualizer | null = null;

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

    // Automatically load the visualizer on construction
    this.loadVisualizer();
  }

  private async loadVisualizer() {
    try {
      console.log("Loading visualizer timing data...");
      const response = await fetch("./assets/keyTimings.json");
      if (!response.ok) {
        console.warn(
          "Could not load keyTimings.json - visualizer will be disabled",
        );
        return;
      }

      const timingsJson = await response.text();
      this.keyVisualizer = new KeyVisualizer(this.canvas);
      this.keyVisualizer.loadTimings(timingsJson);
      this.keyVisualizer.setPlaybackRate(this.PLAYBACKRATE); // Set the playback rate
      console.log("Visualizer loaded successfully");
    } catch (error) {
      console.warn("Failed to load visualizer:", error);
    }
  }
  private setupKeyListeners() {
    document.addEventListener("keydown", (event) => {
      if (!this.active) return;

      // Always handle key presses for the visualizer if it exists
      if (this.keyVisualizer) {
        this.keyVisualizer.handleKeyPress(event.code);
      }

      // Also log keys if logging is enabled
      if (ENABLE_LOGGING) {
        this.logger.handleKeyDown(event);
      }
    });

    document.addEventListener("keyup", (event) => {
      if (!this.active) return;

      if (ENABLE_LOGGING) {
        this.logger.handleKeyUp(event);
      }
    });
  }

  // Start the game with video, audio, and visualizer overlay
  async start() {
    console.log("Starting game...");

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

    // Start the visualizer if it's loaded
    if (this.keyVisualizer) {
      console.log("Starting visualizer...");
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

  private render() {
    if (!this.active) return;

    // Always draw the video frame first
    this.video.drawFrame();

    // Overlay the visualizer if it exists and is playing
    if (this.keyVisualizer) {
      this.keyVisualizer.renderOverlay();
    }

    requestAnimationFrame(() => this.render());
  }
}

// stuff and things