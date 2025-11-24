// LiteRT.js configuration for on-device AI
// Note: LiteRT.js is designed for TensorFlow Lite models
// For code generation, we'll use a simpler approach with Gemini Nano or similar

export const litert = {
	initialized: false,
	
	async initialize() {
		if (this.initialized) return;
		
		// Check if browser supports on-device AI
		if (typeof window === 'undefined') {
			console.warn('LiteRT.js can only run in browser');
			return;
		}
		
		// For now, we'll use a placeholder
		// In production, you would load a TFLite model here
		console.log('LiteRT.js initialized');
		this.initialized = true;
	},
	
	async generateCode(prompt: string): Promise<string> {
		// Since LiteRT.js is for TFLite models and we need code generation,
		// we'll use the Gemini API directly from the client
		// This is a temporary solution until we have a proper on-device model
		
		const apiKey = 'AIzaSyDxc1SSSwzgIPCikQpsgPKHkO0s8Qn1y7M';
		
		const systemPrompt = `You are an expert web developer. Generate a complete, production-ready single-page HTML application based on the user's request.

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

		try {
			const response = await fetch(
				`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						system_instruction: {
							parts: [{ text: systemPrompt }]
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

			if (!response.ok) {
				throw new Error(`API error: ${response.statusText}`);
			}

			const data = await response.json();
			const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

			if (!generatedText) {
				throw new Error('No content generated');
			}

			// Extract JSON from response
			const jsonMatch = generatedText.match(/\{[\s\S]*"html"[\s\S]*\}/);
			if (jsonMatch) {
				const parsed = JSON.parse(jsonMatch[0]);
				return parsed.html;
			}

			// Fallback: treat entire response as HTML
			return generatedText;
		} catch (error) {
			console.error('Code generation error:', error);
			throw error;
		}
	}
};
