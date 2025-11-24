import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { generateSubdomainId } from '$lib/utils/subdomain';

const OUT_DIR = process.env.OUT_DIR ?? (process.env.NODE_ENV === 'production' ? '/var/app/generated' : './static/generated');

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { html } = await request.json();

		if (!html || typeof html !== 'string') {
			return json({ error: 'Invalid HTML content' }, { status: 400 });
		}

		// Generate random subdomain
		const subdomain = generateSubdomainId();

		// Ensure output directory exists
		await mkdir(OUT_DIR, { recursive: true });

		// Save HTML file
		const filePath = path.join(OUT_DIR, `${subdomain}.html`);
		await writeFile(filePath, html, 'utf-8');

		console.log(`Generated app saved to: ${filePath}`);

		return json({
			success: true,
			subdomain,
			url: `https://vibers.kr/app/${subdomain}`
		});
	} catch (error) {
		console.error('Save error:', error);
		return json({ error: `Internal server error: ${error instanceof Error ? error.message : String(error)}` }, { status: 500 });
	}
};
