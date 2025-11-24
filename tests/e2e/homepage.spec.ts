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

		// Check for login button when not authenticated
		await expect(page.getByRole('button', { name: /log in/i })).toBeVisible();
	});

	test('login modal opens when clicking login button', async ({ page }) => {
		await page.goto('/');

		// Click login button (header login button)
		const loginButton = page.locator('header').getByRole('button', { name: /log in/i });
		await loginButton.click();

		// Wait for modal to appear by checking for the modal content
		const modalContent = page.locator('.modal-content');
		await expect(modalContent).toBeVisible({ timeout: 10000 });

		// Check that login modal appears
		await expect(page.getByText('Start Building.', { exact: true })).toBeVisible();
		await expect(page.getByText('Log in to your account', { exact: true })).toBeVisible();

		// Check for Google sign-in button
		await expect(page.getByRole('button', { name: /sign in with google account/i })).toBeVisible();
	});

	test('CTA button shows for unauthenticated users', async ({ page }) => {
		await page.goto('/');

		// Check for Get Started button
		await expect(page.getByRole('button', { name: /get started/i })).toBeVisible();
	});
});
