<script setup lang="ts">
import {
  IconDotsVertical,
  IconLogin,
  IconLogout,
  IconSettings,
  IconUserCircle,
} from "@tabler/icons-vue";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

import { supabase } from "@/lib/supabase";

import { useCookies } from "@vueuse/integrations/useCookies";

const { isMobile } = useSidebar();

const cookies = useCookies(["sb-access-token"]);
const userdata = JSON.parse(localStorage.getItem("sb-user-data") || "{}");

async function logout() {
  await supabase.auth.signOut();
  cookies.remove("sb-access-token");
  cookies.remove("sb-refresh-token");
  cookies.remove("sb-expires-at");
  localStorage.removeItem("sb-user-data");
  location.reload();
}
</script>

<template>
  <SidebarMenu>
    <SidebarMenuItem>
      <router-link to="/login" v-if="!cookies.get('sb-access-token')">
        <SidebarMenuButton
          tooltip="Log In"
          :class="
            $route.path === '/login'
              ? 'bg-sidebar-accent text-sidebar-accent-foreground cursor-normal'
              : 'cursor-pointer'
          "
          ><IconLogin />
          <span>Log In</span>
        </SidebarMenuButton>
      </router-link>

      <DropdownMenu v-else>
        <DropdownMenuTrigger as-child>
          <SidebarMenuButton
            size="lg"
            class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-pointer"
          >
            <Avatar class="h-8 w-8 rounded-lg grayscale">
              <AvatarImage
                :src="userdata.user_metadata.avatar || '/avatars/shadcn.jpg'"
                :alt="userdata.user_metadata.name || 'User Avatar'"
              />
              <AvatarFallback class="rounded-lg"> CN </AvatarFallback>
            </Avatar>
            <div class="grid flex-1 text-left text-sm leading-tight">
              <span class="truncate font-medium">{{
                userdata.user_metadata.name || "Unknown User"
              }}</span>
              <span class="text-muted-foreground truncate text-xs">
                {{ userdata.email }}
              </span>
            </div>
            <IconDotsVertical class="ml-auto size-4" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          class="w-(--reka-dropdown-menu-trigger-width) min-w-56 rounded-lg"
          :side="isMobile ? 'bottom' : 'right'"
          :side-offset="4"
          align="end"
        >
          <DropdownMenuLabel class="p-0 font-normal">
            <div class="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
              <Avatar class="h-8 w-8 rounded-lg">
                <AvatarImage
                  :src="userdata.user_metadata.avatar || '/avatars/shadcn.jpg'"
                  :alt="userdata.user_metadata.name || 'User Avatar'"
                />
                <AvatarFallback class="rounded-lg"> CN </AvatarFallback>
              </Avatar>
              <div class="grid flex-1 text-left text-sm leading-tight">
                <span class="truncate font-medium">{{
                  userdata.user_metadata.name || "Unknown User"
                }}</span>
                <span class="text-muted-foreground truncate text-xs">
                  {{ userdata.email }}
                </span>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem>
              <IconUserCircle />
              Account
            </DropdownMenuItem>
            <DropdownMenuItem>
              <IconSettings />
              Settings
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" @click="logout()">
            <IconLogout />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  </SidebarMenu>
</template>
