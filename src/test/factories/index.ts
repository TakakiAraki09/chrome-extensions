/**
 * テストデータファクトリー統合エクスポート
 *
 * すべてのファクトリー関数を一元的にエクスポートし、
 * テストファイルから簡単にインポートできるようにする
 *
 * @example
 * ```typescript
 * import { createBrowsingActivity, createInterestScore } from '../factories';
 *
 * const testActivity = createBrowsingActivity({ domain: 'example.com' });
 * const testScore = createInterestScore({ score: 85 });
 * ```
 */

// 共通ユーティリティ
export * from "./common";

// BrowsingActivity ファクトリー
export {
	createBrowsingActivity,
	createShortBrowsingActivity,
	createLongBrowsingActivity,
	createHighEngagementActivity,
	createLowEngagementActivity,
	createOngoingActivity,
	createBrowsingActivitySequence,
	createTimeOrderedActivities,
	createDomainActivities,
	createMixedEngagementActivities,
} from "./browsingActivity";

// InterestScore ファクトリー
export {
	createInterestScore,
	createHighInterestScore,
	createMediumInterestScore,
	createLowInterestScore,
	createTimeWeightedScore,
	createScrollWeightedScore,
	createEngagementWeightedScore,
	createDomainOnlyScore,
	createRecentlyUpdatedScore,
	createOldScore,
	createInterestScoreSequence,
	createDomainScores,
	createBalancedInterestScores,
	createTrendingScores,
} from "./interestScore";

// Chrome API ファクトリー
export {
	createTab,
	createActiveTab,
	createPinnedTab,
	createLoadingTab,
	createAudibleTab,
	createMutedTab,
	createIncognitoTab,
	createTabSequence,
	createHistoryItem,
	createFrequentHistoryItem,
	createRecentHistoryItem,
	createOldHistoryItem,
	createTypedHistoryItem,
	createSingleVisitHistoryItem,
	createHistoryItemSequence,
	createDomainHistoryItems,
	createChronologicalHistory,
	createMixedHistoryItems,
} from "./chromeApi";

// メッセージ ファクトリー
export {
	createGetInterestScoresRequest,
	createGetBrowsingDataRequest,
	createGetHistoryRequest,
	createSaveBrowsingActivityRequest,
	createGetTabInfoRequest,
	createButtonClickedRequest,
	createMinimalGetBrowsingDataRequest,
	createDomainSpecificBrowsingDataRequest,
	createTimeRangeSpecificBrowsingDataRequest,
	createMinimalGetHistoryRequest,
	createRecentHistoryRequest,
	createTodayHistoryRequest,
	createWeeklyHistoryRequest,
	createGetInterestScoresResponse,
	createGetBrowsingDataResponse,
	createGetHistoryResponse,
	createSuccessfulSaveResponse,
	createFailedSaveResponse,
	createGetTabInfoResponse,
	createErrorResponse,
	createDatabaseErrorResponse,
	createValidationErrorResponse,
	createPermissionErrorResponse,
	createRandomMessageRequest,
	createMessageRequestSequence,
	createPopupInitializationRequests,
	createDataSyncRequests,
	createHistoryAnalysisRequests,
} from "./messages";

/**
 * 関連データのセットを一括生成するヘルパー
 */

import type { BrowsingActivity, InterestScore } from "../../background/types";
import { createBrowsingActivity } from "./browsingActivity";
import { createHistoryItem, createTab } from "./chromeApi";
import { createInterestScore } from "./interestScore";

/** BrowsingActivityとそれに対応するInterestScoreを生成 */
export const createBrowsingActivityWithScore = (
	activityOverrides?: Partial<BrowsingActivity>,
	scoreOverrides?: Partial<InterestScore>,
) => {
	const activity = createBrowsingActivity(activityOverrides);
	const score = createInterestScore({
		domain: activity.domain,
		url: activity.url,
		...scoreOverrides,
	});

	return { activity, score };
};

/** 特定ドメインの完全なデータセット */
export const createDomainDataSet = (
	domain: string,
	activityCount = 5,
	withScore = true,
) => {
	const activities = Array.from({ length: activityCount }, (_, index) =>
		createBrowsingActivity({
			domain,
			url: `https://${domain}/page${index + 1}`,
			title: `${domain} - Page ${index + 1}`,
		}),
	);

	const score = withScore ? createInterestScore({ domain }) : undefined;

	return { domain, activities, score };
};

/** テスト用のモックデータベース */
export const createMockDatabase = (
	options: {
		activityCount?: number;
		scoreCount?: number;
		domainCount?: number;
	} = {},
) => {
	const { activityCount = 20, scoreCount = 10, domainCount = 5 } = options;

	// ユニークなドメインを生成
	const domains = Array.from(
		{ length: domainCount },
		(_, index) => `test-domain-${index + 1}.com`,
	);

	// 各ドメインに対してアクティビティを生成
	const activities: BrowsingActivity[] = [];
	const scores: InterestScore[] = [];

	domains.forEach((domain, domainIndex) => {
		// ドメインごとのアクティビティ数を計算
		const domainActivityCount = Math.ceil(activityCount / domainCount);

		for (
			let i = 0;
			i < domainActivityCount && activities.length < activityCount;
			i++
		) {
			activities.push(
				createBrowsingActivity({
					domain,
					url: `https://${domain}/page${i + 1}`,
				}),
			);
		}

		// ドメインのスコアを生成
		if (domainIndex < scoreCount) {
			scores.push(createInterestScore({ domain }));
		}
	});

	return {
		activities: activities.slice(0, activityCount),
		scores: scores.slice(0, scoreCount),
		domains,
	};
};

/**
 * 開発・デバッグ用のプリセット
 */

/** 開発用のサンプルデータ */
export const createDevelopmentData = () => {
	return createMockDatabase({
		activityCount: 50,
		scoreCount: 15,
		domainCount: 8,
	});
};

/** パフォーマンステスト用の大量データ */
export const createPerformanceTestData = () => {
	return createMockDatabase({
		activityCount: 1000,
		scoreCount: 100,
		domainCount: 50,
	});
};

/** 最小限のテストデータ */
export const createMinimalTestData = () => {
	return {
		activity: createBrowsingActivity(),
		score: createInterestScore(),
		tab: createTab(),
		historyItem: createHistoryItem(),
	};
};
