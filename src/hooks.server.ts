import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	const host = event.request.headers.get('host') ?? '';

	// Extract subdomain if it ends with .vibers.kr
	const sub = host.endsWith('.vibers.kr') ? host.slice(0, -'.vibers.kr'.length) : null;

	event.locals.subdomain = sub;

	return resolve(event);
};
