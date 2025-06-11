import {
	DATA_LIMITS,
	DATE_CONSTANTS,
	INITIAL_VALUES,
} from "../../shared/constants";
import type {
	GetBrowsingDataRequest,
	GetBrowsingDataResponse,
	GetHistoryRequest,
	GetHistoryResponse,
	GetInterestScoresRequest,
	GetInterestScoresResponse,
	GetTabInfoRequest,
	GetTabInfoResponse,
	SaveBrowsingActivityRequest,
	SaveBrowsingActivityResponse,
} from "../../shared/messages";
import type { IndexedDBManagerInstance } from "../db/IndexedDBManager";
import {
	calculateInterestScore,
	getInterestFactors,
} from "../services/InterestCalculator";
import type { BrowsingActivity } from "../types";

// Utility function for safe error message extraction
const getErrorMessage = (error: unknown): string => {
	if (error instanceof Error) {
		return error.message;
	}
	if (typeof error === "string") {
		return error;
	}
	return "Unknown error occurred";
};

export const createMessageHandlers = (dbManager: IndexedDBManagerInstance) => ({
	getTabInfo: async (
		_request: GetTabInfoRequest,
	): Promise<GetTabInfoResponse> => {
		const tabs = await chrome.tabs.query({
			active: true,
			currentWindow: true,
		});
		return {
			tab: tabs[INITIAL_VALUES.EMPTY_ARRAY_INDEX],
		};
	},

	getHistory: async (
		request: GetHistoryRequest,
	): Promise<GetHistoryResponse> => {
		const {
			startTime,
			endTime,
			maxResults = DATA_LIMITS.DEFAULT_HISTORY_LIMIT,
		} = request;

		const historyItems = await chrome.history.search({
			text: "",
			startTime: startTime || Date.now() - DATE_CONSTANTS.WEEK_IN_MS,
			endTime: endTime || Date.now(),
			maxResults: maxResults,
		});

		const sortedHistory = historyItems.sort((a, b) => {
			return (
				(b.lastVisitTime || INITIAL_VALUES.ZERO) -
				(a.lastVisitTime || INITIAL_VALUES.ZERO)
			);
		});

		return {
			history: sortedHistory,
		};
	},

	saveBrowsingActivity: async (
		request: SaveBrowsingActivityRequest,
	): Promise<SaveBrowsingActivityResponse> => {
		const activity: BrowsingActivity = request.data;

		try {
			const id = await dbManager.saveBrowsingActivity(activity);
			console.log("Activity saved with ID:", id);

			const domainActivities = await dbManager.getBrowsingActivities({
				domain: activity.domain,
				startTime: Date.now() - DATE_CONSTANTS.WEEK_IN_MS,
			});

			const interestScore = calculateInterestScore(domainActivities);
			const factors = getInterestFactors(domainActivities);

			await dbManager.updateInterestScore({
				domain: activity.domain,
				score: interestScore,
				factors,
				lastUpdated: Date.now(),
			});

			console.log(
				`Interest score updated for ${activity.domain}: ${interestScore}`,
			);
			return {
				success: true,
				id,
			};
		} catch (error) {
			console.error("Failed to save activity:", error);
			return {
				success: false,
				error: getErrorMessage(error),
			};
		}
	},

	getBrowsingData: async (
		request: GetBrowsingDataRequest,
	): Promise<GetBrowsingDataResponse> => {
		const { domain, startTime, endTime, limit } = request;

		try {
			const activities = await dbManager.getBrowsingActivities({
				domain,
				startTime,
				endTime,
				limit,
			});
			return {
				activities,
			};
		} catch (error) {
			console.error("Failed to get browsing data:", error);
			return {
				activities: [],
				error: getErrorMessage(error),
			};
		}
	},

	getInterestScores: async (
		_request: GetInterestScoresRequest,
	): Promise<GetInterestScoresResponse> => {
		try {
			const scores = await dbManager.getInterestScores();
			return {
				scores,
			};
		} catch (error) {
			console.error("Failed to get interest scores:", error);
			return {
				scores: [],
				error: getErrorMessage(error),
			};
		}
	},
});
