export interface NavigationHandlerInstance {
	destroy: () => void;
}

export function createNavigationHandler(
	onNavigation: () => void,
): NavigationHandlerInstance {
	let currentUrl = window.location.href;

	const checkUrlChange = () => {
		if (window.location.href !== currentUrl) {
			currentUrl = window.location.href;
			onNavigation();
		}
	};

	const handleUrlChange = () => {
		checkUrlChange();
	};

	const createObserver = (): MutationObserver => {
		return new MutationObserver(() => {
			if (document.readyState === "complete") {
				checkUrlChange();
			}
		});
	};

	const interceptHistoryMethods = () => {
		const originalPushState = history.pushState;
		const originalReplaceState = history.replaceState;

		history.pushState = (...args) => {
			originalPushState.apply(history, args);
			setTimeout(() => handleUrlChange(), 0);
		};

		history.replaceState = (...args) => {
			originalReplaceState.apply(history, args);
			setTimeout(() => handleUrlChange(), 0);
		};
	};

	const setupEventListeners = () => {
		window.addEventListener("popstate", handleUrlChange);
		interceptHistoryMethods();
	};

	const observer = createObserver();

	const init = () => {
		setupEventListeners();
		observer.observe(document, {
			childList: true,
			subtree: true,
		});
	};

	const destroy = () => {
		window.removeEventListener("popstate", handleUrlChange);
		observer.disconnect();
	};

	init();

	return {
		destroy,
	};
}
