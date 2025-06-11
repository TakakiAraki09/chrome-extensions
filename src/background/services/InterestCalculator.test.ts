import { describe, expect, it } from "vitest";
import type { BrowsingActivity } from "../types";
import {
	calculateInterestScore,
	getInterestFactors,
} from "./InterestCalculator";

describe("興味計算機", () => {
	describe("calculateInterestScore", () => {
		it("空のアクティビティ配列に対して0を返す", () => {
			const result = calculateInterestScore([]);
			expect(result).toBe(0);
		});

		it("単一のアクティビティのスコアを計算する", () => {
			const activities: BrowsingActivity[] = [
				{
					url: "https://example.com",
					title: "Test",
					domain: "example.com",
					startTime: Date.now(),
					endTime: Date.now() + 60000,
					scrollDepth: 50,
					maxScrollDepth: 50,
					totalScrollDistance: 100,
					focusTime: 60000, // 1 minute
					idleTime: 0,
				},
			];

			const result = calculateInterestScore(activities);
			expect(result).toBeGreaterThan(0);
			expect(typeof result).toBe("number");
		});

		it("より長いフォーカス時間に対してより高いスコアを計算する", () => {
			const shortActivity: BrowsingActivity[] = [
				{
					url: "https://example.com",
					title: "Test",
					domain: "example.com",
					startTime: Date.now(),
					scrollDepth: 50,
					maxScrollDepth: 50,
					totalScrollDistance: 100,
					focusTime: 30000, // 30 seconds
					idleTime: 0,
				},
			];

			const longActivity: BrowsingActivity[] = [
				{
					url: "https://example.com",
					title: "Test",
					domain: "example.com",
					startTime: Date.now(),
					scrollDepth: 50,
					maxScrollDepth: 50,
					totalScrollDistance: 100,
					focusTime: 120000, // 2 minutes
					idleTime: 0,
				},
			];

			const shortScore = calculateInterestScore(shortActivity);
			const longScore = calculateInterestScore(longActivity);

			expect(longScore).toBeGreaterThan(shortScore);
		});

		it("より深いスクロールに対してより高いスコアを計算する", () => {
			const shallowActivity: BrowsingActivity[] = [
				{
					url: "https://example.com",
					title: "Test",
					domain: "example.com",
					startTime: Date.now(),
					scrollDepth: 10,
					maxScrollDepth: 10,
					totalScrollDistance: 20,
					focusTime: 60000,
					idleTime: 0,
				},
			];

			const deepActivity: BrowsingActivity[] = [
				{
					url: "https://example.com",
					title: "Test",
					domain: "example.com",
					startTime: Date.now(),
					scrollDepth: 90,
					maxScrollDepth: 90,
					totalScrollDistance: 180,
					focusTime: 60000,
					idleTime: 0,
				},
			];

			const shallowScore = calculateInterestScore(shallowActivity);
			const deepScore = calculateInterestScore(deepActivity);

			expect(deepScore).toBeGreaterThan(shallowScore);
		});

		it("より良いエンゲージメントに対してより高いスコアを計算する", () => {
			const lowEngagement: BrowsingActivity[] = [
				{
					url: "https://example.com",
					title: "Test",
					domain: "example.com",
					startTime: Date.now(),
					scrollDepth: 50,
					maxScrollDepth: 50,
					totalScrollDistance: 100,
					focusTime: 30000, // 30 seconds focus
					idleTime: 90000, // 90 seconds idle
				},
			];

			const highEngagement: BrowsingActivity[] = [
				{
					url: "https://example.com",
					title: "Test",
					domain: "example.com",
					startTime: Date.now(),
					scrollDepth: 50,
					maxScrollDepth: 50,
					totalScrollDistance: 100,
					focusTime: 90000, // 90 seconds focus
					idleTime: 30000, // 30 seconds idle
				},
			];

			const lowScore = calculateInterestScore(lowEngagement);
			const highScore = calculateInterestScore(highEngagement);

			expect(highScore).toBeGreaterThan(lowScore);
		});

		it("複数のアクティビティを処理する", () => {
			const activities: BrowsingActivity[] = [
				{
					url: "https://example.com/page1",
					title: "Test 1",
					domain: "example.com",
					startTime: Date.now(),
					scrollDepth: 30,
					maxScrollDepth: 30,
					totalScrollDistance: 60,
					focusTime: 45000,
					idleTime: 15000,
				},
				{
					url: "https://example.com/page2",
					title: "Test 2",
					domain: "example.com",
					startTime: Date.now(),
					scrollDepth: 70,
					maxScrollDepth: 70,
					totalScrollDistance: 140,
					focusTime: 75000,
					idleTime: 25000,
				},
			];

			const result = calculateInterestScore(activities);
			expect(result).toBeGreaterThan(0);
			expect(typeof result).toBe("number");
		});

		it("四捨五入された整数スコアを返す", () => {
			const activities: BrowsingActivity[] = [
				{
					url: "https://example.com",
					title: "Test",
					domain: "example.com",
					startTime: Date.now(),
					scrollDepth: 33,
					maxScrollDepth: 33,
					totalScrollDistance: 66,
					focusTime: 33333,
					idleTime: 11111,
				},
			];

			const result = calculateInterestScore(activities);
			expect(Number.isInteger(result)).toBe(true);
		});
	});

	describe("getInterestFactors", () => {
		it("空のアクティビティ配列に対してゼロを返す", () => {
			const result = getInterestFactors([]);
			expect(result).toEqual({
				timeWeight: 0,
				scrollWeight: 0,
				engagementWeight: 0,
			});
		});

		it("有効範囲内の因子を返す", () => {
			const activities: BrowsingActivity[] = [
				{
					url: "https://example.com",
					title: "Test",
					domain: "example.com",
					startTime: Date.now(),
					scrollDepth: 60,
					maxScrollDepth: 60,
					totalScrollDistance: 120,
					focusTime: 120000, // 2 minutes
					idleTime: 30000,
				},
			];

			const result = getInterestFactors(activities);

			expect(result.timeWeight).toBeGreaterThanOrEqual(0);
			expect(result.timeWeight).toBeLessThanOrEqual(1);
			expect(result.scrollWeight).toBeGreaterThanOrEqual(0);
			expect(result.scrollWeight).toBeLessThanOrEqual(1);
			expect(result.engagementWeight).toBeGreaterThanOrEqual(0);
			expect(result.engagementWeight).toBeLessThanOrEqual(1);
		});

		it("時間重みを最大5分に正規化する", () => {
			const shortActivity: BrowsingActivity[] = [
				{
					url: "https://example.com",
					title: "Test",
					domain: "example.com",
					startTime: Date.now(),
					scrollDepth: 50,
					maxScrollDepth: 50,
					totalScrollDistance: 100,
					focusTime: 150000, // 2.5 minutes
					idleTime: 0,
				},
			];

			const longActivity: BrowsingActivity[] = [
				{
					url: "https://example.com",
					title: "Test",
					domain: "example.com",
					startTime: Date.now(),
					scrollDepth: 50,
					maxScrollDepth: 50,
					totalScrollDistance: 100,
					focusTime: 600000, // 10 minutes (should be capped)
					idleTime: 0,
				},
			];

			const shortFactors = getInterestFactors(shortActivity);
			const longFactors = getInterestFactors(longActivity);

			expect(shortFactors.timeWeight).toBeLessThan(1);
			expect(longFactors.timeWeight).toBe(1); // Should be capped at 1
		});

		it("スクロール重みを最大100%に正規化する", () => {
			const normalScroll: BrowsingActivity[] = [
				{
					url: "https://example.com",
					title: "Test",
					domain: "example.com",
					startTime: Date.now(),
					scrollDepth: 50,
					maxScrollDepth: 50,
					totalScrollDistance: 100,
					focusTime: 60000,
					idleTime: 0,
				},
			];

			const maxScroll: BrowsingActivity[] = [
				{
					url: "https://example.com",
					title: "Test",
					domain: "example.com",
					startTime: Date.now(),
					scrollDepth: 150, // More than 100%
					maxScrollDepth: 150,
					totalScrollDistance: 300,
					focusTime: 60000,
					idleTime: 0,
				},
			];

			const normalFactors = getInterestFactors(normalScroll);
			const maxFactors = getInterestFactors(maxScroll);

			expect(normalFactors.scrollWeight).toBeLessThan(1);
			expect(maxFactors.scrollWeight).toBe(1); // Should be capped at 1
		});

		it("エンゲージメント重みを正しく計算する", () => {
			const balancedActivity: BrowsingActivity[] = [
				{
					url: "https://example.com",
					title: "Test",
					domain: "example.com",
					startTime: Date.now(),
					scrollDepth: 50,
					maxScrollDepth: 50,
					totalScrollDistance: 100,
					focusTime: 60000, // 50% focus
					idleTime: 60000, // 50% idle
				},
			];

			const result = getInterestFactors(balancedActivity);
			expect(result.engagementWeight).toBeCloseTo(0.5, 2);
		});
	});
});
