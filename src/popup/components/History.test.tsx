import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createHistoryItem } from "../../test/factories";
import { History } from "./History";

describe("History", () => {
	it("renders empty state when no history items", () => {
		render(<History items={[]} />);

		expect(screen.getByText("履歴")).toBeInTheDocument();
		expect(
			screen.getByText("No history items found for the selected period."),
		).toBeInTheDocument();
	});

	it("renders history items with data", () => {
		const items = [createHistoryItem(), createHistoryItem()];
		render(<History items={items} />);

		expect(screen.getByText("履歴")).toBeInTheDocument();
		expect(
			screen.getByText(`Found ${items.length} history items`),
		).toBeInTheDocument();
		expect(screen.getByText(items[0].title)).toBeInTheDocument();
		expect(screen.getByText(items[1].title)).toBeInTheDocument();
	});

	it("displays history item details correctly", () => {
		const items = [
			createHistoryItem({
				title: "Test Page Title",
				url: "https://example.com/test",
				lastVisitTime: 1640995200000, // 2022-01-01 00:00:00
				visitCount: 5,
			}),
		];

		render(<History items={items} />);

		expect(screen.getByText("Test Page Title")).toBeInTheDocument();
		expect(screen.getByText("https://example.com/test")).toBeInTheDocument();
		expect(screen.getByText(/訪問日時:/)).toBeInTheDocument();
		expect(screen.getByText("訪問回数: 5回")).toBeInTheDocument();
	});

	it("handles missing title gracefully", () => {
		const items = [
			createHistoryItem({
				title: "",
				url: "https://example.com/no-title",
			}),
		];

		render(<History items={items} />);

		expect(screen.getByText("No title")).toBeInTheDocument();
		expect(
			screen.getByText("https://example.com/no-title"),
		).toBeInTheDocument();
	});

	it("handles undefined title gracefully", () => {
		const items = [
			createHistoryItem({
				title: undefined,
				url: "https://example.com/undefined-title",
			}),
		];

		render(<History items={items} />);

		expect(screen.getByText("No title")).toBeInTheDocument();
		expect(
			screen.getByText("https://example.com/undefined-title"),
		).toBeInTheDocument();
	});

	it("handles missing URL gracefully", () => {
		const items = [
			createHistoryItem({
				title: "Test Title",
				url: "",
			}),
		];

		render(<History items={items} />);

		expect(screen.getByText("Test Title")).toBeInTheDocument();
		// Empty URL should still render but be empty
		const urlElement = screen
			.getByText("Test Title")
			.parentElement?.querySelector(".url");
		expect(urlElement).toBeInTheDocument();
		expect(urlElement?.textContent).toBe("");
	});

	it("handles undefined URL gracefully", () => {
		const items = [
			createHistoryItem({
				title: "Test Title",
				url: undefined,
			}),
		];

		render(<History items={items} />);

		expect(screen.getByText("Test Title")).toBeInTheDocument();
		const urlElement = screen
			.getByText("Test Title")
			.parentElement?.querySelector(".url");
		expect(urlElement).toBeInTheDocument();
		expect(urlElement?.textContent).toBe("");
	});

	it("handles missing visitCount gracefully", () => {
		const items = [
			createHistoryItem({
				visitCount: undefined,
			}),
		];

		render(<History items={items} />);

		expect(screen.getByText("訪問回数: 0回")).toBeInTheDocument();
	});

	it("handles zero visitCount", () => {
		const items = [
			createHistoryItem({
				visitCount: 0,
			}),
		];

		render(<History items={items} />);

		expect(screen.getByText("訪問回数: 0回")).toBeInTheDocument();
	});

	it("displays formatted date correctly", () => {
		const items = [
			createHistoryItem({
				lastVisitTime: 1640995200000, // 2022-01-01 00:00:00
			}),
		];

		render(<History items={items} />);

		// Should display formatted date (format depends on formatFullDate implementation)
		const dateElement = screen.getByText(/訪問日時:/);
		expect(dateElement).toBeInTheDocument();
		expect(dateElement.textContent).toContain("2022");
	});

	it("renders multiple history items with unique keys", () => {
		const items = [
			createHistoryItem({
				id: "item1",
				title: "First Item",
				url: "https://example1.com",
			}),
			createHistoryItem({
				id: "item2",
				title: "Second Item",
				url: "https://example2.com",
			}),
		];

		render(<History items={items} />);

		expect(screen.getByText("First Item")).toBeInTheDocument();
		expect(screen.getByText("Second Item")).toBeInTheDocument();
		expect(screen.getByText("https://example1.com")).toBeInTheDocument();
		expect(screen.getByText("https://example2.com")).toBeInTheDocument();
	});

	it("displays correct item count in summary", () => {
		const items = Array.from({ length: 15 }, () => createHistoryItem());
		render(<History items={items} />);

		expect(screen.getByText("Found 15 history items")).toBeInTheDocument();
	});

	it("applies correct CSS classes", () => {
		const items = [createHistoryItem()];
		render(<History items={items} />);

		const historyContainer = screen.getByText("履歴").parentElement;
		expect(historyContainer).toHaveClass("history");

		const historyItem = screen.getByText(items[0].title).parentElement;
		expect(historyItem).toHaveClass("history-item");

		const urlElement = historyItem?.querySelector(".url");
		expect(urlElement).toBeInTheDocument();

		const metadataElement = historyItem?.querySelector(".metadata");
		expect(metadataElement).toBeInTheDocument();
	});

	it("handles large visit counts", () => {
		const items = [
			createHistoryItem({
				visitCount: 999,
			}),
		];

		render(<History items={items} />);

		expect(screen.getByText("訪問回数: 999回")).toBeInTheDocument();
	});
});
