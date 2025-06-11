import dayjs from "dayjs";
import { DATE_CONSTANTS, INITIAL_VALUES } from "../../shared/constants";

export const formatDateTimeLocal = (date: Date): string => {
	return dayjs(date).format("YYYY-MM-DDTHH:mm");
};

export const formatDuration = (milliseconds: number): string => {
	const seconds = Math.floor(milliseconds / DATE_CONSTANTS.SECOND_IN_MS);
	const minutes = Math.floor(
		seconds / (DATE_CONSTANTS.MINUTE_IN_MS / DATE_CONSTANTS.SECOND_IN_MS),
	);
	const hours = Math.floor(
		minutes / (DATE_CONSTANTS.HOUR_IN_MS / DATE_CONSTANTS.MINUTE_IN_MS),
	);

	if (hours > INITIAL_VALUES.ZERO) {
		return `${hours}時間${minutes % (DATE_CONSTANTS.HOUR_IN_MS / DATE_CONSTANTS.MINUTE_IN_MS)}分`;
	}
	if (minutes > INITIAL_VALUES.ZERO) {
		return `${minutes}分${seconds % (DATE_CONSTANTS.MINUTE_IN_MS / DATE_CONSTANTS.SECOND_IN_MS)}秒`;
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
