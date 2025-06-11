import dayjs from "dayjs";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import "dayjs/locale/ja";
import { DATE_CONSTANTS, UI_CONSTANTS } from "../shared/constants";
import { BrowsingActivities } from "./components/BrowsingActivities";
import { DateRangeSelector } from "./components/DateRangeSelector";
import { History } from "./components/History";
import { InterestScores } from "./components/InterestScores";
import { Loading } from "./components/Loading";
import { TabBar } from "./components/TabBar";
import { useBrowsingData } from "./hooks/useBrowsingData";
import type { ViewMode } from "./types";
import { formatDateTimeLocal } from "./utils/formatters";

dayjs.locale("ja");

export const App: React.FC = () => {
	const [viewMode, setViewMode] = useState<ViewMode>("interests");
	const [dateRange, setDateRange] = useState<string>(
		UI_CONSTANTS.DEFAULT_PERIOD_OPTION,
	);
	const [startDate, setStartDate] = useState("");
	const [endDate, setEndDate] = useState("");

	useEffect(() => {
		const now = new Date();
		const weekAgo = new Date(now.getTime() - DATE_CONSTANTS.WEEK_IN_MS);

		setEndDate(formatDateTimeLocal(now));
		setStartDate(formatDateTimeLocal(weekAgo));
	}, []);

	const timeRange = useMemo(() => {
		if (dateRange === "custom") {
			return {
				startTime: new Date(startDate).getTime(),
				endTime: new Date(endDate).getTime(),
			};
		}

		const days = Number.parseInt(dateRange);
		return {
			startTime: Date.now() - days * DATE_CONSTANTS.DAY_IN_MS,
			endTime: Date.now(),
		};
	}, [dateRange, startDate, endDate]);

	const {
		isLoading,
		interestScores,
		browsingActivities,
		historyItems,
		refresh,
	} = useBrowsingData(viewMode, timeRange);

	const showDateControls = viewMode === "activities" || viewMode === "history";

	return (
		<div id="app">
			<header>
				<h1>ブラウジング分析</h1>
				<TabBar activeTab={viewMode} onTabChange={setViewMode} />
			</header>

			{showDateControls && (
				<DateRangeSelector
					dateRange={dateRange}
					startDate={startDate}
					endDate={endDate}
					onDateRangeChange={setDateRange}
					onStartDateChange={setStartDate}
					onEndDateChange={setEndDate}
					onRefresh={refresh}
					isLoading={isLoading}
				/>
			)}

			<main>
				{isLoading ? (
					<Loading />
				) : (
					<>
						{viewMode === "interests" && (
							<InterestScores scores={interestScores} />
						)}
						{viewMode === "activities" && (
							<BrowsingActivities activities={browsingActivities} />
						)}
						{viewMode === "history" && <History items={historyItems} />}
					</>
				)}
			</main>
		</div>
	);
};
