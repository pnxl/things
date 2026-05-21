<script setup lang="ts"></script>

<template>
  <div class="flex flex-col items-center justify-center gap-4 h-full w-full">
    <img
      src="@/assets/icon.png"
      alt="Logo"
      class="size-64 rounded-sm"
    />
    <div class="flex flex-col items-center gap-1">
      <h1 class="font-semibold text-3xl">{{ $t("pages.404.title") }}</h1>
      <p class="text-muted-foreground">
        {{ $t("pages.404.description") }}
      </p>
      <p class="text-muted-foreground">
        {{ $t("pages.404.suggestion") }}
      </p>
    </div>
  </div>
</template>
