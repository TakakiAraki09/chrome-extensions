import type {
	GetBrowsingDataRequest,
	GetHistoryRequest,
	GetInterestScoresRequest,
	GetTabInfoRequest,
	MessageRequest,
	MessageResponse,
	SaveBrowsingActivityRequest,
} from "../../shared/messages";
import { RequestSchema } from "../../shared/schema/actions";
import { unreachable } from "../../shared/utils";
import type { createMessageHandlers } from "./createMessageHandlers";

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
					return unreachable(validatedRequest, "Unknown action type");
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
