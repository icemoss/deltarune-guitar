export interface KeyTiming {
  press: number;
  release?: number;
  held: boolean;
}

export interface KeyTimings {
  [key: string]: KeyTiming[];
}

export interface HitIndicator {
  note: KeyTiming;
  hitTime: number;
  quality: "perfect" | "great" | "good" | "bad";
  position: { x: number; y: number };
  lane: string;
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
  private hitNotes: Set<KeyTiming> = new Set();
  private hitIndicators: HitIndicator[] = [];

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

  private readonly lanes: { [lane: string]: { x: number; color: string } } = {};

  constructor(private canvas: HTMLCanvasElement) {
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Failed to get 2D context");
    }
    this.ctx = context;

    const centerX = this.canvas.width / 2;
    const laneSpacing = 60;

    this.lanes = {
      left: { x: centerX - laneSpacing / 2, color: "#00ff00" },
      right: { x: centerX + laneSpacing / 2, color: "#0080ff" },
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
    this.keysHeld.clear();
    this.activeLongNotes.clear();
    this.hitNotes.clear();
    this.hitIndicators = [];
  }

  stop(): void {
    this.isPlaying = false;
    this.keysHeld.clear();
    this.activeLongNotes.clear();
    this.hitIndicators = [];
  }

  renderOverlay(): void {
    if (!this.isPlaying) return;

    const currentTime =
      ((Date.now() - this.startTime) / 1000) * this.playbackRate;

    this.updateLongNoteHolding(currentTime);
    this.updateHitIndicators(currentTime);

    this.drawNoteLaneOverlay();

    this.drawLanes();

    this.drawNotes(currentTime);

    this.drawHitIndicators(currentTime);

    this.drawTargetLine();

    this.drawScore();
  }

  handleKeyPress(key: string): void {
    if (!this.isPlaying || !this.keyTimings) return;

    this.keysHeld.add(key);

    const dataKey = this.keyAliases[key] || key;

    if (!this.keyTimings[dataKey]) return;

    const currentTime =
      ((Date.now() - this.startTime) / 1000) * this.playbackRate;
    const laneName = this.keyToLane[key];

    if (!laneName) return;

    const timings = this.keyTimings[dataKey];
    let closestNote: KeyTiming | null = null;
    let closestDist = Infinity;

    const timingWindow = 0.2 / this.playbackRate;

    for (const note of timings) {
      if (this.hitNotes.has(note)) continue;

      const dist = Math.abs(note.press - currentTime);
      if (dist < closestDist && dist < timingWindow) {
        closestDist = dist;
        closestNote = note;
      }
    }

    if (closestNote) {
      let points: number;
      let quality: "perfect" | "great" | "good" | "bad";
      const adjustedThresholds = {
        perfect: 0.15 / this.playbackRate,
        great: 0.25 / this.playbackRate,
        good: 0.4 / this.playbackRate,
      };

      if (closestDist < adjustedThresholds.perfect) {
        points = 100;
        quality = "perfect";
        this.combo++;
        console.log("PERFECT!");
      } else if (closestDist < adjustedThresholds.great) {
        points = 75;
        quality = "great";
        this.combo++;
        console.log("GREAT!");
      } else if (closestDist < adjustedThresholds.good) {
        points = 50;
        quality = "good";
        this.combo++;
        console.log("GOOD!");
      } else {
        points = 25;
        quality = "bad";
        this.combo = 0;
        console.log("BAD!");
      }

      this.score += points * (1 + Math.min(this.combo * 0.1, 2));

      // Create hit indicator
      const lane = this.lanes[laneName];
      const noteY =
        this.targetY -
        (closestNote.press - currentTime) *
          this.approachSpeed *
          this.playbackRate;
      this.hitIndicators.push({
        note: closestNote,
        hitTime: currentTime,
        quality: quality,
        position: { x: lane.x, y: noteY },
        lane: laneName,
      });

      const isLongNote =
        closestNote.release && closestNote.release - closestNote.press > 0.2;

      if (isLongNote) {
        if (!this.activeLongNotes.has(dataKey)) {
          this.activeLongNotes.set(dataKey, []);
        }
        this.activeLongNotes.get(dataKey)!.push(closestNote);
      }

      this.hitNotes.add(closestNote);
    }
  }

  handleKeyRelease(key: string): void {
    this.keysHeld.delete(key);
  }

  private updateHitIndicators(currentTime: number): void {
    // Remove hit indicators that have been visible for too long
    const indicatorLifetime = 0.5; // 0.5 seconds
    this.hitIndicators = this.hitIndicators.filter((indicator) => {
      return currentTime - indicator.hitTime < indicatorLifetime;
    });
  }

