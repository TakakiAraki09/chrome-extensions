export interface VisibilityTrackerInstance {
	getIsVisible: () => boolean;
	destroy: () => void;
}

export function createVisibilityTracker(
	onVisible: () => void,
	onHidden: () => void,
): VisibilityTrackerInstance {
	let isVisible = true;

	const setVisible = (visible: boolean) => {
		if (isVisible === visible) return;

		isVisible = visible;
		if (visible) {
			onVisible();
		} else {
			onHidden();
		}
	};

	const handleVisibilityChange = () => {
		if (document.hidden) {
			setVisible(false);
		} else {
			setVisible(true);
		}
	};

	const handleFocus = () => {
		setVisible(true);
	};

	const handleBlur = () => {
		setVisible(false);
	};

	const attachEventListeners = () => {
		document.addEventListener("visibilitychange", handleVisibilityChange);
		window.addEventListener("focus", handleFocus);
		window.addEventListener("blur", handleBlur);
	};

	const getIsVisible = (): boolean => {
		return isVisible;
	};

	const destroy = () => {
		document.removeEventListener("visibilitychange", handleVisibilityChange);
		window.removeEventListener("focus", handleFocus);
		window.removeEventListener("blur", handleBlur);
	};

	attachEventListeners();

	return {
		getIsVisible,
		destroy,
	};
}
