import { describe, expect, it } from "vitest";
import {
	formatDate,
	formatDateTimeLocal,
	formatDuration,
	formatFullDate,
} from "../formatters";

describe("formatters", () => {
	describe("formatDateTimeLocal", () => {
		it("should format date for datetime-local input", () => {
			const date = new Date("2024-01-15T14:30:00");
			const result = formatDateTimeLocal(date);
			expect(result).toBe("2024-01-15T14:30");
		});

		it("should handle different dates", () => {
			const date = new Date("2023-12-31T23:59:59");
			const result = formatDateTimeLocal(date);
			expect(result).toBe("2023-12-31T23:59");
		});
	});

	describe("formatDuration", () => {
		it("should format seconds only", () => {
			expect(formatDuration(5000)).toBe("5秒");
			expect(formatDuration(45000)).toBe("45秒");
		});

		it("should format minutes and seconds", () => {
			expect(formatDuration(65000)).toBe("1分5秒");
			expect(formatDuration(125000)).toBe("2分5秒");
		});

		it("should format hours and minutes", () => {
			expect(formatDuration(3665000)).toBe("1時間1分");
			expect(formatDuration(7200000)).toBe("2時間0分");
		});

		it("should format hours, minutes and seconds correctly", () => {
			expect(formatDuration(3725000)).toBe("1時間2分");
		});

		it("should handle zero duration", () => {
			expect(formatDuration(0)).toBe("0秒");
		});

		it("should handle milliseconds less than 1 second", () => {
			expect(formatDuration(500)).toBe("0秒");
		});
	});

	describe("formatDate", () => {
		it("should format timestamp to MM/DD HH:mm", () => {
			const timestamp = new Date("2024-01-15T14:30:00").getTime();
			const result = formatDate(timestamp);
			expect(result).toBe("01/15 14:30");
		});

		it("should handle different timestamps", () => {
			const timestamp = new Date("2024-12-31T23:59:00").getTime();
			const result = formatDate(timestamp);
			expect(result).toBe("12/31 23:59");
		});

		it("should return empty string for undefined timestamp", () => {
			expect(formatDate(undefined)).toBe("");
		});

		it("should return empty string for 0 timestamp", () => {
			expect(formatDate(0)).toBe("");
		});
	});

	describe("formatFullDate", () => {
		it("should format timestamp to full Japanese date format", () => {
			const timestamp = new Date("2024-01-15T14:30:45").getTime();
			const result = formatFullDate(timestamp);
			expect(result).toBe("2024年01月15日 14:30:45");
		});

		it("should handle different timestamps", () => {
			const timestamp = new Date("2023-12-31T23:59:59").getTime();
			const result = formatFullDate(timestamp);
			expect(result).toBe("2023年12月31日 23:59:59");
		});

		it("should return empty string for undefined timestamp", () => {
			expect(formatFullDate(undefined)).toBe("");
		});

		it("should handle single digit months and days", () => {
			const timestamp = new Date("2024-01-05T09:05:05").getTime();
			const result = formatFullDate(timestamp);
			expect(result).toBe("2024年01月05日 09:05:05");
		});
	});
});
