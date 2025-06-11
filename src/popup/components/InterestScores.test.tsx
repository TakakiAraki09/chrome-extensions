import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createInterestScore } from "../../test/factories";
import { InterestScores } from "./InterestScores";

describe("InterestScores", () => {
	it("renders empty state when no scores", () => {
		render(<InterestScores scores={[]} />);

		expect(screen.getByText("興味関心度ランキング")).toBeInTheDocument();
		expect(
			screen.getByText(
				"データがありません。しばらくブラウジングしてから確認してください。",
			),
		).toBeInTheDocument();
	});

	it("renders interest scores with data", () => {
		const scores = [
			createInterestScore({ domain: "example.com" }),
			createInterestScore({ domain: "test.org" }),
		];
		render(<InterestScores scores={scores} />);

		expect(screen.getByText("興味関心度ランキング")).toBeInTheDocument();
		expect(screen.getByText(scores[0].domain)).toBeInTheDocument();
		expect(screen.getByText(scores[1].domain)).toBeInTheDocument();
	});

	it("displays score details correctly", () => {
		const scores = [
			createInterestScore({
				domain: "example.com",
				score: 85,
				factors: {
					timeWeight: 0.8,
					scrollWeight: 0.6,
					engagementWeight: 0.9,
				},
				lastUpdated: 1640995200000, // 2022-01-01 00:00:00
			}),
		];

		render(<InterestScores scores={scores} />);

		expect(screen.getByText("example.com")).toBeInTheDocument();
		expect(screen.getByText("85点")).toBeInTheDocument();
		expect(screen.getByText(/滞在時間/)).toBeInTheDocument();
		expect(screen.getByText(/スクロール/)).toBeInTheDocument();
		expect(screen.getByText(/エンゲージメント/)).toBeInTheDocument();
		expect(screen.getByText(/最終更新:/)).toBeInTheDocument();
	});

	it("displays progress bars with correct percentages", () => {
		const scores = [
			createInterestScore({
				factors: {
					timeWeight: 0.75, // Should show 75%
					scrollWeight: 0.5, // Should show 50%
					engagementWeight: 1.0, // Should show 100%
				},
			}),
		];

		render(<InterestScores scores={scores} />);

		expect(screen.getByText("75%")).toBeInTheDocument();
		expect(screen.getByText("50%")).toBeInTheDocument();
		expect(screen.getByText("100%")).toBeInTheDocument();
	});

	it("applies correct CSS classes to progress bars", () => {
		const scores = [createInterestScore()];
		render(<InterestScores scores={scores} />);

		const container = screen.getByText(scores[0].domain).closest(".score-item");
		expect(container).toBeInTheDocument();

		// Check that progress bars have correct classes
		const timeProgressBar = container?.querySelector(".progress-fill.time");
		const scrollProgressBar = container?.querySelector(".progress-fill.scroll");
		const engagementProgressBar = container?.querySelector(
			".progress-fill.engagement",
		);

		expect(timeProgressBar).toBeInTheDocument();
		expect(scrollProgressBar).toBeInTheDocument();
		expect(engagementProgressBar).toBeInTheDocument();
	});

	it("sets correct width styles for progress bars", () => {
		const scores = [
			createInterestScore({
				factors: {
					timeWeight: 0.6, // Should be 60% width
					scrollWeight: 0.3, // Should be 30% width
					engagementWeight: 0.9, // Should be 90% width
				},
			}),
		];

		render(<InterestScores scores={scores} />);

		const container = screen.getByText(scores[0].domain).closest(".score-item");

		const timeProgressBar = container?.querySelector(
			".progress-fill.time",
		) as HTMLElement;
		const scrollProgressBar = container?.querySelector(
			".progress-fill.scroll",
		) as HTMLElement;
		const engagementProgressBar = container?.querySelector(
			".progress-fill.engagement",
		) as HTMLElement;

		expect(timeProgressBar?.style.width).toBe("60%");
		expect(scrollProgressBar?.style.width).toBe("30%");
		expect(engagementProgressBar?.style.width).toBe("90%");
	});

	it("rounds percentage values correctly", () => {
		const scores = [
			createInterestScore({
				factors: {
					timeWeight: 0.756, // Should round to 76%
					scrollWeight: 0.234, // Should round to 23%
					engagementWeight: 0.999, // Should round to 100%
				},
			}),
		];

		render(<InterestScores scores={scores} />);

		expect(screen.getByText("76%")).toBeInTheDocument();
		expect(screen.getByText("23%")).toBeInTheDocument();
		expect(screen.getByText("100%")).toBeInTheDocument();
	});

	it("displays formatted last updated date", () => {
		const scores = [
			createInterestScore({
				lastUpdated: 1640995200000, // 2022-01-01 00:00:00 UTC
			}),
		];

		render(<InterestScores scores={scores} />);

		const lastUpdatedElement = screen.getByText(/最終更新:/);
		expect(lastUpdatedElement).toBeInTheDocument();
		// formatDate uses "MM/DD HH:mm" format, so it shows "01/01 09:00" for JST
		expect(lastUpdatedElement.textContent).toContain("01/01");
	});

	it("renders multiple scores with unique keys", () => {
		const scores = [
			createInterestScore({
				domain: "example1.com",
				score: 90,
			}),
			createInterestScore({
				domain: "example2.com",
				score: 75,
			}),
		];

		render(<InterestScores scores={scores} />);

		expect(screen.getByText("example1.com")).toBeInTheDocument();
		expect(screen.getByText("example2.com")).toBeInTheDocument();
		expect(screen.getByText("90点")).toBeInTheDocument();
		expect(screen.getByText("75点")).toBeInTheDocument();
	});

	it("applies correct CSS classes to score components", () => {
		const scores = [createInterestScore()];
		render(<InterestScores scores={scores} />);

		const mainContainer = screen.getByText(
			"興味関心度ランキング",
		).parentElement;
		expect(mainContainer).toHaveClass("interest-scores");

		const scoresList = mainContainer?.querySelector(".scores-list");
		expect(scoresList).toBeInTheDocument();

		const scoreItem = screen.getByText(scores[0].domain).closest(".score-item");
		expect(scoreItem).toBeInTheDocument();

		const scoreHeader = scoreItem?.querySelector(".score-header");
		expect(scoreHeader).toBeInTheDocument();

		const scoreBadge = scoreItem?.querySelector(".score-badge");
		expect(scoreBadge).toBeInTheDocument();

		const scoreDetails = scoreItem?.querySelector(".score-details");
		expect(scoreDetails).toBeInTheDocument();
	});

	it("handles zero weight values", () => {
		const scores = [
			createInterestScore({
				factors: {
					timeWeight: 0,
					scrollWeight: 0,
					engagementWeight: 0,
				},
			}),
		];

		render(<InterestScores scores={scores} />);

		// Should show 0% for all factors
		const percentageElements = screen.getAllByText("0%");
		expect(percentageElements).toHaveLength(3);
	});

	it("handles maximum weight values", () => {
		const scores = [
			createInterestScore({
				factors: {
					timeWeight: 1.0,
					scrollWeight: 1.0,
					engagementWeight: 1.0,
				},
			}),
		];

		render(<InterestScores scores={scores} />);

		// Should show 100% for all factors
		const percentageElements = screen.getAllByText("100%");
		expect(percentageElements).toHaveLength(3);
	});

	it("displays score badge correctly", () => {
		const scores = [
			createInterestScore({
				score: 42,
			}),
		];

		render(<InterestScores scores={scores} />);

		const scoreBadge = screen.getByText("42点");
		expect(scoreBadge).toBeInTheDocument();
		expect(scoreBadge).toHaveClass("score-badge");
	});
});
