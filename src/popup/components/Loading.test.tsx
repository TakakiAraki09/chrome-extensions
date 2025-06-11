import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Loading } from "./Loading";

describe("Loading コンポーネント", () => {
	it("ローディングテキストを表示する", () => {
		render(<Loading />);

		expect(screen.getByText("Loading...")).toBeInTheDocument();
	});

	it("正しいCSSクラスを持つ", () => {
		render(<Loading />);

		const loadingElement = screen.getByText("Loading...");
		expect(loadingElement).toHaveClass("loading");
	});
});
