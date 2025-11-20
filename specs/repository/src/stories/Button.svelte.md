---
title: Button.svelte - Svelte 5 컴포넌트
original_path: src/stories/Button.svelte
category: source
file_type: svelte
status: current
last_updated: 2025-11-20
---

# Button.svelte

## 개요

**원본 경로**: `src/stories/Button.svelte`

**파일 유형**: Svelte 5 컴포넌트

## 소스 코드

```svelte
<script lang="ts">
  import './button.css';

  interface Props {
    /** Is this the principal call to action on the page? */
    primary?: boolean;
    /** What background color to use */
    backgroundColor?: string;
    /** How large should the button be? */
    size?: 'small' | 'medium' | 'large';
    /** Button contents */
    label: string;
    /** The onclick event handler */
    onclick?: () => void;
  }

  const { primary = false, backgroundColor, size = 'medium', label, ...props }: Props = $props();
  
  let mode = $derived(primary ? 'storybook-button--primary' : 'storybook-button--secondary');
  let style = $derived(backgroundColor ? `background-color: ${backgroundColor}` : '');
</script>

<button
  type="button"
  class={['storybook-button', `storybook-button--${size}`, mode].join(' ')}
  {style}
  {...props}
>
  {label}
</button>
```
