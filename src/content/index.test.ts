import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MockedFunction } from "vitest";
import { TIME_CONSTANTS } from "../shared/constants";

// Create a mock chrome API
const createMockChromeApi = () => ({
	runtime: {
		sendMessage: vi.fn(),
		onMessage: {
			addListener: vi.fn(),
		},
	},
	tabs: {
		query: vi.fn(),
	},
});

// Mock all dependencies
vi.mock("../shared/messages", () => ({
	sendMessage: vi.fn(),
}));

vi.mock("./trackers/IdleTracker", () => ({
	createIdleTracker: vi.fn(() => ({
		destroy: vi.fn(),
	})),
}));

vi.mock("./trackers/ScrollTracker", () => ({
	createScrollTracker: vi.fn(() => ({
		destroy: vi.fn(),
		getMetrics: vi.fn(() => ({
			depth: 50,
			maxDepth: 100,
			totalDistance: 500,
		})),
	})),
}));

vi.mock("./trackers/TimeTracker", () => ({
	createTimeTracker: vi.fn(() => ({
		updateActivity: vi.fn(),
		updateVisibility: vi.fn(),
		markIdle: vi.fn(),
		markActive: vi.fn(),
		finalize: vi.fn(),
		getMetrics: vi.fn(() => ({
			focusTime: 30000,
			idleTime: 5000,
		})),
	})),
}));

vi.mock("./trackers/VisibilityTracker", () => ({
	createVisibilityTracker: vi.fn(() => ({
		destroy: vi.fn(),
	})),
}));

vi.mock("./utils/NavigationHandler", () => ({
	createNavigationHandler: vi.fn(() => ({
		destroy: vi.fn(),
	})),
}));

