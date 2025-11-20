<!--
  게시판 카테고리 텍스트 네비게이션 컴포넌트

  - 전체 + 개별 카테고리를 텍스트 리스트로 렌더링한다.
  - 클릭 시 change 이벤트로 선택된 카테고리를 부모에게 전달한다.
-->

<script lang="ts">
  import { FORUM_CATEGORIES, type ForumCategory } from '../../../../shared/categories';
  import * as m from '$lib/paraglide/messages.js';
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher<{
    change: { category: ForumCategory | null };
    create: { category: ForumCategory | null };
  }>();

  export let selectedCategory: ForumCategory | null = null;
  export let showAll = true;
  export let allLabel: string = m.composeAll();
  /**
   * 카테고리 목록 끝에 글쓰기 버튼을 표시할지 여부
   */
  export let showCreateButton = false;

  const categoryLabelMap: Record<ForumCategory, () => string> = {
    discussion: m.chatCategoryFreeDiscussion,
    qna: m.chatCategoryQna,
    news: m.chatCategoryNews,
    info: m.chatCategoryInformation,
    selling: m.chatCategoryForSale,
    hiring: m.chatCategoryJobs,
    travel: m.chatCategoryTravel,
    mukbang: m.chatCategoryFood,
    realestate: m.chatCategoryRealEstate,
    hobby: m.chatCategoryHobby,
    story: m.chatCategoryStory
  };

  const getCategoryLabel = (category: ForumCategory) => categoryLabelMap[category]();

  function handleSelect(category: ForumCategory | null) {
    dispatch('change', { category });
  }

  /**
   * 글쓰기 버튼 클릭 핸들러
   * 현재 선택된 카테고리를 포함하여 create 이벤트를 dispatch
   */
  function handleCreate() {
    dispatch('create', { category: selectedCategory });
  }
</script>

<div class="category-text-nav flex flex-wrap items-center gap-4">
  {#if showAll}
    <button
      type="button"
      class="category-text-button cursor-pointer px-1"
      class:active={selectedCategory === null}
      on:click={() => handleSelect(null)}
    >
      {allLabel}
    </button>
  {/if}

  {#each FORUM_CATEGORIES as category}
    <button
      type="button"
      class="category-text-button cursor-pointer px-1"
      class:active={selectedCategory === category}
      on:click={() => handleSelect(category)}
    >
      {getCategoryLabel(category)}
    </button>
  {/each}

  {#if showCreateButton}
    <button
      type="button"
      class="category-create-button cursor-pointer px-1"
      on:click={handleCreate}
    >
      {m.boardWritePost()}
    </button>
  {/if}
</div>

<style>
  @import 'tailwindcss' reference;

  .category-text-nav {
    @apply w-full;
  }

  .category-text-button {
    @apply text-sm text-gray-600 transition-colors;
  }

  .category-text-button:hover {
    @apply text-gray-900;
  }

  .category-text-button.active {
    @apply font-semibold text-blue-600;
  }

  /* 글쓰기 버튼 스타일 */
  .category-create-button {
    @apply text-sm text-blue-600 transition-colors;
    @apply font-medium;
  }

  .category-create-button:hover {
    @apply text-blue-700;
  }
</style>
