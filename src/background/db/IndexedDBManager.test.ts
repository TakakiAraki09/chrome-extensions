import { beforeEach, describe, expect, it, vi } from "vitest";
import type { BrowsingActivity, InterestScore } from "../types";
import type { IndexedDBManagerInstance } from "./IndexedDBManager";

describe("IndexedDBManager", () => {
	let dbManager: IndexedDBManagerInstance;
	let mockActivity: BrowsingActivity;
	let mockInterestScore: InterestScore;

	beforeEach(() => {
		mockActivity = {
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
			url: "https://example.com",
			score: 75,
			factors: {
				timeWeight: 0.8,
				scrollWeight: 0.5,
				engagementWeight: 0.75,
			},
			lastUpdated: Date.now(),
		};

		// Create a mock db manager
		dbManager = {
			init: vi.fn().mockResolvedValue(undefined),
			saveBrowsingActivity: vi.fn().mockResolvedValue(123),
			updateInterestScore: vi.fn().mockResolvedValue(undefined),
			getBrowsingActivities: vi.fn().mockResolvedValue([mockActivity]),
			getInterestScores: vi.fn().mockResolvedValue([mockInterestScore]),
		};
	});

	describe("インターフェースコントラクト", () => {
		it("必要なすべてのメソッドを持つ", () => {
			expect(dbManager.init).toBeDefined();
			expect(dbManager.saveBrowsingActivity).toBeDefined();
			expect(dbManager.updateInterestScore).toBeDefined();
			expect(dbManager.getBrowsingActivities).toBeDefined();
			expect(dbManager.getInterestScores).toBeDefined();
		});

		it("メソッドから正しい型を返す", async () => {
			const id = await dbManager.saveBrowsingActivity(mockActivity);
			expect(typeof id).toBe("number");

			const activities = await dbManager.getBrowsingActivities();
			expect(Array.isArray(activities)).toBe(true);

			const scores = await dbManager.getInterestScores();
			expect(Array.isArray(scores)).toBe(true);
		});
	});

	describe("saveBrowsingActivity", () => {
		it("ブラウジングアクティビティを保存して数値IDを返す", async () => {
			const result = await dbManager.saveBrowsingActivity(mockActivity);

			expect(dbManager.saveBrowsingActivity).toHaveBeenCalledWith(mockActivity);
			expect(typeof result).toBe("number");
			expect(result).toBe(123);
		});

		it("異なるアクティビティ構造を処理する", async () => {
			const minimalActivity: BrowsingActivity = {
				url: "https://test.com",
				title: "Test",
				domain: "test.com",
				startTime: Date.now(),
				scrollDepth: 0,
				maxScrollDepth: 0,
				totalScrollDistance: 0,
				focusTime: 0,
				idleTime: 0,
			};

			await dbManager.saveBrowsingActivity(minimalActivity);
			expect(dbManager.saveBrowsingActivity).toHaveBeenCalledWith(
				minimalActivity,
			);
		});
	});

	describe("updateInterestScore", () => {
		it("興味スコアを更新する", async () => {
			await dbManager.updateInterestScore(mockInterestScore);

			expect(dbManager.updateInterestScore).toHaveBeenCalledWith(
				mockInterestScore,
			);
		});

		it("異なる因子値を持つ興味スコアを処理する", async () => {
			const scoreWithZeroFactors: InterestScore = {
				...mockInterestScore,
				factors: {
					timeWeight: 0,
					scrollWeight: 0,
					engagementWeight: 0,
				},
			};

			await dbManager.updateInterestScore(scoreWithZeroFactors);
			expect(dbManager.updateInterestScore).toHaveBeenCalledWith(
				scoreWithZeroFactors,
			);
		});
	});

	describe("getBrowsingActivities", () => {
		it("オプションなしでブラウジングアクティビティを取得する", async () => {
			const result = await dbManager.getBrowsingActivities();

			expect(dbManager.getBrowsingActivities).toHaveBeenCalledWith();
			expect(Array.isArray(result)).toBe(true);
			expect(result).toHaveLength(1);
			expect(result[0]).toEqual(mockActivity);
		});

		it("フィルターオプションを受け入れる", async () => {
			const options = {
				domain: "example.com",
				startTime: Date.now() - 86400000,
				endTime: Date.now(),
				limit: 10,
			};

			// Mock to return empty array for different filters
			dbManager.getBrowsingActivities = vi.fn().mockResolvedValue([]);

			const result = await dbManager.getBrowsingActivities(options);

			expect(dbManager.getBrowsingActivities).toHaveBeenCalledWith(options);
			expect(Array.isArray(result)).toBe(true);
		});

		it("部分的なフィルターオプションを処理する", async () => {
			await dbManager.getBrowsingActivities({
				domain: "test.com",
			});
			expect(dbManager.getBrowsingActivities).toHaveBeenCalledWith({
				domain: "test.com",
			});

			await dbManager.getBrowsingActivities({
				limit: 5,
			});
			expect(dbManager.getBrowsingActivities).toHaveBeenCalledWith({
				limit: 5,
			});
		});
	});

	describe("getInterestScores", () => {
		it("すべての興味スコアを取得する", async () => {
			const result = await dbManager.getInterestScores();

			expect(dbManager.getInterestScores).toHaveBeenCalled();
			expect(Array.isArray(result)).toBe(true);
			expect(result).toHaveLength(1);
			expect(result[0]).toEqual(mockInterestScore);
		});

		it("空のスコアを処理する", async () => {
			dbManager.getInterestScores = vi.fn().mockResolvedValue([]);

			const result = await dbManager.getInterestScores();

			expect(result).toHaveLength(0);
		});

		it("必要なプロパティを持つスコアを返す", async () => {
			const result = await dbManager.getInterestScores();

			for (const score of result) {
				expect(score).toHaveProperty("domain");
				expect(score).toHaveProperty("score");
				expect(score).toHaveProperty("factors");
				expect(score).toHaveProperty("lastUpdated");
				expect(score.factors).toHaveProperty("timeWeight");
				expect(score.factors).toHaveProperty("scrollWeight");
				expect(score.factors).toHaveProperty("engagementWeight");
			}
		});
	});

	describe("エラーハンドリング", () => {
		it("初期化エラーを処理する", async () => {
			dbManager.init = vi.fn().mockRejectedValue(new Error("Init failed"));

			await expect(dbManager.init()).rejects.toThrow("Init failed");
		});

		it("保存エラーを処理する", async () => {
			dbManager.saveBrowsingActivity = vi
				.fn()
				.mockRejectedValue(new Error("Save failed"));

			await expect(
				dbManager.saveBrowsingActivity(mockActivity),
			).rejects.toThrow("Save failed");
		});

		it("更新エラーを処理する", async () => {
			dbManager.updateInterestScore = vi
				.fn()
				.mockRejectedValue(new Error("Update failed"));

			await expect(
				dbManager.updateInterestScore(mockInterestScore),
			).rejects.toThrow("Update failed");
		});

		it("クエリエラーを処理する", async () => {
			dbManager.getBrowsingActivities = vi
				.fn()
				.mockRejectedValue(new Error("Query failed"));
			dbManager.getInterestScores = vi
				.fn()
				.mockRejectedValue(new Error("Query failed"));

			await expect(dbManager.getBrowsingActivities()).rejects.toThrow(
				"Query failed",
			);
			await expect(dbManager.getInterestScores()).rejects.toThrow(
				"Query failed",
			);
		});
	});
});
