// noinspection JSUnusedGlobalSymbols
export class Logger {
    constructor() {
        this.keyTimings = new Map();
        this.activeKeys = new Map();
        this.startTime = 0;
        this.HELD_THRESHOLD = 0.1;
        this.playbackRate = 0.5;
    }
    setPlaybackRate(rate) {
        this.playbackRate = rate;
    }
    startRecording() {
        this.startTime = Date.now();
        this.keyTimings.clear();
        this.activeKeys.clear();
    }
    handleKeyDown(event) {
        var _a;
        event.preventDefault();
        const key = event.code;
        const currentTime = this.getCurrentTime();
        if (!this.activeKeys.has(key)) {
            this.activeKeys.set(key, currentTime);
            if (!this.keyTimings.has(key)) {
                this.keyTimings.set(key, []);
            }
            (_a = this.keyTimings.get(key)) === null || _a === void 0 ? void 0 : _a.push({ press: currentTime });
        }
    }
    handleKeyUp(event) {
        event.preventDefault();
        const key = event.code;
        const currentTime = this.getCurrentTime();
        if (this.activeKeys.has(key)) {
            const pressTime = this.activeKeys.get(key);
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
    }
    exportTimings() {
        const formattedTimings = {};
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
    getCurrentTime() {
        return ((Date.now() - this.startTime) / 1000) * this.playbackRate;
    }
}
// noinspection JSUnusedGlobalSymbols
export class NullLogger {
    setPlaybackRate() { }
    startRecording() { }
    handleKeyDown() { }
    handleKeyUp() { }
    exportTimings() { }
}
export function createLogger(enabled) {
    return enabled ? new Logger() : new NullLogger();
}
//# sourceMappingURL=Logger.js.map