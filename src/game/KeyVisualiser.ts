export interface KeyTiming {
  press: number;
  release?: number;
  held: boolean;
}

export interface KeyTimings {
  [key: string]: KeyTiming[];
}

export class KeyVisualizer {
  private ctx: CanvasRenderingContext2D;
  private keyTimings: KeyTimings | null = null;
  private startTime: number = 0;
  private isPlaying: boolean = false;
  private readonly laneWidth: number = 40;
  private readonly targetY: number = 250;
  private readonly approachSpeed: number = 200;
  private score: number = 0;
  private combo: number = 0;
  private playbackRate: number = 1;
  private keysHeld: Set<string> = new Set();
  private activeLongNotes: Map<string, KeyTiming[]> = new Map();

  private keyToLane: { [key: string]: string } = {
    ArrowLeft: "left",
    ArrowRight: "right",
    KeyZ: "left",
    KeyX: "right",
  };

  private keyAliases: { [key: string]: string } = {
    KeyZ: "ArrowLeft",
    KeyX: "ArrowRight",
  };

  // Lane configuration - centered and with new colors
  private readonly lanes: { [lane: string]: { x: number; color: string } } = {};

  constructor(private canvas: HTMLCanvasElement) {
    console.log("key visualiser");
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Failed to get 2D context");
    }
    this.ctx = context;

    const centerX = this.canvas.width / 2;
    const laneSpacing = 60;

