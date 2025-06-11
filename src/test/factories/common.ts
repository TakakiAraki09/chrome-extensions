/**
 * テストファクトリー共通ユーティリティ
 *
 * すべてのファクトリーで共通して使用される関数やデフォルト値を提供
 */

/** 現在時刻から指定時間前のタイムスタンプを生成 */
export const getTimeAgo = (milliseconds: number): number => {
	return Date.now() - milliseconds;
};

/** 現在時刻から指定時間後のタイムスタンプを生成 */
export const getTimeFromNow = (milliseconds: number): number => {
	return Date.now() + milliseconds;
};

/** ランダムな整数を生成 */
export const randomInt = (min: number, max: number): number => {
	return Math.floor(Math.random() * (max - min + 1)) + min;
};

/** ランダムな小数を生成 */
export const randomFloat = (min: number, max: number, decimals = 2): number => {
	return Number((Math.random() * (max - min) + min).toFixed(decimals));
};

/** ランダムな文字列を生成 */
export const randomString = (length = 8): string => {
	const chars =
		"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
	return Array.from({ length }, () =>
		chars.charAt(Math.floor(Math.random() * chars.length)),
	).join("");
};

/** よく使用されるドメインのリスト */
export const COMMON_DOMAINS = [
	"example.com",
	"test.com",
	"github.com",
	"google.com",
	"stackoverflow.com",
	"wikipedia.org",
	"mozilla.org",
	"microsoft.com",
] as const;

/** よく使用されるURLパターンのリスト */
export const COMMON_URL_PATTERNS = [
	"https://{domain}",
	"https://{domain}/page",
	"https://{domain}/articles/{id}",
	"https://{domain}/users/{id}",
	"https://{domain}/search?q={query}",
] as const;

/** ランダムなドメインを取得 */
export const randomDomain = (): string => {
	return COMMON_DOMAINS[Math.floor(Math.random() * COMMON_DOMAINS.length)];
};

/** ランダムなURLを生成 */
export const randomUrl = (domain?: string): string => {
	const selectedDomain = domain || randomDomain();
	const pattern =
		COMMON_URL_PATTERNS[Math.floor(Math.random() * COMMON_URL_PATTERNS.length)];

	return pattern
		.replace("{domain}", selectedDomain)
		.replace("{id}", randomInt(1, 1000).toString())
		.replace("{query}", randomString(5));
};

/** ランダムなページタイトルを生成 */
export const randomTitle = (): string => {
	const adjectives = [
		"Amazing",
		"Incredible",
		"Awesome",
		"Fantastic",
		"Great",
		"Excellent",
		"Perfect",
	];
	const nouns = [
		"Article",
		"Tutorial",
		"Guide",
		"Documentation",
		"Blog Post",
		"News",
		"Update",
	];

	const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
	const noun = nouns[Math.floor(Math.random() * nouns.length)];

	return `${adjective} ${noun} - ${randomString(3).toUpperCase()}`;
};

/** 配列から指定数の項目をランダムに選択 */
export const randomSelect = <T>(array: readonly T[], count = 1): T[] => {
	const shuffled = [...array].sort(() => 0.5 - Math.random());
	return shuffled.slice(0, count);
};

/** シーケンス生成用のヘルパー */
export interface SequenceOptions<T> {
	count: number;
	baseData?: Partial<T>;
	transform?: (item: T, index: number) => T;
}

export const createSequence = <T>(
	factory: (overrides?: Partial<T>) => T,
	options: SequenceOptions<T>,
): T[] => {
	const { count, baseData, transform } = options;

	return Array.from({ length: count }, (_, index) => {
		let item = factory(baseData);

		if (transform) {
			item = transform(item, index);
		}

		return item;
	});
};

/** 時間範囲を生成するヘルパー */
export interface TimeRange {
	startTime: number;
	endTime: number;
}

export const createTimeRange = (
	startOffset = 3600000, // 1 hour ago
	endOffset = 0, // now
): TimeRange => {
	const now = Date.now();
	return {
		startTime: now - startOffset,
		endTime: now - endOffset,
	};
};

/** デバッグ用: ファクトリーで生成されたオブジェクトのスキーマ検証 */
export const validateWithSchema = <T>(
	schema: { parse: (data: unknown) => T },
	data: unknown,
): T => {
	try {
		return schema.parse(data);
	} catch (error) {
		console.error("Factory schema validation failed:", error);
		throw error;
	}
};
