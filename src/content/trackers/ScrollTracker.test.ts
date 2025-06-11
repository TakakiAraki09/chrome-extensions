import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { UI_CONSTANTS } from "../../shared/constants";
import { createScrollTracker } from "./ScrollTracker";

describe("ScrollTracker", () => {
	let onUpdate: ReturnType<typeof vi.fn>;
	let addEventListenerSpy: ReturnType<typeof vi.spyOn>;
	let removeEventListenerSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		onUpdate = vi.fn();
		addEventListenerSpy = vi
			.spyOn(window, "addEventListener")
			.mockImplementation(() => {});
		vi.spyOn(document, "addEventListener").mockImplementation(() => {});
		removeEventListenerSpy = vi
			.spyOn(window, "removeEventListener")
			.mockImplementation(() => {});
		vi.spyOn(document, "removeEventListener").mockImplementation(() => {});

		// Mock window and document properties
		Object.defineProperty(window, "scrollY", {
			value: 0,
			writable: true,
		});
		Object.defineProperty(window, "innerHeight", {
			value: 800,
			writable: true,
		});

		// Mock document height calculations
		Object.defineProperty(document.body, "scrollHeight", {
			value: 2000,
			writable: true,
		});
		Object.defineProperty(document.body, "offsetHeight", {
			value: 2000,
			writable: true,
		});
		Object.defineProperty(document.documentElement, "clientHeight", {
			value: 800,
			writable: true,
		});
		Object.defineProperty(document.documentElement, "scrollHeight", {
			value: 2000,
			writable: true,
		});
		Object.defineProperty(document.documentElement, "offsetHeight", {
			value: 2000,
			writable: true,
		});
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("should attach event listeners", () => {
		createScrollTracker(onUpdate);

		expect(addEventListenerSpy).toHaveBeenCalledWith(
			"scroll",
			expect.any(Function),
			{ passive: true },
		);
		expect(document.addEventListener).toHaveBeenCalledWith("wheel", onUpdate, {
			passive: true,
		});
		expect(document.addEventListener).toHaveBeenCalledWith(
			"touchmove",
			onUpdate,
			{ passive: true },
		);
	});

	it("should calculate initial scroll depth", () => {
		// Set initial scroll position
		Object.defineProperty(window, "scrollY", {
			value: 500,
			writable: true,
		});

		const tracker = createScrollTracker(onUpdate);
		const metrics = tracker.getMetrics();

		// Expected depth: (500 + 800) / 2000 * 100 = 65%
		expect(metrics.depth).toBe(65);
		expect(metrics.maxDepth).toBe(65);
		expect(metrics.totalDistance).toBe(0);
	});

	it("should update metrics on scroll", () => {
		let scrollHandler: (event: Event) => void;

		// Mock addEventListener to capture the scroll handler
		addEventListenerSpy.mockImplementation((event, handler) => {
			if (event === "scroll") {
				scrollHandler = handler;
			}
		});

		const tracker = createScrollTracker(onUpdate);

		// Simulate scroll
		Object.defineProperty(window, "scrollY", {
			value: 600,
			writable: true,
		});

		// Call the captured scroll handler
		if (scrollHandler) {
			if (scrollHandler) scrollHandler();
		}

		const metrics = tracker.getMetrics();

		// Expected depth: (600 + 800) / 2000 * 100 = 70%
		expect(metrics.depth).toBe(70);
		expect(metrics.maxDepth).toBe(70);
		expect(metrics.totalDistance).toBe(600); // Scrolled from 0 to 600
		expect(onUpdate).toHaveBeenCalled();
	});

	it("should track maximum scroll depth", () => {
		let scrollHandler: (event: Event) => void;

		// Mock addEventListener to capture the scroll handler
		addEventListenerSpy.mockImplementation((event, handler) => {
			if (event === "scroll") {
				scrollHandler = handler;
			}
		});

		const tracker = createScrollTracker(onUpdate);

		// Scroll down
		Object.defineProperty(window, "scrollY", {
			value: 1000,
			writable: true,
		});
		if (scrollHandler) scrollHandler();

		let metrics = tracker.getMetrics();
		expect(metrics.maxDepth).toBe(90); // (1000 + 800) / 2000 * 100 = 90%

		// Scroll back up
		Object.defineProperty(window, "scrollY", {
			value: 500,
			writable: true,
		});
		if (scrollHandler) scrollHandler();

		metrics = tracker.getMetrics();
		expect(metrics.depth).toBe(65); // Current depth
		expect(metrics.maxDepth).toBe(90); // Should maintain max depth
	});

	it("should accumulate total scroll distance", () => {
		let scrollHandler: (event: Event) => void;

		// Mock addEventListener to capture the scroll handler
		addEventListenerSpy.mockImplementation((event, handler) => {
			if (event === "scroll") {
				scrollHandler = handler;
			}
		});

		// Create tracker with new mock
		const tracker = createScrollTracker(onUpdate);

		// Scroll down 300px
		Object.defineProperty(window, "scrollY", {
			value: 300,
			writable: true,
		});
		if (scrollHandler) scrollHandler();

		// Scroll up 100px
		Object.defineProperty(window, "scrollY", {
			value: 200,
			writable: true,
		});
		if (scrollHandler) scrollHandler();

		// Scroll down 400px
		Object.defineProperty(window, "scrollY", {
			value: 600,
			writable: true,
		});
		if (scrollHandler) scrollHandler();

		const metrics = tracker.getMetrics();
		expect(metrics.totalDistance).toBe(800); // 300 + 100 + 400
	});

	it("should cap scroll depth at maximum percentage", () => {
		let scrollHandler: (event: Event) => void;

		// Mock addEventListener to capture the scroll handler
		addEventListenerSpy.mockImplementation((event, handler) => {
			if (event === "scroll") {
				scrollHandler = handler;
			}
		});

		// Create tracker with new mock
		const tracker = createScrollTracker(onUpdate);

		// Scroll to bottom and beyond
		Object.defineProperty(window, "scrollY", {
			value: 2000,
			writable: true,
		});
		if (scrollHandler) scrollHandler();

		const metrics = tracker.getMetrics();
		expect(metrics.depth).toBe(UI_CONSTANTS.SCROLL_MAX_PERCENTAGE);
	});

	it("should remove event listeners on destroy", () => {
		const tracker = createScrollTracker(onUpdate);

		tracker.destroy();

		expect(removeEventListenerSpy).toHaveBeenCalledWith(
			"scroll",
			expect.any(Function),
		);
		expect(document.removeEventListener).toHaveBeenCalledWith(
			"wheel",
			onUpdate,
		);
		expect(document.removeEventListener).toHaveBeenCalledWith(
			"touchmove",
			onUpdate,
		);
	});

	it("should return immutable metrics", () => {
		const tracker = createScrollTracker(onUpdate);

		const metrics1 = tracker.getMetrics();
		const metrics2 = tracker.getMetrics();

		expect(metrics1).not.toBe(metrics2); // Different objects
		expect(metrics1).toEqual(metrics2); // Same values

		// Modifying returned metrics should not affect internal state
		metrics1.depth = 999;
		expect(tracker.getMetrics().depth).not.toBe(999);
	});
});
