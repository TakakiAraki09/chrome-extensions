import { describe, expect, it } from "vitest";
import { BrowserSchema } from "./browsing";

describe("ブラウザスキーマ", () => {
	describe("BrowsingActivitySchema", () => {
		it("有効なブラウジングアクティビティを検証する", () => {
			const validActivity = {
				url: "https://example.com",
				title: "Example Site",
				domain: "example.com",
				startTime: Date.now(),
				scrollDepth: 0.5,
				maxScrollDepth: 0.8,
				totalScrollDistance: 1000,
				focusTime: 30000,
				idleTime: 5000,
			};

			const result =
				BrowserSchema.BrowsingActivitySchema.safeParse(validActivity);
			expect(result.success).toBe(true);
		});

		it("無効なブラウジングアクティビティを拒否する", () => {
			const invalidActivity = {
				url: "",
				title: "Example Site",
				domain: "example.com",
				scrollDepth: "invalid",
			};

			const result =
				BrowserSchema.BrowsingActivitySchema.safeParse(invalidActivity);
			expect(result.success).toBe(false);
		});

		it("オプショナルのendTimeを許可する", () => {
			const activityWithEndTime = {
				url: "https://example.com",
				title: "Example Site",
				domain: "example.com",
				startTime: Date.now(),
				endTime: Date.now() + 10000,
				scrollDepth: 0.5,
				maxScrollDepth: 0.8,
				totalScrollDistance: 1000,
				focusTime: 30000,
				idleTime: 5000,
			};

			const result =
				BrowserSchema.BrowsingActivitySchema.safeParse(activityWithEndTime);
			expect(result.success).toBe(true);
		});
	});

	describe("HistorySchema", () => {
		it("有効な履歴リクエストを検証する", () => {
			const validHistory = {
				type: "History" as const,
				startTime: Date.now() - 86400000,
				endTime: Date.now(),
				maxResults: 100,
			};

			const result = BrowserSchema.HistorySchema.safeParse(validHistory);
			expect(result.success).toBe(true);
		});

		it("最小限の履歴リクエストを検証する", () => {
			const minimalHistory = {
				type: "History" as const,
			};

			const result = BrowserSchema.HistorySchema.safeParse(minimalHistory);
			expect(result.success).toBe(true);
		});
	});

	describe("BrowsingSchema", () => {
		it("有効なブラウジングリクエストを検証する", () => {
			const validBrowsing = {
				type: "Browsing" as const,
				domain: "example.com",
				startTime: Date.now() - 86400000,
				endTime: Date.now(),
				limit: 50,
			};

			const result = BrowserSchema.BrowsingSchema.safeParse(validBrowsing);
			expect(result.success).toBe(true);
		});
	});

	describe("InterestSchema", () => {
		it("有効な興味スコアを検証する", () => {
			const validInterest = {
				type: "Interest" as const,
				domain: "example.com",
				url: "https://example.com/page",
				score: 0.85,
				factors: {
					timeWeight: 0.4,
					scrollWeight: 0.3,
					engagementWeight: 0.3,
				},
				lastUpdated: Date.now(),
			};

			const result = BrowserSchema.InterestSchema.safeParse(validInterest);
			expect(result.success).toBe(true);
		});

		it("オプショナルのurlを許可する", () => {
			const interestWithoutUrl = {
				type: "Interest" as const,
				domain: "example.com",
				score: 0.85,
				factors: {
					timeWeight: 0.4,
					scrollWeight: 0.3,
					engagementWeight: 0.3,
				},
				lastUpdated: Date.now(),
			};

			const result = BrowserSchema.InterestSchema.safeParse(interestWithoutUrl);
			expect(result.success).toBe(true);
		});
	});
});
