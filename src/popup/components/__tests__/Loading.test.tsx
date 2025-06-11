import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Loading } from "../Loading";

describe("Loading", () => {
	it("should render loading text", () => {
		render(<Loading />);

		expect(screen.getByText("Loading...")).toBeInTheDocument();
	});

	it("should have correct CSS class", () => {
		render(<Loading />);

		const loadingElement = screen.getByText("Loading...");
		expect(loadingElement).toHaveClass("loading");
	});
});
