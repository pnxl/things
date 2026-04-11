<script setup lang="ts">
import type { Component } from "vue";
import { IconCirclePlusFilled } from "@tabler/icons-vue";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

interface NavItem {
  title: string;
  url: string;
  icon?: Component;
}

defineProps<{
  items: NavItem[];
}>();
</script>

<template>
  <SidebarGroup>
    <SidebarGroupContent class="flex flex-col gap-2">
      <SidebarMenu>
        <SidebarMenuItem class="flex items-center gap-2">
          <SidebarMenuButton
            tooltip="Quick Create"
            class="bg-accent cursor-pointer text-accent-foreground hover:bg-accent/90 hover:text-accent-foreground active:bg-accent/90 active:text-accent-foreground min-w-8 transition-colors duration-200 ease-linear"
          >
            <IconCirclePlusFilled />
            <span>Add New Item</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
      <SidebarMenu>
        <SidebarMenuItem v-for="item in items" :key="item.title">
          <a :href="item.url">
            <SidebarMenuButton
              :tooltip="item.title"
              :class="
                $route.path === item.url
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground cursor-normal'
                  : 'cursor-pointer'
              "
            >
              <component :is="item.icon" v-if="item.icon" />
              <span>{{ item.title }}</span>
            </SidebarMenuButton>
          </a>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroupContent>
  </SidebarGroup>
</template>
