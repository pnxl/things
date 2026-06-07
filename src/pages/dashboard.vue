<script setup lang="ts">
import {
  IconArrowDown,
  IconArrowUp,
  IconBlocks,
  IconForklift,
  IconPencil,
  IconTrashX,
} from "@tabler/icons-vue";
import { useCookies } from "@vueuse/integrations/useCookies";
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";

import { supabase } from "@/lib/supabase";

import ErrorBanner from "@/components/ErrorBanner.vue";
import SiteHeader from "@/components/SiteHeader.vue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const { t } = useI18n();

if (!useCookies(["sb-access-token"]).get("sb-access-token")) {
  useRouter().replace({ path: "/login" });
}

const errorMessages = ref<string[]>([]);
const supabaseLoaded = ref(false);

const currentItemId = ref<string | null>(null);
const currentDialogEntry = ref<string | number | undefined>("");
const renameModalIsOpen = ref(false);
const moveToLocationModalIsOpen = ref(false);
const deleteConfirmationModalIsOpen = ref(false);

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

function undeployItem(itemId: string) {
  supabase
    .from("items")
    .update({ deployed: null, deployed_at: null, person_responsible: null })
    .eq("id", itemId)
    .then(({ error }) => {
      if (error) {
        errorMessages.value.push(error.message);
      } else {
        // update the dashboard data and remove the item from deployedItems
        const itemIndex = deployedItems.value.findIndex(
          (item) => item.id === itemId
        );
        if (itemIndex !== -1) {
          const item = deployedItems.value[itemIndex];
          dashboardData.value.deployedItemsCount--;
          if (new Date(item.deployed) >= yesterday) {
            dashboardData.value.deployedItemsAdded--;
          }
          deployedItems.value.splice(itemIndex, 1);
        }

        errorMessages.value = [];
      }
    });
}

function deleteItem(itemId: string) {
  supabase
    .from("items")
    .delete()
    .eq("id", itemId)
    .then(({ error }) => {
      if (error) {
        errorMessages.value.push(error.message);
      } else {
        // update the dashboard data and remove the item from deployedItems
        const itemIndex = deployedItems.value.findIndex(
          (item) => item.id === itemId
        );
        if (itemIndex !== -1) {
          const item = deployedItems.value[itemIndex];
          dashboardData.value.deployedItemsCount--;
          if (new Date(item.deployed) >= yesterday) {
            dashboardData.value.deployedItemsAdded--;
          }
          deployedItems.value.splice(itemIndex, 1);
        }

        errorMessages.value = [];
      }
    });

  deleteConfirmationModalIsOpen.value = false;
  currentItemId.value = null;
}

function editItemName(itemId: string, newName: string) {
  supabase
    .from("items")
    .update({ name: newName })
    .eq("id", itemId)
    .then(({ error }) => {
      if (error) {
        errorMessages.value.push(error.message);
      } else {
        // update the dashboard data and remove the item from deployedItems
        const itemIndex = deployedItems.value.findIndex(
          (item) => item.id === itemId
        );
        if (itemIndex !== -1) {
          const item = deployedItems.value[itemIndex];
          item.name = newName;
        }

        errorMessages.value = [];
      }
    });

  renameModalIsOpen.value = false;
  currentItemId.value = null;
  currentDialogEntry.value = "";
}

function editItemLocation(itemId: string, newLocation: string) {
  supabase
    .from("items")
    .update({ deployed_at: newLocation })
    .eq("id", itemId)
    .then(({ error }) => {
      if (error) {
        errorMessages.value.push(error.message);
      } else {
        // update the dashboard data and remove the item from deployedItems
        const itemIndex = deployedItems.value.findIndex(
          (item) => item.id === itemId
        );
        if (itemIndex !== -1) {
          const item = deployedItems.value[itemIndex];
          item.deployed_at = newLocation;
        }

        errorMessages.value = [];
      }
    });

  moveToLocationModalIsOpen.value = false;
  currentItemId.value = null;
  currentDialogEntry.value = "";
}

