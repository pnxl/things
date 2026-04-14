<script setup lang="ts">
import {
  IconBoxSeam,
  IconCirclePlusFilled,
  IconLayoutDashboard,
  IconSearch,
  IconTags,
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
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

import { ref, onMounted } from "vue";
import { supabase } from "@/lib/supabase";
import { useCookies } from "@vueuse/integrations/useCookies";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const items = [
  {
    title: t("components.sidebar.dashboard"),
    url: "/dashboard",
    icon: IconLayoutDashboard,
  },
  {
    title: t("components.sidebar.items"),
    url: "/items",
    icon: IconBoxSeam,
  },
  {
    title: t("components.sidebar.search"),
    url: "/search",
    icon: IconSearch,
  },
  {
    title: t("components.sidebar.tags"),
    url: "/tags",
    icon: IconTags,
  },
];

const { isMobile } = useSidebar();

const cookies = useCookies(["sb-access-token"]);
const userdata = JSON.parse(localStorage.getItem("sb-user-data") || "{}");
const profilePictureUrl = ref("");

async function logout() {
  await supabase.auth.signOut();
  cookies.remove("sb-access-token");
  cookies.remove("sb-refresh-token");
  cookies.remove("sb-expires-at");
  localStorage.removeItem("sb-user-data");
  location.reload();
}

onMounted(async () => {
  const fetchedProfilePicture = supabase.storage
    .from("profile_pictures")
    .getPublicUrl(userdata.id);

  profilePictureUrl.value = fetchedProfilePicture.data.publicUrl;
});
</script>

<template>
  <Sidebar collapsible="offcanvas" class="ease-in-out">
    <SidebarHeader>
      <a href="#" class="flex flex-row">
        <img
          src="@/assets/icon.png"
          :alt="$t('components.sidebar.logo_alt')"
          class="mr-2 h-7 w-7 rounded-sm"
        />
        <span class="text-base font-semibold">things.pnxl.dev</span>
      </a>
    </SidebarHeader>
    <SidebarContent v-if="cookies.get('sb-access-token')">
      <SidebarGroup>
        <SidebarGroupContent class="flex flex-col gap-2">
          <SidebarMenu>
            <SidebarMenuItem class="flex items-center gap-2">
              <SidebarMenuButton
                tooltip="Quick Create"
                class="bg-accent text-accent-foreground hover:bg-accent/90 hover:text-accent-foreground active:bg-accent/90 active:text-accent-foreground min-w-8 transition-colors duration-200 ease-linear"
              >
                <IconCirclePlusFilled />
                <span>{{ $t("components.sidebar.add_new_item") }}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          <SidebarMenu>
            <SidebarMenuItem v-for="item in items" :key="item.title">
              <router-link :to="item.url">
                <SidebarMenuButton
                  :tooltip="item.title"
                  :class="
                    $route.path === item.url
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground cursor-normal'
                      : ''
                  "
                >
                  <component :is="item.icon" v-if="item.icon" />
                  <span>{{ item.title }}</span>
                </SidebarMenuButton>
              </router-link>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
    <SidebarFooter :class="cookies.get('sb-access-token') ? '' : 'mt-auto'">
      <SidebarMenu>
        <SidebarMenuItem>
          <router-link to="/login" v-if="!cookies.get('sb-access-token')">
            <SidebarMenuButton
              tooltip="Log In"
              :class="
                $route.path === '/login'
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground cursor-normal'
                  : ''
              "
              ><IconLogin />
              <span>{{ $t("components.sidebar.login") }}</span>
            </SidebarMenuButton>
          </router-link>

          <DropdownMenu v-else>
            <DropdownMenuTrigger as-child>
              <SidebarMenuButton
                size="lg"
                class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Avatar class="h-8 w-8 rounded-lg">
                  <AvatarImage
                    :src="profilePictureUrl"
                    :alt="$t('components.sidebar.profile_picture_alt')"
                  />
                  <AvatarFallback class="rounded-lg"> 👤 </AvatarFallback>
                </Avatar>
                <div class="grid flex-1 text-left text-sm leading-tight">
                  <span class="truncate font-medium">{{
                    userdata.user_metadata.display_name ||
                    $t("components.sidebar.unknown_user")
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
                <div
                  class="flex items-center gap-2 px-1 py-1.5 text-left text-sm"
                >
                  <Avatar class="h-8 w-8 rounded-lg">
                    <AvatarImage
                      :src="profilePictureUrl"
                      :alt="$t('components.sidebar.profile_picture_alt')"
                    />
                    <AvatarFallback class="rounded-lg"> 👤 </AvatarFallback>
                  </Avatar>
                  <div class="grid flex-1 text-left text-sm leading-tight">
                    <span class="truncate font-medium">{{
                      userdata.user_metadata.display_name ||
                      $t("components.sidebar.unknown_user")
                    }}</span>
                    <span class="text-muted-foreground truncate text-xs">
                      {{ userdata.email }}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem @click="$router.push('/account')">
                  <IconUserCircle />
                  {{ $t("components.sidebar.account") }}
                </DropdownMenuItem>
                <DropdownMenuItem @click="$router.push('/settings')">
                  <IconSettings />
                  {{ $t("components.sidebar.settings") }}
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" @click="logout()">
                <IconLogout />
                {{ $t("components.sidebar.logout") }}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  </Sidebar>
</template>
