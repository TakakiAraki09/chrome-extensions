import type React from "react";

interface DateRangeSelectorProps {
	dateRange: string;
	startDate: string;
	endDate: string;
	onDateRangeChange: (range: string) => void;
	onStartDateChange: (date: string) => void;
	onEndDateChange: (date: string) => void;
	onRefresh: () => void;
	isLoading: boolean;
}

const dateRangeOptions = [
	{ value: "1", label: "Last 24 hours" },
	{ value: "7", label: "Last 7 days" },
	{ value: "30", label: "Last 30 days" },
	{ value: "custom", label: "Custom" },
];

export const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({
	dateRange,
	startDate,
	endDate,
	onDateRangeChange,
	onStartDateChange,
	onEndDateChange,
	onRefresh,
	isLoading,
}) => {
	const showCustomDate = dateRange === "custom";

	return (
		<div className="date-controls">
			<label>
				Date Range:
				<select
					value={dateRange}
					onChange={(e) => onDateRangeChange(e.target.value)}
				>
					{dateRangeOptions.map((option) => (
						<option key={option.value} value={option.value}>
							{option.label}
						</option>
					))}
				</select>
			</label>

			{showCustomDate && (
				<div id="customDateInputs">
					<label>
						From:
						<input
							type="datetime-local"
							value={startDate}
							onChange={(e) => onStartDateChange(e.target.value)}
						/>
					</label>
					<label>
						To:
						<input
							type="datetime-local"
							value={endDate}
							onChange={(e) => onEndDateChange(e.target.value)}
						/>
					</label>
				</div>
			)}

			<button type="button" onClick={onRefresh} disabled={isLoading}>
				{isLoading ? "Loading..." : "Refresh"}
			</button>
		</div>
	);
};
