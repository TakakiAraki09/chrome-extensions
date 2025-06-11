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
		timeWeight: Math.min(metrics.totalTime / (1000 * 60 * 5), 1), // Normalize to 5 minutes max
		scrollWeight: Math.min(metrics.avgScrollDepth / 100, 1),
		engagementWeight: metrics.avgEngagement,
	};
}

function computeScore(weights: InterestScore["factors"]) {
	const { timeWeight, scrollWeight, engagementWeight } = weights;

	return (
		(timeWeight * 0.3 +
			scrollWeight * 0.2 +
			engagementWeight * 0.3 +
			Math.min(1, 0.2)) * // Simplified frequency weight
		100
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
