import { describe, expect, it } from "vitest";
import {
	formatDate,
	formatDateTimeLocal,
	formatDuration,
	formatFullDate,
} from "./formatters";

describe("フォーマッター", () => {
	describe("formatDateTimeLocal", () => {
		it("datetime-local入力用に日付をフォーマットする", () => {
			const date = new Date("2024-01-15T14:30:00");
			const result = formatDateTimeLocal(date);
			expect(result).toBe("2024-01-15T14:30");
		});

		it("異なる日付を処理する", () => {
			const date = new Date("2023-12-31T23:59:59");
			const result = formatDateTimeLocal(date);
			expect(result).toBe("2023-12-31T23:59");
		});
	});

	describe("formatDuration", () => {
		it("秒のみをフォーマットする", () => {
			expect(formatDuration(5000)).toBe("5秒");
			expect(formatDuration(45000)).toBe("45秒");
		});

		it("分と秒をフォーマットする", () => {
			expect(formatDuration(65000)).toBe("1分5秒");
			expect(formatDuration(125000)).toBe("2分5秒");
		});

		it("時間と分をフォーマットする", () => {
			expect(formatDuration(3665000)).toBe("1時間1分");
			expect(formatDuration(7200000)).toBe("2時間0分");
		});

		it("時間、分、秒を正しくフォーマットする", () => {
			expect(formatDuration(3725000)).toBe("1時間2分");
		});

		it("ゼロ時間を処理する", () => {
			expect(formatDuration(0)).toBe("0秒");
		});

		it("1秒未満のミリ秒を処理する", () => {
			expect(formatDuration(500)).toBe("0秒");
		});
	});

	describe("formatDate", () => {
		it("タイムスタンプをMM/DD HH:mm形式でフォーマットする", () => {
			const timestamp = new Date("2024-01-15T14:30:00").getTime();
			const result = formatDate(timestamp);
			expect(result).toBe("01/15 14:30");
		});

		it("異なるタイムスタンプを処理する", () => {
			const timestamp = new Date("2024-12-31T23:59:00").getTime();
			const result = formatDate(timestamp);
			expect(result).toBe("12/31 23:59");
		});

		it("undefinedタイムスタンプに対して空文字列を返す", () => {
			expect(formatDate(undefined)).toBe("");
		});

		it("0タイムスタンプに対して空文字列を返す", () => {
			expect(formatDate(0)).toBe("");
		});
	});

	describe("formatFullDate", () => {
		it("タイムスタンプを日本語の完全な日付形式でフォーマットする", () => {
			const timestamp = new Date("2024-01-15T14:30:45").getTime();
			const result = formatFullDate(timestamp);
			expect(result).toBe("2024年01月15日 14:30:45");
		});

		it("異なるタイムスタンプを処理する", () => {
			const timestamp = new Date("2023-12-31T23:59:59").getTime();
			const result = formatFullDate(timestamp);
			expect(result).toBe("2023年12月31日 23:59:59");
		});

		it("undefinedタイムスタンプに対して空文字列を返す", () => {
			expect(formatFullDate(undefined)).toBe("");
		});

		it("一桁の月や日を処理する", () => {
			const timestamp = new Date("2024-01-05T09:05:05").getTime();
			const result = formatFullDate(timestamp);
			expect(result).toBe("2024年01月05日 09:05:05");
		});
	});
});
