import { describe, expect, it } from "vitest";
import { unreachable } from "../utils";

describe("utils", () => {
	describe("unreachable", () => {
		it("should throw an error with the provided message", () => {
			const message = "This should never happen";

			expect(() => {
				unreachable({} as never, message);
			}).toThrow(`unreachable: ${message}`);
		});
	});
});
