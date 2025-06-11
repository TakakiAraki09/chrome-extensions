import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createVisibilityTracker } from "./VisibilityTracker";

describe("VisibilityTracker", () => {
	let onVisible: ReturnType<typeof vi.fn>;
	let onHidden: ReturnType<typeof vi.fn>;
	let documentAddEventListenerSpy: ReturnType<typeof vi.spyOn>;
	let windowAddEventListenerSpy: ReturnType<typeof vi.spyOn>;
	let documentRemoveEventListenerSpy: ReturnType<typeof vi.spyOn>;
	let windowRemoveEventListenerSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		onVisible = vi.fn();
		onHidden = vi.fn();

		documentAddEventListenerSpy = vi.spyOn(document, "addEventListener");
		windowAddEventListenerSpy = vi.spyOn(window, "addEventListener");
		documentRemoveEventListenerSpy = vi.spyOn(document, "removeEventListener");
		windowRemoveEventListenerSpy = vi.spyOn(window, "removeEventListener");

		// Mock document.hidden property
		Object.defineProperty(document, "hidden", {
			value: false,
			writable: true,
		});
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("should attach event listeners", () => {
		createVisibilityTracker(onVisible, onHidden);

		expect(documentAddEventListenerSpy).toHaveBeenCalledWith(
			"visibilitychange",
			expect.any(Function),
		);
		expect(windowAddEventListenerSpy).toHaveBeenCalledWith(
			"focus",
			expect.any(Function),
		);
		expect(windowAddEventListenerSpy).toHaveBeenCalledWith(
			"blur",
			expect.any(Function),
		);
	});

	it("should initialize as visible", () => {
		const tracker = createVisibilityTracker(onVisible, onHidden);

		expect(tracker.getIsVisible()).toBe(true);
		expect(onVisible).not.toHaveBeenCalled();
		expect(onHidden).not.toHaveBeenCalled();
	});

	describe("visibility change events", () => {
		it("should call onHidden when document becomes hidden", () => {
			createVisibilityTracker(onVisible, onHidden);

			// Get the visibility change handler
			const visibilityCall = documentAddEventListenerSpy.mock.calls.find(
				([event]) => event === "visibilitychange",
			);
			expect(visibilityCall).toBeDefined();
			const visibilityHandler = visibilityCall?.[1] as () => void;

			// Simulate document becoming hidden
			Object.defineProperty(document, "hidden", {
				value: true,
				writable: true,
			});

			visibilityHandler();

			expect(onHidden).toHaveBeenCalledOnce();
			expect(onVisible).not.toHaveBeenCalled();
		});

		it("should call onVisible when document becomes visible", () => {
			const tracker = createVisibilityTracker(onVisible, onHidden);

			// Get the visibility change handler
			const visibilityCall = documentAddEventListenerSpy.mock.calls.find(
				([event]) => event === "visibilitychange",
			);
			expect(visibilityCall).toBeDefined();
			const visibilityHandler = visibilityCall?.[1] as () => void;

			// First make document hidden
			Object.defineProperty(document, "hidden", {
				value: true,
				writable: true,
			});
			visibilityHandler();

			// Reset mocks
			vi.clearAllMocks();

			// Then make it visible again
			Object.defineProperty(document, "hidden", {
				value: false,
				writable: true,
			});
			visibilityHandler();

			expect(onVisible).toHaveBeenCalledOnce();
			expect(onHidden).not.toHaveBeenCalled();
			expect(tracker.getIsVisible()).toBe(true);
		});

		it("should not call callbacks if visibility state doesn't change", () => {
			createVisibilityTracker(onVisible, onHidden);

			const visibilityCall = documentAddEventListenerSpy.mock.calls.find(
				([event]) => event === "visibilitychange",
			);
			expect(visibilityCall).toBeDefined();
			const visibilityHandler = visibilityCall?.[1] as () => void;

			// Document is already not hidden, simulate same state
			Object.defineProperty(document, "hidden", {
				value: false,
				writable: true,
			});

			visibilityHandler();

			expect(onVisible).not.toHaveBeenCalled();
			expect(onHidden).not.toHaveBeenCalled();
		});
	});

	describe("focus events", () => {
		it("should call onVisible when window gains focus", () => {
			const tracker = createVisibilityTracker(onVisible, onHidden);

			// Get handlers before doing anything
			const visibilityCall = documentAddEventListenerSpy.mock.calls.find(
				([event]) => event === "visibilitychange",
			);
			expect(visibilityCall).toBeDefined();
			const visibilityHandler = visibilityCall?.[1] as () => void;

			const focusCall = windowAddEventListenerSpy.mock.calls.find(
				([event]) => event === "focus",
			);
			expect(focusCall).toBeDefined();
			const focusHandler = focusCall?.[1] as () => void;

			// First hide the tracker
			Object.defineProperty(document, "hidden", {
				value: true,
				writable: true,
			});
			visibilityHandler();

			// Reset mocks
			vi.clearAllMocks();

			// Trigger focus handler
			focusHandler();

			expect(onVisible).toHaveBeenCalledOnce();
			expect(tracker.getIsVisible()).toBe(true);
		});

		it("should not call onVisible if already visible on focus", () => {
			createVisibilityTracker(onVisible, onHidden);

			const focusCall = windowAddEventListenerSpy.mock.calls.find(
				([event]) => event === "focus",
			);
			expect(focusCall).toBeDefined();
			const focusHandler = focusCall?.[1] as () => void;

			focusHandler();

			expect(onVisible).not.toHaveBeenCalled();
		});
	});

	describe("blur events", () => {
		it("should call onHidden when window loses focus", () => {
			const tracker = createVisibilityTracker(onVisible, onHidden);

			const blurCall = windowAddEventListenerSpy.mock.calls.find(
				([event]) => event === "blur",
			);
			expect(blurCall).toBeDefined();
			const blurHandler = blurCall?.[1] as () => void;

			blurHandler();

			expect(onHidden).toHaveBeenCalledOnce();
			expect(tracker.getIsVisible()).toBe(false);
		});

		it("should not call onHidden if already hidden on blur", () => {
			const tracker = createVisibilityTracker(onVisible, onHidden);

			// First blur to make hidden
			const blurCall = windowAddEventListenerSpy.mock.calls.find(
				([event]) => event === "blur",
			);
			expect(blurCall).toBeDefined();
			const blurHandler = blurCall?.[1] as () => void;

			blurHandler();

			// Reset mocks
			vi.clearAllMocks();

			// Blur again
			blurHandler();

			expect(onHidden).not.toHaveBeenCalled();
			expect(tracker.getIsVisible()).toBe(false);
		});
	});

	describe("event listener cleanup", () => {
		it("should remove event listeners on destroy", () => {
			const tracker = createVisibilityTracker(onVisible, onHidden);

			tracker.destroy();

			expect(documentRemoveEventListenerSpy).toHaveBeenCalledWith(
				"visibilitychange",
				expect.any(Function),
			);
			expect(windowRemoveEventListenerSpy).toHaveBeenCalledWith(
				"focus",
				expect.any(Function),
			);
			expect(windowRemoveEventListenerSpy).toHaveBeenCalledWith(
				"blur",
				expect.any(Function),
			);
		});
	});

	describe("complex state changes", () => {
		it("should handle rapid state changes correctly", () => {
			const tracker = createVisibilityTracker(onVisible, onHidden);

			const blurCall = windowAddEventListenerSpy.mock.calls.find(
				([event]) => event === "blur",
			);
			expect(blurCall).toBeDefined();
			const blurHandler = blurCall?.[1] as () => void;

			const focusCall = windowAddEventListenerSpy.mock.calls.find(
				([event]) => event === "focus",
			);
			expect(focusCall).toBeDefined();
			const focusHandler = focusCall?.[1] as () => void;

			// Blur -> Focus -> Blur
			blurHandler();
			expect(onHidden).toHaveBeenCalledTimes(1);
			expect(tracker.getIsVisible()).toBe(false);

			focusHandler();
			expect(onVisible).toHaveBeenCalledTimes(1);
			expect(tracker.getIsVisible()).toBe(true);

			blurHandler();
			expect(onHidden).toHaveBeenCalledTimes(2);
			expect(tracker.getIsVisible()).toBe(false);
		});

		it("should prioritize focus/blur over visibility change", () => {
			const tracker = createVisibilityTracker(onVisible, onHidden);

			const visibilityCall = documentAddEventListenerSpy.mock.calls.find(
				([event]) => event === "visibilitychange",
			);
			expect(visibilityCall).toBeDefined();
			const visibilityHandler = visibilityCall?.[1] as () => void;

			const focusCall = windowAddEventListenerSpy.mock.calls.find(
				([event]) => event === "focus",
			);
			expect(focusCall).toBeDefined();
			const focusHandler = focusCall?.[1] as () => void;

			// Hide via visibility change
			Object.defineProperty(document, "hidden", {
				value: true,
				writable: true,
			});
			visibilityHandler();

			expect(tracker.getIsVisible()).toBe(false);

			// Show via focus (even though document.hidden is still true)
			focusHandler();

			expect(tracker.getIsVisible()).toBe(true);
			expect(onVisible).toHaveBeenCalledOnce();
		});
	});
});
