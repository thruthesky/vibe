import { test, expect } from '@playwright/test';

test.describe('Vibers Homepage', () => {
	test('homepage loads successfully', async ({ page }) => {
		// Navigate to homepage
		await page.goto('/');

		// Check that the page loaded
		await expect(page).toHaveTitle(/Vibers/i);

		// Check for main heading
		await expect(page.locator('h1')).toContainText('Build something');

		// Check for Vibers branding
		await expect(page.locator('h1')).toContainText('Vibers');

		// Check for subtitle
		await expect(page.getByText('Create apps and websites by chatting with AI')).toBeVisible();

		// Check for chat sidebar (always visible now, no auth required)
		await expect(page.locator('.chat-sidebar')).toBeVisible();
	});

	test('chat sidebar is always visible', async ({ page }) => {
		await page.goto('/');

		// Check that chat sidebar is visible
		const chatSidebar = page.locator('.chat-sidebar');
		await expect(chatSidebar).toBeVisible();

		// Check for chat input
		const chatInput = page.locator('.chat-input');
		await expect(chatInput).toBeVisible();
		await expect(chatInput).toHaveAttribute('placeholder', 'Describe your app...');

		// Check for send button
		await expect(page.locator('.send-button')).toBeVisible();
	});

	test('chat input accepts text', async ({ page }) => {
		await page.goto('/');

		// Type in chat input
		const chatInput = page.locator('.chat-input');
		await chatInput.fill('Create a simple calculator app');

		// Check that text was entered
		await expect(chatInput).toHaveValue('Create a simple calculator app');
	});
});
