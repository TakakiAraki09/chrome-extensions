import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	createBrowsingActivity,
	createHistoryItem,
	createInterestScore,
} from "../test/factories";
import { App } from "./App";
import * as useBrowsingDataModule from "./hooks/useBrowsingData";

// Helper functions to create arrays
const createMockBrowsingActivities = (count: number) =>
	Array.from({ length: count }, (_, i) =>
		createBrowsingActivity({ domain: `domain${i}.com` }),
	);
const createMockInterestScores = (count: number) =>
	Array.from({ length: count }, (_, i) =>
		createInterestScore({ domain: `domain${i}.com` }),
	);
const createMockHistoryItems = (count: number) =>
	Array.from({ length: count }, (_, i) =>
		createHistoryItem({ url: `https://domain${i}.com/page` }),
	);

// Mock dayjs
vi.mock("dayjs", () => {
	const mockDayjs = vi.fn((date) => ({
		format: vi.fn((format) => {
			const d = date ? new Date(date) : new Date();
			if (format === "YYYY-MM-DDTHH:mm") {
				const year = d.getFullYear();
				const month = String(d.getMonth() + 1).padStart(2, "0");
				const day = String(d.getDate()).padStart(2, "0");
				const hours = String(d.getHours()).padStart(2, "0");
				const minutes = String(d.getMinutes()).padStart(2, "0");
				return `${year}-${month}-${day}T${hours}:${minutes}`;
			}
			if (format === "MM/DD HH:mm") {
				const month = String(d.getMonth() + 1).padStart(2, "0");
				const day = String(d.getDate()).padStart(2, "0");
				const hours = String(d.getHours()).padStart(2, "0");
				const minutes = String(d.getMinutes()).padStart(2, "0");
				return `${month}/${day} ${hours}:${minutes}`;
			}
			if (format === "YYYY年MM月DD日 HH:mm:ss") {
				const year = d.getFullYear();
				const month = String(d.getMonth() + 1).padStart(2, "0");
				const day = String(d.getDate()).padStart(2, "0");
				const hours = String(d.getHours()).padStart(2, "0");
				const minutes = String(d.getMinutes()).padStart(2, "0");
				const seconds = String(d.getSeconds()).padStart(2, "0");
				return `${year}年${month}月${day}日 ${hours}:${minutes}:${seconds}`;
			}
			return "01/01 00:00";
		}),
		locale: vi.fn(),
	}));
	mockDayjs.locale = vi.fn();
	return {
		default: mockDayjs,
	};
});

// Mock the useBrowsingData hook
vi.mock("./hooks/useBrowsingData");

