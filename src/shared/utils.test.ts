import { describe, expect, it } from "vitest";
import { unreachable } from "./utils";

describe("ユーティリティ", () => {
	describe("unreachable", () => {
		it("指定されたメッセージでエラーをスローする", () => {
			const message = "This should never happen";

			expect(() => {
				unreachable({} as never, message);
			}).toThrow(`unreachable: ${message}`);
		});
	});
});
