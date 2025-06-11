export interface BrowsingActivity {
	url: string;
	title: string;
	domain: string;
	startTime: number;
	endTime?: number;
	scrollDepth: number;
	maxScrollDepth: number;
	totalScrollDistance: number;
	focusTime: number;
	idleTime: number;
}

export interface ScrollMetrics {
	depth: number;
	maxDepth: number;
	totalDistance: number;
}

export interface TimeMetrics {
	startTime: number;
	focusTime: number;
	idleTime: number;
	lastActivity: number;
}
