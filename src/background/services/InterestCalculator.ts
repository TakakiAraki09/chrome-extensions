import { INITIAL_VALUES, SCORE_CONSTANTS } from "../../shared/constants";
import type { BrowsingActivity, InterestScore } from "../types";

function calculateMetrics(activities: BrowsingActivity[]) {
	const totalTime = activities.reduce(
		(sum, activity) => sum + activity.focusTime,
		0,
	);
	const avgScrollDepth =
		activities.reduce((sum, activity) => sum + activity.maxScrollDepth, 0) /
		activities.length;
	const avgEngagement =
		activities.reduce((sum, activity) => {
			const totalTime = activity.focusTime + activity.idleTime;
			return sum + (totalTime > 0 ? activity.focusTime / totalTime : 0);
		}, 0) / activities.length;
	const frequency = activities.length;

	return {
		totalTime,
		avgScrollDepth,
		avgEngagement,
		frequency,
	};
}

function normalizeWeights(metrics: ReturnType<typeof calculateMetrics>) {
	return {
		timeWeight: Math.min(
			metrics.totalTime / SCORE_CONSTANTS.TIME_NORMALIZATION_MAX,
			1,
		),
		scrollWeight: Math.min(
			metrics.avgScrollDepth / SCORE_CONSTANTS.SCROLL_NORMALIZATION_MAX,
			1,
		),
		engagementWeight: metrics.avgEngagement,
	};
}

function computeScore(weights: InterestScore["factors"]) {
	const { timeWeight, scrollWeight, engagementWeight } = weights;

	return (
		(timeWeight * SCORE_CONSTANTS.WEIGHTS.TIME +
			scrollWeight * SCORE_CONSTANTS.WEIGHTS.SCROLL +
			engagementWeight * SCORE_CONSTANTS.WEIGHTS.ENGAGEMENT +
			Math.min(1, SCORE_CONSTANTS.WEIGHTS.FREQUENCY)) *
		SCORE_CONSTANTS.SCORE_MULTIPLIER
	);
}

export function calculateInterestScore(activities: BrowsingActivity[]): number {
	if (activities.length === 0) return 0;

	const metrics = calculateMetrics(activities);
	const weights = normalizeWeights(metrics);

	const score = computeScore(weights);
	return Math.round(score);
}

export function getInterestFactors(
	activities: BrowsingActivity[],
): InterestScore["factors"] {
	if (activities.length === 0) {
		return {
			timeWeight: 0,
			scrollWeight: 0,
			engagementWeight: 0,
		};
	}

	const metrics = calculateMetrics(activities);
	return normalizeWeights(metrics);
}
