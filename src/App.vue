<script setup lang="ts">
import AppSidebar from "@/components/global/sidebar/AppSidebar.vue";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
</script>

<template>
  <SidebarProvider
    :style="{
      '--sidebar-width': 'calc(var(--spacing) * 72)',
      '--header-height': 'calc(var(--spacing) * 12)',
    }"
  >
    <AppSidebar variant="inset" />
    <SidebarInset>
      <router-view />
    </SidebarInset>
  </SidebarProvider>
</template>
