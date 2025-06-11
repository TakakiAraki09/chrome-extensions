import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { ViewMode } from "../../types";
import { TabBar } from "../TabBar";

describe("TabBar", () => {
	const mockOnTabChange = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should render all tabs", () => {
		render(<TabBar activeTab="interests" onTabChange={mockOnTabChange} />);

		expect(screen.getByText("興味関心度")).toBeInTheDocument();
		expect(screen.getByText("活動履歴")).toBeInTheDocument();
		expect(screen.getByText("履歴")).toBeInTheDocument();
	});

	it("should highlight the active tab", () => {
		render(<TabBar activeTab="activities" onTabChange={mockOnTabChange} />);

		const interestsTab = screen.getByText("興味関心度");
		const activitiesTab = screen.getByText("活動履歴");
		const historyTab = screen.getByText("履歴");

		expect(interestsTab).not.toHaveClass("active");
		expect(activitiesTab).toHaveClass("active");
		expect(historyTab).not.toHaveClass("active");
	});

	it("should call onTabChange when a tab is clicked", async () => {
		const user = userEvent.setup();
		render(<TabBar activeTab="interests" onTabChange={mockOnTabChange} />);

		const activitiesTab = screen.getByText("活動履歴");
		await user.click(activitiesTab);

		expect(mockOnTabChange).toHaveBeenCalledWith("activities");
	});

	it("should call onTabChange with correct values for all tabs", async () => {
		const user = userEvent.setup();
		render(<TabBar activeTab="interests" onTabChange={mockOnTabChange} />);

		// Test interests tab
		const interestsTab = screen.getByText("興味関心度");
		await user.click(interestsTab);
		expect(mockOnTabChange).toHaveBeenCalledWith("interests");

		// Test activities tab
		const activitiesTab = screen.getByText("活動履歴");
		await user.click(activitiesTab);
		expect(mockOnTabChange).toHaveBeenCalledWith("activities");

		// Test history tab
		const historyTab = screen.getByText("履歴");
		await user.click(historyTab);
		expect(mockOnTabChange).toHaveBeenCalledWith("history");

		expect(mockOnTabChange).toHaveBeenCalledTimes(3);
	});

	it("should render buttons with correct type", () => {
		render(<TabBar activeTab="interests" onTabChange={mockOnTabChange} />);

		const buttons = screen.getAllByRole("button");

		for (const button of buttons) {
			expect(button).toHaveAttribute("type", "button");
		}
	});

	it("should have correct CSS class for container", () => {
		const { container } = render(
			<TabBar activeTab="interests" onTabChange={mockOnTabChange} />,
		);

		const tabContainer = container.querySelector(".tab-controls");
		expect(tabContainer).toBeInTheDocument();
	});
});
