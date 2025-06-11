/**
 * BrowsingActivity テストデータファクトリー
 */

import type { BrowsingActivity } from "../../background/types";
import { BrowsingActivitySchema } from "../../background/types";
import {
	createSequence,
	createTimeRange,
	getTimeAgo,
	randomDomain,
	randomFloat,
	randomInt,
	randomTitle,
	randomUrl,
	validateWithSchema,
} from "./common";

/**
 * デフォルトの BrowsingActivity を作成
 */
export const createBrowsingActivity = (
	overrides?: Partial<BrowsingActivity>,
): BrowsingActivity => {
	const domain = overrides?.domain || randomDomain();
	const startTime =
		overrides?.startTime || getTimeAgo(randomInt(300000, 3600000)); // 5分〜1時間前
	const focusTime = overrides?.focusTime || randomInt(10000, 300000); // 10秒〜5分
	const idleTime = overrides?.idleTime || randomInt(0, focusTime / 2); // フォーカス時間の半分以下
	const endTime = overrides?.endTime || startTime + focusTime + idleTime;

	const activity: BrowsingActivity = {
		url: randomUrl(domain),
		title: randomTitle(),
		domain,
		startTime,
		endTime,
		scrollDepth: randomFloat(0, 100, 1),
		maxScrollDepth: randomFloat(50, 100, 1),
		totalScrollDistance: randomInt(0, 2000),
		focusTime,
		idleTime,
		...overrides,
	};

	return validateWithSchema(BrowsingActivitySchema, activity);
};

/**
 * 特定のパターンのBrowsingActivityを生成するヘルパー
 */

/** 短時間の閲覧アクティビティ（5-30秒） */
export const createShortBrowsingActivity = (
	overrides?: Partial<BrowsingActivity>,
): BrowsingActivity => {
	const focusTime = randomInt(5000, 30000);
	return createBrowsingActivity({
		focusTime,
		idleTime: randomInt(0, 5000),
		scrollDepth: randomFloat(0, 30, 1),
		maxScrollDepth: randomFloat(0, 40, 1),
		totalScrollDistance: randomInt(0, 200),
		...overrides,
	});
};

/** 長時間の閲覧アクティビティ（5-30分） */
export const createLongBrowsingActivity = (
	overrides?: Partial<BrowsingActivity>,
): BrowsingActivity => {
	const focusTime = randomInt(300000, 1800000); // 5-30分
	return createBrowsingActivity({
		focusTime,
		idleTime: randomInt(0, focusTime / 3),
		scrollDepth: randomFloat(50, 100, 1),
		maxScrollDepth: randomFloat(70, 100, 1),
		totalScrollDistance: randomInt(500, 5000),
		...overrides,
	});
};

/** 高エンゲージメントのアクティビティ */
export const createHighEngagementActivity = (
	overrides?: Partial<BrowsingActivity>,
): BrowsingActivity => {
	const focusTime = randomInt(120000, 600000); // 2-10分
	return createBrowsingActivity({
		focusTime,
		idleTime: randomInt(0, focusTime / 10), // アイドル時間は少なめ
		scrollDepth: randomFloat(80, 100, 1),
		maxScrollDepth: randomFloat(90, 100, 1),
		totalScrollDistance: randomInt(1000, 3000),
		...overrides,
	});
};

/** 低エンゲージメントのアクティビティ */
export const createLowEngagementActivity = (
	overrides?: Partial<BrowsingActivity>,
): BrowsingActivity => {
	const totalTime = randomInt(30000, 120000); // 30秒-2分
	const idleTime = randomInt(totalTime / 2, totalTime * 0.8); // アイドル時間が多め
	const focusTime = totalTime - idleTime;

	return createBrowsingActivity({
		focusTime: Math.max(focusTime, 5000), // 最低5秒
		idleTime,
		scrollDepth: randomFloat(0, 20, 1),
		maxScrollDepth: randomFloat(0, 30, 1),
		totalScrollDistance: randomInt(0, 100),
		...overrides,
	});
};

/** 進行中のアクティビティ（endTimeなし） */
export const createOngoingActivity = (
	overrides?: Partial<BrowsingActivity>,
): BrowsingActivity => {
	const activity = createBrowsingActivity({
		startTime: getTimeAgo(randomInt(60000, 600000)), // 1-10分前開始
		endTime: undefined,
		...overrides,
	});

	// endTimeを削除
	const { endTime, ...ongoingActivity } = activity;
	return ongoingActivity as BrowsingActivity;
};

/** 同一ドメインの複数アクティビティ */
export const createBrowsingActivitySequence = (
	count: number,
	baseOverrides?: Partial<BrowsingActivity>,
): BrowsingActivity[] => {
	return createSequence(createBrowsingActivity, {
		count,
		baseData: baseOverrides,
		transform: (activity, index) => ({
			...activity,
			startTime: activity.startTime + index * 300000, // 5分間隔
		}),
	});
};

/** 時系列に沿った複数アクティビティ */
export const createTimeOrderedActivities = (
	count: number,
	timeRange = createTimeRange(),
	baseOverrides?: Partial<BrowsingActivity>,
): BrowsingActivity[] => {
	const { startTime, endTime } = timeRange;
	const timeStep = (endTime - startTime) / count;

	return createSequence(createBrowsingActivity, {
		count,
		baseData: baseOverrides,
		transform: (activity, index) => {
			const activityStartTime = startTime + index * timeStep;
			const activityDuration = activity.focusTime + activity.idleTime;

			return {
				...activity,
				startTime: activityStartTime,
				endTime: activityStartTime + activityDuration,
			};
		},
	});
};

/** 特定ドメインのアクティビティ群 */
export const createDomainActivities = (
	domain: string,
	count: number,
	overrides?: Partial<BrowsingActivity>,
): BrowsingActivity[] => {
	return createSequence(createBrowsingActivity, {
		count,
		baseData: { domain, ...overrides },
		transform: (activity, index) => ({
			...activity,
			url: randomUrl(domain),
			title: `${randomTitle()} - Page ${index + 1}`,
		}),
	});
};

/** 様々なエンゲージメントレベルのアクティビティ群 */
export const createMixedEngagementActivities = (
	count: number,
): BrowsingActivity[] => {
	const activities: BrowsingActivity[] = [];

	for (let i = 0; i < count; i++) {
		const rand = Math.random();
		if (rand < 0.3) {
			activities.push(createLowEngagementActivity());
		} else if (rand < 0.7) {
			activities.push(createBrowsingActivity());
		} else {
			activities.push(createHighEngagementActivity());
		}
	}

	// 時系列順にソート
	return activities.sort((a, b) => a.startTime - b.startTime);
};
