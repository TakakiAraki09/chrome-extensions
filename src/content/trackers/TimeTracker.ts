import type { TimeMetrics } from "../types";

export interface TimeTrackerInstance {
	updateVisibility: (visible: boolean) => void;
	markActive: () => void;
	markIdle: () => void;
	updateActivity: () => void;
	finalize: () => void;
	getMetrics: () => TimeMetrics;
}

export function createTimeTracker(): TimeTrackerInstance {
	const now = Date.now();
	const metrics: TimeMetrics = {
		startTime: now,
		focusTime: 0,
		idleTime: 0,
		lastActivity: now,
	};
	let isActive = true;
	let isVisible = true;

	const updateVisibility = (visible: boolean) => {
		const now = Date.now();

		if (!visible && isVisible && isActive) {
			metrics.focusTime += now - metrics.lastActivity;
		} else if (visible && !isVisible) {
			metrics.lastActivity = now;
		}

		isVisible = visible;
	};

	const markActive = () => {
		if (!isActive && isVisible) {
			const now = Date.now();
			metrics.idleTime += now - metrics.lastActivity;
			metrics.lastActivity = now;
		}
		isActive = true;
	};

	const markIdle = () => {
		if (isActive && isVisible) {
			const now = Date.now();
			metrics.focusTime += now - metrics.lastActivity;
			metrics.lastActivity = now;
		}
		isActive = false;
	};

	const updateActivity = () => {
		if (isVisible && isActive) {
			metrics.lastActivity = Date.now();
		}
	};

	const finalize = () => {
		const now = Date.now();
		if (isVisible && isActive) {
			metrics.focusTime += now - metrics.lastActivity;
		}
	};

	const getMetrics = (): TimeMetrics => {
		return {
			...metrics,
		};
	};

	return {
		updateVisibility,
		markActive,
		markIdle,
		updateActivity,
		finalize,
		getMetrics,
	};
}
