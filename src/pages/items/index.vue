<script setup lang="ts">
import SiteHeader from "@/components/SiteHeader.vue";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";

import { useCookies } from "@vueuse/integrations/useCookies";
import { useRouter } from "vue-router";

const cookies = useCookies(["sb-access-token"]);
const router = useRouter();

if (!cookies.get("sb-access-token")) {
  router.replace({ path: "/login" });
}

import { supabase } from "@/lib/supabase";
import { ref, onMounted } from "vue";
import Separator from "@/components/ui/separator/Separator.vue";
import { IconBlocks, IconFolder } from "@tabler/icons-vue";

const categories = ref<any[]>([]);
const items = ref<any[]>([]);

onMounted(async () => {
  const categoriesData = await supabase.from("categories").select();
  const itemsData = await supabase.from("items").select();

  if (!categoriesData.error) {
    categories.value = categoriesData.data;
  } else {
    console.error("Error fetching categories:", categoriesData.error);
  }

  if (!itemsData.error) {
    items.value = itemsData.data;

    // fetch image URLs from supabase buckets and add them to each item in items
    for (const item of items.value) {
      const { data } = supabase.storage.from("items").getPublicUrl(item.uuid);
      item.image_url = data?.publicUrl;
    }
  } else {
    console.error("Error fetching items:", itemsData.error);
  }
});
</script>

<template>
  <SiteHeader :title="$t('items.title')" />
  <div class="flex flex-col md:flex-row h-full">
    <section
      class="w-full md:w-1/3 lg:w-1/4 md:h-full p-4 gap-4 md:gap-6 lg:p-6 md:flex flex-col"
    >
      <h1 class="text-lg font-medium pb-2 md:hidden">
        {{ $t("items.categories") }}
      </h1>
      <div class="flex flex-col gap-1 -mx-4 md:mx-0">
        <router-link
          to="/items"
          :class="
            (!$route.query.f
              ? 'bg-accent/70  cursor-default'
              : 'hover:bg-accent/70') +
            ' flex flex-row gap-2 duration-200 transition-colors px-3 p-1.5 md:rounded-md'
          "
        >
          <IconBlocks class="size-4 my-auto" />
          <span class="text-sm">{{ $t("items.all_items") }}</span>
        </router-link>
        <router-link
          v-for="category in categories"
          :to="`/items?f=${category.uuid}`"
          :class="
            ($route.query.f === category.uuid
              ? 'bg-secondary/70 cursor-default'
              : ' hover:bg-secondary/70') +
            ' flex flex-row gap-2 duration-200 transition-colors px-3 p-1.5 md:rounded-md'
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
    <section class="flex flex-col gap-4 p-4 md:gap-6 md:p-6 w-full">
      <div class="flex flex-row justify-between">
        <h1 class="text-lg font-medium">
          {{
            $route.query.f
              ? $t("items.items_in_category", {
                  category: categories.find((c) => c.uuid === $route.query.f)
                    ?.name,
                })
              : $t("items.all_items")
          }}
        </h1>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          v-for="item in items.filter(
            (item) => !$route.query.f || item.category === $route.query.f,
          )"
          :key="item.uuid"
          @click="$router.push(`/items/${item.uuid}`)"
          class="@container/card hover:bg-secondary transition-colors duration-200 cursor-pointer"
        >
          <CardHeader>
            <CardTitle
              class="text-xl font-medium tabular-nums @[250px]/card:text-xl line-clamp-1"
            >
              {{ item.name }}
            </CardTitle>
            <CardDescription
              >1 unit &bull; {{ $t("global.currency")
              }}{{ item.price.toLocaleString() }}</CardDescription
            >
          </CardHeader>
          <CardContent class="sm:block hidden">
            <img
              :src="item.image_url"
              :alt="$t('dashboard.item_image_alt')"
              class="rounded-lg"
            />
          </CardContent>
        </Card>
      </div>
    </section>
  </div>
</template>
