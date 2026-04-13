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

const supabaseLoaded = ref(false);
const errorUpdating = ref("");

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

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (!categoriesData.error) {
    categoriesCount.value = categoriesData.data.length;

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

    supabaseLoaded.value = true;
  } else {
    console.error("Error fetching items:", itemsData.error);
    errorUpdating.value = itemsData.error.message;
  }
});
</script>

<template>
  <SiteHeader :title="$t('dashboard.title')" />
  <div
    class="flex flex-row justify-between gap-2 text-center text-destructive bg-destructive/10 rounded-md p-4 m-4 mb-0 md:m-6 md:mb-0 border border-destructive"
    v-if="errorUpdating !== ''"
  >
    <span class="my-auto">{{ errorUpdating }}</span>
    <Button variant="ghost" size="icon-sm" @click="errorUpdating = ''">
      <IconX />
    </Button>
  </div>
  <section class="flex flex-col gap-4 p-4 lg:gap-6 lg:p-6">
    <h1 class="font-semibold text-3xl">
      {{ $t("dashboard.inventory_summary") }}
    </h1>

    <div
      class="*:data-[slot=card]:from-accent/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:shadow-xs"
    >
      <Card class="@container/card">
        <CardHeader class="relative flex flex-col gap-2">
          <CardDescription>{{
            $t("dashboard.total_categories")
          }}</CardDescription>
          <CardTitle
            class="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl"
          >
            <span v-if="supabaseLoaded">{{ categoriesCount }}</span>
            <div
              v-else
              class="bg-primary/25 animate-pulse h-8 w-32 rounded-md"
            ></div>
          </CardTitle>
          <CardAction
            v-if="categoriesAdded !== 0 && supabaseLoaded"
            class="absolute right-4"
          >
            <Badge variant="outline">
              <IconArrowUp v-if="categoriesAdded > 0" />
              <IconArrowDown v-if="categoriesAdded < 0" />
              {{ categoriesAdded }}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter class="flex-col items-start gap-1.5 text-sm">
          <div class="line-clamp-1 flex gap-2 font-medium">
            <span v-if="supabaseLoaded">
              {{
                categoriesAdded > 0
                  ? $t("dashboard.new_categories")
                  : $t("dashboard.no_categories")
              }}</span
            >
            <div
              v-else
              class="bg-primary/25 animate-pulse h-5 mt-1 w-40 rounded-md"
            ></div>
          </div>
          <div class="text-muted-foreground">
            {{ $t("dashboard.data_from_30d") }}
          </div>
        </CardFooter>
      </Card>
      <Card class="@container/card">
        <CardHeader class="relative flex flex-col gap-2">
          <CardDescription>{{ $t("dashboard.total_items") }}</CardDescription>
          <CardTitle
            class="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl"
          >
            <span v-if="supabaseLoaded">{{ itemsCount }}</span>
            <div
              v-else
              class="bg-primary/25 animate-pulse h-8 w-32 rounded-md"
            ></div>
          </CardTitle>
          <CardAction
            v-if="itemsAdded !== 0 && supabaseLoaded"
            class="absolute right-4"
          >
            <Badge variant="outline">
              <IconArrowUp v-if="itemsAdded > 0" />
              <IconArrowDown v-if="itemsAdded < 0" />
              {{ itemsAdded }}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter class="flex-col items-start gap-1.5 text-sm">
          <div class="line-clamp-1 flex gap-2 font-medium">
            <span v-if="supabaseLoaded">
              {{
                itemsAdded > 0
                  ? $t("dashboard.new_items")
                  : $t("dashboard.no_new_items")
              }}</span
            >
            <div
              v-else
              class="bg-primary/25 animate-pulse h-5 mt-1 w-40 rounded-md"
            ></div>
          </div>
          <div class="text-muted-foreground">
            {{ $t("dashboard.data_from_30d") }}
          </div>
        </CardFooter>
      </Card>
      <Card class="@container/card">
        <CardHeader class="relative flex flex-col gap-2">
          <CardDescription>{{
            $t("dashboard.items_deployed")
          }}</CardDescription>
          <CardTitle
            class="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl"
          >
            <span v-if="supabaseLoaded">{{ deployedItemsCount }}</span>
            <div
              v-else
              class="bg-primary/25 animate-pulse h-8 w-32 rounded-md"
            ></div>
          </CardTitle>
          <CardAction
            v-if="deployedItemsAdded > 0 && supabaseLoaded"
            class="absolute right-4"
          >
            <Badge variant="outline">
              <IconArrowUp />
              {{ deployedItemsAdded }}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter class="flex-col items-start gap-1.5 text-sm">
          <div class="line-clamp-1 flex gap-2 font-medium">
            <span v-if="supabaseLoaded">
              {{
                deployedItemsCount > 0
                  ? $t("dashboard.new_deployments")
                  : $t("dashboard.no_new_deployments")
              }}</span
            >
            <div
              v-else
              class="bg-primary/25 animate-pulse h-5 mt-1 w-40 rounded-md"
            ></div>
          </div>
          <div class="text-muted-foreground">
            {{ $t("dashboard.data_compared_yesterday") }}
          </div>
        </CardFooter>
      </Card>
      <Card class="@container/card">
        <CardHeader class="relative flex flex-col gap-2">
          <CardDescription>{{ $t("dashboard.total_value") }}</CardDescription>
          <CardTitle
            class="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl line-clamp-1"
          >
            <span v-if="supabaseLoaded"
              >{{ $t("global.currency") }}
              {{ totalValue.toLocaleString($t("global.locale")) }}</span
            >
            <div
              v-else
              class="bg-primary/25 animate-pulse h-8 w-40 rounded-md"
            ></div>
          </CardTitle>
          <CardAction
            v-if="totalValueAdded > 0 && supabaseLoaded"
            class="absolute right-4"
          >
            <Badge variant="outline">
              <IconArrowUp />
              {{
                totalValueAdded.toLocaleString($t("global.locale")).length > 8
                  ? totalValueAdded
                      .toLocaleString($t("global.locale"))
                      .slice(0, -8) + $t("global.millionAbbreviation")
                  : totalValueAdded
                      .toLocaleString($t("global.locale"))
                      .slice(0, -4) + $t("global.thousandAbbreviation")
              }}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter class="flex-col items-start gap-1.5 text-sm">
          <div class="line-clamp-1 flex gap-2 font-medium">
            <span v-if="supabaseLoaded">{{
              totalValueAdded > 0
                ? $t("dashboard.new_value_increase")
                : $t("dashboard.no_value_increase")
            }}</span>
            <div
              v-else
              class="bg-primary/25 animate-pulse h-5 mt-1 w-40 rounded-md"
            ></div>
          </div>
          <div class="text-muted-foreground">
            {{ $t("dashboard.data_from_30d") }}
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
      {{ $t("dashboard.deployed_items") }}
    </h1>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card
        v-for="item in deployedItems"
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
            >{{
              item.weight.toLocaleString($t("global.locale"), {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
              })
            }}
            {{ $t("global.weight") }} &bull; {{ $t("global.currency") }}
            {{
              item.price.toLocaleString($t("global.locale"))
            }}</CardDescription
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
              date: new Date(item.deployed).toLocaleDateString(
                $t("global.locale"),
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
