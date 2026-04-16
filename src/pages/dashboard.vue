<script setup lang="ts">
import { IconArrowUp, IconArrowDown } from "@tabler/icons-vue";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardContent,
  CardAction,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import SiteHeader from "@/components/SiteHeader.vue";
import ErrorBanner from "@/components/ErrorBanner.vue";

import { supabase } from "@/lib/supabase";
import { ref, onMounted } from "vue";
import { useCookies } from "@vueuse/integrations/useCookies";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

if (!useCookies(["sb-access-token"]).get("sb-access-token")) {
  useRouter().replace({ path: "/login" });
}

const errorMessages = ref<string[]>([]);
const supabaseLoaded = ref(false);

const dashboardData = ref({
  categoriesCount: 0,
  categoriesAdded: 0,
  itemsCount: 0,
  itemsAdded: 0,
  deployedItemsCount: 0,
  deployedItemsAdded: 0,
  totalValue: 0,
  totalValueAdded: 0,
});
const deployedItems = ref<any[]>([]);

const now = new Date();

const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(now.getDate() - 30);

const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);

function shortenNumber(input: number): string {
  switch (true) {
    case input >= 1_000_000_000:
      return (
        (input / 1_000_000_000).toLocaleString(t("language.locale"), {
          maximumFractionDigits: 1,
        }) + t("language.numberAbbreviations.billion")
      );
    case input >= 1_000_000:
      return (
        (input / 1_000_000).toLocaleString(t("language.locale"), {
          maximumFractionDigits: 1,
        }) + t("language.numberAbbreviations.million")
      );
    case input >= 1_000:
      return (
        (input / 1_000).toLocaleString(t("language.locale"), {
          maximumFractionDigits: 1,
        }) + t("language.numberAbbreviations.thousand")
      );
    default:
      return input.toLocaleString(t("language.locale"));
  }
}

onMounted(async () => {
  const categoriesData = await supabase.from("categories").select();
  const itemsData = await supabase.from("items").select();

  if (!categoriesData.error) {
    dashboardData.value.categoriesCount = categoriesData.data.length;
    dashboardData.value.categoriesAdded = categoriesData.data.filter(
      (category) => new Date(category.created_at) >= thirtyDaysAgo,
    ).length;

    errorMessages.value = [];
  } else {
    console.error("Error fetching categories:", categoriesData.error);
    errorMessages.value.push(categoriesData.error.message);
  }

  if (!itemsData.error) {
    dashboardData.value.itemsCount = itemsData.data.length;
    dashboardData.value.itemsAdded = itemsData.data.filter(
      (item) => new Date(item.created_at) >= thirtyDaysAgo,
    ).length;

    dashboardData.value.deployedItemsCount = itemsData.data.filter(
      (item) => item.deployed !== "",
    ).length;
    dashboardData.value.deployedItemsAdded = itemsData.data.filter(
      (item) => item.deployed !== "" && new Date(item.deployed) >= yesterday,
    ).length;

    dashboardData.value.totalValue = itemsData.data.reduce(
      (sum, item) => sum + item.price,
      0,
    );
    dashboardData.value.totalValueAdded = itemsData.data
      .filter((item) => new Date(item.created_at) >= thirtyDaysAgo)
      .reduce((sum, item) => sum + item.price, 0);

    deployedItems.value = itemsData.data
      .filter((item) => item.deployed !== "")
      .sort(
        (a, b) =>
          new Date(b.deployed).getTime() - new Date(a.deployed).getTime(),
      )
      .slice(0, 4);

    // fetch image URLs from supabase buckets and add them to each item in items
    for (const item of deployedItems.value) {
      const { data } = await supabase.storage
        .from("items")
        .getPublicUrl(String(item.id));

      // if it doesn't exist don't add the image_url property to the item
      // supabase is kinda weird about it because it'll still return a string
      const doesItemExist = await supabase.storage
        .from("items")
        .exists(String(item.id));

      if (doesItemExist.data === true) {
        item.image_url = data?.publicUrl;
      }
    }

    supabaseLoaded.value = true;

    errorMessages.value = [];
  } else {
    console.error("Error fetching items:", itemsData.error);
    errorMessages.value.push(itemsData.error.message);
  }
});
</script>

