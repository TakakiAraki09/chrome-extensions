import Dexie, { type Table } from "dexie";
import type { BrowsingActivity, InterestScore } from "../types";

export interface DatabaseSchema {
	browsingActivities: BrowsingActivity & { id?: number };
	interestScores: InterestScore & { id?: number };
}

export interface QueryOptions {
	domain?: string;
	startTime?: number;
	endTime?: number;
	limit?: number;
}

class BrowsingTrackerDB extends Dexie {
	browsingActivities!: Table<BrowsingActivity & { id?: number }>;
	interestScores!: Table<InterestScore & { id?: number }>;

	constructor() {
		super("BrowsingTracker");
		this.version(1).stores({
			browsingActivities: "++id, domain, url, startTime",
			interestScores: "++id, domain, score",
		});
	}
}

export interface IndexedDBManagerInstance {
	init: () => Promise<void>;
	saveBrowsingActivity: (activity: BrowsingActivity) => Promise<number>;
	updateInterestScore: (score: InterestScore) => Promise<void>;
	getBrowsingActivities: (
		options?: QueryOptions,
	) => Promise<BrowsingActivity[]>;
	getInterestScores: () => Promise<InterestScore[]>;
}

export function createIndexedDBManager(): IndexedDBManagerInstance {
	const db = new BrowsingTrackerDB();

	const init = async (): Promise<void> => {
		await db.open();
	};

	const saveBrowsingActivity = async (
		activity: BrowsingActivity,
	): Promise<number> => {
		return await db.browsingActivities.add(activity);
	};

	const updateInterestScore = async (score: InterestScore): Promise<void> => {
		const existing = await db.interestScores
			.where("domain")
			.equals(score.domain)
			.first();

		if (existing) {
			await db.interestScores.put({ ...score, id: existing.id });
		} else {
			await db.interestScores.add(score);
		}
	};

	const getBrowsingActivities = async (
		options: QueryOptions = {},
	): Promise<BrowsingActivity[]> => {
		let collection = db.browsingActivities.toCollection();

		if (options.domain) {
			collection = db.browsingActivities.where("domain").equals(options.domain);
		}

		let results = await collection.toArray();

		if (options.startTime || options.endTime) {
			results = results.filter((activity) => {
				if (options.startTime && activity.startTime < options.startTime)
					return false;
				if (options.endTime && activity.startTime > options.endTime)
					return false;
				return true;
			});
		}

		results.sort((a, b) => b.startTime - a.startTime);

		if (options.limit) {
			results = results.slice(0, options.limit);
		}

		return results;
	};

	const getInterestScores = async (): Promise<InterestScore[]> => {
		const results = await db.interestScores.toArray();
		results.sort((a, b) => b.score - a.score);
		return results;
	};

	return {
		init,
		saveBrowsingActivity,
		updateInterestScore,
		getBrowsingActivities,
		getInterestScores,
	};
}
