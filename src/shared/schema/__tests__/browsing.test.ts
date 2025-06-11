import { describe, expect, it } from "vitest";
import { BrowserSchema } from "../browsing";

describe("BrowserSchema", () => {
	describe("BrowsingActivitySchema", () => {
		it("should validate a valid browsing activity", () => {
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

		it("should reject invalid browsing activity", () => {
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

		it("should allow optional endTime", () => {
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
		it("should validate a valid history request", () => {
			const validHistory = {
				type: "History" as const,
				startTime: Date.now() - 86400000,
				endTime: Date.now(),
				maxResults: 100,
			};

			const result = BrowserSchema.HistorySchema.safeParse(validHistory);
			expect(result.success).toBe(true);
		});

		it("should validate minimal history request", () => {
			const minimalHistory = {
				type: "History" as const,
			};

			const result = BrowserSchema.HistorySchema.safeParse(minimalHistory);
			expect(result.success).toBe(true);
		});
	});

	describe("BrowsingSchema", () => {
		it("should validate a valid browsing request", () => {
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
		it("should validate a valid interest score", () => {
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

		it("should allow optional url", () => {
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