<template>
  <SiteHeader :title="$t('pages.dashboard.title')" />
  <ErrorBanner :errors="errorMessages" />
  <section class="flex flex-col gap-4 p-4 lg:gap-6 lg:p-6">
    <h1 class="font-semibold text-3xl">
      {{ $t("pages.dashboard.inventory_summary") }}
    </h1>

    <div
      class="*:data-[slot=card]:from-accent/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:shadow-xs"
    >
      <Card class="@container/card">
        <CardHeader class="relative flex flex-col gap-2">
          <CardDescription>{{
            $t("pages.dashboard.total_categories")
          }}</CardDescription>
          <CardTitle
            class="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl"
          >
            <span v-if="supabaseLoaded">{{
              dashboardData.categoriesCount
            }}</span>
            <div
              v-else
              class="bg-primary/25 animate-pulse h-8 w-32 rounded-md"
            ></div>
          </CardTitle>
          <CardAction
            v-if="dashboardData.categoriesAdded !== 0 && supabaseLoaded"
            class="absolute right-4"
          >
            <Badge variant="outline">
              <IconArrowUp v-if="dashboardData.categoriesAdded > 0" />
              <IconArrowDown v-if="dashboardData.categoriesAdded < 0" />
              {{ shortenNumber(dashboardData.categoriesAdded) }}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter class="flex-col items-start gap-1.5 text-sm">
          <div class="line-clamp-1 flex gap-2 font-medium">
            <span v-if="supabaseLoaded">
              {{
                dashboardData.categoriesAdded > 0
                  ? $t("pages.dashboard.new_categories")
                  : $t("pages.dashboard.no_categories")
              }}</span
            >
            <div
              v-else
              class="bg-primary/25 animate-pulse h-5 mt-1 w-40 rounded-md"
            ></div>
          </div>
          <div class="text-muted-foreground">
            {{ $t("pages.dashboard.data_from_30d") }}
          </div>
        </CardFooter>
      </Card>
      <Card class="@container/card">
        <CardHeader class="relative flex flex-col gap-2">
          <CardDescription>{{
            $t("pages.dashboard.total_items")
          }}</CardDescription>
          <CardTitle
            class="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl"
          >
            <span v-if="supabaseLoaded">{{ dashboardData.itemsCount }}</span>
            <div
              v-else
              class="bg-primary/25 animate-pulse h-8 w-32 rounded-md"
            ></div>
          </CardTitle>
          <CardAction
            v-if="dashboardData.itemsAdded !== 0 && supabaseLoaded"
            class="absolute right-4"
          >
            <Badge variant="outline">
              <IconArrowUp v-if="dashboardData.itemsAdded > 0" />
              <IconArrowDown v-if="dashboardData.itemsAdded < 0" />
              {{ shortenNumber(dashboardData.itemsAdded) }}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter class="flex-col items-start gap-1.5 text-sm">
          <div class="line-clamp-1 flex gap-2 font-medium">
            <span v-if="supabaseLoaded">
              {{
                dashboardData.itemsAdded > 0
                  ? $t("pages.dashboard.new_items")
                  : $t("pages.dashboard.no_new_items")
              }}</span
            >
            <div
              v-else
              class="bg-primary/25 animate-pulse h-5 mt-1 w-40 rounded-md"
            ></div>
          </div>
          <div class="text-muted-foreground">
            {{ $t("pages.dashboard.data_from_30d") }}
          </div>
        </CardFooter>
      </Card>
      <Card class="@container/card">
        <CardHeader class="relative flex flex-col gap-2">
          <CardDescription>{{
            $t("pages.dashboard.items_deployed")
          }}</CardDescription>
          <CardTitle
            class="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl"
          >
            <span v-if="supabaseLoaded">{{
              dashboardData.deployedItemsCount
            }}</span>
            <div
              v-else
              class="bg-primary/25 animate-pulse h-8 w-32 rounded-md"
            ></div>
          </CardTitle>
          <CardAction
            v-if="dashboardData.deployedItemsAdded > 0 && supabaseLoaded"
            class="absolute right-4"
          >
            <Badge variant="outline">
              <IconArrowUp />
              {{ shortenNumber(dashboardData.deployedItemsAdded) }}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter class="flex-col items-start gap-1.5 text-sm">
          <div class="line-clamp-1 flex gap-2 font-medium">
            <span v-if="supabaseLoaded">
              {{
                dashboardData.deployedItemsCount > 0
                  ? $t("pages.dashboard.new_deployments")
                  : $t("pages.dashboard.no_new_deployments")
              }}</span
            >
            <div
              v-else
              class="bg-primary/25 animate-pulse h-5 mt-1 w-40 rounded-md"
            ></div>
          </div>
          <div class="text-muted-foreground">
            {{ $t("pages.dashboard.data_compared_yesterday") }}
          </div>
        </CardFooter>
      </Card>
      <Card class="@container/card">
        <CardHeader class="relative flex flex-col gap-2">
          <CardDescription>{{
            $t("pages.dashboard.total_value")
          }}</CardDescription>
          <CardTitle
            class="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl line-clamp-1"
          >
            <span v-if="supabaseLoaded"
              >{{ $t("language.units.currency") }}
              {{
                dashboardData.totalValue.toLocaleString($t("language.locale"))
              }}</span
            >
            <div
              v-else
              class="bg-primary/25 animate-pulse h-8 w-40 rounded-md"
            ></div>
          </CardTitle>
          <CardAction
            v-if="dashboardData.totalValueAdded > 0 && supabaseLoaded"
            class="absolute right-4"
          >
            <Badge variant="outline">
              <IconArrowUp />
              {{ shortenNumber(dashboardData.totalValueAdded) }}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter class="flex-col items-start gap-1.5 text-sm">
          <div class="line-clamp-1 flex gap-2 font-medium">
            <span v-if="supabaseLoaded">{{
              dashboardData.totalValueAdded > 0
                ? $t("pages.dashboard.new_value_increase")
                : $t("pages.dashboard.no_value_increase")
            }}</span>
            <div
              v-else
              class="bg-primary/25 animate-pulse h-5 mt-1 w-40 rounded-md"
            ></div>
          </div>
          <div class="text-muted-foreground">
            {{ $t("pages.dashboard.data_from_30d") }}
          </div>
        </CardFooter>
      </Card>
    </div>
  </section>
  <section
    class="flex flex-col gap-4 p-4 lg:gap-6 lg:p-6"
    v-if="supabaseLoaded"
  >
    <h1 class="font-semibold text-3xl">
      {{ $t("pages.dashboard.deployed_items") }}
    </h1>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card
        v-for="item in deployedItems"
        :key="item.id"
        @click="$router.push(`/items/${item.id}`)"
        class="@container/card hover:bg-secondary transition-colors duration-200 cursor-pointer"
      >
        <CardHeader>
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
        </CardHeader>
        <CardContent class="sm:block hidden">
          <img
            :src="item.image_url"
            :alt="$t('pages.dashboard.item_image_alt')"
            class="rounded-lg"
          />
        </CardContent>
        <CardFooter>
          <CardDescription>{{
            $t("pages.dashboard.deployed_on", {
              date: new Date(item.deployed).toLocaleDateString(
                $t("language.locale"),
                {
                  year: "numeric",
                  month: "numeric",
                  day: "numeric",
                },
              ),
            })
          }}</CardDescription>
        </CardFooter>
      </Card>
    </div>
  </section>
</template>
