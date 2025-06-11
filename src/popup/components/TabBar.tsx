import type React from "react";
import type { ViewMode } from "../types";

interface TabBarProps {
	activeTab: ViewMode;
	onTabChange: (tab: ViewMode) => void;
}

const tabs: Array<{
	id: ViewMode;
	label: string;
}> = [
	{
		id: "interests",
		label: "興味関心度",
	},
	{
		id: "activities",
		label: "活動履歴",
	},
	{
		id: "history",
		label: "履歴",
	},
];

export const TabBar: React.FC<TabBarProps> = ({ activeTab, onTabChange }) => {
	return (
		<div className="tab-controls">
			{tabs.map((tab) => (
				<button
					type="button"
					key={tab.id}
					className={activeTab === tab.id ? "active" : ""}
					onClick={() => onTabChange(tab.id)}
				>
					{tab.label}
				</button>
			))}
		</div>
	);
};
