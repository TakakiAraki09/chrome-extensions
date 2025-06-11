import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
	GetBrowsingDataRequest,
	GetHistoryRequest,
	GetInterestScoresRequest,
	GetTabInfoRequest,
	MessageRequest,
	SaveBrowsingActivityRequest,
} from "../../shared/messages";
import type { IndexedDBManagerInstance } from "../db/IndexedDBManager";
import type { BrowsingActivity, InterestScore } from "../types";
import { createMessageHandlers } from "./createMessageHandlers";
import { handleMessage } from "./handleMessage";

// Mock Chrome APIs
const mockChrome = {
	tabs: {
		query: vi.fn(),
	},
	history: {
		search: vi.fn(),
	},
};

// @ts-ignore
global.chrome = mockChrome;

// Mock console methods
global.console = {
	...console,
	log: vi.fn(),
	error: vi.fn(),
};

describe("メッセージハンドラー", () => {
	let mockDBManager: IndexedDBManagerInstance;
	let handlers: ReturnType<typeof createMessageHandlers>;
	let mockBrowsingActivity: BrowsingActivity;
	let mockInterestScore: InterestScore;

	beforeEach(() => {
		vi.clearAllMocks();

		mockBrowsingActivity = {
			url: "https://example.com",
			title: "Test Page",
			domain: "example.com",
			startTime: Date.now(),
			endTime: Date.now() + 60000,
			scrollDepth: 50,
			maxScrollDepth: 50,
			totalScrollDistance: 100,
			focusTime: 45000,
			idleTime: 15000,
		};

		mockInterestScore = {
			domain: "example.com",
			score: 75,
			factors: {
				timeWeight: 0.8,
				scrollWeight: 0.5,
				engagementWeight: 0.75,
			},
			lastUpdated: Date.now(),
		};

		mockDBManager = {
			init: vi.fn(),
			saveBrowsingActivity: vi.fn(),
			updateInterestScore: vi.fn(),
			getBrowsingActivities: vi.fn(),
			getInterestScores: vi.fn(),
		};

		handlers = createMessageHandlers(mockDBManager);
	});

	describe("createMessageHandlers", () => {
		describe("getTabInfo", () => {
			it("アクティブなタブ情報を返す", async () => {
				const mockTab = {
					id: 123,
					url: "https://example.com",
					title: "Example",
					active: true,
					index: 0,
					windowId: 1,
					highlighted: true,
					pinned: false,
					selected: true,
					discarded: false,
					autoDiscardable: true,
					incognito: false,
				};

				mockChrome.tabs.query.mockResolvedValue([mockTab]);

				const request: GetTabInfoRequest = {
					action: "getTabInfo",
				};
				const result = await handlers.getTabInfo(request);

				expect(mockChrome.tabs.query).toHaveBeenCalledWith({
					active: true,
					currentWindow: true,
				});
				expect(result).toEqual({
					tab: mockTab,
				});
			});
		});

		describe("getHistory", () => {
			it("デフォルトパラメータでブラウザ履歴を返す", async () => {
				const mockHistory = [
					{
						id: "1",
						url: "https://example.com",
						title: "Example",
						lastVisitTime: Date.now(),
						visitCount: 5,
						typedCount: 2,
					},
				];

				mockChrome.history.search.mockResolvedValue(mockHistory);

				const request: GetHistoryRequest = {
					action: "getHistory",
				};
				const result = await handlers.getHistory(request);

				expect(mockChrome.history.search).toHaveBeenCalledWith({
					text: "",
					startTime: expect.any(Number),
					endTime: expect.any(Number),
					maxResults: 100,
				});
				expect(result).toEqual({
					history: mockHistory,
				});
			});

			it("提供されたパラメータを使用する", async () => {
				const mockHistory: chrome.history.HistoryItem[] = [];
				mockChrome.history.search.mockResolvedValue(mockHistory);

				const request: GetHistoryRequest = {
					action: "getHistory",
					startTime: 1000,
					endTime: 2000,
					maxResults: 50,
				};

				const result = await handlers.getHistory(request);

				expect(mockChrome.history.search).toHaveBeenCalledWith({
					text: "",
					startTime: 1000,
					endTime: 2000,
					maxResults: 50,
				});
			});

			it("lastVisitTimeで履歴をソートする", async () => {
				const mockHistory = [
					{
						id: "1",
						url: "https://old.com",
						title: "Old",
						lastVisitTime: 1000,
						visitCount: 1,
						typedCount: 0,
					},
					{
						id: "2",
						url: "https://new.com",
						title: "New",
						lastVisitTime: 2000,
						visitCount: 1,
						typedCount: 0,
					},
				];

				mockChrome.history.search.mockResolvedValue(mockHistory);

				const request: GetHistoryRequest = {
					action: "getHistory",
				};
				const result = await handlers.getHistory(request);

				expect(result.history[0].lastVisitTime).toBe(2000);
				expect(result.history[1].lastVisitTime).toBe(1000);
			});
		});

		describe("saveBrowsingActivity", () => {
			it("アクティビティを保存して興味スコアを更新する", async () => {
				const mockId = 123;
				const mockActivities = [mockBrowsingActivity];

				mockDBManager.saveBrowsingActivity = vi.fn().mockResolvedValue(mockId);
				mockDBManager.getBrowsingActivities = vi
					.fn()
					.mockResolvedValue(mockActivities);
				mockDBManager.updateInterestScore = vi
					.fn()
					.mockResolvedValue(undefined);

				const request: SaveBrowsingActivityRequest = {
					action: "saveBrowsingActivity",
					data: mockBrowsingActivity,
				};

				const result = await handlers.saveBrowsingActivity(request);

				expect(mockDBManager.saveBrowsingActivity).toHaveBeenCalledWith(
					mockBrowsingActivity,
				);
				expect(mockDBManager.getBrowsingActivities).toHaveBeenCalledWith({
					domain: mockBrowsingActivity.domain,
					startTime: expect.any(Number),
				});
				expect(mockDBManager.updateInterestScore).toHaveBeenCalledWith({
					domain: mockBrowsingActivity.domain,
					score: expect.any(Number),
					factors: expect.any(Object),
					lastUpdated: expect.any(Number),
				});
				expect(result).toEqual({
					success: true,
					id: mockId,
				});
			});

			it("保存エラーを処理する", async () => {
				const error = new Error("Database error");
				mockDBManager.saveBrowsingActivity = vi.fn().mockRejectedValue(error);

				const request: SaveBrowsingActivityRequest = {
					action: "saveBrowsingActivity",
					data: mockBrowsingActivity,
				};

				const result = await handlers.saveBrowsingActivity(request);

				expect(result).toEqual({
					success: false,
					error: "Database error",
				});
			});

			it("文字列エラーを処理する", async () => {
				mockDBManager.saveBrowsingActivity = vi
					.fn()
					.mockRejectedValue("String error");

				const request: SaveBrowsingActivityRequest = {
					action: "saveBrowsingActivity",
					data: mockBrowsingActivity,
				};

				const result = await handlers.saveBrowsingActivity(request);

				expect(result).toEqual({
					success: false,
					error: "String error",
				});
			});

			it("未知のエラーを処理する", async () => {
				mockDBManager.saveBrowsingActivity = vi.fn().mockRejectedValue({
					unknown: "error",
				});

				const request: SaveBrowsingActivityRequest = {
					action: "saveBrowsingActivity",
					data: mockBrowsingActivity,
				};

				const result = await handlers.saveBrowsingActivity(request);

				expect(result).toEqual({
					success: false,
					error: "Unknown error occurred",
				});
			});
		});

		describe("getBrowsingData", () => {
			it("ブラウジングアクティビティを返す", async () => {
				const mockActivities = [mockBrowsingActivity];
				mockDBManager.getBrowsingActivities = vi
					.fn()
					.mockResolvedValue(mockActivities);

				const request: GetBrowsingDataRequest = {
					action: "getBrowsingData",
					domain: "example.com",
					startTime: 1000,
					endTime: 2000,
					limit: 10,
				};

				const result = await handlers.getBrowsingData(request);

				expect(mockDBManager.getBrowsingActivities).toHaveBeenCalledWith({
					domain: "example.com",
					startTime: 1000,
					endTime: 2000,
					limit: 10,
				});
				expect(result).toEqual({
					activities: mockActivities,
				});
			});

			it("データベースエラーを処理する", async () => {
				const error = new Error("Database error");
				mockDBManager.getBrowsingActivities = vi.fn().mockRejectedValue(error);

				const request: GetBrowsingDataRequest = {
					action: "getBrowsingData",
				};

				const result = await handlers.getBrowsingData(request);

				expect(result).toEqual({
					activities: [],
					error: "Database error",
				});
			});
		});

		describe("getInterestScores", () => {
			it("興味スコアを返す", async () => {
				const mockScores = [mockInterestScore];
				mockDBManager.getInterestScores = vi.fn().mockResolvedValue(mockScores);

				const request: GetInterestScoresRequest = {
					action: "getInterestScores",
				};

				const result = await handlers.getInterestScores(request);

				expect(mockDBManager.getInterestScores).toHaveBeenCalled();
				expect(result).toEqual({
					scores: mockScores,
				});
			});

			it("データベースエラーを処理する", async () => {
				const error = new Error("Database error");
				mockDBManager.getInterestScores = vi.fn().mockRejectedValue(error);

				const request: GetInterestScoresRequest = {
					action: "getInterestScores",
				};

				const result = await handlers.getInterestScores(request);

				expect(result).toEqual({
					scores: [],
					error: "Database error",
				});
			});
		});
	});

	describe("handleMessage", () => {
		let mockSendResponse: ReturnType<typeof vi.fn>;

		beforeEach(() => {
			mockSendResponse = vi.fn();
		});

		it("有効なリクエストを処理する", async () => {
			const mockTab = {
				id: 123,
				url: "https://example.com",
				title: "Example",
				active: true,
				index: 0,
				windowId: 1,
				highlighted: true,
				pinned: false,
				selected: true,
				discarded: false,
				autoDiscardable: true,
				incognito: false,
			};

			mockChrome.tabs.query.mockResolvedValue([mockTab]);

			const request: MessageRequest = {
				action: "getTabInfo",
			};

			const result = handleMessage(handlers, request, mockSendResponse);

			expect(result).toBe(true);
			// Wait for async processing
			await new Promise((resolve) => setTimeout(resolve, 0));
			expect(mockSendResponse).toHaveBeenCalledWith({
				tab: mockTab,
			});
		});

		it("無効なリクエスト形式を処理する", async () => {
			const invalidRequest = {
				invalid: "request",
			} as unknown as MessageRequest;

			const result = handleMessage(handlers, invalidRequest, mockSendResponse);

			expect(result).toBe(true);
			expect(mockSendResponse).toHaveBeenCalledWith({
				error: "Invalid request format",
			});
		});

		it("buttonClickedアクションを処理する", async () => {
			const request: MessageRequest = {
				action: "buttonClicked",
			};

			const result = handleMessage(handlers, request, mockSendResponse);

			expect(result).toBe(true);
			// Wait for async processing
			await new Promise((resolve) => setTimeout(resolve, 0));
			expect(mockSendResponse).toHaveBeenCalledWith({});
		});

		it("ハンドラーエラーを処理する", async () => {
			mockDBManager.getInterestScores = vi
				.fn()
				.mockRejectedValue(new Error("Handler error"));

			const request: MessageRequest = {
				action: "getInterestScores",
			};

			const result = handleMessage(handlers, request, mockSendResponse);

			expect(result).toBe(true);
			// Wait for async processing
			await new Promise((resolve) => setTimeout(resolve, 0));
			expect(mockSendResponse).toHaveBeenCalledWith({
				scores: [],
				error: "Handler error",
			});
		});
	});
});
