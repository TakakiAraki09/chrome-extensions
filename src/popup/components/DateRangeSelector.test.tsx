import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DateRangeSelector } from "./DateRangeSelector";

describe("DateRangeSelector", () => {
	const defaultProps = {
		dateRange: "7",
		startDate: "2024-01-01T00:00",
		endDate: "2024-01-07T00:00",
		onDateRangeChange: vi.fn(),
		onStartDateChange: vi.fn(),
		onEndDateChange: vi.fn(),
		onRefresh: vi.fn(),
		isLoading: false,
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders date range selector with options", () => {
		render(<DateRangeSelector {...defaultProps} />);

		expect(screen.getByText("Date Range:")).toBeInTheDocument();
		expect(screen.getByRole("combobox")).toBeInTheDocument();

		// Check all options are present
		expect(screen.getByText("Last 24 hours")).toBeInTheDocument();
		expect(screen.getByText("Last 7 days")).toBeInTheDocument();
		expect(screen.getByText("Last 30 days")).toBeInTheDocument();
		expect(screen.getByText("Custom")).toBeInTheDocument();
	});

	it("selects the correct default option", () => {
		render(<DateRangeSelector {...defaultProps} />);

		const select = screen.getByRole("combobox") as HTMLSelectElement;
		expect(select.value).toBe("7");
	});

	it("calls onDateRangeChange when selection changes", () => {
		const onDateRangeChange = vi.fn();
		render(
			<DateRangeSelector
				{...defaultProps}
				onDateRangeChange={onDateRangeChange}
			/>,
		);

		const select = screen.getByRole("combobox");
		fireEvent.change(select, { target: { value: "30" } });

		expect(onDateRangeChange).toHaveBeenCalledWith("30");
	});

	it("shows custom date inputs when custom is selected", () => {
		render(<DateRangeSelector {...defaultProps} dateRange="custom" />);

		expect(screen.getByLabelText("From:")).toBeInTheDocument();
		expect(screen.getByLabelText("To:")).toBeInTheDocument();
		expect(screen.getByDisplayValue("2024-01-01T00:00")).toBeInTheDocument();
		expect(screen.getByDisplayValue("2024-01-07T00:00")).toBeInTheDocument();
	});

	it("hides custom date inputs when predefined range is selected", () => {
		render(<DateRangeSelector {...defaultProps} dateRange="7" />);

		expect(screen.queryByLabelText("From:")).not.toBeInTheDocument();
		expect(screen.queryByLabelText("To:")).not.toBeInTheDocument();
		expect(
			screen.queryByDisplayValue("2024-01-01T00:00"),
		).not.toBeInTheDocument();
	});

	it("calls onStartDateChange when start date changes", () => {
		const onStartDateChange = vi.fn();
		render(
			<DateRangeSelector
				{...defaultProps}
				dateRange="custom"
				onStartDateChange={onStartDateChange}
			/>,
		);

		const startDateInput = screen.getByLabelText("From:");
		fireEvent.change(startDateInput, { target: { value: "2024-02-01T00:00" } });

		expect(onStartDateChange).toHaveBeenCalledWith("2024-02-01T00:00");
	});

	it("calls onEndDateChange when end date changes", () => {
		const onEndDateChange = vi.fn();
		render(
			<DateRangeSelector
				{...defaultProps}
				dateRange="custom"
				onEndDateChange={onEndDateChange}
			/>,
		);

		const endDateInput = screen.getByLabelText("To:");
		fireEvent.change(endDateInput, { target: { value: "2024-02-07T00:00" } });

		expect(onEndDateChange).toHaveBeenCalledWith("2024-02-07T00:00");
	});

	it("renders refresh button with correct text when not loading", () => {
		render(<DateRangeSelector {...defaultProps} isLoading={false} />);

		const refreshButton = screen.getByRole("button", { name: "Refresh" });
		expect(refreshButton).toBeInTheDocument();
		expect(refreshButton).not.toBeDisabled();
	});

	it("renders refresh button with loading text when loading", () => {
		render(<DateRangeSelector {...defaultProps} isLoading={true} />);

		const refreshButton = screen.getByRole("button", { name: "Loading..." });
		expect(refreshButton).toBeInTheDocument();
		expect(refreshButton).toBeDisabled();
	});

	it("calls onRefresh when refresh button is clicked", () => {
		const onRefresh = vi.fn();
		render(<DateRangeSelector {...defaultProps} onRefresh={onRefresh} />);

		const refreshButton = screen.getByRole("button", { name: "Refresh" });
		fireEvent.click(refreshButton);

		expect(onRefresh).toHaveBeenCalledOnce();
	});

	it("disables refresh button when loading", () => {
		const onRefresh = vi.fn();
		render(
			<DateRangeSelector
				{...defaultProps}
				isLoading={true}
				onRefresh={onRefresh}
			/>,
		);

		const refreshButton = screen.getByRole("button", { name: "Loading..." });
		fireEvent.click(refreshButton);

		// Button should be disabled, so onRefresh should not be called
		expect(onRefresh).not.toHaveBeenCalled();
	});

	it("renders custom date inputs with correct id", () => {
		render(<DateRangeSelector {...defaultProps} dateRange="custom" />);

		expect(document.getElementById("customDateInputs")).toBeInTheDocument();
	});

	it("handles all predefined date range options", () => {
		const onDateRangeChange = vi.fn();
		render(
			<DateRangeSelector
				{...defaultProps}
				onDateRangeChange={onDateRangeChange}
			/>,
		);

		const select = screen.getByRole("combobox");

		// Test each option
		fireEvent.change(select, { target: { value: "1" } });
		expect(onDateRangeChange).toHaveBeenLastCalledWith("1");

		fireEvent.change(select, { target: { value: "7" } });
		expect(onDateRangeChange).toHaveBeenLastCalledWith("7");

		fireEvent.change(select, { target: { value: "30" } });
		expect(onDateRangeChange).toHaveBeenLastCalledWith("30");

		fireEvent.change(select, { target: { value: "custom" } });
		expect(onDateRangeChange).toHaveBeenLastCalledWith("custom");
	});

	it("shows correct input types for date inputs", () => {
		render(<DateRangeSelector {...defaultProps} dateRange="custom" />);

		const startDateInput = screen.getByLabelText("From:");
		const endDateInput = screen.getByLabelText("To:");

		expect(startDateInput).toHaveAttribute("type", "datetime-local");
		expect(endDateInput).toHaveAttribute("type", "datetime-local");
	});
});
