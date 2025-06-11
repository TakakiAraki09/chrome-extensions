/**
 * Chrome API 関連のテストデータファクトリー
 * Tab と HistoryItem のファクトリーを提供
 */

import {
	createSequence,
	getTimeAgo,
	randomDomain,
	randomInt,
	randomString,
	randomTitle,
	randomUrl,
} from "./common";

/**
 * Chrome Tab オブジェクトを作成
 */
export const createTab = (
	overrides?: Partial<chrome.tabs.Tab>,
): chrome.tabs.Tab => {
	const id = overrides?.id || randomInt(1, 999999);
	const url = overrides?.url || randomUrl();

	return {
		id,
		index: randomInt(0, 10),
		windowId: randomInt(1, 100),
		highlighted: false,
		active: false,
		pinned: false,
		audible: false,
		discarded: false,
		autoDiscardable: true,
		mutedInfo: { muted: false },
		incognito: false,
		width: 1920,
		height: 1080,
		sessionId: randomString(10),
		url,
		title: randomTitle(),
		favIconUrl: `${new URL(url).origin}/favicon.ico`,
		status: "complete",
		selected: false,
		lastAccessed: Date.now(),
		groupId: -1,
		...overrides,
	} as chrome.tabs.Tab;
};

/**
 * 特定のパターンのTabを生成するヘルパー
 */

/** アクティブなタブ */
export const createActiveTab = (
	overrides?: Partial<chrome.tabs.Tab>,
): chrome.tabs.Tab => {
	return createTab({
		active: true,
		highlighted: true,
		index: 0,
		...overrides,
	});
};

/** ピン留めされたタブ */
export const createPinnedTab = (
	overrides?: Partial<chrome.tabs.Tab>,
): chrome.tabs.Tab => {
	return createTab({
		pinned: true,
		index: randomInt(0, 3), // ピン留めタブは通常最初の方
		width: 48, // ピン留めタブは幅が狭い
		...overrides,
	});
};

/** ローディング中のタブ */
export const createLoadingTab = (
	overrides?: Partial<chrome.tabs.Tab>,
): chrome.tabs.Tab => {
	return createTab({
		status: "loading",
		title: "Loading...",
		favIconUrl: undefined,
		...overrides,
	});
};

/** 音声再生中のタブ */
export const createAudibleTab = (
	overrides?: Partial<chrome.tabs.Tab>,
): chrome.tabs.Tab => {
	return createTab({
		audible: true,
		mutedInfo: { muted: false },
		...overrides,
	});
};

/** ミュートされたタブ */
export const createMutedTab = (
	overrides?: Partial<chrome.tabs.Tab>,
): chrome.tabs.Tab => {
	return createTab({
		audible: true,
		mutedInfo: { muted: true },
		...overrides,
	});
};

/** シークレットモードのタブ */
export const createIncognitoTab = (
	overrides?: Partial<chrome.tabs.Tab>,
): chrome.tabs.Tab => {
	return createTab({
		incognito: true,
		...overrides,
	});
};

/** タブのシーケンス */
export const createTabSequence = (
	count: number,
	baseOverrides?: Partial<chrome.tabs.Tab>,
): chrome.tabs.Tab[] => {
	return createSequence(createTab, {
		count,
		baseData: baseOverrides,
		transform: (tab, index) => ({
			...tab,
			id: (tab.id || 1) + index,
			index,
			active: index === 0, // 最初のタブをアクティブに
		}),
	});
};

/**
 * Chrome HistoryItem オブジェクトを作成
 */
export const createHistoryItem = (
	overrides?: Partial<chrome.history.HistoryItem>,
): chrome.history.HistoryItem => {
	const url = overrides?.url || randomUrl();

	return {
		id: randomString(16),
		url,
		title: randomTitle(),
		lastVisitTime: getTimeAgo(randomInt(0, 2592000000)), // 0-30日前
		visitCount: randomInt(1, 50),
		typedCount: randomInt(0, 10),
		...overrides,
	};
};

/**
 * 特定のパターンのHistoryItemを生成するヘルパー
 */

