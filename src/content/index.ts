import { INITIAL_VALUES, TIME_CONSTANTS } from "../shared/constants";
import { sendMessage } from "../shared/messages";
import { createIdleTracker } from "./trackers/IdleTracker";
import { createScrollTracker } from "./trackers/ScrollTracker";
import { createTimeTracker } from "./trackers/TimeTracker";
import { createVisibilityTracker } from "./trackers/VisibilityTracker";
import type { BrowsingActivity } from "./types";

interface BrowsingTrackerInstance {
	destroy: () => void;
}

function createBrowsingTracker(): BrowsingTrackerInstance {
	let activity: BrowsingActivity = createInitialActivity();
	let saveTimer: number | undefined;

	const timeTracker = createTimeTracker();

	const onUserActivity = () => {
		timeTracker.updateActivity();
	};

	const onVisible = () => {
		timeTracker.updateVisibility(true);
	};

	const onHidden = () => {
		timeTracker.updateVisibility(false);
	};

	const onIdle = () => {
		timeTracker.markIdle();
	};

	const onActive = () => {
		timeTracker.markActive();
	};

	const scrollTracker = createScrollTracker(onUserActivity);
	const visibilityTracker = createVisibilityTracker(onVisible, onHidden);
	const idleTracker = createIdleTracker(
		TIME_CONSTANTS.IDLE_THRESHOLD,
		onIdle,
		onActive,
	);

	function createInitialActivity(): BrowsingActivity {
		return {
			url: window.location.href,
			title: document.title,
			domain: window.location.hostname,
			startTime: Date.now(),
			scrollDepth: INITIAL_VALUES.ZERO,
			maxScrollDepth: INITIAL_VALUES.ZERO,
			totalScrollDistance: INITIAL_VALUES.ZERO,
			focusTime: INITIAL_VALUES.ZERO,
			idleTime: INITIAL_VALUES.ZERO,
		};
	}

	const saveCurrentActivity = () => {
		timeTracker.finalize();
		const scrollMetrics = scrollTracker.getMetrics();
		const timeMetrics = timeTracker.getMetrics();

		activity = {
			...activity,
			scrollDepth: scrollMetrics.depth,
			maxScrollDepth: scrollMetrics.maxDepth,
			totalScrollDistance: scrollMetrics.totalDistance,
			focusTime: timeMetrics.focusTime,
			idleTime: timeMetrics.idleTime,
		};

		sendMessage({
			action: "saveBrowsingActivity",
			data: activity,
		});
	};

	const startPeriodicSave = () => {
		saveTimer = window.setInterval(() => {
			saveCurrentActivity();
		}, TIME_CONSTANTS.SAVE_INTERVAL);
	};

	const destroy = () => {
		if (saveTimer) {
			clearInterval(saveTimer);
		}

		scrollTracker.destroy();
		visibilityTracker.destroy();
		idleTracker.destroy();

		activity.endTime = Date.now();
		saveCurrentActivity();
	};

	startPeriodicSave();

	return {
		destroy,
	};
}

import { createNavigationHandler } from "./utils/NavigationHandler";

interface TrackerManagerInstance {
	destroy: () => void;
}

function createTrackerManager(): TrackerManagerInstance {
	let tracker: BrowsingTrackerInstance | null = null;

	const initTracker = () => {
		if (tracker) {
			tracker.destroy();
		}
		tracker = createBrowsingTracker();
	};

	const cleanup = () => {
		if (tracker) {
			tracker.destroy();
		}
	};

	const handleMessage = (
		request: {
			action: string;
		},
		sender: chrome.runtime.MessageSender,
		sendResponse: (response?: unknown) => void,
	) => {
		if (request.action === "buttonClicked") {
			console.log("Button was clicked in popup");
			flashBackground();
		}
	};

	const flashBackground = () => {
		const originalColor = document.body.style.backgroundColor;
		document.body.style.backgroundColor = "#f0f0f0";
		setTimeout(() => {
			document.body.style.backgroundColor = originalColor;
		}, TIME_CONSTANTS.UI_FLASH_DURATION);
	};

	const setupEventListeners = () => {
		window.addEventListener("beforeunload", () => cleanup());
		chrome.runtime.onMessage.addListener(handleMessage);
	};

	const navigationHandler = createNavigationHandler(initTracker);

	const init = () => {
		setupEventListeners();

		if (document.readyState === "loading") {
			document.addEventListener("DOMContentLoaded", () => initTracker());
		} else {
			initTracker();
		}
	};

	const destroy = () => {
		cleanup();
		navigationHandler.destroy();
	};

	init();

	return {
		destroy,
	};
}

const trackerManager = createTrackerManager();
