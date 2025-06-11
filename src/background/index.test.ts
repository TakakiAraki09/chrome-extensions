import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MockedFunction } from "vitest";

// Create a mock chrome API
const createMockChromeApi = () => ({
	runtime: {
		onInstalled: {
			addListener: vi.fn(),
		},
		onStartup: {
			addListener: vi.fn(),
		},
		onMessage: {
			addListener: vi.fn(),
		},
	},
	tabs: {
		query: vi.fn(),
	},
});

// Mock the dependencies
const mockDBManager = {
	init: vi.fn().mockResolvedValue(undefined),
};

vi.mock("./db/IndexedDBManager", () => ({
	createIndexedDBManager: vi.fn(() => mockDBManager),
}));

vi.mock("./handlers/messageHandlers", () => ({
	createMessageHandlers: vi.fn(() => ({})),
	handleMessage: vi.fn(() => true),
}));

describe("background/index", () => {
	let mockChromeApi: ReturnType<typeof createMockChromeApi>;
	let consoleLogSpy: MockedFunction<typeof console.log>;
	let consoleErrorSpy: MockedFunction<typeof console.error>;

	beforeEach(() => {
		// Only create the chrome API once
		if (!mockChromeApi) {
			mockChromeApi = createMockChromeApi();
			global.chrome = mockChromeApi;
		}

		consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
		consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		// Clear console spies and DB manager mock
		consoleLogSpy.mockClear();
		consoleErrorSpy.mockClear();
		mockDBManager.init.mockClear();

		// Reset the mock DB manager
		mockDBManager.init.mockResolvedValue(undefined);
	});

	describe("extension lifecycle", () => {
		it("should initialize extension on install", async () => {
			// Import the module to register listeners
			await import("./index");

			// Verify listener was added
			expect(mockChromeApi.runtime.onInstalled.addListener).toHaveBeenCalled();

			// Get the listener that was passed to addListener and call it
			const listener =
				mockChromeApi.runtime.onInstalled.addListener.mock.calls[0][0];
			await listener();

			// Verify the expected logs
			expect(consoleLogSpy).toHaveBeenCalledWith("Extension installed");
			expect(consoleLogSpy).toHaveBeenCalledWith("Database initialized");
		});

		it("should initialize extension on startup", async () => {
			// Get the previously registered listener
			expect(mockChromeApi.runtime.onStartup.addListener).toHaveBeenCalled();

			const listener =
				mockChromeApi.runtime.onStartup.addListener.mock.calls[0][0];
			await listener();

			expect(consoleLogSpy).toHaveBeenCalledWith("Extension startup");
			expect(consoleLogSpy).toHaveBeenCalledWith("Database initialized");
		});

		it("should handle database initialization errors", async () => {
			// Set up the mock to fail
			mockDBManager.init.mockRejectedValue(new Error("DB init failed"));

			// Get the previously registered listener
			expect(mockChromeApi.runtime.onInstalled.addListener).toHaveBeenCalled();

			const listener =
				mockChromeApi.runtime.onInstalled.addListener.mock.calls[0][0];
			await listener();

			expect(consoleErrorSpy).toHaveBeenCalledWith(
				"Failed to initialize database:",
				expect.any(Error),
			);
		});
	});

	describe("message handling", () => {
		it("should handle runtime messages", async () => {
			const { handleMessage } = await import("./handlers/messageHandlers");

			const mockRequest = { type: "test" };
			const mockSender = {};
			const mockSendResponse = vi.fn();

			// Verify listener was added (module was already imported in first test)
			expect(mockChromeApi.runtime.onMessage.addListener).toHaveBeenCalled();

			// Get the listener that was passed to addListener
			const listener =
				mockChromeApi.runtime.onMessage.addListener.mock.calls[0][0];
			const result = listener(mockRequest, mockSender, mockSendResponse);

			expect(handleMessage).toHaveBeenCalledWith(
				expect.any(Object), // messageHandlers
				mockRequest,
				mockSendResponse,
			);
			expect(result).toBe(true);
		});
	});
});
