import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createTimeTracker } from "./TimeTracker";

describe("TimeTracker", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2024-01-01T00:00:00Z"));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("should initialize with correct default values", () => {
		const tracker = createTimeTracker();
		const metrics = tracker.getMetrics();

		expect(metrics.startTime).toBe(Date.now());
		expect(metrics.focusTime).toBe(0);
		expect(metrics.idleTime).toBe(0);
		expect(metrics.lastActivity).toBe(Date.now());
	});

	describe("visibility tracking", () => {
		it("should update focus time when becoming hidden while active", () => {
			const tracker = createTimeTracker();

			// Advance time
			vi.advanceTimersByTime(5000);

			// Hide page while active
			tracker.updateVisibility(false);

			const metrics = tracker.getMetrics();
			expect(metrics.focusTime).toBe(5000);
		});

		it("should reset last activity when becoming visible", () => {
			const tracker = createTimeTracker();
			const initialTime = Date.now();

			// Hide page
			tracker.updateVisibility(false);

			// Advance time while hidden
			vi.advanceTimersByTime(3000);

			// Show page again
			tracker.updateVisibility(true);

			const metrics = tracker.getMetrics();
			expect(metrics.lastActivity).toBe(initialTime + 3000);
		});

		it("should not update focus time when hidden while inactive", () => {
			const tracker = createTimeTracker();

			// Mark as idle first
			tracker.markIdle();

			// Advance time
			vi.advanceTimersByTime(5000);

			// Hide page while idle
			tracker.updateVisibility(false);

			const metrics = tracker.getMetrics();
			expect(metrics.focusTime).toBe(0);
		});

		it("should not reset activity when already hidden", () => {
			const tracker = createTimeTracker();
			const initialTime = Date.now();

			// Hide page
			tracker.updateVisibility(false);
			tracker.updateVisibility(false); // Hide again

			const metrics = tracker.getMetrics();
			expect(metrics.lastActivity).toBe(initialTime);
		});
	});

	describe("idle/active tracking", () => {
		it("should update idle time when becoming active while visible", () => {
			const tracker = createTimeTracker();

			// Mark as idle
			tracker.markIdle();

			// Advance time while idle
			vi.advanceTimersByTime(8000);

			// Mark as active
			tracker.markActive();

			const metrics = tracker.getMetrics();
			expect(metrics.idleTime).toBe(8000);
		});

		it("should update focus time when becoming idle while visible", () => {
			const tracker = createTimeTracker();

			// Advance time while active
			vi.advanceTimersByTime(6000);

			// Mark as idle
			tracker.markIdle();

			const metrics = tracker.getMetrics();
			expect(metrics.focusTime).toBe(6000);
		});

		it("should not update idle time when becoming active while hidden", () => {
			const tracker = createTimeTracker();

			// Hide page first
			tracker.updateVisibility(false);

			// Mark as idle then active
			tracker.markIdle();
			vi.advanceTimersByTime(5000);
			tracker.markActive();

			const metrics = tracker.getMetrics();
			expect(metrics.idleTime).toBe(0);
		});

		it("should not update focus time when becoming idle while hidden", () => {
			const tracker = createTimeTracker();

			// Hide page first
			tracker.updateVisibility(false);

			// Advance time
			vi.advanceTimersByTime(4000);

			// Mark as idle
			tracker.markIdle();

			const metrics = tracker.getMetrics();
			expect(metrics.focusTime).toBe(0);
		});

		it("should not change state when marking already active as active", () => {
			const tracker = createTimeTracker();
			const initialTime = Date.now();

			// Mark as active when already active
			tracker.markActive();

			const metrics = tracker.getMetrics();
			expect(metrics.lastActivity).toBe(initialTime);
			expect(metrics.idleTime).toBe(0);
		});

		it("should not change state when marking already idle as idle", () => {
			const tracker = createTimeTracker();

			// Mark as idle
			tracker.markIdle();
			vi.advanceTimersByTime(2000);

			// Mark as idle again
			tracker.markIdle();

			const metrics = tracker.getMetrics();
			expect(metrics.focusTime).toBe(0); // Should not add more focus time
		});
	});

	describe("activity updates", () => {
		it("should update last activity when visible and active", () => {
			const tracker = createTimeTracker();

			vi.advanceTimersByTime(3000);
			tracker.updateActivity();

			const metrics = tracker.getMetrics();
			expect(metrics.lastActivity).toBe(Date.now());
		});

		it("should not update last activity when hidden", () => {
			const tracker = createTimeTracker();
			const initialTime = Date.now();

			tracker.updateVisibility(false);
			vi.advanceTimersByTime(3000);
			tracker.updateActivity();

			const metrics = tracker.getMetrics();
			expect(metrics.lastActivity).toBe(initialTime);
		});

		it("should not update last activity when idle", () => {
			const tracker = createTimeTracker();
			const initialTime = Date.now();

			tracker.markIdle();
			vi.advanceTimersByTime(3000);
			tracker.updateActivity();

			const metrics = tracker.getMetrics();
			expect(metrics.lastActivity).toBe(initialTime);
		});
	});

	describe("finalization", () => {
		it("should add remaining focus time when visible and active", () => {
			const tracker = createTimeTracker();

			vi.advanceTimersByTime(7000);
			tracker.finalize();

			const metrics = tracker.getMetrics();
			expect(metrics.focusTime).toBe(7000);
		});

		it("should not add focus time when hidden", () => {
			const tracker = createTimeTracker();

			tracker.updateVisibility(false);
			vi.advanceTimersByTime(4000);
			tracker.finalize();

			const metrics = tracker.getMetrics();
			expect(metrics.focusTime).toBe(0);
		});

		it("should not add focus time when idle", () => {
			const tracker = createTimeTracker();

			tracker.markIdle();
			vi.advanceTimersByTime(4000);
			tracker.finalize();

			const metrics = tracker.getMetrics();
			expect(metrics.focusTime).toBe(0);
		});
	});

	describe("complex scenarios", () => {
		it("should handle alternating visible/hidden states correctly", () => {
			const tracker = createTimeTracker();

			// Active and visible for 2 seconds
			vi.advanceTimersByTime(2000);
			tracker.updateVisibility(false);

			// Hidden for 1 second
			vi.advanceTimersByTime(1000);
			tracker.updateVisibility(true);

			// Active and visible for 3 seconds
			vi.advanceTimersByTime(3000);
			tracker.finalize();

			const metrics = tracker.getMetrics();
			expect(metrics.focusTime).toBe(5000); // 2000 + 3000
		});

		it("should handle alternating active/idle states correctly", () => {
			const tracker = createTimeTracker();

			// Active for 3 seconds
			vi.advanceTimersByTime(3000);
			tracker.markIdle();

			// Idle for 2 seconds
			vi.advanceTimersByTime(2000);
			tracker.markActive();

			// Active for 4 seconds
			vi.advanceTimersByTime(4000);
			tracker.finalize();

			const metrics = tracker.getMetrics();
			expect(metrics.focusTime).toBe(7000); // 3000 + 4000
			expect(metrics.idleTime).toBe(2000);
		});
	});

	it("should return immutable metrics", () => {
		const tracker = createTimeTracker();

		const metrics1 = tracker.getMetrics();
		const metrics2 = tracker.getMetrics();

		expect(metrics1).not.toBe(metrics2); // Different objects
		expect(metrics1).toEqual(metrics2); // Same values

		// Modifying returned metrics should not affect internal state
		metrics1.focusTime = 999;
		expect(tracker.getMetrics().focusTime).not.toBe(999);
	});
});
