/**
 * AuraPlay Adaptive Difficulty Engine
 *
 * This system uses behavioral calibration metrics to dynamically adjust
 * game difficulty parameters, creating a personalized experience for each child.
 *
 * Metrics collected during Magic Tap calibration:
 * - Motor Control: Jitter (tremor), Pressure, Tap Duration
 * - Cognitive: Response Latency, Inhibition Errors
 * - Visual: Gaze Accuracy, Visual Processing Speed
 */

class AuraAdaptiveSystem {
    constructor(userProfile) {
        this.profile = userProfile || this.getDefaultProfile();
    }

    /**
     * Get default profile if no calibration data exists
     */
    getDefaultProfile() {
        return {
            avgTapDurationMs: 150,
            avgJitterPx: 8,
            avgPressure: 0.6,
            responseLatencyMs: 400,
            inhibitionErrors: 1,
            gazeAccuracyPx: 30,
            visualProcessingSpeed: "Medium"
        };
    }

    /**
     * Load profile from localStorage or in-memory storage
     */
    static loadFromStorage() {
        // Try to load from localStorage first
        try {
            const stored = localStorage.getItem('auraCalibrationProfile');
            if (stored) {
                return new AuraAdaptiveSystem(JSON.parse(stored));
            }
        } catch (e) {
            console.log('LocalStorage not available, checking in-memory storage');
        }

        // Fallback to in-memory storage (if available from index.html)
        if (typeof inMemoryStorage !== 'undefined' && inMemoryStorage.magicTapCalibration) {
            const calibration = inMemoryStorage.magicTapCalibration;
            const profile = {
                avgTapDurationMs: calibration.avgTapDuration || 150,
                avgJitterPx: calibration.avgJitter || 8,
                avgPressure: calibration.avgPressure || 0.6,
                responseLatencyMs: calibration.avgResponseTime || 400,
                inhibitionErrors: calibration.inhibitionErrors || 1,
                gazeAccuracyPx: calibration.gazeAccuracy || 30,
                visualProcessingSpeed: calibration.visualProcessingSpeed || "Medium"
            };
            return new AuraAdaptiveSystem(profile);
        }

        // Return default profile
        return new AuraAdaptiveSystem();
    }

    /**
     * Save profile to localStorage
     */
    save() {
        try {
            localStorage.setItem('auraCalibrationProfile', JSON.stringify(this.profile));
        } catch (e) {
            console.log('Could not save to localStorage:', e);
        }
    }

    /**
     * GAME 1: Water Park Focus Float (rainbow-reach.html)
     * Focus: Aiming and Sustained Attention
     *
     * Adaptations:
     * - Jitter → Target Size (shaky hands need larger targets)
     * - Response Latency → Target Movement Speed (slow processing needs slower targets)
     * - Inhibition Errors → Distraction Level (impulsive kids need less visual noise)
     */
    getWaterParkSettings() {
        const settings = {
            targetSize: 50,         // Base radius in px
            waterStreamSpeed: 10,   // Projectile speed
            targetMovementSpeed: 2, // How fast targets move
            distractionLevel: 'Low', // Visual noise (None, Low, Medium, High)
            gameSpeed: 1.0          // Overall game speed multiplier
        };

        // 1. Motor Stability (Jitter) → Target Size
        // High jitter (tremor) increases target size to reduce frustration
        if (this.profile.avgJitterPx > 10) {
            settings.targetSize += (this.profile.avgJitterPx - 10) * 2;
            console.log(`[Adaptive] High jitter detected (${this.profile.avgJitterPx}px). Target size increased to ${settings.targetSize}px`);
        }

        // 2. Response Latency → Target Movement Speed
        // Slow processing (> 500ms) slows down targets
        if (this.profile.responseLatencyMs > 500) {
            const slowdownFactor = Math.min(0.6, 500 / this.profile.responseLatencyMs);
            settings.targetMovementSpeed *= slowdownFactor;
            settings.gameSpeed = slowdownFactor;
            console.log(`[Adaptive] Slow response time (${this.profile.responseLatencyMs}ms). Game speed reduced to ${settings.gameSpeed.toFixed(2)}x`);
        }

        // 3. Inhibition Errors → Distractions
        // High impulsivity reduces background distractions
        if (this.profile.inhibitionErrors > 3) {
            settings.distractionLevel = 'None';
            console.log(`[Adaptive] High inhibition errors (${this.profile.inhibitionErrors}). Distractions removed`);
        } else if (this.profile.inhibitionErrors > 1) {
            settings.distractionLevel = 'Low';
        }

        return settings;
    }

