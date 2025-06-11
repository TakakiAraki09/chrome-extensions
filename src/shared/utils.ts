export function unreachable(_x: never, message: string): never {
	throw new Error(`unreachable: ${message}`);
}