  private drawHitIndicators(currentTime: number): void {
    this.hitIndicators.forEach((indicator) => {
      const elapsed = currentTime - indicator.hitTime;
      const lifetime = 0.5; // 0.5 seconds
      const progress = elapsed / lifetime;

      if (progress >= 1) return; // Skip if expired

      // Calculate fade and movement
      const alpha = 1 - progress;
      const yOffset = -progress * 30; // Move up as it fades
      const scale = 1 + progress * 0.5; // Grow slightly as it fades

      // Get color based on quality
      let baseColor: string;
      switch (indicator.quality) {
        case "perfect":
          baseColor = "#FFD700"; // Gold
          break;
        case "great":
          baseColor = "#FFA500"; // Orange
          break;
        case "good":
          baseColor = "#90EE90"; // Light Green
          break;
        case "bad":
          baseColor = "#FF6B6B"; // Light Red
          break;
      }

      // Draw the hit note with golden/colored effect
      this.drawHitNote(
        indicator.position.x,
        indicator.position.y + yOffset,
        baseColor,
        alpha,
        scale,
      );

      // Draw quality text
      this.drawHitText(
        indicator.position.x,
        indicator.position.y + yOffset - 25,
        indicator.quality.toUpperCase(),
        baseColor,
        alpha,
      );
    });
  }

  private drawHitNote(
    x: number,
    y: number,
    color: string,
    alpha: number,
    scale: number,
  ): void {
    const noteWidth = 30 * scale;
    const noteHeight = 20 * scale;

    this.ctx.save();
    this.ctx.globalAlpha = alpha;

    // Draw glow effect
    this.ctx.shadowColor = color;
    this.ctx.shadowBlur = 15;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 0;

    // Draw the golden note
    this.ctx.fillStyle = color;
    this.ctx.fillRect(
      x - noteWidth / 2,
      y - noteHeight / 2,
      noteWidth,
      noteHeight,
    );

    // Draw bright border
    this.ctx.strokeStyle = "#FFFFFF";
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(
      x - noteWidth / 2,
      y - noteHeight / 2,
      noteWidth,
      noteHeight,
    );

    this.ctx.restore();
  }

  private drawHitText(
    x: number,
    y: number,
    text: string,
    color: string,
    alpha: number,
  ): void {
    this.ctx.save();
    this.ctx.globalAlpha = alpha;
    this.ctx.fillStyle = color;
    this.ctx.strokeStyle = "#000000";
    this.ctx.lineWidth = 2;
    this.ctx.font = "bold 14px Arial";
    this.ctx.textAlign = "center";

    // Draw text outline
    this.ctx.strokeText(text, x, y);
    // Draw text
    this.ctx.fillText(text, x, y);

    this.ctx.restore();
  }

  private updateLongNoteHolding(currentTime: number): void {
    this.activeLongNotes.forEach((longNotes, dataKey) => {
      const isKeyHeld = Array.from(this.keysHeld).some((heldKey) => {
        const mappedKey = this.keyAliases[heldKey] || heldKey;
        return mappedKey === dataKey;
      });

      longNotes.forEach((note, index) => {
        if (
          note.release &&
          currentTime >= note.press &&
          currentTime <= note.release
        ) {
          if (isKeyHeld) {
            this.score += 1;
          } else {
            const noteProgress =
              (currentTime - note.press) / (note.release! - note.press);
            const minHoldRatio = 0.7;

            if (noteProgress < minHoldRatio) {
              this.combo = 0;
            }
          }
        }

        const gracePeriod = 0.3;
        if (note.release && currentTime > note.release + gracePeriod) {
          const noteLength = note.release - note.press;
          if (noteLength > 0.2) {
            const bonusPoints = Math.floor(noteLength * 10);
            this.score += bonusPoints;
          }

          longNotes.splice(index, 1);
        }
      });

      if (longNotes.length === 0) {
        this.activeLongNotes.delete(dataKey);
      }
    });
  }

  private drawNoteLaneOverlay(): void {
    const leftLaneX = this.lanes["left"].x;
    const rightLaneX = this.lanes["right"].x;
    const overlayLeft = leftLaneX - this.laneWidth / 2;
    const overlayWidth = rightLaneX + this.laneWidth / 2 - overlayLeft;

    const overlayTop = this.targetY - 220;
    const overlayBottom = this.canvas.height - 100 - 20;
    const overlayHeight = overlayBottom - overlayTop;

    this.ctx.fillStyle = "#000000";
    this.ctx.fillRect(overlayLeft, overlayTop, overlayWidth, overlayHeight);
  }

  private drawLanes(): void {
    this.ctx.strokeStyle = "#888888";
    this.ctx.lineWidth = 2;

    const laneEntries = Object.entries(this.lanes) as [
      string,
      { x: number; color: string },
    ][];
    for (const [, lane] of laneEntries) {
      this.ctx.beginPath();
      this.ctx.moveTo(lane.x - this.laneWidth / 2, this.targetY - 220);
      this.ctx.lineTo(
        lane.x - this.laneWidth / 2,
        this.canvas.height - 100 - 20,
      );
      this.ctx.stroke();

      this.ctx.beginPath();
      this.ctx.moveTo(lane.x + this.laneWidth / 2, this.targetY - 220);
      this.ctx.lineTo(
        lane.x + this.laneWidth / 2,
        this.canvas.height - 100 - 20,
      );
      this.ctx.stroke();
    }
  }

