export interface IdleTrackerInstance {
	destroy: () => void;
}

export function createIdleTracker(
	idleThreshold: number,
	onIdle: () => void,
	onActive: () => void,
): IdleTrackerInstance {
	let idleTimer: number | undefined;

	const events = [
		"mousedown",
		"mousemove",
		"keypress",
		"scroll",
		"touchstart",
		"click",
	];

	const handleActivity = () => {
		onActive();
		resetIdleTimer();
	};

	const resetIdleTimer = () => {
		if (idleTimer) {
			clearTimeout(idleTimer);
		}

		idleTimer = window.setTimeout(() => {
			onIdle();
		}, idleThreshold);
	};

	const attachEventListeners = () => {
		for (const event of events) {
			document.addEventListener(event, handleActivity, {
				passive: true,
			});
		}
	};

	const destroy = () => {
		if (idleTimer) {
			clearTimeout(idleTimer);
		}

		for (const event of events) {
			document.removeEventListener(event, handleActivity);
		}
	};

	attachEventListeners();
	resetIdleTimer();

	return {
		destroy,
	};
}