/** よく訪問される履歴項目 */
export const createFrequentHistoryItem = (
	overrides?: Partial<chrome.history.HistoryItem>,
): chrome.history.HistoryItem => {
	return createHistoryItem({
		visitCount: randomInt(20, 100),
		typedCount: randomInt(5, 20),
		lastVisitTime: getTimeAgo(randomInt(0, 86400000)), // 最近1日以内
		...overrides,
	});
};

/** 最近訪問された履歴項目 */
export const createRecentHistoryItem = (
	overrides?: Partial<chrome.history.HistoryItem>,
): chrome.history.HistoryItem => {
	return createHistoryItem({
		lastVisitTime: getTimeAgo(randomInt(0, 3600000)), // 1時間以内
		visitCount: randomInt(1, 5),
		...overrides,
	});
};

/** 古い履歴項目 */
export const createOldHistoryItem = (
	overrides?: Partial<chrome.history.HistoryItem>,
): chrome.history.HistoryItem => {
	return createHistoryItem({
		lastVisitTime: getTimeAgo(randomInt(2592000000, 31536000000)), // 1ヶ月-1年前
		visitCount: randomInt(1, 10),
		typedCount: randomInt(0, 2),
		...overrides,
	});
};

/** 直接入力で訪問された履歴項目 */
export const createTypedHistoryItem = (
	overrides?: Partial<chrome.history.HistoryItem>,
): chrome.history.HistoryItem => {
	return createHistoryItem({
		typedCount: randomInt(5, 15),
		visitCount: randomInt(10, 30),
		...overrides,
	});
};

/** 一度だけ訪問された履歴項目 */
export const createSingleVisitHistoryItem = (
	overrides?: Partial<chrome.history.HistoryItem>,
): chrome.history.HistoryItem => {
	return createHistoryItem({
		visitCount: 1,
		typedCount: randomInt(0, 1),
		...overrides,
	});
};

/** 履歴項目のシーケンス */
export const createHistoryItemSequence = (
	count: number,
	baseOverrides?: Partial<chrome.history.HistoryItem>,
): chrome.history.HistoryItem[] => {
	return createSequence(createHistoryItem, {
		count,
		baseData: baseOverrides,
		transform: (item, index) => ({
			...item,
			id: `${item.id}_${index}`,
			lastVisitTime: getTimeAgo(index * 3600000), // 1時間間隔
		}),
	});
};

/** 特定ドメインの履歴項目群 */
export const createDomainHistoryItems = (
	domain: string,
	count: number,
	overrides?: Partial<chrome.history.HistoryItem>,
): chrome.history.HistoryItem[] => {
	return createSequence(createHistoryItem, {
		count,
		baseData: overrides,
		transform: (item, index) => ({
			...item,
			url: `https://${domain}/page${index + 1}`,
			title: `${domain} - Page ${index + 1}`,
		}),
	});
};

/** 時系列に沿った履歴項目群 */
export const createChronologicalHistory = (
	count: number,
	startTime?: number,
	timeStep = 3600000, // 1時間間隔
): chrome.history.HistoryItem[] => {
	const baseTime = startTime || getTimeAgo(count * timeStep);

	return createSequence(createHistoryItem, {
		count,
		transform: (item, index) => ({
			...item,
			lastVisitTime: baseTime + index * timeStep,
		}),
	});
};

/** 様々な訪問パターンの履歴群 */
export const createMixedHistoryItems = (
	count: number,
): chrome.history.HistoryItem[] => {
	const items: chrome.history.HistoryItem[] = [];

	for (let i = 0; i < count; i++) {
		const rand = Math.random();
		if (rand < 0.2) {
			items.push(createFrequentHistoryItem());
		} else if (rand < 0.4) {
			items.push(createRecentHistoryItem());
		} else if (rand < 0.6) {
			items.push(createTypedHistoryItem());
		} else if (rand < 0.8) {
			items.push(createSingleVisitHistoryItem());
		} else {
			items.push(createOldHistoryItem());
		}
	}

	// 最新訪問時刻順にソート
	return items.sort((a, b) => (b.lastVisitTime || 0) - (a.lastVisitTime || 0));
};
