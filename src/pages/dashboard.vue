<script setup lang="ts">
import SiteHeader from "@/components/SiteHeader.vue";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardContent,
  CardAction,
  CardFooter,
} from "@/components/ui/card";

import { IconArrowUp, IconArrowDown } from "@tabler/icons-vue";
import { Badge } from "@/components/ui/badge";

import { useCookies } from "@vueuse/integrations/useCookies";
import { useRouter } from "vue-router";

const cookies = useCookies(["sb-access-token"]);
const router = useRouter();

if (!cookies.get("sb-access-token")) {
  router.replace({ path: "/login" });
}

import { supabase } from "@/lib/supabase";
import { ref, onMounted } from "vue";
import { de } from "zod/locales";

const categoriesCount = ref(0);
const categoriesAdded = ref(0);
const itemsCount = ref(0);
const itemsAdded = ref(0);
const deployedItemsCount = ref(0);
const deployedItemsAdded = ref(0);
const totalValue = ref(0);
const totalValueAdded = ref(0);
const deployedItems = ref<any[]>([]);

onMounted(async () => {
  const categoriesData = await supabase.from("categories").select();
  const itemsData = await supabase.from("items").select();

  if (!categoriesData.error) {
    categoriesCount.value = categoriesData.data.length;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    categoriesAdded.value = categoriesData.data.filter(
      (category) => new Date(category.created_at) >= thirtyDaysAgo,
    ).length;
  } else {
    console.error("Error fetching categories:", categoriesData.error);
  }

  if (!itemsData.error) {
    itemsCount.value = itemsData.data.length;
    deployedItemsCount.value = itemsData.data.filter(
      (item) => item.deployed !== "",
    ).length;
    totalValue.value = itemsData.data.reduce(
      (sum, item) => sum + item.price,
      0,
    );

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    itemsAdded.value = itemsData.data.filter(
      (item) => new Date(item.created_at) >= thirtyDaysAgo,
    ).length;
    deployedItemsAdded.value = itemsData.data.filter(
      (item) => item.deployed !== "" && new Date(item.deployed) >= yesterday,
    ).length;
    totalValueAdded.value = itemsData.data
      .filter((item) => new Date(item.created_at) >= thirtyDaysAgo)
      .reduce((sum, item) => sum + item.price, 0);

    deployedItems.value = itemsData.data
      .filter((item) => item.deployed !== "")
      .sort(
        (a, b) =>
          new Date(b.deployed).getTime() - new Date(a.deployed).getTime(),
      )
      .slice(0, 4);

    // fetch image URLs from supabase buckets and add them to each item in deployedItems
    for (const item of deployedItems.value) {
      const { data } = supabase.storage.from("items").getPublicUrl(item.uuid);
      item.image_url = data?.publicUrl;
    }
  } else {
    console.error("Error fetching items:", itemsData.error);
  }
});
</script>

<template>
  <SiteHeader :title="$t('dashboard.title')" />
  <section class="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
    <h1 class="font-semibold text-3xl">
      {{ $t("dashboard.inventory_summary") }}
    </h1>
    <div
      class="*:data-[slot=card]:from-accent/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:shadow-xs"
    >
      <Card class="@container/card">
        <CardHeader>
          <CardDescription>{{
            $t("dashboard.total_categories")
          }}</CardDescription>
          <CardTitle
            class="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl"
          >
            {{ categoriesCount }}
          </CardTitle>
          <CardAction v-if="categoriesAdded !== 0">
            <Badge variant="outline">
              <IconArrowUp v-if="categoriesAdded > 0" />
              <IconArrowDown v-if="categoriesAdded < 0" />
              {{ categoriesAdded }}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter class="flex-col items-start gap-1.5 text-sm">
          <div class="line-clamp-1 flex gap-2 font-medium">
            {{
              categoriesAdded > 0
                ? $t("dashboard.new_categories")
                : $t("dashboard.no_categories")
            }}
          </div>
          <div class="text-muted-foreground">
            {{ $t("dashboard.data_from_30d") }}
          </div>
        </CardFooter>
      </Card>
      <Card class="@container/card">
        <CardHeader>
          <CardDescription>{{ $t("dashboard.total_items") }}</CardDescription>
          <CardTitle
            class="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl"
          >
            {{ itemsCount }}
          </CardTitle>
          <CardAction v-if="itemsAdded !== 0">
            <Badge variant="outline">
              <IconArrowUp v-if="itemsAdded > 0" />
              <IconArrowDown v-if="itemsAdded < 0" />
              {{ itemsAdded }}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter class="flex-col items-start gap-1.5 text-sm">
          <div class="line-clamp-1 flex gap-2 font-medium">
            {{
              itemsAdded > 0
                ? $t("dashboard.new_items")
                : $t("dashboard.no_new_items")
            }}
          </div>
          <div class="text-muted-foreground">
            {{ $t("dashboard.data_from_30d") }}
          </div>
        </CardFooter>
      </Card>
      <Card class="@container/card">
        <CardHeader>
          <CardDescription>{{
            $t("dashboard.items_deployed")
          }}</CardDescription>
          <CardTitle
            class="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl"
          >
            {{ deployedItemsCount }}
          </CardTitle>
          <CardAction v-if="deployedItemsAdded > 0">
            <Badge variant="outline">
              <IconArrowUp />
              {{ deployedItemsAdded }}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter class="flex-col items-start gap-1.5 text-sm">
          <div class="line-clamp-1 flex gap-2 font-medium">
            {{
              deployedItemsCount > 0
                ? $t("dashboard.new_deployments")
                : $t("dashboard.no_new_deployments")
            }}
          </div>
          <div class="text-muted-foreground">
            {{ $t("dashboard.data_compared_yesterday") }}
          </div>
        </CardFooter>
      </Card>
      <Card class="@container/card">
        <CardHeader>
          <CardDescription>{{ $t("dashboard.total_value") }}</CardDescription>
          <CardTitle
            class="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl"
          >
            {{ $t("global.currency") }}{{ totalValue.toLocaleString() }}
          </CardTitle>
          <CardAction v-if="totalValueAdded > 0">
            <Badge variant="outline">
              <IconArrowUp />
              {{
                totalValueAdded.toLocaleString().length > 8
                  ? totalValueAdded.toLocaleString().slice(0, -8) +
                    $t("global.millionAbbreviation")
                  : totalValueAdded.toLocaleString().slice(0, -4) +
                    $t("global.thousandAbbreviation")
              }}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter class="flex-col items-start gap-1.5 text-sm">
          <div class="line-clamp-1 flex gap-2 font-medium">
            {{
              totalValueAdded > 0
                ? $t("dashboard.new_value_increase")
                : $t("dashboard.no_value_increase")
            }}
          </div>
          <div class="text-muted-foreground">
            {{ $t("dashboard.data_from_30d") }}
          </div>
        </CardFooter>
      </Card>
    </div>
  </section>
  <section class="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
    <h1 class="font-semibold text-3xl">
      {{ $t("dashboard.deployed_items") }}
    </h1>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card
        v-for="item in deployedItems"
        :key="item.id"
        class="@container/card hover:bg-secondary transition-colors duration-200"
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
        <CardFooter>
          <CardDescription>{{
            $t("dashboard.deployed_on", {
              date: new Date(item.deployed).toLocaleDateString(undefined, {
                year: "numeric",
                month: "numeric",
                day: "numeric",
              }),
            })
          }}</CardDescription>
        </CardFooter>
      </Card>
    </div>
  </section>
</template>