    this.lanes = {
      left: { x: centerX - laneSpacing / 2, color: "#00ff00" }, // Green
      right: { x: centerX + laneSpacing / 2, color: "#0080ff" }, // Blue
    };
  }

  loadTimings(timingsJson: string): void {
    try {
      this.keyTimings = JSON.parse(timingsJson);
      console.log("Loaded key timings:", this.keyTimings);
    } catch (e) {
      console.error("Failed to parse key timings:", e);
    }
  }

  setPlaybackRate(rate: number): void {
    this.playbackRate = rate;
    console.log("KeyVisualizer playback rate set to:", rate);
  }

  start(): void {
    if (!this.keyTimings) {
      console.error("No key timings loaded");
      return;
    }

    this.startTime = Date.now();
    this.isPlaying = true;
    this.score = 0;
    this.combo = 0;
    console.log("KeyVisualizer started with playback rate:", this.playbackRate);
  }

  stop(): void {
    this.isPlaying = false;
  }

  renderOverlay(): void {
    if (!this.isPlaying) return;

    // Adjust current time by playback rate
    const currentTime =
      ((Date.now() - this.startTime) / 1000) * this.playbackRate;

    // Draw a visible test overlay to confirm it's working
    this.ctx.fillStyle = "rgba(255, 0, 0, 0.3)";
    this.ctx.fillRect(0, 0, this.canvas.width, 40);
    this.ctx.fillStyle = "white";
    this.ctx.font = "16px Arial";
    this.ctx.shadowColor = "black";
    this.ctx.shadowBlur = 2;
    this.ctx.fillText(
      `♪ Time: ${currentTime.toFixed(1)}s (${this.playbackRate}x)`,
      10,
      25,
    );
    this.ctx.shadowBlur = 0;

    // Draw solid black overlay only behind note lanes
    this.drawNoteLaneOverlay();

    // Draw lanes
    this.drawLanes();

    // Draw target line
    this.drawTargetLine();

    // Draw notes
    this.drawNotes(currentTime);

    // Draw score
    this.drawScore();
  }

  private drawNoteLaneOverlay(): void {
    // Draw solid black overlay only behind the note lanes, not the entire width
    const leftLaneX = this.lanes["left"].x;
    const rightLaneX = this.lanes["right"].x;
    const overlayLeft = leftLaneX - this.laneWidth / 2;
    const overlayWidth = rightLaneX + this.laneWidth / 2 - overlayLeft;

    this.ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    this.ctx.fillRect(overlayLeft, this.targetY - 150, overlayWidth, 150);
  }

  private drawLanes(): void {
    this.ctx.strokeStyle = "#888888";
    this.ctx.lineWidth = 2;

    // Draw lane lines
    const laneEntries = Object.entries(this.lanes) as [
      string,
      { x: number; color: string },
    ][];
    for (const [, lane] of laneEntries) {
      this.ctx.beginPath();
      this.ctx.moveTo(lane.x - this.laneWidth / 2, this.targetY - 150);
      this.ctx.lineTo(lane.x - this.laneWidth / 2, this.canvas.height);
      this.ctx.stroke();

      this.ctx.beginPath();
      this.ctx.moveTo(lane.x + this.laneWidth / 2, this.targetY - 150);
      this.ctx.lineTo(lane.x + this.laneWidth / 2, this.canvas.height);
      this.ctx.stroke();
    }
  }

  private drawTargetLine(): void {
    this.ctx.strokeStyle = "#ffffff";
    this.ctx.lineWidth = 3;
    this.ctx.shadowColor = "#000000";
    this.ctx.shadowBlur = 2;

    this.ctx.beginPath();
    this.ctx.moveTo(this.lanes["left"].x - this.laneWidth / 2, this.targetY);
    this.ctx.lineTo(this.lanes["right"].x + this.laneWidth / 2, this.targetY);
    this.ctx.stroke();

    // Draw receptors (target zones) - rectangles instead of circles, transparent in middle
    const laneEntries = Object.entries(this.lanes) as [
      string,
      { x: number; color: string },
    ][];
    for (const [, lane] of laneEntries) {
      const rectWidth = 30;
      const rectHeight = 20;

      // Draw the colored border
      this.ctx.strokeStyle = lane.color;
      this.ctx.lineWidth = 3;
      this.ctx.strokeRect(
        lane.x - rectWidth / 2,
        this.targetY - rectHeight / 2,
        rectWidth,
        rectHeight,
      );

      // Add a white inner border for better visibility
      this.ctx.strokeStyle = "#ffffff";
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(
        lane.x - rectWidth / 2 + 2,
        this.targetY - rectHeight / 2 + 2,
        rectWidth - 4,
        rectHeight - 4,
      );
    }

    this.ctx.shadowBlur = 0; // Reset shadow
  }

  private drawNotes(currentTime: number): void {
    if (!this.keyTimings) return;

    // Adjust time windows based on playback rate
    const futureWindow = 2 / this.playbackRate;
    const pastWindow = 0.3 / this.playbackRate;

    const timingEntries = Object.entries(this.keyTimings) as [
      string,
      KeyTiming[],
    ][];
    timingEntries.forEach(([key, timings]) => {
      const laneName = this.keyToLane[key];
      if (!laneName) return;

      const lane = this.lanes[laneName];

      timings.forEach((timing: KeyTiming) => {
        const timeOffset = timing.press - currentTime;

        if (timeOffset > -pastWindow && timeOffset < futureWindow) {
          // Adjust approach speed based on playback rate
          const y =
            this.targetY - timeOffset * this.approachSpeed * this.playbackRate;

          // Check if this is a long note based on duration (ignore held property)
          const isLongNote =
            timing.release && timing.release - timing.press > 0.2;

          // Check if note should be visible (including when bottom is off screen)
          if (y >= this.targetY - 150 || isLongNote) {
            if (isLongNote && timing.release) {
              const releaseOffset = timing.release - currentTime;
              const releaseY =
                this.targetY -
                releaseOffset * this.approachSpeed * this.playbackRate;

              if (releaseOffset > -pastWindow) {
                // Draw the tail even if the bottom extends below the screen
                const tailTop = Math.min(y, releaseY);
                const tailBottom = Math.max(y, releaseY);

                // Only draw if any part of the tail is visible
                if (tailTop < this.canvas.height) {
                  this.ctx.fillStyle = lane.color; // Solid color, not translucent

                  // Draw tail from top to bottom, even if bottom extends off screen
                  this.ctx.fillRect(
                    lane.x - 10, // Smaller width for tail
                    tailTop,
                    20,
                    tailBottom - tailTop,
                  );
                }

                // Only draw the bottom cap (release note) if it's in the visible area
                // No top cap for long notes as requested
                if (
                  releaseY >= this.targetY - 150 &&
                  releaseY <= this.canvas.height + 25
                ) {
                  this.drawNoteRect(lane.x, releaseY, lane.color);
                }
              }
            } else {
              // Regular note - only draw if visible
              if (y <= this.canvas.height + 25) {
                this.drawNoteRect(lane.x, y, lane.color);
              }
            }
          }
        }
      });
    });
  }

  private drawNoteRect(x: number, y: number, color: string): void {
    const noteWidth = 30; // Smaller notes
    const noteHeight = 20;

    // Add shadow for better visibility over video
    this.ctx.shadowColor = "#000000";
    this.ctx.shadowBlur = 3;
    this.ctx.shadowOffsetX = 1;
    this.ctx.shadowOffsetY = 1;

    // Draw note rectangle without border
    this.ctx.fillStyle = color;
    this.ctx.fillRect(
      x - noteWidth / 2,
      y - noteHeight / 2,
      noteWidth,
      noteHeight,
    );

    // No white border as requested

    // Reset shadow
    this.ctx.shadowBlur = 0;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 0;
  }

  private drawScore(): void {
    // Position score in top-right corner with shadow for visibility
    this.ctx.fillStyle = "#ffffff";
    this.ctx.font = "20px Arial";
    this.ctx.textAlign = "right";
    this.ctx.textBaseline = "top";
    this.ctx.shadowColor = "#000000";
    this.ctx.shadowBlur = 2;

    this.ctx.fillText(`Score: ${this.score}`, this.canvas.width - 20, 20);
    this.ctx.fillText(`Combo: ${this.combo}x`, this.canvas.width - 20, 45);

    this.ctx.shadowBlur = 0; // Reset shadow
  }

  handleKeyPress(key: string): void {
    if (!this.isPlaying || !this.keyTimings || !this.keyTimings[key]) return;

    // Adjust current time by playback rate
    const currentTime =
      ((Date.now() - this.startTime) / 1000) * this.playbackRate;
    const laneName = this.keyToLane[key];

    if (!laneName) return;

    const timings = this.keyTimings[key];
    let closestNote: KeyTiming | null = null;
    let closestDist = Infinity;

    // Adjust timing window based on playback rate
    const timingWindow = 0.2 / this.playbackRate;

    for (const note of timings) {
      const dist = Math.abs(note.press - currentTime);
      if (dist < closestDist && dist < timingWindow) {
        closestDist = dist;
        closestNote = note;
      }
    }

    if (closestNote) {
      let points = 0;
      const adjustedThresholds = {
        perfect: 0.05 / this.playbackRate,
        great: 0.1 / this.playbackRate,
        good: 0.15 / this.playbackRate,
      };

      if (closestDist < adjustedThresholds.perfect) {
        points = 100;
        this.combo++;
        console.log("PERFECT!");
      } else if (closestDist < adjustedThresholds.great) {
        points = 75;
        this.combo++;
        console.log("GREAT!");
      } else if (closestDist < adjustedThresholds.good) {
        points = 50;
        this.combo++;
        console.log("GOOD!");
      } else {
        points = 25;
        this.combo = 0;
        console.log("BAD!");
      }

      this.score += points * (1 + Math.min(this.combo * 0.1, 2));

      const index = timings.indexOf(closestNote);
      if (index > -1) {
        timings.splice(index, 1);
      }
    } else {
      this.combo = 0;
      console.log("MISS!");
    }
  }

  handleKeyRelease(key: string): void {
    // Handle held note releases if needed
  }
}
