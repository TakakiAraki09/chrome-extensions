import { beforeEach, describe, expect, it, vi } from "vitest";
import { createIdleTracker } from "./IdleTracker";

describe("IdleTracker", () => {
	let onIdle: ReturnType<typeof vi.fn>;
	let onActive: ReturnType<typeof vi.fn>;
	let addEventListenerSpy: ReturnType<typeof vi.spyOn>;
	let removeEventListenerSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		onIdle = vi.fn();
		onActive = vi.fn();
		addEventListenerSpy = vi.spyOn(document, "addEventListener");
		removeEventListenerSpy = vi.spyOn(document, "removeEventListener");
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.clearAllMocks();
	});

	it("should attach event listeners for all activity events", () => {
		createIdleTracker(5000, onIdle, onActive);

		const expectedEvents = [
			"mousedown",
			"mousemove",
			"keypress",
			"scroll",
			"touchstart",
			"click",
		];

		for (const event of expectedEvents) {
			expect(addEventListenerSpy).toHaveBeenCalledWith(
				event,
				expect.any(Function),
				{ passive: true },
			);
		}
	});

	it("should call onIdle after idle threshold", () => {
		const idleThreshold = 5000;
		createIdleTracker(idleThreshold, onIdle, onActive);

		vi.advanceTimersByTime(idleThreshold);

		expect(onIdle).toHaveBeenCalledOnce();
	});

	it("should call onActive when user activity is detected", () => {
		const tracker = createIdleTracker(5000, onIdle, onActive);

		// Simulate mouse activity
		const mouseHandler = addEventListenerSpy.mock.calls.find(
			([event]) => event === "mousedown",
		)?.[1] as EventListener;

		mouseHandler(new Event("mousedown"));

		expect(onActive).toHaveBeenCalledOnce();
	});

	it("should reset idle timer on activity", () => {
		const idleThreshold = 5000;
		createIdleTracker(idleThreshold, onIdle, onActive);

		// Advance time but not to threshold
		vi.advanceTimersByTime(3000);

		// Simulate activity
		const mouseHandler = addEventListenerSpy.mock.calls.find(
			([event]) => event === "mousedown",
		)?.[1] as EventListener;

		mouseHandler(new Event("mousedown"));

		// Advance time less than threshold again
		vi.advanceTimersByTime(3000);

		// Should not be idle yet
		expect(onIdle).not.toHaveBeenCalled();

		// Advance past threshold
		vi.advanceTimersByTime(2001);

		expect(onIdle).toHaveBeenCalledOnce();
	});

	it("should remove event listeners on destroy", () => {
		const tracker = createIdleTracker(5000, onIdle, onActive);

		tracker.destroy();

		const expectedEvents = [
			"mousedown",
			"mousemove",
			"keypress",
			"scroll",
			"touchstart",
			"click",
		];

		for (const event of expectedEvents) {
			expect(removeEventListenerSpy).toHaveBeenCalledWith(
				event,
				expect.any(Function),
			);
		}
	});

	it("should clear timeout on destroy", () => {
		const tracker = createIdleTracker(5000, onIdle, onActive);

		tracker.destroy();

		// Advance time past threshold
		vi.advanceTimersByTime(6000);

		// Should not call onIdle after destroy
		expect(onIdle).not.toHaveBeenCalled();
	});

	it("should handle multiple activities correctly", () => {
		createIdleTracker(2000, onIdle, onActive);

		const clickHandler = addEventListenerSpy.mock.calls.find(
			([event]) => event === "click",
		)?.[1] as EventListener;

		const scrollHandler = addEventListenerSpy.mock.calls.find(
			([event]) => event === "scroll",
		)?.[1] as EventListener;

		// First activity
		clickHandler(new Event("click"));
		expect(onActive).toHaveBeenCalledTimes(1);

		// Second activity after some time
		vi.advanceTimersByTime(1000);
		scrollHandler(new Event("scroll"));
		expect(onActive).toHaveBeenCalledTimes(2);

		// Should not be idle until threshold is reached
		vi.advanceTimersByTime(1500);
		expect(onIdle).not.toHaveBeenCalled();

		vi.advanceTimersByTime(501);
		expect(onIdle).toHaveBeenCalledOnce();
	});
});
