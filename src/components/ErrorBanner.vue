<script setup lang="ts">
import { IconAlertCircle } from "@tabler/icons-vue";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

defineProps({ errors: Array });
</script>

<template>
  <Alert
    variant="destructive"
    v-if="errors && errors.length > 0"
    v-for="error in errors"
  >
    <IconAlertCircle class="w-4 h-4" />
    <AlertTitle class="font-semibold">{{
      $t("components.error.title")
    }}</AlertTitle>
    <AlertDescription> {{ error }} </AlertDescription>
  </Alert>
</template>
