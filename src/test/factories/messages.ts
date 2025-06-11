/**
 * メッセージ関連のテストデータファクトリー
 * 各種リクエスト・レスポンス型のファクトリーを提供
 */

import type {
	ButtonClickedRequest,
	GetBrowsingDataRequest,
	GetHistoryRequest,
	GetInterestScoresRequest,
	GetTabInfoRequest,
	MessageRequest,
	SaveBrowsingActivityRequest,
} from "../../shared/messages";
import { createBrowsingActivity } from "./browsingActivity";
import { createHistoryItem, createTab } from "./chromeApi";
import { createTimeRange, getTimeAgo, randomDomain, randomInt } from "./common";
import { createInterestScore } from "./interestScore";

/**
 * GetInterestScoresRequest ファクトリー
 */
export const createGetInterestScoresRequest = (
	overrides?: Partial<GetInterestScoresRequest>,
): GetInterestScoresRequest => {
	return {
		action: "getInterestScores",
		...overrides,
	};
};

/**
 * GetBrowsingDataRequest ファクトリー
 */
export const createGetBrowsingDataRequest = (
	overrides?: Partial<GetBrowsingDataRequest>,
): GetBrowsingDataRequest => {
	const timeRange = createTimeRange();

	return {
		action: "getBrowsingData",
		domain: randomDomain(),
		startTime: timeRange.startTime,
		endTime: timeRange.endTime,
		limit: randomInt(10, 100),
		...overrides,
	};
};

/**
 * GetHistoryRequest ファクトリー
 */
export const createGetHistoryRequest = (
	overrides?: Partial<GetHistoryRequest>,
): GetHistoryRequest => {
	const timeRange = createTimeRange();

	return {
		action: "getHistory",
		startTime: timeRange.startTime,
		endTime: timeRange.endTime,
		maxResults: randomInt(50, 2000),
		...overrides,
	};
};

/**
 * SaveBrowsingActivityRequest ファクトリー
 */
export const createSaveBrowsingActivityRequest = (
	overrides?: Partial<SaveBrowsingActivityRequest>,
): SaveBrowsingActivityRequest => {
	return {
		action: "saveBrowsingActivity",
		data: createBrowsingActivity(),
		...overrides,
	};
};

/**
 * GetTabInfoRequest ファクトリー
 */
export const createGetTabInfoRequest = (
	overrides?: Partial<GetTabInfoRequest>,
): GetTabInfoRequest => {
	return {
		action: "getTabInfo",
		...overrides,
	};
};

/**
 * ButtonClickedRequest ファクトリー
 */
export const createButtonClickedRequest = (
	overrides?: Partial<ButtonClickedRequest>,
): ButtonClickedRequest => {
	return {
		action: "buttonClicked",
		...overrides,
	};
};

/**
 * 特定のパターンのリクエストを生成するヘルパー
 */

/** 最小限のパラメータでのGetBrowsingDataRequest */
export const createMinimalGetBrowsingDataRequest =
	(): GetBrowsingDataRequest => {
		return {
			action: "getBrowsingData",
		};
	};

/** 特定ドメインのGetBrowsingDataRequest */
export const createDomainSpecificBrowsingDataRequest = (
	domain: string,
	overrides?: Partial<GetBrowsingDataRequest>,
): GetBrowsingDataRequest => {
	return createGetBrowsingDataRequest({
		domain,
		...overrides,
	});
};

/** 時間範囲指定のGetBrowsingDataRequest */
export const createTimeRangeSpecificBrowsingDataRequest = (
	startTime: number,
	endTime: number,
	overrides?: Partial<GetBrowsingDataRequest>,
): GetBrowsingDataRequest => {
	return createGetBrowsingDataRequest({
		startTime,
		endTime,
		...overrides,
	});
};

/** 最小限のパラメータでのGetHistoryRequest */
export const createMinimalGetHistoryRequest = (): GetHistoryRequest => {
	return {
		action: "getHistory",
	};
};