onMounted(async () => {
  const categoriesData = await supabase.from("categories").select();
  const itemsData = await supabase.from("items").select();

  if (!categoriesData.error) {
    dashboardData.value.categoriesCount = categoriesData.data.length;
    dashboardData.value.categoriesAdded = categoriesData.data.filter(
      (category) => new Date(category.created_at) >= thirtyDaysAgo
    ).length;

    errorMessages.value = [];
  } else {
    console.error("Error fetching categories:", categoriesData.error);
    errorMessages.value.push(categoriesData.error.message);
  }

  if (!itemsData.error) {
    dashboardData.value.itemsCount = itemsData.data.length;
    dashboardData.value.itemsAdded = itemsData.data.filter(
      (item) => new Date(item.created_at) >= thirtyDaysAgo
    ).length;

    dashboardData.value.deployedItemsCount = itemsData.data.filter(
      (item) => item.deployed !== null
    ).length;
    dashboardData.value.deployedItemsAdded = itemsData.data.filter(
      (item) => item.deployed !== null && new Date(item.deployed) >= yesterday
    ).length;

    dashboardData.value.totalValue = itemsData.data.reduce(
      (sum, item) => sum + item.price,
      0
    );
    dashboardData.value.totalValueAdded = itemsData.data
      .filter((item) => new Date(item.created_at) >= thirtyDaysAgo)
      .reduce((sum, item) => sum + item.price, 0);

    deployedItems.value = itemsData.data
      .filter((item) => item.deployed !== null)
      .sort(
        (a, b) =>
          new Date(b.deployed).getTime() - new Date(a.deployed).getTime()
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

  <Dialog v-model:open="renameModalIsOpen">
    <form>
      <DialogContent class="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{{ $t("components.dialog.rename") }}</DialogTitle>
          <DialogDescription>
            {{ $t("components.dialog.rename_description") }}
          </DialogDescription>
        </DialogHeader>
        <Input
          id="name-1"
          name="name"
          v-model="currentDialogEntry"
        />
        <DialogFooter>
          <DialogClose as-child>
            <Button variant="outline">
              {{ $t("components.dialog.generic_cancel") }}
            </Button>
          </DialogClose>
          <Button
            type="submit"
            @click="
              editItemName(String(currentItemId), String(currentDialogEntry))
            "
          >
            {{ $t("components.dialog.generic_confirm") }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </form>
  </Dialog>

  <Dialog v-model:open="moveToLocationModalIsOpen">
    <form>
      <DialogContent class="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{{
            $t("components.dialog.move_to_location")
          }}</DialogTitle>
          <DialogDescription>
            {{ $t("components.dialog.move_to_location_description") }}
          </DialogDescription>
        </DialogHeader>
        <Input
          id="name-1"
          name="name"
          v-model="currentDialogEntry"
        />
        <DialogFooter>
          <DialogClose as-child>
            <Button variant="outline">
              {{ $t("components.dialog.generic_cancel") }}
            </Button>
          </DialogClose>
          <Button
            type="submit"
            @click="
              editItemLocation(
                String(currentItemId),
                String(currentDialogEntry)
              )
            "
          >
            {{ $t("components.dialog.generic_confirm") }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </form>
  </Dialog>

  <Dialog v-model:open="deleteConfirmationModalIsOpen">
    <form>
      <DialogContent class="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{{ $t("components.dialog.delete") }}</DialogTitle>
          <DialogDescription>
            {{ $t("components.dialog.delete_description") }}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose as-child>
            <Button variant="outline">
              {{ $t("components.dialog.delete_cancel") }}
            </Button>
          </DialogClose>
          <Button
            type="submit"
            @click="deleteItem(String(currentItemId))"
            variant="destructive"
          >
            {{ $t("components.dialog.delete_confirm") }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </form>
  </Dialog>

  <div
    class="m-4 mr-2 pr-2 mb-0! pb-4 lg:pb-6 lg:m-6 lg:mr-3 lg:pr-3 flex flex-col gap-4 lg:gap-6 overflow-x-clip overflow-y-scroll scrollbar-thin scrollbar-bg-transparent scrollbar-thumb-secondary/50 scrollbar-thumb-rounded-full hover:scrollbar-thumb-secondary/80 transition-colors duration-200"
  >
    <section class="flex flex-col gap-4 lg:gap-6">
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
                    : $t("pages.dashboard.no_deployments")
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
      class="flex flex-col gap-4 lg:gap-6"
      v-if="supabaseLoaded && deployedItems.length > 0"
    >
      <h1 class="font-semibold text-3xl">
        {{ $t("pages.dashboard.deployed_items") }}
      </h1>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ContextMenu
          v-for="item in deployedItems"
          :key="item.id"
        >
          <ContextMenuTrigger>
            <Card
              @click="$router.push(`/items/${item.id}`)"
              class="@container/card hover:bg-secondary transition-colors duration-200 *:cursor-pointer! cursor-pointer!"
            >
              <CardHeader class="*:cursor-pointer! cursor-pointer!">
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
                  {{ $t("language.units.mass")
                  }}{{
                    item.price !== 0
                      ? ` &bull; ${$t("language.units.currency")} ${item.price.toLocaleString($t("language.locale"))}`
                      : ""
                  }}</CardDescription
                >
              </CardHeader>
              <CardContent
                class="*:cursor-pointer! cursor-pointer!"
                v-if="item.image_url"
              >
                <img
                  :src="item.image_url"
                  :alt="$t('pages.dashboard.item_image_alt')"
                  class="aspect-3/2 rounded-lg border shadow-sm object-cover object-center"
                />
              </CardContent>
              <CardFooter class="*:cursor-pointer! cursor-pointer!">
                <CardDescription>{{
                  item.deployed_at
                    ? $t("pages.dashboard.deployed_on_with_at", {
                        date: new Date(item.deployed).toLocaleDateString(
                          $t("language.locale"),
                          {
                            year: "numeric",
                            month: "numeric",
                            day: "numeric",
                          }
                        ),
                        location: item.deployed_at,
                      })
                    : $t("pages.dashboard.deployed_on", {
                        date: new Date(item.deployed).toLocaleDateString(
                          $t("language.locale"),
                          {
                            year: "numeric",
                            month: "numeric",
                            day: "numeric",
                          }
                        ),
                      })
                }}</CardDescription>
              </CardFooter>
            </Card>
          </ContextMenuTrigger>
          <ContextMenuContent class="md:w-56 w-48">
            <ContextMenuItem @click="$router.push(`/items/${item.id}`)"
              ><IconBlocks /> {{ $t("components.context_menu.item.view_item") }}
            </ContextMenuItem>
            <ContextMenuItem @click="undeployItem(item.id)"
              ><IconForklift />
              {{ $t("components.context_menu.item.undeploy_item") }}
            </ContextMenuItem>
            <ContextMenuItem @click="$router.push(`/items/${item.id}/edit`)"
              ><IconPencil />
              {{ $t("components.context_menu.item.open_in_editor") }}
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem
              @click="
                renameModalIsOpen = true;
                currentItemId = item.id;
                currentDialogEntry = item.name;
              "
              inset
            >
              {{ $t("components.context_menu.item.rename") }}
            </ContextMenuItem>
            <ContextMenuItem
              @click="
                moveToLocationModalIsOpen = true;
                currentItemId = item.id;
                currentDialogEntry = item.deployed_at || '';
              "
              inset
            >
              {{ $t("components.context_menu.item.move_to_location") }}
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem
              @click="
                deleteConfirmationModalIsOpen = true;
                currentItemId = item.id;
              "
              variant="destructive"
              class="text-destructive"
            >
              <IconTrashX /> {{ $t("components.context_menu.item.delete") }}
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </div>
    </section>
  </div>
</template>
