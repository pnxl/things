<script setup lang="ts">
import SiteHeader from "@/components/SiteHeader.vue";

import Summary from "@/components/pages/dashboard/Summary.vue";
import Recents from "@/components/pages/dashboard/Recents.vue";

import { useCookies } from "@vueuse/integrations/useCookies";
import { useRouter } from "vue-router";

const cookies = useCookies(["sb-access-token"]);
const router = useRouter();

if (!cookies.get("sb-access-token")) {
  router.replace({ path: "/login" });
}
</script>

<template>
  <SiteHeader title="Dashboard" />
  <Summary />
  <Recents />
</template>
