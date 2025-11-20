---
title: Header.stories.svelte - Svelte 5 컴포넌트
original_path: src/stories/Header.stories.svelte
category: source
file_type: svelte
status: current
last_updated: 2025-11-20
---

# Header.stories.svelte

## 개요

**원본 경로**: `src/stories/Header.stories.svelte`

**파일 유형**: Svelte 5 컴포넌트

## 소스 코드

```svelte
<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import Header from './Header.svelte';
  import { fn } from 'storybook/test';

  // More on how to set up stories at: https://storybook.js.org/docs/writing-stories
  const { Story } = defineMeta({
    title: 'Example/Header',
    component: Header,
    // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
    tags: ['autodocs'],
    parameters: {
      // More on how to position stories at: https://storybook.js.org/docs/configure/story-layout
      layout: 'fullscreen',
    },
    args: {
      onLogin: fn(),
      onLogout: fn(),
      onCreateAccount: fn(),
    }
  });
</script>

<Story name="Logged In" args={{ user: { name: 'Jane Doe' } }} />

<Story name="Logged Out" />
```
