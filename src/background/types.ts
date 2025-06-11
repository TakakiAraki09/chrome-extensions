import { z } from "zod";

export const BrowsingActivitySchema = z.object({
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
export const History = z.object({
	type: z.literal("History"),
	startTime: z.number().optional(),
	endTime: z.number().optional(),
	maxResults: z.number().optional(),
});
export const BrowsingData = z.object({
	type: z.literal("BrowsingData"),
	domain: z.string().optional(),
	startTime: z.number().optional(),
	endTime: z.number().optional(),
	limit: z.number().optional(),
});

export type BrowsingActivity = z.infer<typeof BrowsingActivitySchema>;

export interface InterestScore {
	domain: string;
	url?: string;
	score: number;
	factors: {
		timeWeight: number;
		scrollWeight: number;
		engagementWeight: number;
	};
	lastUpdated: number;
}
