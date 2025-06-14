export class KeyVisualizer {
    constructor(canvas) {
        this.canvas = canvas;
        this.keyTimings = null;
        this.startTime = 0;
        this.isPlaying = false;
        this.laneWidth = 40;
        this.targetY = 250;
        this.approachSpeed = 200;
        this.score = 0;
        this.combo = 0;
        this.playbackRate = 1;
        this.keysHeld = new Set();
        this.activeLongNotes = new Map();
        this.hitNotes = new Set();
        this.hitIndicators = [];
        this.keyToLane = {
            ArrowLeft: "left",
            ArrowRight: "right",
            KeyZ: "left",
            KeyX: "right",
        };
        this.keyAliases = {
            KeyZ: "ArrowLeft",
            KeyX: "ArrowRight",
        };
        this.lanes = {};
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
    loadTimings(timingsJson) {
        try {
            this.keyTimings = JSON.parse(timingsJson);
            console.log("Loaded key timings:", this.keyTimings);
        }
        catch (e) {
            console.error("Failed to parse key timings:", e);
        }
    }
    setPlaybackRate(rate) {
        this.playbackRate = rate;
        console.log("KeyVisualizer playback rate set to:", rate);
    }
    start() {
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
    stop() {
        this.isPlaying = false;
        this.keysHeld.clear();
        this.activeLongNotes.clear();
        this.hitIndicators = [];
    }
    renderOverlay() {
        if (!this.isPlaying)
            return;
        const currentTime = ((Date.now() - this.startTime) / 1000) * this.playbackRate;
        this.updateLongNoteHolding(currentTime);
        this.updateHitIndicators(currentTime);
        this.drawNoteLaneOverlay();
        this.drawLanes();
        this.drawNotes(currentTime);
        this.drawHitIndicators(currentTime);
        this.drawTargetLine();
        this.drawScore();
    }
    handleKeyPress(key) {
        if (!this.isPlaying || !this.keyTimings)
            return;
        this.keysHeld.add(key);
        const dataKey = this.keyAliases[key] || key;
        if (!this.keyTimings[dataKey])
            return;
        const currentTime = ((Date.now() - this.startTime) / 1000) * this.playbackRate;
        const laneName = this.keyToLane[key];
        if (!laneName)
            return;
        const timings = this.keyTimings[dataKey];
        let closestNote = null;
        let closestDist = Infinity;
        const timingWindow = 0.2 / this.playbackRate;
        for (const note of timings) {
            if (this.hitNotes.has(note))
                continue;
            const dist = Math.abs(note.press - currentTime);
            if (dist < closestDist && dist < timingWindow) {
                closestDist = dist;
                closestNote = note;
            }
        }
        if (closestNote) {
            let points;
            let quality;
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
            }
            else if (closestDist < adjustedThresholds.great) {
                points = 75;
                quality = "great";
                this.combo++;
                console.log("GREAT!");
            }
            else if (closestDist < adjustedThresholds.good) {
                points = 50;
                quality = "good";
                this.combo++;
                console.log("GOOD!");
            }
            else {
                points = 25;
                quality = "bad";
                this.combo = 0;
                console.log("BAD!");
            }
            this.score += points * (1 + Math.min(this.combo * 0.1, 2));
            // Create hit indicator
            const lane = this.lanes[laneName];
            const noteY = this.targetY -
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
            const isLongNote = closestNote.release && closestNote.release - closestNote.press > 0.2;
            if (isLongNote) {
                if (!this.activeLongNotes.has(dataKey)) {
                    this.activeLongNotes.set(dataKey, []);
                }
                this.activeLongNotes.get(dataKey).push(closestNote);
            }
            this.hitNotes.add(closestNote);
        }
    }
    handleKeyRelease(key) {
        this.keysHeld.delete(key);
    }
    updateHitIndicators(currentTime) {
        // Remove hit indicators that have been visible for too long
        const indicatorLifetime = 0.5; // 0.5 seconds
        this.hitIndicators = this.hitIndicators.filter((indicator) => {
            return currentTime - indicator.hitTime < indicatorLifetime;
        });
    }
    drawHitIndicators(currentTime) {
        this.hitIndicators.forEach((indicator) => {
            const elapsed = currentTime - indicator.hitTime;
            const lifetime = 0.5; // 0.5 seconds
            const progress = elapsed / lifetime;
            if (progress >= 1)
                return; // Skip if expired
            // Calculate fade and movement
            const alpha = 1 - progress;
            const yOffset = -progress * 30; // Move up as it fades
            const scale = 1 + progress * 0.5; // Grow slightly as it fades
            // Get color based on quality
            let baseColor;
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
            this.drawHitNote(indicator.position.x, indicator.position.y + yOffset, baseColor, alpha, scale);
            // Draw quality text
            this.drawHitText(indicator.position.x, indicator.position.y + yOffset - 25, indicator.quality.toUpperCase(), baseColor, alpha);
        });
    }
    drawHitNote(x, y, color, alpha, scale) {
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
        this.ctx.fillRect(x - noteWidth / 2, y - noteHeight / 2, noteWidth, noteHeight);
        // Draw bright border
        this.ctx.strokeStyle = "#FFFFFF";
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x - noteWidth / 2, y - noteHeight / 2, noteWidth, noteHeight);
        this.ctx.restore();
    }
    drawHitText(x, y, text, color, alpha) {
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
    updateLongNoteHolding(currentTime) {
        this.activeLongNotes.forEach((longNotes, dataKey) => {
            const isKeyHeld = Array.from(this.keysHeld).some((heldKey) => {
                const mappedKey = this.keyAliases[heldKey] || heldKey;
                return mappedKey === dataKey;
            });
            longNotes.forEach((note, index) => {
                if (note.release &&
                    currentTime >= note.press &&
                    currentTime <= note.release) {
                    if (isKeyHeld) {
                        this.score += 1;
                    }
                    else {
                        const noteProgress = (currentTime - note.press) / (note.release - note.press);
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
    drawNoteLaneOverlay() {
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
    drawLanes() {
        this.ctx.strokeStyle = "#888888";
        this.ctx.lineWidth = 2;
        const laneEntries = Object.entries(this.lanes);
        for (const [, lane] of laneEntries) {
            this.ctx.beginPath();
            this.ctx.moveTo(lane.x - this.laneWidth / 2, this.targetY - 220);
            this.ctx.lineTo(lane.x - this.laneWidth / 2, this.canvas.height - 100 - 20);
            this.ctx.stroke();
            this.ctx.beginPath();
            this.ctx.moveTo(lane.x + this.laneWidth / 2, this.targetY - 220);
            this.ctx.lineTo(lane.x + this.laneWidth / 2, this.canvas.height - 100 - 20);
            this.ctx.stroke();
        }
    }
    drawTargetLine() {
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
        const laneEntries = Object.entries(this.lanes);
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
                this.ctx.strokeRect(lane.x - rectWidth / 2 - 2, this.targetY - rectHeight / 2 - 2 + yOffset, rectWidth + 4, rectHeight + 4);
                this.ctx.shadowColor = "#000000";
                this.ctx.shadowBlur = 2;
            }
            this.ctx.strokeStyle = lane.color;
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(lane.x - rectWidth / 2, this.targetY - rectHeight / 2 + yOffset, rectWidth, rectHeight);
            this.ctx.strokeStyle = "#ffffff";
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(lane.x - rectWidth / 2 + 2, this.targetY - rectHeight / 2 + 2 + yOffset, rectWidth - 4, rectHeight - 4);
        }
        this.ctx.shadowBlur = 0;
    }
    drawNotes(currentTime) {
        if (!this.keyTimings)
            return;
        const futureWindow = 2 / this.playbackRate;
        const pastWindow = 0.3 / this.playbackRate;
        const timingEntries = Object.entries(this.keyTimings);
        timingEntries.forEach(([key, timings]) => {
            const laneName = this.keyToLane[key];
            if (!laneName)
                return;
            const lane = this.lanes[laneName];
            timings.forEach((timing) => {
                const timeOffset = timing.press - currentTime;
                const isLongNote = timing.release && timing.release - timing.press > 0.2;
                // Draw long note tails
                if (isLongNote && timing.release) {
                    const releaseOffset = timing.release - currentTime;
                    const y = this.targetY - timeOffset * this.approachSpeed * this.playbackRate;
                    const releaseY = this.targetY -
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
                            this.ctx.fillRect(lane.x - 5, clampedTop, 10, clampedBottom - clampedTop);
                        }
                    }
                }
                // Draw note heads (only if not hit)
                if (!this.hitNotes.has(timing) &&
                    timeOffset > -pastWindow &&
                    timeOffset < futureWindow) {
                    const y = this.targetY - timeOffset * this.approachSpeed * this.playbackRate;
                    if (y >= this.targetY - 220 &&
                        y <= this.canvas.height - 100 - 20 + 25 &&
                        timeOffset > -0.05) {
                        this.drawNoteRect(lane.x, y, lane.color);
                    }
                }
            });
        });
    }
    drawNoteRect(x, y, color) {
        const noteWidth = 30;
        const noteHeight = 20;
        this.ctx.shadowColor = "#000000";
        this.ctx.shadowBlur = 3;
        this.ctx.shadowOffsetX = 1;
        this.ctx.shadowOffsetY = 1;
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x - noteWidth / 2, y - noteHeight / 2, noteWidth, noteHeight);
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
    }
    drawScore() {
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
//# sourceMappingURL=KeyVisualiser.js.map