import type { PageServerLoad } from './$types';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { error } from '@sveltejs/kit';

const OUT_DIR = process.env.OUT_DIR ?? (process.env.NODE_ENV === 'production' ? '/var/app/generated' : './static/generated');

export const load: PageServerLoad = async ({ params }) => {
	const subdomain = params.subdomain;

	if (!subdomain) {
		throw error(400, 'Subdomain is required');
	}

	// Try to serve the generated HTML file
	try {
		const filePath = path.join(OUT_DIR, `${subdomain}.html`);
		const htmlContent = await readFile(filePath, 'utf-8');

		// Return the HTML content to be rendered
		return {
			subdomain,
			htmlContent
		};
	} catch (err) {
		// File doesn't exist
		throw error(404, `App not found: ${subdomain}`);
	}
};