    /**
     * GAME 2: Maze Stillness (maze-stillness.html)
     * Focus: Motor Inhibition and Steadiness
     *
     * Adaptations:
     * - Jitter → Path Width (tremor needs wider corridors)
     * - Tap Duration → Stop Signal Duration (impulsive needs shorter freezes)
     * - Pressure → Tremor Tolerance (high muscle tone needs more tolerance)
     */
    getMazeSettings() {
        const settings = {
            pathWidth: 60,          // Width of the maze corridor in px
            tremorTolerance: 5,     // Allowed movement during "STOP" in px
            stopSignalDuration: 2000, // How long to freeze in ms
            mazeComplexity: 'Medium' // Simple, Medium, Complex
        };

        // 1. Jitter → Path Width
        // High jitter requires wider paths to prevent constant collisions
        if (this.profile.avgJitterPx > 5) {
            settings.pathWidth += this.profile.avgJitterPx * 3;
            console.log(`[Adaptive] Jitter detected (${this.profile.avgJitterPx}px). Maze path widened to ${settings.pathWidth}px`);
        }

        // 2. Inhibition (Tap Duration) → Stop Signal Duration
        // Short tap duration (< 100ms) indicates impulsivity
        // Shorten the freeze requirement to build confidence first
        if (this.profile.avgTapDurationMs < 100) {
            settings.stopSignalDuration = 1500; // Shorten to 1.5s
            console.log(`[Adaptive] Impulsive tapping detected (${this.profile.avgTapDurationMs}ms). Stop duration reduced to 1.5s`);
        } else if (this.profile.avgTapDurationMs > 300) {
            // Very deliberate tappers might handle longer stops
            settings.stopSignalDuration = 2500;
        }

        // 3. Pressure → Tremor Tolerance
        // High pressure indicates high muscle tone, increase tolerance for micro-movements
        if (this.profile.avgPressure > 0.7) {
            settings.tremorTolerance += 5;
            console.log(`[Adaptive] High pressure detected (${this.profile.avgPressure}). Tremor tolerance increased to ${settings.tremorTolerance}px`);
        }

        return settings;
    }

    /**
     * GAME 3: Fruit Ninja (fruit-ninja.html)
     * Focus: Impulse Control (Go/No-Go) and Reaction Time
     *
     * Adaptations:
     * - Response Latency → Gravity (slower reactions need "floatier" objects)
     * - Inhibition Errors → Bomb Visual Distinctness (impulsive kids need clearer "NO" signals)
     * - Tap Duration → Combo Window (impulsive vs deliberate timing)
     */
    getFruitNinjaSettings() {
        const settings = {
            gravity: 0.5,           // Fall speed (lower = floatier)
            bombProbability: 0.2,   // Chance of a bomb (No-Go stimulus)
            bombVisualDistinctness: 1.0, // 1.0 = Normal, 1.5 = Extra bright/large
            comboWindowMs: 300,     // Time window to chain hits
            spawnRate: 1000         // How often new objects spawn (ms)
        };

        // 1. Response Latency → Gravity
        // Slower reactions need more time to process
        if (this.profile.responseLatencyMs > 600) {
            settings.gravity = 0.3;
            settings.spawnRate = 1200; // Slower spawn
            console.log(`[Adaptive] Slow reaction time (${this.profile.responseLatencyMs}ms). Gravity reduced, spawn rate slowed`);
        } else if (this.profile.responseLatencyMs < 300) {
            // Fast reactions can handle faster gameplay
            settings.gravity = 0.7;
            settings.spawnRate = 800;
        }

        // 2. Inhibition Errors → Bomb Distinctness & Probability
        // If child hits bombs often (low inhibition), make them more obvious
        if (this.profile.inhibitionErrors > 2) {
            settings.bombVisualDistinctness = 1.5;
            settings.bombProbability = 0.15; // Slightly fewer bombs
            console.log(`[Adaptive] High inhibition errors (${this.profile.inhibitionErrors}). Bombs more distinct, probability reduced`);
        } else if (this.profile.inhibitionErrors === 0) {
            // Great inhibition control, can handle more challenge
            settings.bombProbability = 0.25;
        }

        // 3. Tap Duration → Combo Window
        // Impulsive tappers get shorter combo windows
        if (this.profile.avgTapDurationMs < 100) {
            settings.comboWindowMs = 200;
        } else if (this.profile.avgTapDurationMs > 300) {
            settings.comboWindowMs = 400;
        }

        return settings;
    }

