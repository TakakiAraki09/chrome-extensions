import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { sendMessage } from "../../shared/messages";
import type { TimeRange, ViewMode } from "../types";
import { useBrowsingData } from "./useBrowsingData";

// Mock sendMessage
vi.mock("../../shared/messages", () => ({
	sendMessage: vi.fn(),
}));

const mockSendMessage = vi.mocked(sendMessage);

describe("useBrowsingData フック", () => {
	const mockTimeRange: TimeRange = {
		startTime: Date.now() - 86400000, // 24 hours ago
		endTime: Date.now(),
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("viewModeが'interests'のとき興味スコアを取得する", async () => {
		const mockInterestScores = [
			{
				domain: "example.com",
				score: 0.85,
				factors: {
					timeWeight: 0.4,
					scrollWeight: 0.3,
					engagementWeight: 0.3,
				},
				lastUpdated: Date.now(),
			},
		];

		mockSendMessage.mockResolvedValue({
			scores: mockInterestScores,
		});

		const { result } = renderHook(() =>
			useBrowsingData("interests", mockTimeRange),
		);

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});

		expect(mockSendMessage).toHaveBeenCalledWith({
			action: "getInterestScores",
		});
		expect(result.current.interestScores).toEqual(mockInterestScores);
		expect(result.current.browsingActivities).toEqual([]);
		expect(result.current.historyItems).toEqual([]);
	});

	it("viewModeが'activities'のときブラウジングアクティビティを取得する", async () => {
		const mockActivities = [
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
		];

		mockSendMessage.mockResolvedValue({
			activities: mockActivities,
		});

		const { result } = renderHook(() =>
			useBrowsingData("activities", mockTimeRange),
		);

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});

		expect(mockSendMessage).toHaveBeenCalledWith({
			action: "getBrowsingData",
			startTime: mockTimeRange.startTime,
			endTime: mockTimeRange.endTime,
			limit: 100,
		});
		expect(result.current.browsingActivities).toEqual(mockActivities);
		expect(result.current.interestScores).toEqual([]);
		expect(result.current.historyItems).toEqual([]);
	});

	it("viewModeが'history'のとき履歴アイテムを取得する", async () => {
		const mockHistory = [
			{
				id: "1",
				url: "https://example.com",
				title: "Example",
				lastVisitTime: Date.now(),
				visitCount: 5,
				typedCount: 1,
			},
		];

		mockSendMessage.mockResolvedValue({
			history: mockHistory,
		});

		const { result } = renderHook(() =>
			useBrowsingData("history", mockTimeRange),
		);

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});

		expect(mockSendMessage).toHaveBeenCalledWith({
			action: "getHistory",
			startTime: mockTimeRange.startTime,
			endTime: mockTimeRange.endTime,
			maxResults: 2000,
		});
		expect(result.current.historyItems).toEqual(mockHistory);
		expect(result.current.interestScores).toEqual([]);
		expect(result.current.browsingActivities).toEqual([]);
	});

	it("ローディング状態を正しく処理する", async () => {
		mockSendMessage.mockImplementation(() => new Promise(() => {})); // Never resolves

		const { result } = renderHook(() =>
			useBrowsingData("interests", mockTimeRange),
		);

		expect(result.current.isLoading).toBe(true);
	});

	it("エラーを適切に処理する", async () => {
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		mockSendMessage.mockRejectedValue(new Error("Network error"));

		const { result } = renderHook(() =>
			useBrowsingData("interests", mockTimeRange),
		);

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});

		expect(consoleSpy).toHaveBeenCalledWith(
			"Error fetching data:",
			expect.any(Error),
		);
		expect(result.current.interestScores).toEqual([]);

		consoleSpy.mockRestore();
	});

	it("timeRangeが変更されたときデータを再取得する", async () => {
		mockSendMessage.mockResolvedValue({
			scores: [],
		});

		const { result, rerender } = renderHook(
			({
				viewMode,
				timeRange,
			}: {
				viewMode: ViewMode;
				timeRange: TimeRange;
			}) => useBrowsingData(viewMode, timeRange),
			{
				initialProps: {
					viewMode: "interests" as ViewMode,
					timeRange: mockTimeRange,
				},
			},
		);

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});

		expect(mockSendMessage).toHaveBeenCalledTimes(1);

		// Change timeRange
		const newTimeRange = {
			startTime: Date.now() - 172800000, // 48 hours ago
			endTime: Date.now(),
		};

		rerender({
			viewMode: "interests",
			timeRange: newTimeRange,
		});

		await waitFor(() => {
			expect(mockSendMessage).toHaveBeenCalledTimes(2);
		});
	});

	it("データを再取得するrefresh関数を提供する", async () => {
		mockSendMessage.mockResolvedValue({
			scores: [],
		});

		const { result } = renderHook(() =>
			useBrowsingData("interests", mockTimeRange),
		);

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});

		expect(mockSendMessage).toHaveBeenCalledTimes(1);

		// Call refresh
		act(() => {
			result.current.refresh();
		});

		await waitFor(() => {
			expect(mockSendMessage).toHaveBeenCalledTimes(2);
		});
	});

	it("空のレスポンスデータを処理する", async () => {
		mockSendMessage.mockResolvedValue({});

		const { result } = renderHook(() =>
			useBrowsingData("interests", mockTimeRange),
		);

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});

		expect(result.current.interestScores).toEqual([]);
	});
});
