/**
 * Generate a random subdomain ID (8 characters, alphanumeric lowercase)
 */
export function generateSubdomainId(): string {
	const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
	let result = '';
	for (let i = 0; i < 8; i++) {
		result += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return result;
}

/**
 * Validate subdomain format (alphanumeric, lowercase, 3-20 chars)
 */
export function isValidSubdomain(subdomain: string): boolean {
	return /^[a-z0-9]{3,20}$/.test(subdomain);
}

/**
 * Extract subdomain from host header
 */
export function extractSubdomain(host: string): string | null {
	if (!host) return null;

	const parts = host.split('.');
	// Check if it's a subdomain of vibers.kr
	if (parts.length >= 3 && parts[parts.length - 2] === 'vibers' && parts[parts.length - 1] === 'kr') {
		const subdomain = parts.slice(0, -2).join('.');
		return isValidSubdomain(subdomain) ? subdomain : null;
	}

	return null;
}
