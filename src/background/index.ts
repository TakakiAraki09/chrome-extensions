import { createIndexedDBManager } from "./db/IndexedDBManager";
import {
	createMessageHandlers,
	handleMessage,
} from "./handlers/messageHandlers";

const dbManager = createIndexedDBManager();
const messageHandlers = createMessageHandlers(dbManager);

const initializeExtension = async () => {
	try {
		await dbManager.init();
		console.log("Database initialized");
	} catch (error) {
		console.error("Failed to initialize database:", error);
	}
};

chrome.runtime.onInstalled.addListener(() => {
	console.log("Extension installed");
	initializeExtension();
});

chrome.runtime.onStartup.addListener(() => {
	console.log("Extension startup");
	initializeExtension();
});

chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
	return handleMessage(messageHandlers, request, sendResponse);
});
