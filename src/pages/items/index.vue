<script setup lang="ts">
import {
  IconBlocks,
  IconFolder,
  IconLayoutGrid,
  IconLayoutList,
} from "@tabler/icons-vue";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import Separator from "@/components/ui/separator/Separator.vue";
import Button from "@/components/ui/button/Button.vue";

import SiteHeader from "@/components/SiteHeader.vue";
import ErrorBanner from "@/components/ErrorBanner.vue";

import { useCookies } from "@vueuse/integrations/useCookies";
import { useRouter } from "vue-router";
import { supabase } from "@/lib/supabase";
import { ref, onMounted } from "vue";

if (!useCookies(["sb-access-token"]).get("sb-access-token")) {
  useRouter().replace({ path: "/login" });
}

const errorMessages = ref<string[]>([]);
const supabaseLoaded = ref(false);

const userdata = JSON.parse(localStorage.getItem("sb-user-data") || "{}");
const viewMode = ref(
  String(userdata.user_metadata.settings?.viewmode) || "grid",
);

const items = ref<any[]>([]);
const categories = ref<any[]>([]);
const tags = ref<any[]>([]);

async function setViewMode(mode: string) {
  viewMode.value = mode;

  const settings = {
    viewmode: mode,
  };

  localStorage.setItem(
    "sb-user-data",
    JSON.stringify({
      ...userdata,
      user_metadata: {
        ...userdata.user_metadata,
        settings: {
          ...userdata.user_metadata.settings,
          ...settings,
        },
      },
    }),
  );

  await supabase.auth.updateUser({
    data: {
      settings: {
        ...userdata.user_metadata.settings,
        ...settings,
      },
    },
  });
}

onMounted(async () => {
  const itemsData = await supabase.from("items").select();
  const categoriesData = await supabase.from("categories").select();
  const tagsData = await supabase.from("tags").select();

  if (!itemsData.error) {
    items.value = itemsData.data;

    // fetch image URLs from supabase buckets and add them to each item in items
    for (const item of items.value) {
      const { data } = supabase.storage.from("items").getPublicUrl(item.id);
      item.image_url = data?.publicUrl;
    }
    supabaseLoaded.value = true;
    errorMessages.value = [];
  } else {
    console.error("Error fetching items:", itemsData.error);
    errorMessages.value.push(itemsData.error.message);
  }

  if (!categoriesData.error) {
    categories.value = categoriesData.data;
    errorMessages.value = [];
  } else {
    console.error("Error fetching categories:", categoriesData.error);
    errorMessages.value.push(categoriesData.error.message);
  }

  if (!tagsData.error) {
    tags.value = tagsData.data;
    errorMessages.value = [];
  } else {
    console.error("Error fetching tags:", tagsData.error);
    errorMessages.value.push(tagsData.error.message);
  }
});
</script>

