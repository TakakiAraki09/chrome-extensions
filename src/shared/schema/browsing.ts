import { z } from "zod";

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

const HistorySchema = z.object({
	type: z.literal("History"),
	startTime: z.number().optional(),
	endTime: z.number().optional(),
	maxResults: z.number().optional(),
});

const BrowsingSchema = z.object({
	type: z.literal("Browsing"),
	domain: z.string().optional(),
	startTime: z.number().optional(),
	endTime: z.number().optional(),
	limit: z.number().optional(),
});

const InterestSchema = z.object({
	type: z.literal("Interest"),
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

export const BrowserSchema = {
	BrowsingActivitySchema,
	HistorySchema,
	BrowsingSchema,
	InterestSchema,
	UnionSchema: z.union([
		BrowsingActivitySchema,
		HistorySchema,
		BrowsingSchema,
		InterestSchema,
	]),
};

export type Browser = {
	BrowsingActivity: z.infer<typeof BrowsingActivitySchema>;
	History: z.infer<typeof HistorySchema>;
	Browsing: z.infer<typeof BrowsingSchema>;
	Interest: z.infer<typeof InterestSchema>;
};
