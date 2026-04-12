<script setup lang="ts">
import {
  IconBoxSeam,
  IconLayoutDashboard,
  IconSearch,
  IconTags,
} from "@tabler/icons-vue";

import NavMain from "@/components/global/sidebar/NavMain.vue";
import NavUser from "@/components/global/sidebar/NavUser.vue";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";

import { useCookies } from "@vueuse/integrations/useCookies";

import { useI18n } from "vue-i18n";

const { t } = useI18n();

const data = {
  navMain: [
    {
      title: t("sidebar.dashboard"),
      url: "/dashboard",
      icon: IconLayoutDashboard,
    },
    {
      title: t("sidebar.items"),
      url: "/items",
      icon: IconBoxSeam,
    },
    {
      title: t("sidebar.search"),
      url: "/search",
      icon: IconSearch,
    },
    {
      title: t("sidebar.tags"),
      url: "/tags",
      icon: IconTags,
    },
  ],
};

const cookies = useCookies(["sb-access-token"]);
</script>

<template>
  <Sidebar collapsible="offcanvas" class="ease-in-out">
    <SidebarHeader>
      <a href="#" class="flex flex-row">
        <img
          src="@/assets/icon.png"
          alt="Logo"
          class="mr-2 h-7 w-7 rounded-sm"
        />
        <span class="text-base font-semibold">things.pnxl.dev</span>
      </a>
    </SidebarHeader>
    <SidebarContent v-if="cookies.get('sb-access-token')">
      <NavMain :items="data.navMain" />
    </SidebarContent>
    <SidebarFooter :class="cookies.get('sb-access-token') ? '' : 'mt-auto'">
      <NavUser />
    </SidebarFooter>
  </Sidebar>
</template>
