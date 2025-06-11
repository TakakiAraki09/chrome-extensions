import type {
	GetBrowsingDataRequest,
	GetBrowsingDataResponse,
	GetHistoryRequest,
	GetHistoryResponse,
	GetInterestScoresRequest,
	GetInterestScoresResponse,
	GetTabInfoRequest,
	GetTabInfoResponse,
	MessageRequest,
	MessageResponse,
	SaveBrowsingActivityRequest,
	SaveBrowsingActivityResponse,
} from "../../shared/messages";
import { RequestSchema } from "../../shared/schema/actions";
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
		const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
		return { tab: tabs[0] };
	},

	getHistory: async (
		request: GetHistoryRequest,
	): Promise<GetHistoryResponse> => {
		const { startTime, endTime, maxResults = 100 } = request;

		const historyItems = await chrome.history.search({
			text: "",
			startTime: startTime || Date.now() - 7 * 24 * 60 * 60 * 1000,
			endTime: endTime || Date.now(),
			maxResults: maxResults,
		});

		const sortedHistory = historyItems.sort((a, b) => {
			return (b.lastVisitTime || 0) - (a.lastVisitTime || 0);
		});

		return { history: sortedHistory };
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
				startTime: Date.now() - 7 * 24 * 60 * 60 * 1000, // Last 7 days
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
			return { success: true, id };
		} catch (error) {
			console.error("Failed to save activity:", error);
			return { success: false, error: getErrorMessage(error) };
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
			return { activities };
		} catch (error) {
			console.error("Failed to get browsing data:", error);
			return { activities: [], error: getErrorMessage(error) };
		}
	},

	getInterestScores: async (
		_request: GetInterestScoresRequest,
	): Promise<GetInterestScoresResponse> => {
		try {
			const scores = await dbManager.getInterestScores();
			return { scores };
		} catch (error) {
			console.error("Failed to get interest scores:", error);
			return { scores: [], error: getErrorMessage(error) };
		}
	},
});

export const handleMessage = (
	handlers: ReturnType<typeof createMessageHandlers>,
	request: MessageRequest,
	sendResponse: (response: MessageResponse) => void,
): boolean => {
	// Validate request with Zod
	const parseResult = RequestSchema.safeParse(request);
	if (!parseResult.success) {
		console.error("Invalid request format:", parseResult.error);
		sendResponse({ error: "Invalid request format" });
		return true;
	}

	// Use original request for type safety after Zod validation
	const validatedRequest = request;

	const processMessage = async () => {
		try {
			let response: MessageResponse;

			switch (validatedRequest.action) {
				case "getTabInfo":
					response = await handlers.getTabInfo(
						validatedRequest as GetTabInfoRequest,
					);
					break;
				case "getHistory":
					response = await handlers.getHistory(
						validatedRequest as GetHistoryRequest,
					);
					break;
				case "saveBrowsingActivity":
					response = await handlers.saveBrowsingActivity(
						validatedRequest as SaveBrowsingActivityRequest,
					);
					break;
				case "getBrowsingData":
					response = await handlers.getBrowsingData(
						validatedRequest as GetBrowsingDataRequest,
					);
					break;
				case "getInterestScores":
					response = await handlers.getInterestScores(
						validatedRequest as GetInterestScoresRequest,
					);
					break;
				case "buttonClicked":
					// No specific handler needed for buttonClicked
					response = {};
					break;
				default: {
					const unknownAction = validatedRequest.action || "unknown";
					console.warn(`Unknown action: ${unknownAction}`);
					response = { error: `Unknown action: ${unknownAction}` };
				}
			}

			sendResponse(response);
		} catch (error) {
			const action = validatedRequest.action || "unknown";
			console.error(`Error handling ${action}:`, error);
			sendResponse({ error: getErrorMessage(error) });
		}
	};

	processMessage();
	return true; // Indicates async response
};
