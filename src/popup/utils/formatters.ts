import dayjs from "dayjs";

export const formatDateTimeLocal = (date: Date): string => {
	return dayjs(date).format("YYYY-MM-DDTHH:mm");
};

export const formatDuration = (milliseconds: number): string => {
	const seconds = Math.floor(milliseconds / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);

	if (hours > 0) {
		return `${hours}時間${minutes % 60}分`;
	}
	if (minutes > 0) {
		return `${minutes}分${seconds % 60}秒`;
	}
	return `${seconds}秒`;
};

export const formatDate = (timestamp: number | undefined): string => {
	if (!timestamp) return "";
	return dayjs(timestamp).format("MM/DD HH:mm");
};

export const formatFullDate = (timestamp: number | undefined): string => {
	if (!timestamp) return "";
	return dayjs(timestamp).format("YYYY年MM月DD日 HH:mm:ss");
};