describe("content/index", () => {
	let mockChromeApi: ReturnType<typeof createMockChromeApi>;
	let consoleLogSpy: MockedFunction<typeof console.log>;
	let setIntervalSpy: MockedFunction<typeof window.setInterval>;
	let clearIntervalSpy: MockedFunction<typeof window.clearInterval>;
	let addEventListenerSpy: MockedFunction<typeof window.addEventListener>;

	beforeEach(() => {
		vi.resetModules();

		mockChromeApi = createMockChromeApi();
		global.chrome = mockChromeApi;

		consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
		setIntervalSpy = vi
			.spyOn(window, "setInterval")
			.mockImplementation(() => 1);
		clearIntervalSpy = vi
			.spyOn(window, "clearInterval")
			.mockImplementation(() => {});
		addEventListenerSpy = vi
			.spyOn(window, "addEventListener")
			.mockImplementation(() => {});

		// Mock document properties
		Object.defineProperty(document, "title", {
			value: "Test Page",
			writable: true,
		});

		Object.defineProperty(document, "readyState", {
			value: "complete",
			writable: true,
		});

		// Mock location
		Object.defineProperty(window, "location", {
			value: {
				href: "https://example.com/test",
				hostname: "example.com",
			},
			writable: true,
		});

		// Mock body style
		Object.defineProperty(document, "body", {
			value: {
				style: {
					backgroundColor: "",
				},
			},
			writable: true,
		});

		vi.clearAllMocks();
	});

	describe("BrowsingTracker", () => {
		it("should initialize trackers and start periodic saving", async () => {
			const { createTimeTracker } = await import("./trackers/TimeTracker");
			const { createScrollTracker } = await import("./trackers/ScrollTracker");
			const { createVisibilityTracker } = await import(
				"./trackers/VisibilityTracker"
			);
			const { createIdleTracker } = await import("./trackers/IdleTracker");

			// Import the module to trigger initialization
			await import("./index");

			expect(createTimeTracker).toHaveBeenCalled();
			expect(createScrollTracker).toHaveBeenCalled();
			expect(createVisibilityTracker).toHaveBeenCalled();
			expect(createIdleTracker).toHaveBeenCalledWith(
				TIME_CONSTANTS.IDLE_THRESHOLD,
				expect.any(Function), // onIdle
				expect.any(Function), // onActive
			);
			expect(setIntervalSpy).toHaveBeenCalledWith(
				expect.any(Function),
				TIME_CONSTANTS.SAVE_INTERVAL,
			);
		});

		it("should save browsing activity with correct data", async () => {
			const { sendMessage } = await import("../shared/messages");

			// Import the module
			await import("./index");

			// Verify setInterval was called
			expect(setIntervalSpy).toHaveBeenCalled();

			// Trigger the periodic save
			const [saveCallback] = setIntervalSpy.mock.calls[0];
			saveCallback();

			expect(sendMessage).toHaveBeenCalledWith({
				action: "saveBrowsingActivity",
				data: expect.objectContaining({
					url: "https://example.com/test",
					title: "Test Page",
					domain: "example.com",
					startTime: expect.any(Number),
					scrollDepth: 50,
					maxScrollDepth: 100,
					totalScrollDistance: 500,
					focusTime: 30000,
					idleTime: 5000,
				}),
			});
		});
	});

	describe("TrackerManager", () => {
		it("should setup event listeners", async () => {
			await import("./index");

			expect(addEventListenerSpy).toHaveBeenCalledWith(
				"beforeunload",
				expect.any(Function),
			);
			expect(mockChromeApi.runtime.onMessage.addListener).toHaveBeenCalledWith(
				expect.any(Function),
			);
		});

		it("should handle message for button click", async () => {
			await import("./index");

			// Verify message listener was added
			expect(mockChromeApi.runtime.onMessage.addListener).toHaveBeenCalled();

			const [messageHandler] =
				mockChromeApi.runtime.onMessage.addListener.mock.calls[0];

			messageHandler({ action: "buttonClicked" }, {}, vi.fn());

			expect(consoleLogSpy).toHaveBeenCalledWith("Button was clicked in popup");
			expect(document.body.style.backgroundColor).toBe("#f0f0f0");
		});

		it("should initialize tracker when DOM is ready", async () => {
			// Mock document as loading
			Object.defineProperty(document, "readyState", {
				value: "loading",
				writable: true,
			});

			const addEventListenerSpy = vi
				.spyOn(document, "addEventListener")
				.mockImplementation(() => {});

			await import("./index");

			expect(addEventListenerSpy).toHaveBeenCalledWith(
				"DOMContentLoaded",
				expect.any(Function),
			);
		});

		it("should cleanup on beforeunload", async () => {
			const { sendMessage } = await import("../shared/messages");

			await import("./index");

			// Get the beforeunload handler
			const beforeunloadCall = addEventListenerSpy.mock.calls.find(
				([event]) => event === "beforeunload",
			);
			const beforeunloadHandler = beforeunloadCall?.[1];

			if (beforeunloadHandler) {
				beforeunloadHandler();

				// Should save activity with endTime
				expect(sendMessage).toHaveBeenCalledWith({
					action: "saveBrowsingActivity",
					data: expect.objectContaining({
						endTime: expect.any(Number),
					}),
				});
			}
		});

		it("should flash background with correct timing", async () => {
			vi.useFakeTimers();

			await import("./index");

			// Verify message listener was added
			expect(mockChromeApi.runtime.onMessage.addListener).toHaveBeenCalled();

			const [messageHandler] =
				mockChromeApi.runtime.onMessage.addListener.mock.calls[0];

			// Set initial background color
			document.body.style.backgroundColor = "white";

			messageHandler({ action: "buttonClicked" }, {}, vi.fn());

			expect(document.body.style.backgroundColor).toBe("#f0f0f0");

			// Fast forward the timeout
			vi.advanceTimersByTime(TIME_CONSTANTS.UI_FLASH_DURATION);

			expect(document.body.style.backgroundColor).toBe("white");

			vi.useRealTimers();
		});
	});

	describe("NavigationHandler integration", () => {
		it("should create navigation handler with init callback", async () => {
			const { createNavigationHandler } = await import(
				"./utils/NavigationHandler"
			);

			await import("./index");

			expect(createNavigationHandler).toHaveBeenCalledWith(
				expect.any(Function), // initTracker callback
			);
		});
	});
});
