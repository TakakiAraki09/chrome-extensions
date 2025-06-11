import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
	GetBrowsingDataRequest,
	GetHistoryRequest,
	GetInterestScoresRequest,
	GetTabInfoRequest,
	SaveBrowsingActivityRequest,
} from "../messages";
import { sendMessage } from "../messages";

// Mock chrome.runtime.sendMessage
const mockSendMessage = vi.fn();
global.chrome = {
	...global.chrome,
	runtime: {
		...global.chrome?.runtime,
		sendMessage: mockSendMessage,
	},
};

describe("messages", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("sendMessage", () => {
		it("should send getTabInfo message and validate response", async () => {
			const mockResponse = {
				tab: {
					id: 1,
					index: 0,
					windowId: 1,
					url: "https://example.com",
					title: "Example",
					active: true,
					highlighted: false,
					pinned: false,
					selected: false,
					discarded: false,
					autoDiscardable: true,
					incognito: false,
				},
			};

			mockSendMessage.mockResolvedValue(mockResponse);

			const message: GetTabInfoRequest = { action: "getTabInfo" };
			const result = await sendMessage(message);

			expect(mockSendMessage).toHaveBeenCalledWith(message);
			expect(result).toEqual(mockResponse);
		});

		it("should send getHistory message and validate response", async () => {
			const mockResponse = {
				history: [
					{
						id: "1",
						url: "https://example.com",
						title: "Example",
						lastVisitTime: Date.now(),
						visitCount: 5,
						typedCount: 1,
					},
				],
			};

			mockSendMessage.mockResolvedValue(mockResponse);

			const message: GetHistoryRequest = {
				action: "getHistory",
				startTime: Date.now() - 86400000,
				endTime: Date.now(),
				maxResults: 100,
			};
			const result = await sendMessage(message);

			expect(mockSendMessage).toHaveBeenCalledWith(message);
			expect(result).toEqual(mockResponse);
		});

		it("should send saveBrowsingActivity message and validate response", async () => {
			const mockResponse = {
				success: true,
				id: 123,
			};

			mockSendMessage.mockResolvedValue(mockResponse);

			const message: SaveBrowsingActivityRequest = {
				action: "saveBrowsingActivity",
				data: {
					url: "https://example.com",
					title: "Example Site",
					domain: "example.com",
					startTime: Date.now(),
					scrollDepth: 0.5,
					maxScrollDepth: 0.8,
					totalScrollDistance: 1000,
					focusTime: 30000,
					idleTime: 5000,
				},
			};
			const result = await sendMessage(message);

			expect(mockSendMessage).toHaveBeenCalledWith(message);
			expect(result).toEqual(mockResponse);
		});

		it("should send getBrowsingData message and validate response", async () => {
			const mockResponse = {
				activities: [
					{
						url: "https://example.com",
						title: "Example Site",
						domain: "example.com",
						startTime: Date.now(),
						scrollDepth: 0.5,
						maxScrollDepth: 0.8,
						totalScrollDistance: 1000,
						focusTime: 30000,
						idleTime: 5000,
					},
				],
			};

			mockSendMessage.mockResolvedValue(mockResponse);

			const message: GetBrowsingDataRequest = {
				action: "getBrowsingData",
				domain: "example.com",
				startTime: Date.now() - 86400000,
				endTime: Date.now(),
				limit: 50,
			};
			const result = await sendMessage(message);

			expect(mockSendMessage).toHaveBeenCalledWith(message);
			expect(result).toEqual(mockResponse);
		});

		it("should send getInterestScores message and validate response", async () => {
			const mockResponse = {
				scores: [
					{
						domain: "example.com",
						url: "https://example.com",
						score: 0.85,
						factors: {
							timeWeight: 0.4,
							scrollWeight: 0.3,
							engagementWeight: 0.3,
						},
						lastUpdated: Date.now(),
					},
				],
			};

			mockSendMessage.mockResolvedValue(mockResponse);

			const message: GetInterestScoresRequest = {
				action: "getInterestScores",
			};
			const result = await sendMessage(message);

			expect(mockSendMessage).toHaveBeenCalledWith(message);
			expect(result).toEqual(mockResponse);
		});

		it("should throw error for invalid response format", async () => {
			const invalidResponse = {
				tab: {
					// Missing required fields
					id: "invalid_id_type",
				},
			};

			mockSendMessage.mockResolvedValue(invalidResponse);

			const message: GetTabInfoRequest = { action: "getTabInfo" };

			await expect(sendMessage(message)).rejects.toThrow(
				"Invalid response format for getTabInfo",
			);
		});

		it("should handle response with error field", async () => {
			const errorResponse = {
				activities: [],
				error: "Database connection failed",
			};

			mockSendMessage.mockResolvedValue(errorResponse);

			const message: GetBrowsingDataRequest = {
				action: "getBrowsingData",
			};
			const result = await sendMessage(message);

			expect(result).toEqual(errorResponse);
		});
	});
});
