<script setup lang="ts">
import SiteHeader from "@/components/SiteHeader.vue";

import Form from "@/components/pages/login/Form.vue";
</script>

<template>
  <SiteHeader title="Log In" />
  <div
    class="bg-background flex min-h-[92svh] md:min-h-[80svh] flex-col items-center justify-center gap-6 p-6 md:p-10"
  >
    <div class="w-full max-w-sm">
      <Form />
    </div>
  </div>
</template>
