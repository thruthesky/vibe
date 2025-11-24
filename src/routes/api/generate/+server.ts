import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { generateSubdomainId } from '$lib/utils/subdomain';
import { env } from '$env/dynamic/private';

const OUT_DIR = process.env.OUT_DIR ?? (process.env.NODE_ENV === 'production' ? '/var/app/generated' : './static/generated');

// System prompt for AI to generate single-page HTML apps
const SYSTEM_PROMPT = `You are an expert web developer. Generate a complete, production-ready single-page HTML application based on the user's request.

IMPORTANT REQUIREMENTS:
1. Return ONLY valid JSON in this exact format: {"html": "...complete HTML code..."}
2. The HTML must be a complete, self-contained document with:
   - <!DOCTYPE html> declaration
   - All CSS in a <style> tag within <head>
   - All JavaScript in a <script> tag before </body>
   - Modern, beautiful, responsive design
   - Vibrant colors and smooth animations
   - Professional UI/UX following current web design trends
3. Use modern CSS (flexbox, grid, custom properties)
4. Include interactive features with vanilla JavaScript
5. Make it mobile-responsive
6. Use a cohesive color scheme with gradients
7. Add smooth transitions and hover effects
8. NO external dependencies (no CDN links, no external scripts)
9. The app should be fully functional and impressive

Return ONLY the JSON object, no markdown, no explanations, just: {"html": "..."}`;

export const POST: RequestHandler = async ({ request, fetch }) => {
	try {
		const { prompt } = await request.json();

		if (!prompt || typeof prompt !== 'string') {
			return json({ error: 'Invalid prompt' }, { status: 400 });
		}

		// Call Firebase AI Logic (using Gemini API directly for now)
		// Note: In production, you'd use Firebase AI Logic SDK
		// Try to get API key from env, fallback to hardcoded (dev only)
		const apiKey = env.VITE_FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY || 'AIzaSyDxc1SSSwzgIPCikQpsgPKHkO0s8Qn1y7M';
		
		console.log('Using API Key:', apiKey ? '***' + apiKey.slice(-4) : 'None');

		const aiResponse = await fetch(
			`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:generateContent?key=${apiKey}`,
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					system_instruction: {
						parts: [{ text: SYSTEM_PROMPT }]
					},
					contents: [
						{
							role: 'user',
							parts: [{ text: prompt }]
						}
					],
					generationConfig: {
						temperature: 0.7,
						maxOutputTokens: 8192
					}
				})
			}
		);

		if (!aiResponse.ok) {
			const errorText = await aiResponse.text();
			console.error('AI API error:', errorText);
			return json({ error: `AI generation failed: ${errorText}` }, { status: 500 });
		}

		const aiData = await aiResponse.json();
		const generatedText = aiData.candidates?.[0]?.content?.parts?.[0]?.text;

		if (!generatedText) {
			return json({ error: 'No content generated' }, { status: 500 });
		}

		// Extract JSON from response (handle markdown code blocks if present)
		let htmlContent: string;
		try {
			const jsonMatch = generatedText.match(/\{[\s\S]*"html"[\s\S]*\}/);
			if (jsonMatch) {
				const parsed = JSON.parse(jsonMatch[0]);
				htmlContent = parsed.html;
			} else {
				// Fallback: treat entire response as HTML
				htmlContent = generatedText;
			}
		} catch (e) {
			// If JSON parsing fails, use the text as-is
			htmlContent = generatedText;
		}

		// Generate random subdomain
		const subdomain = generateSubdomainId();

		// Ensure output directory exists
		await mkdir(OUT_DIR, { recursive: true });

		// Save HTML file
		const filePath = path.join(OUT_DIR, `${subdomain}.html`);
		await writeFile(filePath, htmlContent, 'utf-8');

		console.log(`Generated app saved to: ${filePath}`);

		return json({
			success: true,
			subdomain,
			url: `https://vibers.kr/app/${subdomain}`
		});
	} catch (error) {
		console.error('Generation error:', error);
		return json({ error: `Internal server error: ${error instanceof Error ? error.message : String(error)}` }, { status: 500 });
	}
};
