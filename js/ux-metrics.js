/**
 * UX Metrics Tracker
 * Tracks: task_time, click_count, rage_clicks, backtracks, form_errors, hover_time
 * 
 * backtracks  = Number of Backspace key presses during form filling
 * form_errors = Incremented when Save is clicked with incomplete/invalid fields
 * 
 * On Cancel / Close (X): all metrics reset to 0
 */

class UXMetricsTracker {
    constructor() {
        this.reset();
        this._boundClickHandler = this._handleClick.bind(this);
        this._boundKeydownHandler = this._handleKeydown.bind(this);
        this._lastClickTime = 0;
        this._lastClickX = 0;
        this._lastClickY = 0;
        this._rageClickThreshold = 500; // ms between clicks to count as rage
        this._rageClickDistance = 50;   // px radius for rage click detection
        this._consecutiveRapidClicks = 0;
        this._isTracking = false;
    }

    reset() {
        this.metrics = {
            task_time: 0,
            click_count: 0,
            rage_clicks: 0,
            backtracks: 0,
            form_errors: 0,
            hover_time: 0
        };
        this._startTime = null;
        this._hoverStartTime = null;
        this._consecutiveRapidClicks = 0;
        this._lastClickTime = 0;
    }

    /** Start tracking a new task (called when form opens) */
    startTracking() {
        this.reset();
        this._startTime = Date.now();
        this._isTracking = true;

        // Track all clicks inside the modal
        document.addEventListener('click', this._boundClickHandler, true);

        // Track backspace key presses (backtracks)
        document.addEventListener('keydown', this._boundKeydownHandler, true);
    }

    /** Stop tracking and return final metrics (called on successful save) */
    stopTracking() {
        if (this._startTime) {
            this.metrics.task_time = Math.round((Date.now() - this._startTime) / 1000);
        }

        this._removeListeners();
        this._isTracking = false;

        return { ...this.metrics };
    }

    /** Cancel tracking — reset everything to 0 (called on Close X / Cancel) */
    cancelTracking() {
        this._removeListeners();
        this._isTracking = false;
        this.reset();

        return { ...this.metrics }; // all zeros
    }

    /** Remove all event listeners */
    _removeListeners() {
        document.removeEventListener('click', this._boundClickHandler, true);
        document.removeEventListener('keydown', this._boundKeydownHandler, true);
    }

    /** Record a form validation error (Save clicked with missing fields) */
    recordFormError() {
        this.metrics.form_errors++;
    }

    /** Start hover timer (called on mouseenter of save button) */
    startHoverTimer() {
        this._hoverStartTime = Date.now();
    }

    /** Stop hover timer and accumulate (called on mouseleave or click of save button) */
    stopHoverTimer() {
        if (this._hoverStartTime) {
            const elapsed = (Date.now() - this._hoverStartTime) / 1000;
            this.metrics.hover_time = Math.round((this.metrics.hover_time + elapsed) * 10) / 10;
            this._hoverStartTime = null;
        }
    }

    /** Internal: handle click events */
    _handleClick(e) {
        this.metrics.click_count++;

        const now = Date.now();
        const timeDiff = now - this._lastClickTime;
        const dx = Math.abs(e.clientX - this._lastClickX);
        const dy = Math.abs(e.clientY - this._lastClickY);
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Rage click detection: rapid clicks in same area
        if (timeDiff < this._rageClickThreshold && dist < this._rageClickDistance) {
            this._consecutiveRapidClicks++;
            if (this._consecutiveRapidClicks >= 2) {
                this.metrics.rage_clicks++;
            }
        } else {
            this._consecutiveRapidClicks = 0;
        }

        this._lastClickTime = now;
        this._lastClickX = e.clientX;
        this._lastClickY = e.clientY;
    }

    /** Internal: handle keydown — count Backspace presses as backtracks */
    _handleKeydown(e) {
        if (e.key === 'Backspace') {
            this.metrics.backtracks++;
        }
    }
}

// Global instance
const uxTracker = new UXMetricsTracker();