    /**
     * GAME 4: Catch the Fly (catch-the-fly.html)
     * Focus: Eye Tracking and Visual Attention
     *
     * Adaptations:
     * - Gaze Accuracy → Assist Radius (loose eye tracking needs "magnet" effect)
     * - Visual Processing Speed → Fly Speed & Size
     * - Response Latency → Fly Movement Patterns
     */
    getCatchTheFlySettings() {
        const settings = {
            flySize: 40,            // px
            flySpeed: 5,            // movement speed (pixels per frame)
            gazeAssistRadius: 30,   // "Magnet" effect for eye tracking in px
            flyMovementPattern: 'Smooth', // Smooth, Erratic, Predictable
            multiplyFlies: 1        // Number of flies (1-3)
        };

        // 1. Gaze Accuracy → Assist Radius
        // Poor eye tracking calibration needs larger "hit" zone
        if (this.profile.gazeAccuracyPx > 30) {
            settings.gazeAssistRadius = this.profile.gazeAccuracyPx * 1.2;
            console.log(`[Adaptive] Low gaze accuracy (${this.profile.gazeAccuracyPx}px). Assist radius increased to ${settings.gazeAssistRadius.toFixed(1)}px`);
        } else if (this.profile.gazeAccuracyPx < 15) {
            // Excellent gaze accuracy can handle smaller zones
            settings.gazeAssistRadius = 20;
        }

        // 2. Visual Processing Speed → Fly Speed & Size
        // Slow visual search needs bigger, slower flies
        if (this.profile.responseLatencyMs > 500 || this.profile.visualProcessingSpeed === 'Slow') {
            settings.flySpeed = 3;
            settings.flySize = 60;
            settings.flyMovementPattern = 'Predictable';
            console.log(`[Adaptive] Slow visual processing. Flies larger (${settings.flySize}px) and slower (${settings.flySpeed}px/frame)`);
        } else if (this.profile.responseLatencyMs < 300 || this.profile.visualProcessingSpeed === 'Fast') {
            // Fast processing can handle challenge
            settings.flySpeed = 7;
            settings.flySize = 30;
            settings.flyMovementPattern = 'Erratic';
        }

        // 3. Advanced users get multiple flies
        if (this.profile.gazeAccuracyPx < 20 && this.profile.responseLatencyMs < 400) {
            settings.multiplyFlies = 2;
            console.log(`[Adaptive] High skill detected. Multiple flies enabled`);
        }

        return settings;
    }

    /**
     * Get a summary of the user's profile for display
     */
    getProfileSummary() {
        return {
            motorStability: this.profile.avgJitterPx < 8 ? 'Excellent' : this.profile.avgJitterPx < 15 ? 'Good' : 'Needs Support',
            responseSpeed: this.profile.responseLatencyMs < 350 ? 'Fast' : this.profile.responseLatencyMs < 550 ? 'Average' : 'Slow',
            impulseControl: this.profile.inhibitionErrors === 0 ? 'Excellent' : this.profile.inhibitionErrors < 2 ? 'Good' : 'Developing',
            visualTracking: this.profile.gazeAccuracyPx < 25 ? 'Excellent' : this.profile.gazeAccuracyPx < 40 ? 'Good' : 'Needs Support',
            rawData: this.profile
        };
    }

    /**
     * Generate a difficulty report
     */
    generateAdaptationReport() {
        const waterPark = this.getWaterParkSettings();
        const maze = this.getMazeSettings();
        const fruitNinja = this.getFruitNinjaSettings();
        const catchFly = this.getCatchTheFlySettings();

        return {
            profileSummary: this.getProfileSummary(),
            gameSettings: {
                waterPark,
                maze,
                fruitNinja,
                catchFly
            },
            timestamp: new Date().toISOString()
        };
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuraAdaptiveSystem;
}
