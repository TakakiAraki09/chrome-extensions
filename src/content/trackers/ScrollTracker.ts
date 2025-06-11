import type { ScrollMetrics } from "../types";

export interface ScrollTrackerInstance {
	getMetrics: () => ScrollMetrics;
	destroy: () => void;
}

export function createScrollTracker(
	onUpdate: () => void,
): ScrollTrackerInstance {
	const metrics: ScrollMetrics = {
		depth: 0,
		maxDepth: 0,
		totalDistance: 0,
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
			100,
			Math.round(((window.scrollY + windowHeight) / documentHeight) * 100),
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