<template>
  <SiteHeader :title="$t('pages.items.editors.title')" />
  <ErrorBanner :errors="errorMessages" />
  <div class="flex flex-col md:flex-row h-full">
    <section
      class="w-full md:w-1/3 2xl:w-1/4 md:h-full p-4 gap-4 md:gap-6 lg:p-6 md:flex flex-col"
    >
      <h1 class="text-lg font-medium pb-2 md:hidden">
        {{ $t("pages.items.categories") }}
      </h1>
      <div class="flex flex-col gap-1">
        <router-link
          to="/items"
          :class="
            (!$route.query.f
              ? 'bg-accent text-background dark:text-primary dark:bg-accent/70 cursor-default'
              : 'hover:bg-accent/10 dark:hover:bg-accent/70') +
            ' flex flex-row gap-2 duration-200 transition-colors px-3 p-1.5 rounded-md'
          "
        >
          <IconBlocks class="size-4 my-auto" />
          <span class="text-sm">{{ $t("pages.items.all_items") }}</span>
        </router-link>
        <router-link
          v-for="category in categories"
          :to="`/items?f=${category.id}`"
          :class="
            ($route.query.f === category.id
              ? 'bg-secondary/70 cursor-default'
              : ' hover:bg-secondary/70') +
            ' flex flex-row gap-2 duration-200 transition-colors px-3 p-1.5 rounded-md'
          "
        >
          <IconFolder class="size-4 my-auto" />
          <span class="text-sm">{{ category.name }}</span>
        </router-link>
      </div>
    </section>
    <Separator
      orientation="vertical"
      class="data-[orientation=vertical]:h-full md:block hidden"
    />
    <section class="flex flex-col gap-4 p-4 lg:gap-6 lg:p-6 w-full">
      <div class="flex flex-row justify-between">
        <h1 class="text-lg font-medium">
          {{
            $route.query.f
              ? $t("pages.items.items_in_category", {
                  category: categories.find((c) => c.id === $route.query.f)
                    ?.name,
                })
              : $t("pages.items.all_items")
          }}
        </h1>
        <div class="flex flex-row gap-0">
          <Button
            variant="outline"
            size="sm"
            :class="
              (viewMode === 'grid' ? 'bg-input!' : 'border-r-0') +
              ' rounded-r-none'
            "
            @click.prevent="setViewMode('grid')"
          >
            <IconLayoutGrid />
          </Button>
          <Button
            variant="outline"
            size="sm"
            :class="
              (viewMode === 'list' ? 'bg-input!' : 'border-l-0') +
              ' rounded-l-none'
            "
            @click.prevent="setViewMode('list')"
          >
            <IconLayoutList />
          </Button>
        </div>
      </div>
      <div
        v-if="!supabaseLoaded"
        :class="
          (viewMode === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 2xl:grid-cols-4 gap-4'
            : 'flex flex-col gap-4') +
          ' opacity-50 animate-pulse overflow-y-clip md:h-[75svh] h-[50svh] relative'
        "
      >
        <div
          class="absolute w-full bg-linear-to-t from-background to-transparent h-24 bottom-0"
        ></div>
        <Card
          :class="(viewMode === 'grid' ? 'h-64' : ' h-24') + ' @container/card'"
        >
        </Card>
        <Card
          :class="(viewMode === 'grid' ? 'h-64' : ' h-24') + ' @container/card'"
        >
        </Card>
        <Card
          :class="(viewMode === 'grid' ? 'h-64' : ' h-24') + ' @container/card'"
        >
        </Card>
        <Card
          :class="(viewMode === 'grid' ? 'h-64' : ' h-24') + ' @container/card'"
        >
        </Card>
        <Card
          :class="(viewMode === 'grid' ? 'h-64' : ' h-24') + ' @container/card'"
        >
        </Card>
        <Card
          :class="(viewMode === 'grid' ? 'h-64' : ' h-24') + ' @container/card'"
        >
        </Card>
      </div>
      <div
        v-else
        :class="
          viewMode === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 2xl:grid-cols-4 gap-4'
            : 'flex flex-col gap-4'
        "
      >
        <Card
          v-for="item in items.filter(
            (item) => !$route.query.f || item.category === $route.query.f,
          )"
          :key="item.id"
          @click="$router.push(`/items/${item.id}`)"
          :class="
            (viewMode === 'grid' ? '' : 'flex flex-row') +
            ' @container/card hover:bg-secondary transition-colors duration-200 cursor-pointer justify-between'
          "
        >
          <CardHeader
            :class="
              (viewMode === 'grid' ? '' : 'gap-1 justify-between') +
              ' w-full flex flex-col'
            "
          >
            <CardTitle
              class="text-xl font-medium tabular-nums @[250px]/card:text-xl line-clamp-1"
            >
              {{ item.name }}
            </CardTitle>
            <CardDescription
              >{{
                item.weight.toLocaleString($t("language.locale"), {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1,
                })
              }}
              {{ $t("language.units.mass") }} &bull;
              {{ $t("language.units.currency") }}
              {{
                item.price.toLocaleString($t("language.locale"))
              }}</CardDescription
            >
            <div class="opacity-50">
              <div
                v-for="tag in item.tags"
                :key="tag"
                class="text-sm border rounded-md px-1.5 border-muted-foreground inline-block mr-1 last:mr-0"
              >
                {{
                  tags.find((t) => t.id === tag)?.name ||
                  $t("pages.items.viewer.unknown_tag")
                }}
              </div>
            </div>
          </CardHeader>
          <CardContent
            :class="(viewMode === 'grid' ? '' : 'w-fit') + ' sm:block hidden'"
          >
            <img
              :src="item.image_url"
              :alt="$t('pages.dashboard.item_image_alt')"
              :class="
                (viewMode === 'grid' ? 'aspect-3/2' : 'aspect-square') +
                ' rounded-lg border shadow-sm object-cover object-center'
              "
            />
          </CardContent>
        </Card>
      </div>
    </section>
  </div>
</template>