  private drawTargetLine(): void {
    this.ctx.strokeStyle = "#ffffff";
    this.ctx.lineWidth = 3;
    this.ctx.shadowColor = "#000000";
    this.ctx.shadowBlur = 2;

    const yOffset = -30;
    const targetLineY = this.targetY + yOffset;
    this.ctx.beginPath();
    this.ctx.moveTo(this.lanes["left"].x - this.laneWidth / 2, targetLineY);
    this.ctx.lineTo(this.lanes["right"].x + this.laneWidth / 2, targetLineY);
    this.ctx.stroke();

    const laneEntries = Object.entries(this.lanes) as [
      string,
      { x: number; color: string },
    ][];
    for (const [laneName, lane] of laneEntries) {
      const rectWidth = 30;
      const rectHeight = 20;

      const isLanePressed = Array.from(this.keysHeld).some((heldKey) => {
        return this.keyToLane[heldKey] === laneName;
      });

      if (isLanePressed) {
        this.ctx.strokeStyle = "#ffffff";
        this.ctx.lineWidth = 6;
        this.ctx.shadowColor = "#ffffff";
        this.ctx.shadowBlur = 10;
        this.ctx.strokeRect(
          lane.x - rectWidth / 2 - 2,
          this.targetY - rectHeight / 2 - 2 + yOffset,
          rectWidth + 4,
          rectHeight + 4,
        );

        this.ctx.shadowColor = "#000000";
        this.ctx.shadowBlur = 2;
      }

      this.ctx.strokeStyle = lane.color;
      this.ctx.lineWidth = 3;
      this.ctx.strokeRect(
        lane.x - rectWidth / 2,
        this.targetY - rectHeight / 2 + yOffset,
        rectWidth,
        rectHeight,
      );

      this.ctx.strokeStyle = "#ffffff";
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(
        lane.x - rectWidth / 2 + 2,
        this.targetY - rectHeight / 2 + 2 + yOffset,
        rectWidth - 4,
        rectHeight - 4,
      );
    }

    this.ctx.shadowBlur = 0;
  }

  private drawNotes(currentTime: number): void {
    if (!this.keyTimings) return;

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
        const isLongNote =
          timing.release && timing.release - timing.press > 0.2;

        // Draw long note tails
        if (isLongNote && timing.release) {
          const releaseOffset = timing.release - currentTime;
          const y =
            this.targetY - timeOffset * this.approachSpeed * this.playbackRate;
          const releaseY =
            this.targetY -
            releaseOffset * this.approachSpeed * this.playbackRate;

          const tailTop = Math.min(y, releaseY);
          const tailBottom = Math.max(y, releaseY);

          const visibleTop = this.targetY - 220;
          const visibleBottom = this.canvas.height - 100 - 20;

          if (tailTop <= visibleBottom) {
            // Check if this note was hit - if so, make the tail golden too
            const wasHit = this.hitNotes.has(timing);
            this.ctx.fillStyle = wasHit ? "#FFD700" : lane.color;

            const clampedTop = Math.max(tailTop, visibleTop);
            const clampedBottom = Math.min(tailBottom, visibleBottom);

            if (clampedBottom > clampedTop) {
              this.ctx.fillRect(
                lane.x - 5,
                clampedTop,
                10,
                clampedBottom - clampedTop,
              );
            }
          }
        }

        // Draw note heads (only if not hit)
        if (
          !this.hitNotes.has(timing) &&
          timeOffset > -pastWindow &&
          timeOffset < futureWindow
        ) {
          const y =
            this.targetY - timeOffset * this.approachSpeed * this.playbackRate;

          if (
            y >= this.targetY - 220 &&
            y <= this.canvas.height - 100 - 20 + 25 &&
            timeOffset > -0.05
          ) {
            this.drawNoteRect(lane.x, y, lane.color);
          }
        }
      });
    });
  }

  private drawNoteRect(x: number, y: number, color: string): void {
    const noteWidth = 30;
    const noteHeight = 20;

    this.ctx.shadowColor = "#000000";
    this.ctx.shadowBlur = 3;
    this.ctx.shadowOffsetX = 1;
    this.ctx.shadowOffsetY = 1;

    this.ctx.fillStyle = color;
    this.ctx.fillRect(
      x - noteWidth / 2,
      y - noteHeight / 2,
      noteWidth,
      noteHeight,
    );

    this.ctx.shadowBlur = 0;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 0;
  }

  private drawScore(): void {
    this.ctx.fillStyle = "#ffffff";
    this.ctx.font = "20px Arial";
    this.ctx.textAlign = "right";
    this.ctx.textBaseline = "top";
    this.ctx.shadowColor = "#000000";
    this.ctx.shadowBlur = 2;

    this.ctx.fillText(`Score: ${this.score}`, this.canvas.width - 20, 20);
    this.ctx.fillText(`Combo: ${this.combo}x`, this.canvas.width - 20, 45);

    this.ctx.shadowBlur = 0;
  }
}
