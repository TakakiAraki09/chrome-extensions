import { z } from "zod";
import type { BrowsingActivity, InterestScore } from "../background/types";

// Base message interface
export interface BaseMessage {
	action: string;
}

// Request messages
export interface GetTabInfoRequest extends BaseMessage {
	action: "getTabInfo";
}

export interface GetHistoryRequest extends BaseMessage {
	action: "getHistory";
	startTime?: number;
	endTime?: number;
	maxResults?: number;
}

export interface SaveBrowsingActivityRequest extends BaseMessage {
	action: "saveBrowsingActivity";
	data: BrowsingActivity;
}

export interface GetBrowsingDataRequest extends BaseMessage {
	action: "getBrowsingData";
	domain?: string;
	startTime?: number;
	endTime?: number;
	limit?: number;
}

export interface GetInterestScoresRequest extends BaseMessage {
	action: "getInterestScores";
}

export interface ButtonClickedRequest extends BaseMessage {
	action: "buttonClicked";
}

// Union type for all request messages
export type MessageRequest =
	| GetTabInfoRequest
	| GetHistoryRequest
	| SaveBrowsingActivityRequest
	| GetBrowsingDataRequest
	| GetInterestScoresRequest
	| ButtonClickedRequest;

// Response types
export interface GetTabInfoResponse {
	tab: chrome.tabs.Tab;
}

export interface GetHistoryResponse {
	history: chrome.history.HistoryItem[];
}

export interface SaveBrowsingActivityResponse {
	success: boolean;
	id?: number;
	error?: string;
}

export interface GetBrowsingDataResponse {
	activities: BrowsingActivity[];
	error?: string;
}

export interface GetInterestScoresResponse {
	scores: InterestScore[];
	error?: string;
}

export type ButtonClickedResponse = Record<string, never>;

export interface ErrorResponse {
	error: string;
}

// Union type for all response messages
export type MessageResponse =
	| GetTabInfoResponse
	| GetHistoryResponse
	| SaveBrowsingActivityResponse
	| GetBrowsingDataResponse
	| GetInterestScoresResponse
	| ButtonClickedResponse
	| ErrorResponse;

// Type-safe message handler type
export type MessageHandler<
	T extends MessageRequest,
	R extends MessageResponse,
> = (request: T, sender: chrome.runtime.MessageSender) => Promise<R>;

// Message type mapping for type inference
export interface MessageTypeMap {
	getTabInfo: {
		request: GetTabInfoRequest;
		response: GetTabInfoResponse;
	};
	getHistory: {
		request: GetHistoryRequest;
		response: GetHistoryResponse;
	};
	saveBrowsingActivity: {
		request: SaveBrowsingActivityRequest;
		response: SaveBrowsingActivityResponse;
	};
	getBrowsingData: {
		request: GetBrowsingDataRequest;
		response: GetBrowsingDataResponse;
	};
	getInterestScores: {
		request: GetInterestScoresRequest;
		response: GetInterestScoresResponse;
	};
	buttonClicked: {
		request: ButtonClickedRequest;
		response: ButtonClickedResponse;
	};
}

// Zod schemas for response validation
const BrowsingActivitySchema = z.object({
	url: z.string(),
	title: z.string(),
	domain: z.string(),
	startTime: z.number(),
	endTime: z.number().optional(),
	scrollDepth: z.number(),
	maxScrollDepth: z.number(),
	totalScrollDistance: z.number(),
	focusTime: z.number(),
	idleTime: z.number(),
});

const InterestScoreSchema = z.object({
	domain: z.string(),
	url: z.string().optional(),
	score: z.number(),
	factors: z.object({
		timeWeight: z.number(),
		scrollWeight: z.number(),
		engagementWeight: z.number(),
	}),
	lastUpdated: z.number(),
});

const ChromeTabSchema = z.object({
	id: z.number().optional(),
	index: z.number(),
	windowId: z.number(),
	url: z.string().optional(),
	title: z.string().optional(),
	favIconUrl: z.string().optional(),
	status: z.string().optional(),
	active: z.boolean(),
	highlighted: z.boolean(),
	pinned: z.boolean(),
	selected: z.boolean(),
	audible: z.boolean().optional(),
	discarded: z.boolean(),
	autoDiscardable: z.boolean(),
	incognito: z.boolean(),
	width: z.number().optional(),
	height: z.number().optional(),
	sessionId: z.string().optional(),
});

const ChromeHistoryItemSchema = z.object({
	id: z.string(),
	url: z.string().optional(),
	title: z.string().optional(),
	lastVisitTime: z.number().optional(),
	visitCount: z.number().optional(),
	typedCount: z.number().optional(),
});

const GetTabInfoResponseSchema = z.object({
	tab: ChromeTabSchema,
});

const GetHistoryResponseSchema = z.object({
	history: z.array(ChromeHistoryItemSchema),
});

const SaveBrowsingActivityResponseSchema = z.object({
	success: z.boolean(),
	id: z.number().optional(),
	error: z.string().optional(),
});

const GetBrowsingDataResponseSchema = z.object({
	activities: z.array(BrowsingActivitySchema),
	error: z.string().optional(),
});

const GetInterestScoresResponseSchema = z.object({
	scores: z.array(InterestScoreSchema),
	error: z.string().optional(),
});

const ButtonClickedResponseSchema = z.object({});

// Response schema mapping
const ResponseSchemas = {
	getTabInfo: GetTabInfoResponseSchema,
	getHistory: GetHistoryResponseSchema,
	saveBrowsingActivity: SaveBrowsingActivityResponseSchema,
	getBrowsingData: GetBrowsingDataResponseSchema,
	getInterestScores: GetInterestScoresResponseSchema,
	buttonClicked: ButtonClickedResponseSchema,
} as const;

// Type-safe sendMessage function with validation
export async function sendMessage<T extends MessageRequest>(
	message: T,
): Promise<
	T extends {
		action: infer A;
	}
		? A extends keyof MessageTypeMap
			? MessageTypeMap[A]["response"]
			: never
		: never
> {
	const response: unknown = await chrome.runtime.sendMessage(message);
	const action = message.action as keyof MessageTypeMap;
	const schema = ResponseSchemas[action];
	const result = schema.safeParse(response);

	if (!result.success) {
		console.error(`Invalid response for ${message.action}:`, result.error);
		throw new Error(`Invalid response format for ${message.action}`);
	}

	return result.data as T extends {
		action: infer A;
	}
		? A extends keyof MessageTypeMap
			? MessageTypeMap[A]["response"]
			: never
		: never;
}
