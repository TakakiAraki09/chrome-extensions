/**
 * InterestScore テストデータファクトリー
 */

import type { InterestScore } from "../../background/types";
import {
	createSequence,
	getTimeAgo,
	randomDomain,
	randomFloat,
	randomInt,
	randomUrl,
} from "./common";

/**
 * デフォルトの InterestScore を作成
 */
export const createInterestScore = (
	overrides?: Partial<InterestScore>,
): InterestScore => {
	const domain = overrides?.domain || randomDomain();

	return {
		domain,
		url: randomUrl(domain),
		score: randomInt(0, 100),
		factors: {
			timeWeight: randomFloat(0, 1),
			scrollWeight: randomFloat(0, 1),
			engagementWeight: randomFloat(0, 1),
		},
		lastUpdated: getTimeAgo(randomInt(0, 86400000)), // 0-24時間前
		...overrides,
	};
};

/**
 * 特定のパターンのInterestScoreを生成するヘルパー
 */

/** 高い興味スコア（70-100点） */
export const createHighInterestScore = (
	overrides?: Partial<InterestScore>,
): InterestScore => {
	return createInterestScore({
		score: randomInt(70, 100),
		factors: {
			timeWeight: randomFloat(0.7, 1),
			scrollWeight: randomFloat(0.6, 1),
			engagementWeight: randomFloat(0.8, 1),
		},
		...overrides,
	});
};

/** 中程度の興味スコア（30-70点） */
export const createMediumInterestScore = (
	overrides?: Partial<InterestScore>,
): InterestScore => {
	return createInterestScore({
		score: randomInt(30, 70),
		factors: {
			timeWeight: randomFloat(0.3, 0.7),
			scrollWeight: randomFloat(0.3, 0.7),
			engagementWeight: randomFloat(0.4, 0.8),
		},
		...overrides,
	});
};

/** 低い興味スコア（0-30点） */
export const createLowInterestScore = (
	overrides?: Partial<InterestScore>,
): InterestScore => {
	return createInterestScore({
		score: randomInt(0, 30),
		factors: {
			timeWeight: randomFloat(0, 0.4),
			scrollWeight: randomFloat(0, 0.4),
			engagementWeight: randomFloat(0, 0.5),
		},
		...overrides,
	});
};

/** 時間重視の興味スコア */
export const createTimeWeightedScore = (
	overrides?: Partial<InterestScore>,
): InterestScore => {
	return createInterestScore({
		score: randomInt(40, 80),
		factors: {
			timeWeight: randomFloat(0.8, 1), // 時間重みが高い
			scrollWeight: randomFloat(0.2, 0.5),
			engagementWeight: randomFloat(0.3, 0.6),
		},
		...overrides,
	});
};

/** スクロール重視の興味スコア */
export const createScrollWeightedScore = (
	overrides?: Partial<InterestScore>,
): InterestScore => {
	return createInterestScore({
		score: randomInt(40, 80),
		factors: {
			timeWeight: randomFloat(0.2, 0.5),
			scrollWeight: randomFloat(0.8, 1), // スクロール重みが高い
			engagementWeight: randomFloat(0.3, 0.6),
		},
		...overrides,
	});
};

/** エンゲージメント重視の興味スコア */
export const createEngagementWeightedScore = (
	overrides?: Partial<InterestScore>,
): InterestScore => {
	return createInterestScore({
		score: randomInt(50, 90),
		factors: {
			timeWeight: randomFloat(0.3, 0.6),
			scrollWeight: randomFloat(0.3, 0.6),
			engagementWeight: randomFloat(0.8, 1), // エンゲージメント重みが高い
		},
		...overrides,
	});
};

/** URLなしの興味スコア（ドメインレベルのスコア） */
export const createDomainOnlyScore = (
	overrides?: Partial<InterestScore>,
): InterestScore => {
	const score = createInterestScore(overrides);
	const { url, ...domainScore } = score;
	return domainScore as InterestScore;
};

/** 最近更新された興味スコア */
export const createRecentlyUpdatedScore = (
	overrides?: Partial<InterestScore>,
): InterestScore => {
	return createInterestScore({
		lastUpdated: getTimeAgo(randomInt(0, 3600000)), // 0-1時間前
		...overrides,
	});
};

/** 古い興味スコア */
export const createOldScore = (
	overrides?: Partial<InterestScore>,
): InterestScore => {
	return createInterestScore({
		lastUpdated: getTimeAgo(randomInt(604800000, 2592000000)), // 1週間-1ヶ月前
		...overrides,
	});
};

/** 興味スコアのシーケンス */
export const createInterestScoreSequence = (
	count: number,
	baseOverrides?: Partial<InterestScore>,
): InterestScore[] => {
	return createSequence(createInterestScore, {
		count,
		baseData: baseOverrides,
		transform: (score, index) => ({
			...score,
			domain: `${score.domain.split(".")[0]}${index + 1}.com`,
		}),
	});
};

/** 特定ドメインの興味スコア群 */
export const createDomainScores = (
	domain: string,
	count: number,
	overrides?: Partial<InterestScore>,
): InterestScore[] => {
	return createSequence(createInterestScore, {
		count,
		baseData: { domain, ...overrides },
		transform: (score, index) => ({
			...score,
			url: `https://${domain}/page${index + 1}`,
			lastUpdated: getTimeAgo(index * 3600000), // 1時間間隔
		}),
	});
};

/** スコア分布のバランスの取れた興味スコア群 */
export const createBalancedInterestScores = (
	count: number,
): InterestScore[] => {
	const scores: InterestScore[] = [];
	const distributionCount = Math.ceil(count / 3);

	// 高、中、低のスコアを均等に生成
	for (let i = 0; i < distributionCount && scores.length < count; i++) {
		if (scores.length < count) scores.push(createHighInterestScore());
		if (scores.length < count) scores.push(createMediumInterestScore());
		if (scores.length < count) scores.push(createLowInterestScore());
	}

	return scores.slice(0, count);
};

/** トレンド分析用のスコア群（時系列） */
export const createTrendingScores = (
	domain: string,
	days: number,
	trend: "increasing" | "decreasing" | "stable" = "stable",
): InterestScore[] => {
	const scores: InterestScore[] = [];
	const baseScore = randomInt(30, 70);

	for (let i = 0; i < days; i++) {
		let score = baseScore;

		switch (trend) {
			case "increasing":
				score = Math.min(100, baseScore + i * 5);
				break;
			case "decreasing":
				score = Math.max(0, baseScore - i * 5);
				break;
			case "stable":
				score = baseScore + randomInt(-10, 10);
				break;
		}

		scores.push(
			createInterestScore({
				domain,
				score,
				lastUpdated: getTimeAgo(i * 86400000), // 1日間隔
				url: `https://${domain}/daily/${days - i}`,
			}),
		);
	}

	return scores.reverse(); // 古い順から新しい順へ
};
