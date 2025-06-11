import { z } from "zod";
import { BrowserSchema } from "./browsing";

export const GetInterestScoresRequestSchema = z.object({
	action: z.literal("getInterestScores"),
});

export const GetBrowsingDataRequestSchema = z.object({
	action: z.literal("getBrowsingData"),
	domain: z.string().optional(),
	startTime: z.number().optional(),
	endTime: z.number().optional(),
	limit: z.number().optional(),
});

export const GetHistoryRequestSchema = z.object({
	action: z.literal("getHistory"),
	startTime: z.number().optional(),
	endTime: z.number().optional(),
	maxResults: z.number().optional(),
});

export const SaveBrowsingActivityRequestSchema = z.object({
	action: z.literal("saveBrowsingActivity"),
	data: z.object({
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
	}),
});

export const GetTabInfoRequestSchema = z.object({
	action: z.literal("getTabInfo"),
});

export const ButtonClickedRequestSchema = z.object({
	action: z.literal("buttonClicked"),
});

export const RequestSchema = z.union([
	GetInterestScoresRequestSchema,
	GetBrowsingDataRequestSchema,
	GetHistoryRequestSchema,
	SaveBrowsingActivityRequestSchema,
	GetTabInfoRequestSchema,
	ButtonClickedRequestSchema,
]);
