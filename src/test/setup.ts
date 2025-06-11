import "@testing-library/jest-dom";

// Mock Chrome APIs for testing
Object.assign(global, {
	chrome: {
		runtime: {
			sendMessage: vi.fn(),
			onMessage: {
				addListener: vi.fn(),
				removeListener: vi.fn(),
			},
		},
		tabs: {
			query: vi.fn(),
			onUpdated: {
				addListener: vi.fn(),
				removeListener: vi.fn(),
			},
		},
		storage: {
			local: {
				get: vi.fn(),
				set: vi.fn(),
			},
		},
	},
});
