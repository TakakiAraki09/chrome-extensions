import { useCallback, useEffect, useState } from "react";
import { DATA_LIMITS } from "../../shared/constants";
import { sendMessage } from "../../shared/messages";
import type {
	BrowsingActivity,
	HistoryItem,
	InterestScore,
	TimeRange,
	ViewMode,
} from "../types";

export const useBrowsingData = (viewMode: ViewMode, timeRange: TimeRange) => {
	const [isLoading, setIsLoading] = useState(false);
	const [interestScores, setInterestScores] = useState<InterestScore[]>([]);
	const [browsingActivities, setBrowsingActivities] = useState<
		BrowsingActivity[]
	>([]);
	const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);

	const fetchData = useCallback(async () => {
		setIsLoading(true);

		try {
			if (viewMode === "interests") {
				const response = await sendMessage({
					action: "getInterestScores",
				});
				setInterestScores(response.scores || []);
			} else if (viewMode === "activities") {
				const response = await sendMessage({
					action: "getBrowsingData",
					startTime: timeRange.startTime,
					endTime: timeRange.endTime,
					limit: DATA_LIMITS.DEFAULT_ACTIVITY_LIMIT,
				});
				setBrowsingActivities(response.activities || []);
			} else if (viewMode === "history") {
				const response = await sendMessage({
					action: "getHistory",
					startTime: timeRange.startTime,
					endTime: timeRange.endTime,
					maxResults: DATA_LIMITS.DEFAULT_HISTORY_LIMIT,
				});
				setHistoryItems(response.history || []);
			}
		} catch (error) {
			console.error("Error fetching data:", error);
		} finally {
			setIsLoading(false);
		}
	}, [viewMode, timeRange.startTime, timeRange.endTime]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	return {
		isLoading,
		interestScores,
		browsingActivities,
		historyItems,
		refresh: fetchData,
	};
};
