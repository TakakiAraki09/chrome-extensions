import { beforeEach, describe, expect, it, vi } from "vitest";
import { TIME_CONSTANTS } from "../../shared/constants";
import { createNavigationHandler } from "./NavigationHandler";

describe("NavigationHandler", () => {
	let onNavigation: ReturnType<typeof vi.fn>;
	let addEventListenerSpy: ReturnType<typeof vi.spyOn>;
	let removeEventListenerSpy: ReturnType<typeof vi.spyOn>;
	let mockObserver: {
		observe: ReturnType<typeof vi.fn>;
		disconnect: ReturnType<typeof vi.fn>;
	};
	let originalPushState: typeof history.pushState;
	let originalReplaceState: typeof history.replaceState;

	beforeEach(() => {
		onNavigation = vi.fn();
		addEventListenerSpy = vi.spyOn(window, "addEventListener");
		removeEventListenerSpy = vi.spyOn(window, "removeEventListener");

		// Mock MutationObserver
		mockObserver = {
			observe: vi.fn(),
			disconnect: vi.fn(),
		};
		global.MutationObserver = vi.fn(
			() => mockObserver,
		) as unknown as typeof MutationObserver;

		// Store original history methods
		originalPushState = history.pushState;
		originalReplaceState = history.replaceState;

		// Mock location
		Object.defineProperty(window, "location", {
			value: {
				href: "https://example.com/initial",
			},
			writable: true,
		});

		// Mock document.readyState
		Object.defineProperty(document, "readyState", {
			value: "complete",
			writable: true,
		});

		vi.useFakeTimers();
	});

	afterEach(() => {
		// Restore original history methods
		history.pushState = originalPushState;
		history.replaceState = originalReplaceState;

		vi.useRealTimers();
		vi.clearAllMocks();
	});

	it("should setup event listeners and mutation observer", () => {
		createNavigationHandler(onNavigation);

		expect(addEventListenerSpy).toHaveBeenCalledWith(
			"popstate",
			expect.any(Function),
		);
		expect(mockObserver.observe).toHaveBeenCalledWith(document, {
			childList: true,
			subtree: true,
		});
	});

	it("should intercept history.pushState and call onNavigation after delay", () => {
		createNavigationHandler(onNavigation);

		// Change URL
		Object.defineProperty(window, "location", {
			value: {
				href: "https://example.com/new-page",
			},
			writable: true,
		});

		// Call pushState
		history.pushState({}, "", "/new-page");

		// Should not call immediately
		expect(onNavigation).not.toHaveBeenCalled();

		// Advance timers to trigger the delay
		vi.advanceTimersByTime(TIME_CONSTANTS.NAVIGATION_DELAY);

		expect(onNavigation).toHaveBeenCalledOnce();
	});

	it("should intercept history.replaceState and call onNavigation after delay", () => {
		createNavigationHandler(onNavigation);

		// Change URL
		Object.defineProperty(window, "location", {
			value: {
				href: "https://example.com/replaced-page",
			},
			writable: true,
		});

		// Call replaceState
		history.replaceState({}, "", "/replaced-page");

		// Should not call immediately
		expect(onNavigation).not.toHaveBeenCalled();

		// Advance timers to trigger the delay
		vi.advanceTimersByTime(TIME_CONSTANTS.NAVIGATION_DELAY);

		expect(onNavigation).toHaveBeenCalledOnce();
	});

	it("should handle popstate events", () => {
		createNavigationHandler(onNavigation);

		// Get the popstate handler
		const popstateCall = addEventListenerSpy.mock.calls.find(
			([event]) => event === "popstate",
		);
		const popstateHandler = popstateCall?.[1];

		// Change URL
		Object.defineProperty(window, "location", {
			value: {
				href: "https://example.com/back-page",
			},
			writable: true,
		});

		// Trigger popstate
		popstateHandler();

		expect(onNavigation).toHaveBeenCalledOnce();
	});

	it("should not call onNavigation if URL hasn't changed", () => {
		createNavigationHandler(onNavigation);

		const popstateCall = addEventListenerSpy.mock.calls.find(
			([event]) => event === "popstate",
		);
		const popstateHandler = popstateCall?.[1];

		// Trigger popstate without changing URL
		popstateHandler();

		expect(onNavigation).not.toHaveBeenCalled();
	});

	it("should handle mutation observer changes when document is complete", () => {
		createNavigationHandler(onNavigation);

		// Get the mutation observer callback
		const [mutationCallback] = (
			global.MutationObserver as unknown as ReturnType<typeof vi.fn>
		).mock.calls[0];

		// Change URL
		Object.defineProperty(window, "location", {
			value: {
				href: "https://example.com/mutated-page",
			},
			writable: true,
		});

		// Document is complete
		Object.defineProperty(document, "readyState", {
			value: "complete",
			writable: true,
		});

		// Trigger mutation callback
		mutationCallback([]);

		expect(onNavigation).toHaveBeenCalledOnce();
	});

	it("should not handle mutation observer changes when document is not complete", () => {
		createNavigationHandler(onNavigation);

		const [mutationCallback] = (
			global.MutationObserver as unknown as ReturnType<typeof vi.fn>
		).mock.calls[0];

		// Change URL
		Object.defineProperty(window, "location", {
			value: {
				href: "https://example.com/mutated-page",
			},
			writable: true,
		});

		// Document is not complete
		Object.defineProperty(document, "readyState", {
			value: "loading",
			writable: true,
		});

		// Trigger mutation callback
		mutationCallback([]);

		expect(onNavigation).not.toHaveBeenCalled();
	});

	it("should preserve original history method functionality", () => {
		const pushStateSpy = vi.spyOn(originalPushState, "apply");
		const replaceStateSpy = vi.spyOn(originalReplaceState, "apply");

		createNavigationHandler(onNavigation);

		const state = { test: true };
		const title = "Test Title";
		const url = "/test-url";

		// Test pushState
		history.pushState(state, title, url);
		expect(pushStateSpy).toHaveBeenCalledWith(history, [state, title, url]);

		// Test replaceState
		history.replaceState(state, title, url);
		expect(replaceStateSpy).toHaveBeenCalledWith(history, [state, title, url]);
	});

	it("should remove event listeners and disconnect observer on destroy", () => {
		const handler = createNavigationHandler(onNavigation);

		handler.destroy();

		expect(removeEventListenerSpy).toHaveBeenCalledWith(
			"popstate",
			expect.any(Function),
		);
		expect(mockObserver.disconnect).toHaveBeenCalledOnce();
	});

	it("should handle multiple URL changes correctly", () => {
		createNavigationHandler(onNavigation);

		// First URL change via pushState
		Object.defineProperty(window, "location", {
			value: {
				href: "https://example.com/page1",
			},
			writable: true,
		});
		history.pushState({}, "", "/page1");
		vi.advanceTimersByTime(TIME_CONSTANTS.NAVIGATION_DELAY);

		expect(onNavigation).toHaveBeenCalledTimes(1);

		// Second URL change via popstate
		Object.defineProperty(window, "location", {
			value: {
				href: "https://example.com/page2",
			},
			writable: true,
		});
		const popstateCall = addEventListenerSpy.mock.calls.find(
			([event]) => event === "popstate",
		);
		const popstateHandler = popstateCall?.[1];
		popstateHandler();

		expect(onNavigation).toHaveBeenCalledTimes(2);

		// Third URL change via replaceState
		Object.defineProperty(window, "location", {
			value: {
				href: "https://example.com/page3",
			},
			writable: true,
		});
		history.replaceState({}, "", "/page3");
		vi.advanceTimersByTime(TIME_CONSTANTS.NAVIGATION_DELAY);

		expect(onNavigation).toHaveBeenCalledTimes(3);
	});

	it("should not call onNavigation for rapid identical URL changes", () => {
		createNavigationHandler(onNavigation);

		const popstateCall = addEventListenerSpy.mock.calls.find(
			([event]) => event === "popstate",
		);
		const popstateHandler = popstateCall?.[1];

		// Multiple popstate events without URL change
		popstateHandler();
		popstateHandler();
		popstateHandler();

		expect(onNavigation).not.toHaveBeenCalled();
	});
});