describe("App", () => {
	const mockUseBrowsingData = vi.mocked(useBrowsingDataModule.useBrowsingData);
	const mockRefresh = vi.fn();

	beforeEach(() => {
		mockRefresh.mockClear();
		mockUseBrowsingData.mockReturnValue({
			isLoading: false,
			interestScores: createMockInterestScores(3),
			browsingActivities: createMockBrowsingActivities(2),
			historyItems: createMockHistoryItems(3),
			refresh: mockRefresh,
		});
	});

	it("renders the app header", () => {
		render(<App />);

		expect(screen.getByText("ブラウジング分析")).toBeInTheDocument();
		expect(screen.getByRole("tablist")).toBeInTheDocument();
	});

	it("shows interests view by default", () => {
		render(<App />);

		expect(screen.getByText("興味関心度ランキング")).toBeInTheDocument();
		// Tab labels are always visible, but the content is not
		expect(screen.queryByText("ブラウジング活動")).not.toBeInTheDocument();
		// History tab button exists, but history content doesn't
		expect(
			screen.queryByRole("heading", { name: "履歴" }),
		).not.toBeInTheDocument();
	});

	it("does not show date controls for interests view", () => {
		render(<App />);

		expect(screen.queryByText("Date Range:")).not.toBeInTheDocument();
	});

	it("switches to activities view and shows date controls", () => {
		render(<App />);

		const activitiesTab = screen.getByRole("tab", { name: "活動履歴" });
		fireEvent.click(activitiesTab);

		expect(screen.getByText("ブラウジング活動")).toBeInTheDocument();
		expect(screen.getByText("Date Range:")).toBeInTheDocument();
	});

	it("switches to history view and shows date controls", () => {
		render(<App />);

		const historyTab = screen.getByRole("tab", { name: "履歴" });
		fireEvent.click(historyTab);

		expect(screen.getByRole("heading", { name: "履歴" })).toBeInTheDocument();
		expect(screen.getByText("Date Range:")).toBeInTheDocument();
	});

	it("shows loading state", () => {
		mockUseBrowsingData.mockReturnValue({
			isLoading: true,
			interestScores: [],
			browsingActivities: [],
			historyItems: [],
			refresh: mockRefresh,
		});

		render(<App />);

		expect(screen.getByText("Loading...")).toBeInTheDocument();
	});

	it("handles date range change to custom", () => {
		render(<App />);

		// Switch to activities view first
		const activitiesTab = screen.getByRole("tab", { name: "活動履歴" });
		fireEvent.click(activitiesTab);

		const dateRangeSelect = screen.getByRole("combobox");
		fireEvent.change(dateRangeSelect, { target: { value: "custom" } });

		expect(screen.getByLabelText("From:")).toBeInTheDocument();
		expect(screen.getByLabelText("To:")).toBeInTheDocument();
	});

	it("calculates time range correctly for predefined periods", async () => {
		render(<App />);

		// Switch to activities view
		const activitiesTab = screen.getByRole("tab", { name: "活動履歴" });
		fireEvent.click(activitiesTab);

		const dateRangeSelect = screen.getByRole("combobox");
		fireEvent.change(dateRangeSelect, { target: { value: "1" } });

		await waitFor(() => {
			expect(mockUseBrowsingData).toHaveBeenCalledWith(
				"activities",
				expect.objectContaining({
					startTime: expect.any(Number),
					endTime: expect.any(Number),
				}),
			);
		});
	});

	it("calculates time range correctly for custom period", async () => {
		render(<App />);

		// Switch to activities view
		const activitiesTab = screen.getByRole("tab", { name: "活動履歴" });
		fireEvent.click(activitiesTab);

		// Change to custom
		const dateRangeSelect = screen.getByRole("combobox");
		fireEvent.change(dateRangeSelect, { target: { value: "custom" } });

		// Set custom dates
		const startDateInput = screen.getByLabelText("From:");
		const endDateInput = screen.getByLabelText("To:");

		fireEvent.change(startDateInput, { target: { value: "2024-01-01T00:00" } });
		fireEvent.change(endDateInput, { target: { value: "2024-01-02T00:00" } });

		await waitFor(() => {
			expect(mockUseBrowsingData).toHaveBeenCalledWith(
				"activities",
				expect.objectContaining({
					startTime: new Date("2024-01-01T00:00").getTime(),
					endTime: new Date("2024-01-02T00:00").getTime(),
				}),
			);
		});
	});

	it("calls refresh function when refresh button is clicked", () => {
		render(<App />);

		// Switch to activities view to show refresh button
		const activitiesTab = screen.getByRole("tab", { name: "活動履歴" });
		fireEvent.click(activitiesTab);

		const refreshButton = screen.getByRole("button", { name: /refresh/i });
		fireEvent.click(refreshButton);

		expect(mockRefresh).toHaveBeenCalledOnce();
	});

	it("disables refresh button when loading", () => {
		mockUseBrowsingData.mockReturnValue({
			isLoading: true,
			interestScores: [],
			browsingActivities: [],
			historyItems: [],
			refresh: mockRefresh,
		});

		render(<App />);

		// Switch to activities view to show refresh button
		const activitiesTab = screen.getByRole("tab", { name: "活動履歴" });
		fireEvent.click(activitiesTab);

		const refreshButton = screen.getByRole("button", { name: /loading/i });
		expect(refreshButton).toBeDisabled();
	});

	it("initializes date range with default values", () => {
		render(<App />);

		// The hook should be called with the default time range
		expect(mockUseBrowsingData).toHaveBeenCalledWith(
			"interests",
			expect.objectContaining({
				startTime: expect.any(Number),
				endTime: expect.any(Number),
			}),
		);
	});

	it("updates useBrowsingData when view mode changes", async () => {
		render(<App />);

		// Initial call for interests
		expect(mockUseBrowsingData).toHaveBeenLastCalledWith(
			"interests",
			expect.any(Object),
		);

		// Switch to activities
		const activitiesTab = screen.getByRole("tab", { name: "活動履歴" });
		fireEvent.click(activitiesTab);

		await waitFor(() => {
			expect(mockUseBrowsingData).toHaveBeenLastCalledWith(
				"activities",
				expect.any(Object),
			);
		});
	});
});
