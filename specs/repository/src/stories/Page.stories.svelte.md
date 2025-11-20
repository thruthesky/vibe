---
title: Page.stories.svelte - Svelte 5 컴포넌트
original_path: src/stories/Page.stories.svelte
category: source
file_type: svelte
status: current
last_updated: 2025-11-20
---

# Page.stories.svelte

## 개요

**원본 경로**: `src/stories/Page.stories.svelte`

**파일 유형**: Svelte 5 컴포넌트

## 소스 코드

```svelte
<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { expect, userEvent, waitFor, within } from 'storybook/test';
  import Page from './Page.svelte';
  import { fn } from 'storybook/test';

  // More on how to set up stories at: https://storybook.js.org/docs/writing-stories
  const { Story } = defineMeta({
    title: 'Example/Page',
    component: Page,
    parameters: {
      // More on how to position stories at: https://storybook.js.org/docs/configure/story-layout
      layout: 'fullscreen',
    },
  });
</script>

<Story name="Logged In" play={async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const loginButton = canvas.getByRole('button', { name: /Log in/i });
    await expect(loginButton).toBeInTheDocument();
    await userEvent.click(loginButton);
    await waitFor(() => expect(loginButton).not.toBeInTheDocument());

    const logoutButton = canvas.getByRole('button', { name: /Log out/i });
    await expect(logoutButton).toBeInTheDocument();
  }}
/>

<Story name="Logged Out" />
```
