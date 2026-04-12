<script setup lang="ts">
import AppSidebar from "@/components/global/sidebar/AppSidebar.vue";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import { onMounted } from "vue";

// restore user settings on page load
onMounted(() => {
  if (!localStorage.getItem("sb-user-data")) return;

  const theme = localStorage.getItem("sb-user-data")
    ? JSON.parse(localStorage.getItem("sb-user-data") || "{}").user_metadata
        .settings?.appearance
    : "system";

  if (theme === "dark") {
    document.documentElement.classList.add("dark");
  } else if (theme === "light") {
    document.documentElement.classList.remove("dark");
  } else {
    // Follow system setting
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    if (prefersDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }

  // Listen for system theme changes if user preference is "system"
  if (theme === "system") {
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", (e) => {
        if (e.matches) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      });
  }
});
</script>

<script lang="ts">
import { supabase } from "@/lib/supabase";
import { useCookies } from "@vueuse/integrations/useCookies";

// refresh session on page load
const { data, error } = await supabase.auth.getSession();

const cookies = useCookies([
  "sb-access-token",
  "sb-refresh-token",
  "sb-expires-at",
]);

// if there's an active session, set cookies, user data, and start refresh timer
if (data.session !== null) {
  cookies.set("sb-access-token", data.session.access_token);
  cookies.set("sb-refresh-token", data.session.refresh_token);
  cookies.set("sb-expires-at", data.session.expires_at);

  const userData = (await supabase.auth.getUser()).data.user;

  localStorage.setItem("sb-user-data", JSON.stringify(userData));

  setInterval(
    // refresh session 1 minute before it expires
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
    (data.session?.expires_in ?? 0) * 1000 - 60000,
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
