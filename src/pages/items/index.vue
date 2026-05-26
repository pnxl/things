<script setup lang="ts">
import {
  IconBlocks,
  IconFolder,
  IconFolderOpen,
  IconFolderPlus,
  IconForklift,
  IconLayoutGrid,
  IconLayoutList,
  IconPackages,
  IconPencil,
  IconTrashX,
} from "@tabler/icons-vue";
import { useCookies } from "@vueuse/integrations/useCookies";
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";

import { supabase } from "@/lib/supabase";

import ErrorBanner from "@/components/ErrorBanner.vue";
import SiteHeader from "@/components/SiteHeader.vue";
import Button from "@/components/ui/button/Button.vue";
import {
  Card,
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
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import Separator from "@/components/ui/separator/Separator.vue";

const router = useRouter();
const route = useRoute();
const { t } = useI18n();

if (!useCookies(["sb-access-token"]).get("sb-access-token")) {
  router.replace({ path: "/login" });
}

const errorMessages = ref<string[]>([]);
const supabaseLoaded = ref(false);

const userdata = JSON.parse(localStorage.getItem("sb-user-data") || "{}");
const viewMode = ref(
  String(userdata.user_metadata.settings?.viewmode) || "grid"
);

const items = ref<any[]>([]);
const categories = ref<any[]>([]);
const tags = ref<any[]>([]);

const newCategoryPopupOpen = ref(false);
const newCategoryName = ref("");

const currentItemId = ref<string | null>(null);
const currentDialogEntry = ref<string | number | undefined>("");
const renameModalIsOpen = ref(false);
const moveToLocationModalIsOpen = ref(false);
const deleteConfirmationModalIsOpen = ref(false);

const currentCategoryId = ref<string | null>(null);
const currentCategoryDialogEntry = ref<string>("");
const categoryRenameModalIsOpen = ref(false);
const categoryDeleteConfirmationModalIsOpen = ref(false);

async function createCategory() {
  if (newCategoryName.value.trim() === "") {
    return;
  }

  const { data, error } = await supabase
    .from("categories")
    .insert({ name: newCategoryName.value })
    .select()
    .single();

  if (error) {
    console.error("Error creating category:", error);
    errorMessages.value.push(error.message);
  } else {
    categories.value.push(data);
    newCategoryName.value = "";
    errorMessages.value = [];
    newCategoryPopupOpen.value = false;
  }
}

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
    })
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

function deployItem(itemId: string) {
  supabase
    .from("items")
    .update({ deployed: new Date().toISOString() })
    .eq("id", itemId)
    .then(({ error }) => {
      if (error) {
        errorMessages.value.push(error.message);
      } else {
        // update the items array and set the deployed property of the item to the current date
        const itemIndex = items.value.findIndex((item) => item.id === itemId);
        if (itemIndex !== -1) {
          const item = items.value[itemIndex];
          item.deployed = new Date().toISOString();
        }

        errorMessages.value = [];
      }
    });
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
        // update the items array and set the deployed property of the item to null
        const itemIndex = items.value.findIndex((item) => item.id === itemId);
        if (itemIndex !== -1) {
          const item = items.value[itemIndex];
          item.deployed = null;
          item.deployed_at = null;
          item.person_responsible = null;
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
        // update the dashboard data and remove the item from items
        const itemIndex = items.value.findIndex((item) => item.id === itemId);
        if (itemIndex !== -1) {
          items.value.splice(itemIndex, 1);
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
        // update the dashboard data and remove the item from items
        const itemIndex = items.value.findIndex((item) => item.id === itemId);
        if (itemIndex !== -1) {
          const item = items.value[itemIndex];
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
        // update the dashboard data and remove the item from items
        const itemIndex = items.value.findIndex((item) => item.id === itemId);
        if (itemIndex !== -1) {
          const item = items.value[itemIndex];
          item.deployed_at = newLocation;
        }

        errorMessages.value = [];
      }
    });

  moveToLocationModalIsOpen.value = false;
  currentItemId.value = null;
  currentDialogEntry.value = "";
}

function deleteCategory(categoryId: string) {
  supabase
    .from("categories")
    .delete()
    .eq("id", categoryId)
    .then(({ error }) => {
      if (error) {
        errorMessages.value.push(error.message);
      } else {
        // update the dashboard data and remove the category from categories
        const categoryIndex = categories.value.findIndex(
          (category) => category.id === categoryId
        );
        if (categoryIndex !== -1) {
          categories.value.splice(categoryIndex, 1);
        }

        router.push("/items");

        errorMessages.value = [];
      }
    });

  categoryDeleteConfirmationModalIsOpen.value = false;
  currentCategoryId.value = null;
}

function editCategoryName(categoryId: string, newName: string) {
  supabase
    .from("categories")
    .update({ name: newName })
    .eq("id", categoryId)
    .then(({ error }) => {
      if (error) {
        errorMessages.value.push(error.message);
      } else {
        // update the dashboard data and remove the category from categories
        const categoryIndex = categories.value.findIndex(
          (category) => category.id === categoryId
        );
        if (categoryIndex !== -1) {
          const category = categories.value[categoryIndex];
          category.name = newName;
        }

        errorMessages.value = [];
      }
    });

  categoryRenameModalIsOpen.value = false;
  currentCategoryId.value = null;
  currentDialogEntry.value = "";
}

