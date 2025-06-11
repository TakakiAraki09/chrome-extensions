import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createBrowsingActivity } from "../../test/factories";
import { BrowsingActivities } from "./BrowsingActivities";

describe("BrowsingActivities", () => {
	it("renders empty state when no activities", () => {
		render(<BrowsingActivities activities={[]} />);

		expect(screen.getByText("ブラウジング活動")).toBeInTheDocument();
		expect(
			screen.getByText("期間内のデータがありません。"),
		).toBeInTheDocument();
	});

	it("renders activities list with data", () => {
		const activities = [createBrowsingActivity(), createBrowsingActivity()];
		render(<BrowsingActivities activities={activities} />);

		expect(screen.getByText("ブラウジング活動")).toBeInTheDocument();
		expect(screen.getByText(activities[0].title)).toBeInTheDocument();
		expect(screen.getByText(activities[1].title)).toBeInTheDocument();
	});

	it("displays activity statistics correctly", () => {
		const activities = [
			createBrowsingActivity({
				title: "Test Page",
				url: "https://example.com/test",
				focusTime: 60000, // 60 seconds
				idleTime: 30000, // 30 seconds
				maxScrollDepth: 75,
				totalScrollDistance: 1500,
			}),
		];

		render(<BrowsingActivities activities={activities} />);

		// Check title and URL
		expect(screen.getByText("Test Page")).toBeInTheDocument();
		expect(screen.getByText("https://example.com/test")).toBeInTheDocument();

		// Check statistics
		expect(screen.getByText("滞在時間:")).toBeInTheDocument();
		expect(screen.getByText("最大スクロール:")).toBeInTheDocument();
		expect(screen.getByText("75%")).toBeInTheDocument();
		expect(screen.getByText("スクロール距離:")).toBeInTheDocument();
		expect(screen.getByText("1500px")).toBeInTheDocument();
		expect(screen.getByText("エンゲージメント率:")).toBeInTheDocument();
	});

	it("calculates engagement rate correctly", () => {
		const activities = [
			createBrowsingActivity({
				focusTime: 80000, // 80 seconds
				idleTime: 20000, // 20 seconds
			}),
		];

		render(<BrowsingActivities activities={activities} />);

		// Engagement rate should be 80% (80000 / (80000 + 20000) * 100)
		expect(screen.getByText("80%")).toBeInTheDocument();
	});

	it("handles zero total time for engagement rate", () => {
		const activities = [
			createBrowsingActivity({
				focusTime: 0,
				idleTime: 0,
			}),
		];

		render(<BrowsingActivities activities={activities} />);

		// Engagement rate should be 0% when total time is 0
		expect(screen.getByText("0%")).toBeInTheDocument();
	});

	it("displays timestamps correctly", () => {
		const activities = [
			createBrowsingActivity({
				startTime: 1640995200000, // 2022-01-01 00:00:00
				endTime: 1640998800000, // 2022-01-01 01:00:00
			}),
		];

		render(<BrowsingActivities activities={activities} />);

		// Should show formatted start and end times (MM/DD HH:mm format)
		const timestampElement = screen.getByText(/01\/01 09:00 - 01\/01 10:00/);
		expect(timestampElement).toBeInTheDocument();
	});

	it("handles missing end time", () => {
		const activities = [
			createBrowsingActivity({
				startTime: 1640995200000,
				endTime: undefined,
			}),
		];

		render(<BrowsingActivities activities={activities} />);

		// Should only show start time when end time is missing (MM/DD HH:mm format)
		const timestampElement = screen.getByText(/01\/01 09:00/);
		expect(timestampElement).toBeInTheDocument();
		expect(timestampElement.textContent).not.toContain(" - ");
	});

	it("renders multiple activities with unique keys", () => {
		const activities = [
			createBrowsingActivity({
				url: "https://example1.com",
				startTime: 1640995200000,
				title: "Page 1",
			}),
			createBrowsingActivity({
				url: "https://example2.com",
				startTime: 1640995300000,
				title: "Page 2",
			}),
		];

		render(<BrowsingActivities activities={activities} />);

		expect(screen.getByText("Page 1")).toBeInTheDocument();
		expect(screen.getByText("Page 2")).toBeInTheDocument();
		expect(screen.getByText("https://example1.com")).toBeInTheDocument();
		expect(screen.getByText("https://example2.com")).toBeInTheDocument();
	});

	it("rounds numeric values appropriately", () => {
		const activities = [
			createBrowsingActivity({
				totalScrollDistance: 1234.56,
				focusTime: 90000, // 90 seconds
				idleTime: 60000, // 60 seconds
			}),
		];

		render(<BrowsingActivities activities={activities} />);

		// Scroll distance should be rounded to integer
		expect(screen.getByText("1235px")).toBeInTheDocument();

		// Engagement rate should be rounded to integer (60%)
		expect(screen.getByText("60%")).toBeInTheDocument();
	});

	it("renders ActivityStat component correctly", () => {
		const activities = [createBrowsingActivity()];
		render(<BrowsingActivities activities={activities} />);

		// Check that all stat labels are present
		expect(screen.getByText("滞在時間:")).toBeInTheDocument();
		expect(screen.getByText("最大スクロール:")).toBeInTheDocument();
		expect(screen.getByText("スクロール距離:")).toBeInTheDocument();
		expect(screen.getByText("エンゲージメント率:")).toBeInTheDocument();
	});
});
