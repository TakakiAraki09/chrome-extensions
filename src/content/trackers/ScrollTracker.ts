import { INITIAL_VALUES, UI_CONSTANTS } from "../../shared/constants";
import type { ScrollMetrics } from "../types";

export interface ScrollTrackerInstance {
	getMetrics: () => ScrollMetrics;
	destroy: () => void;
}

export function createScrollTracker(
	onUpdate: () => void,
): ScrollTrackerInstance {
	const metrics: ScrollMetrics = {
		depth: INITIAL_VALUES.ZERO,
		maxDepth: INITIAL_VALUES.ZERO,
		totalDistance: INITIAL_VALUES.ZERO,
	};
	let lastScrollY = window.scrollY;

	const calculateScrollDepth = (): number => {
		const windowHeight = window.innerHeight;
		const documentHeight = Math.max(
			document.body.scrollHeight,
			document.body.offsetHeight,
			document.documentElement.clientHeight,
			document.documentElement.scrollHeight,
			document.documentElement.offsetHeight,
		);

		return Math.min(
			UI_CONSTANTS.SCROLL_MAX_PERCENTAGE,
			Math.round(
				((window.scrollY + windowHeight) / documentHeight) *
					UI_CONSTANTS.PERCENTAGE_MULTIPLIER,
			),
		);
	};

	const calculateInitialDepth = () => {
		metrics.depth = calculateScrollDepth();
		metrics.maxDepth = metrics.depth;
	};

	const handleScroll = () => {
		const currentScrollY = window.scrollY;
		const scrollDistance = Math.abs(currentScrollY - lastScrollY);

		metrics.totalDistance += scrollDistance;

		const scrollDepth = calculateScrollDepth();
		metrics.depth = scrollDepth;
		metrics.maxDepth = Math.max(metrics.maxDepth, scrollDepth);

		onUpdate();
		lastScrollY = currentScrollY;
	};

	const attachEventListeners = () => {
		window.addEventListener("scroll", handleScroll, {
			passive: true,
		});
		document.addEventListener("wheel", onUpdate, {
			passive: true,
		});
		document.addEventListener("touchmove", onUpdate, {
			passive: true,
		});
	};

	const getMetrics = (): ScrollMetrics => {
		return {
			...metrics,
		};
	};

	const destroy = () => {
		window.removeEventListener("scroll", handleScroll);
		document.removeEventListener("wheel", onUpdate);
		document.removeEventListener("touchmove", onUpdate);
	};

	attachEventListeners();
	calculateInitialDepth();

	return {
		getMetrics,
		destroy,
	};
}