onMounted(async () => {
  const itemsData = await supabase.from("items").select();
  const categoriesData = await supabase
    .from("categories")
    .select()
    .order("name", { ascending: true });
  const tagsData = await supabase.from("tags").select();

  if (!itemsData.error) {
    items.value = itemsData.data;

    // fetch image URLs from supabase buckets and add them to each item in items
    for (const item of items.value) {
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
  <SiteHeader
    :title="
      route.query.f
        ? t('pages.items.items_in_category', {
            category: categories.find((c) => c.id === $route.query.f)?.name,
          })
        : t('pages.items.all_items')
    "
  >
    <div class="flex flex-row gap-0">
      <Button
        variant="outline"
        size="sm"
        :class="
          (viewMode === 'grid' ? 'bg-input!' : 'border-r-0') + ' rounded-r-none'
        "
        @click.prevent="setViewMode('grid')"
      >
        <IconLayoutGrid />
      </Button>
      <Button
        variant="outline"
        size="sm"
        :class="
          (viewMode === 'list' ? 'bg-input!' : 'border-l-0') + ' rounded-l-none'
        "
        @click.prevent="setViewMode('list')"
      >
        <IconLayoutList />
      </Button></div
  ></SiteHeader>
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

  <Dialog v-model:open="categoryRenameModalIsOpen">
    <form>
      <DialogContent class="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{{ $t("components.dialog.rename") }}</DialogTitle>
          <DialogDescription>
            {{ $t("components.dialog.category_rename_description") }}
          </DialogDescription>
        </DialogHeader>
        <Input
          id="name-1"
          name="name"
          v-model="currentCategoryDialogEntry"
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
              editCategoryName(
                String(currentCategoryId),
                String(currentCategoryDialogEntry)
              )
            "
          >
            {{ $t("components.dialog.generic_confirm") }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </form>
  </Dialog>

  <Dialog v-model:open="categoryDeleteConfirmationModalIsOpen">
    <form>
      <DialogContent class="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{{ $t("components.dialog.delete") }}</DialogTitle>
          <DialogDescription>
            {{ $t("components.dialog.category_delete_description") }}
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
            @click="deleteCategory(String(currentCategoryId))"
            variant="destructive"
          >
            {{ $t("components.dialog.delete_confirm") }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </form>
  </Dialog>

  <div class="flex flex-col md:flex-row h-full">
    <section
      class="w-full md:w-1/3 2xl:w-1/4 md:h-full p-4 gap-4 md:gap-6 lg:p-6 md:flex flex-col"
    >
      <h1 class="text-lg font-medium pb-2 md:hidden">
        {{ $t("pages.items.categories") }}
      </h1>
      <div class="flex flex-col justify-between md:h-full gap-4 md:gap-6">
        <div
          class="flex flex-col gap-1 md:overflow-y-scroll overflow-x-clip md:-mr-3.5 md:pr-0.5 lg:-mr-4.5 lg:pr-1.5 md:h-[76.2vh] lg:h-[73.8vh] scrollbar-thin scrollbar-bg-transparent scrollbar-thumb-secondary/50 scrollbar-thumb-rounded-full hover:scrollbar-thumb-secondary/80"
        >
          <router-link
            to="/items"
            :class="
              (!$route.query.f
                ? 'bg-secondary/70 cursor-default'
                : ' hover:bg-secondary/70') +
              ' flex flex-row gap-2 duration-200 transition-colors px-3 p-1.5 rounded-md *:cursor-pointer cursor-pointer'
            "
          >
            <IconPackages class="size-4 my-auto" />
            <span class="text-sm">{{ $t("pages.items.all_items") }}</span>
          </router-link>

          <ContextMenu
            v-for="category in categories"
            :key="category.id"
          >
            <ContextMenuTrigger>
              <router-link
                :to="`/items?f=${category.id}`"
                :class="
                  ($route.query.f === category.id
                    ? 'bg-secondary/70 cursor-default'
                    : ' hover:bg-secondary/70') +
                  ' flex flex-row gap-2 duration-200 transition-colors px-3 p-1.5 rounded-md *:cursor-pointer cursor-pointer'
                "
              >
                <IconFolder class="size-4 my-auto" />
                <span class="text-sm">{{ category.name }}</span>
              </router-link>
            </ContextMenuTrigger>
            <ContextMenuContent class="md:w-56 w-48">
              <ContextMenuItem @click="$router.push(`/items?f=${category.id}`)"
                ><IconFolderOpen />
                {{
                  $t("components.context_menu.category.view_items_in_category")
                }}
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem
                inset
                @click="
                  categoryRenameModalIsOpen = true;
                  currentCategoryId = category.id;
                  currentCategoryDialogEntry = category.name;
                "
              >
                {{ $t("components.context_menu.category.rename") }}
              </ContextMenuItem>
              <ContextMenuItem
                @click="
                  categoryDeleteConfirmationModalIsOpen = true;
                  currentCategoryId = category.id;
                "
                variant="destructive"
                class="text-destructive"
              >
                <IconTrashX />
                {{ $t("components.context_menu.category.delete") }}
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        </div>
        <Popover v-model:open="newCategoryPopupOpen">
          <PopoverTrigger>
            <Button
              class="w-full *:cursor-pointer cursor-pointer"
              variant="secondary"
            >
              <IconFolderPlus class="size-4 my-auto" />
              <span class="text-sm">{{ $t("pages.items.new_category") }}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent class="w-80 my-2">
            <div class="grid gap-4">
              <div class="space-y-2">
                <h4 class="font-medium leading-none">
                  {{ $t("pages.items.new_category") }}
                </h4>
                <p class="text-sm text-muted-foreground">
                  {{ $t("pages.items.new_category_description") }}
                </p>
              </div>

              <Field>
                <Input
                  id="new-category"
                  type="text"
                  required
                  v-model="newCategoryName"
                />
                <Button
                  variant="outline"
                  class="w-full"
                  @click="createCategory()"
                >
                  {{ $t("pages.items.create_category") }}
                </Button>
              </Field>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </section>
    <Separator
      orientation="vertical"
      class="data-[orientation=vertical]:h-full md:block hidden"
    />
    <section class="flex flex-col gap-4 lg:gap-6 w-full">
      <div
        v-if="!supabaseLoaded"
        :class="
          (viewMode === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 2xl:grid-cols-4 gap-4'
            : 'flex flex-col gap-4') +
          ' opacity-50 animate-pulse overflow-y-clip md:h-[75svh] h-[50svh] relative'
        "
        class="md:overflow-y-scroll overflow-x-clip md:h-[87.8vh] lg:h-[86.6vh] p-4 md:m-2 md:p-2 pt-0! md:mt-4 lg:m-3 lg:p-3 lg:mt-6 mb-0! scrollbar-thin scrollbar-bg-transparent scrollbar-thumb-secondary/50 scrollbar-thumb-rounded-full hover:scrollbar-thumb-secondary/80 transition-colors duration-200"
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
        class="md:overflow-y-scroll overflow-x-clip md:h-[87.8vh] lg:h-[86.6vh] p-4 md:m-2 md:p-2 pt-0! md:mt-4 lg:m-3 lg:p-3 lg:mt-6 mb-0! scrollbar-thin scrollbar-bg-transparent scrollbar-thumb-secondary/50 scrollbar-thumb-rounded-full hover:scrollbar-thumb-secondary/80 transition-colors duration-200"
        :class="
          viewMode === 'grid'
            ? 'grid grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4'
            : 'flex flex-col gap-4'
        "
      >
        <ContextMenu
          v-for="item in items.filter(
            (item) => !$route.query.f || item.category === $route.query.f,
          )"
          :key="item.id"
        >
          <ContextMenuTrigger>
            <Card
              @click="$router.push(`/items/${item.id}`)"
              :class="
                (viewMode === 'grid' ? '' : 'flex flex-row') +
                ' @container/card hover:bg-secondary transition-colors duration-200  *:cursor-pointer cursor-pointer justify-between'
              "
            >
              <CardHeader
                :class="
                  (viewMode === 'grid' ? 'gap-1' : 'gap-1 justify-start') +
                  ' w-full flex flex-col cursor-pointer!'
                "
              >
                <CardTitle
                  class="text-xl font-medium tabular-nums @[250px]/card:text-xl line-clamp-1 cursor-pointer!"
                >
                  {{ item.name }}
                </CardTitle>
                <CardDescription class="cursor-pointer!"
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

                <CardDescription
                  v-if="item.deployed !== null"
                  :class="viewMode === 'grid' ? 'hidden' : 'mt-auto'"
                  >{{
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
                  }}</CardDescription
                >
              </CardHeader>
              <CardContent
                v-if="item.image_url"
                :class="viewMode === 'grid' ? '' : 'w-fit'"
                class="cursor-pointer!"
              >
                <img
                  :src="item.image_url"
                  :alt="$t('pages.dashboard.item_image_alt')"
                  :class="
                    (viewMode === 'grid'
                      ? 'aspect-3/2'
                      : 'size-24! aspect-square!') +
                    ' rounded-lg border shadow-sm object-cover object-center'
                  "
                  class="cursor-pointer!"
                />
              </CardContent>
              <CardFooter
                v-if="item.deployed !== null"
                :class="viewMode === 'grid' ? '' : 'hidden'"
                class="cursor-pointer!"
              >
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
            <ContextMenuItem
              @click="undeployItem(item.id)"
              v-if="item.deployed !== null"
              ><IconForklift />
              {{ $t("components.context_menu.item.undeploy_item") }}
            </ContextMenuItem>
            <ContextMenuItem
              @click="deployItem(item.id)"
              v-if="item.deployed === null"
              ><IconForklift />
              {{ $t("components.context_menu.item.deploy_item") }}
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
              v-if="item.deployed !== null"
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