/** 最近1時間のGetHistoryRequest */
export const createRecentHistoryRequest = (): GetHistoryRequest => {
	return createGetHistoryRequest({
		startTime: getTimeAgo(3600000), // 1時間前
		endTime: Date.now(),
		maxResults: 100,
	});
};

/** 今日のGetHistoryRequest */
export const createTodayHistoryRequest = (): GetHistoryRequest => {
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	return createGetHistoryRequest({
		startTime: today.getTime(),
		endTime: Date.now(),
		maxResults: 1000,
	});
};

/** 過去1週間のGetHistoryRequest */
export const createWeeklyHistoryRequest = (): GetHistoryRequest => {
	return createGetHistoryRequest({
		startTime: getTimeAgo(604800000), // 1週間前
		endTime: Date.now(),
		maxResults: 2000,
	});
};

/**
 * レスポンス用のファクトリー
 */

/** GetInterestScoresResponse */
export const createGetInterestScoresResponse = (count = 5) => {
	return {
		scores: Array.from({ length: count }, () => createInterestScore()),
	};
};

/** GetBrowsingDataResponse */
export const createGetBrowsingDataResponse = (count = 10) => {
	return {
		activities: Array.from({ length: count }, () => createBrowsingActivity()),
	};
};

/** GetHistoryResponse */
export const createGetHistoryResponse = (count = 20) => {
	return {
		history: Array.from({ length: count }, () => createHistoryItem()),
	};
};

/** SaveBrowsingActivityResponse（成功） */
export const createSuccessfulSaveResponse = (id = randomInt(1, 999999)) => {
	return {
		success: true,
		id,
	};
};

/** SaveBrowsingActivityResponse（失敗） */
export const createFailedSaveResponse = (error = "Database error") => {
	return {
		success: false,
		error,
	};
};

/** GetTabInfoResponse */
export const createGetTabInfoResponse = () => {
	return {
		tab: createTab(),
	};
};

/**
 * エラーレスポンス用のファクトリー
 */
export const createErrorResponse = (error = "Unknown error occurred") => {
	return {
		error,
	};
};

export const createDatabaseErrorResponse = () => {
	return createErrorResponse("Database connection failed");
};

export const createValidationErrorResponse = () => {
	return createErrorResponse("Invalid request format");
};

export const createPermissionErrorResponse = () => {
	return createErrorResponse("Permission denied");
};

/**
 * ランダムなメッセージリクエストを生成
 */
export const createRandomMessageRequest = (): MessageRequest => {
	const requestTypes = [
		() => createGetInterestScoresRequest(),
		() => createGetBrowsingDataRequest(),
		() => createGetHistoryRequest(),
		() => createSaveBrowsingActivityRequest(),
		() => createGetTabInfoRequest(),
		() => createButtonClickedRequest(),
	];

	const randomIndex = Math.floor(Math.random() * requestTypes.length);
	return requestTypes[randomIndex]();
};

/**
 * 複数のメッセージリクエストを生成
 */
export const createMessageRequestSequence = (
	count: number,
): MessageRequest[] => {
	return Array.from({ length: count }, () => createRandomMessageRequest());
};

/**
 * 実際のテストシナリオを想定したリクエスト群
 */

/** ポップアップ初期化シナリオ */
export const createPopupInitializationRequests = () => {
	return [
		createGetTabInfoRequest(),
		createGetInterestScoresRequest(),
		createGetBrowsingDataRequest({ limit: 50 }),
	];
};

/** データ同期シナリオ */
export const createDataSyncRequests = (activityCount = 5) => {
	const saveRequests = Array.from({ length: activityCount }, () =>
		createSaveBrowsingActivityRequest(),
	);

	return [...saveRequests, createGetInterestScoresRequest()];
};

/** 履歴分析シナリオ */
export const createHistoryAnalysisRequests = () => {
	return [
		createTodayHistoryRequest(),
		createWeeklyHistoryRequest(),
		createGetBrowsingDataRequest({ startTime: getTimeAgo(604800000) }),
		createGetInterestScoresRequest(),
	];
};
