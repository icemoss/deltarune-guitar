// noinspection JSUnusedGlobalSymbols
export class Logger {
  private keyTimings: Map<string, { press: number; release?: number }[]> =
    new Map();
  private activeKeys: Map<string, number> = new Map();
  private startTime: number = 0;
  private HELD_THRESHOLD: number = 0.1;
  private playbackRate: number = 0.5;

  constructor() {}

  setPlaybackRate(rate: number): void {
    this.playbackRate = rate;
  }

  startRecording(): void {
    this.startTime = Date.now();
    this.keyTimings.clear();
    this.activeKeys.clear();
  }

  handleKeyDown(event: KeyboardEvent): void {
    event.preventDefault();

    const key = event.code;
    const currentTime = this.getCurrentTime();

    if (!this.activeKeys.has(key)) {
      this.activeKeys.set(key, currentTime);

      if (!this.keyTimings.has(key)) {
        this.keyTimings.set(key, []);
      }

      this.keyTimings.get(key)?.push({ press: currentTime });
      console.log(`Key ${key} pressed at ${currentTime.toFixed(3)}s`);
    }
  }

  handleKeyUp(event: KeyboardEvent): void {
    event.preventDefault();

    const key = event.code;
    const currentTime = this.getCurrentTime();

    if (this.activeKeys.has(key)) {
      const pressTime = this.activeKeys.get(key)!;
      const duration = currentTime - pressTime;
      const keyEntries = this.keyTimings.get(key);

      if (keyEntries && keyEntries.length > 0) {
        const lastEntry = keyEntries[keyEntries.length - 1];
        lastEntry.release = currentTime;

        const isHeld = duration >= this.HELD_THRESHOLD;
        console.log(
          `Key ${key} released at ${currentTime.toFixed(3)}s, duration: ${duration.toFixed(3)}s, held: ${isHeld}`,
        );
      }

      this.activeKeys.delete(key);
    }
  }

  private getCurrentTime(): number {
    return ((Date.now() - this.startTime) / 1000) * this.playbackRate;
  }

  exportTimings(): void {
    const formattedTimings: Record<
      string,
      Array<{ press: number; release?: number; held: boolean }>
    > = {};

    this.keyTimings.forEach((timings, key) => {
      formattedTimings[key] = timings.map((timing) => {
        const duration = timing.release ? timing.release - timing.press : 0;
        return {
          press: timing.press,
          release: timing.release,
          held: duration >= this.HELD_THRESHOLD,
        };
      });
    });

    const json = JSON.stringify(formattedTimings, null, 2);
    console.log("Exporting timings:", formattedTimings);

    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "keyTimings.json";
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }
}

// noinspection JSUnusedGlobalSymbols
export class NullLogger implements Partial<Logger> {
  setPlaybackRate(): void {}
  startRecording(): void {}
  handleKeyDown(): void {}
  handleKeyUp(): void {}
  exportTimings(): void {}
}

export function createLogger(enabled: boolean) {
  return enabled ? new Logger() : new NullLogger();
}
