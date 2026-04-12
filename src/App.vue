<script setup lang="ts">
import AppSidebar from "@/components/global/sidebar/AppSidebar.vue";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
</script>

<script lang="ts">
import { supabase } from "@/lib/supabase";
import { useCookies } from "@vueuse/integrations/useCookies";

const { data, error } = await supabase.auth.getSession();

const cookies = useCookies([
  "sb-access-token",
  "sb-refresh-token",
  "sb-expires-at",
]);

if (data.session !== null) {
  setInterval(
    async () => {
      const { data, error } = await supabase.auth.refreshSession();

      if (data.session !== null) {
        cookies.set("sb-access-token", data.session.access_token);
        cookies.set("sb-refresh-token", data.session.refresh_token);
        cookies.set("sb-expires-at", data.session.expires_at);

        console.log("Session refreshed.");
      }

      if (error) {
        console.error("Error refreshing session!", error);

        await supabase.auth.signOut();
        cookies.remove("sb-access-token");
        cookies.remove("sb-refresh-token");
        cookies.remove("sb-expires-at");
        localStorage.removeItem("sb-user-data");
        location.reload();
      }
    },
    (data.session?.expires_in ?? 0) * 1000,
  );
}
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
