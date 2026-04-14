<script setup lang="ts">
import SiteHeader from "@/components/SiteHeader.vue";

import {
  IconArrowLeft,
  IconPencil,
  IconTag,
  IconTrash,
  IconX,
} from "@tabler/icons-vue";

import Button from "@/components/ui/button/Button.vue";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Field from "@/components/ui/field/Field.vue";
import FieldLabel from "@/components/ui/field/FieldLabel.vue";
import Textarea from "@/components/ui/textarea/Textarea.vue";

import { supabase } from "@/lib/supabase";
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const route = useRoute();
const router = useRouter();

const remarksField = ref("");
const remarksInterval = ref<number | null>(null);

function startRemarksSync() {
  if (remarksInterval.value) clearInterval(remarksInterval.value);

  remarksInterval.value = setInterval(async () => {
    if (remarksField.value !== item.value.remarks) {
      console.log("test", remarksField.value);
      item.value.remarks = remarksField.value;

      await supabase
        .from("items")
        .update({ remarks: remarksField.value })
        .eq("id", item.value.id);
    }
  }, 5000);
}

async function stopRemarksSync() {
  if (remarksInterval.value) {
    clearInterval(remarksInterval.value);
    remarksInterval.value = null;
    console.log("stop");

    await supabase
      .from("items")
      .update({ remarks: remarksField.value })
      .eq("id", item.value.id);
  }
}

const item = ref({
  id: "",
  name: t("item.name_placeholder"),
  category: t("item.unknown_category"),
  price: 0,
  weight: 0,
  deployed: null,
  deployed_at: null,
  person_responsible: null,
  tags: null,
  remarks: "" as string | null,
  custom: [] as any[],
  created_at: "" as string | null,
});
const itemImage = ref("");
const categories = ref<any[]>([]);
const tags = ref<any[]>([]);

const supabaseLoaded = ref(false);
const errorUpdating = ref("");

async function deleteItem() {
  await supabase.from("items").delete().eq("id", item.value.id);
  router.push("/items");
}

onMounted(async () => {
  let id = "00000000-0000-0000-0000-000000000000";
  if ("id" in route.params) {
    id = route.params.id as string;
  } else {
    router.push("/404");
    return;
  }

  const itemData = await supabase.from("items").select().eq("id", id);
  const categoriesData = await supabase.from("categories").select();
  const tagsData = await supabase.from("tags").select();

  if (itemData.data) {
    if (itemData.data.length === 0) {
      router.push("/404");
      return;
    }

    item.value = itemData.data[0];

    const { data } = await supabase.storage
      .from("items")
      .getPublicUrl(String(item.id));
    itemImage.value = data?.publicUrl;

    supabaseLoaded.value = true;

    remarksField.value = item.value.remarks || "";

    console.log(item.value);
  } else {
    if (itemData.error.code === "22P02") {
      router.push("/404");
      return;
    }

    errorUpdating.value = itemData.error.message;
    console.error("Error fetching items:", itemData.error);
  }

  if (!categoriesData.error) {
    categories.value = categoriesData.data;
  } else {
    console.error("Error fetching categories:", categoriesData.error);
    errorUpdating.value = categoriesData.error.message;
  }

  if (!tagsData.error) {
    tags.value = tagsData.data;
  } else {
    console.error("Error fetching tags:", tagsData.error);
    errorUpdating.value = tagsData.error.message;
  }
});
</script>

<template>
  <SiteHeader :title="item.name" />
  <div
    class="flex flex-row justify-between gap-2 text-center text-destructive bg-destructive/10 rounded-md m-4 lg:m-6 p-4 border border-destructive"
    v-if="errorUpdating !== ''"
  >
    <span class="my-auto">{{ errorUpdating }}</span>
    <Button variant="ghost" size="icon-sm" @click="errorUpdating = ''">
      <IconX />
    </Button>
  </div>
  <div
    class="flex flex-row justify-between text-sm m-4 mb-0 lg:mb-0 lg:m-6 gap-1 text-primary"
  >
    <Button
      @click="$router.push('/items')"
      variant="ghost"
      class="flex flex-row gap-1 cursor-pointer -ml-3 hover:bg-transparent! hover:text-primary/80 hover:underline duration-200 transition-colors"
    >
      <IconArrowLeft class="size-4 my-auto" />
      {{ t("item.go_back") }}
    </Button>
    <div class="flex flex-row gap-1">
      <Button
        @click="$router.push(`/items/${item.id}/edit`)"
        variant="ghost"
        class="flex flex-row gap-1 cursor-pointer -mr-3 hover:bg-transparent! hover:text-primary/80 hover:underline duration-200 transition-colors"
      >
        <IconPencil class="size-4 my-auto" />
        {{ t("item.edit_item") }}
      </Button>

      <Dialog>
        <DialogTrigger as-child>
          <Button
            variant="ghost"
            class="flex text-destructive flex-row gap-1 cursor-pointer -mr-3 hover:bg-transparent! hover:text-destructive/80 hover:underline duration-200 transition-colors"
          >
            <IconTrash class="size-4 my-auto" />
            {{ t("item.delete_item") }}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{{ t("item.delete_confirmation") }}</DialogTitle>
            <DialogDescription>
              {{ t("item.delete_warning") }}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter class="sm:justify-end flex sm:flex-row flex-col gap-2">
            <DialogClose as-child>
              <Button type="button" variant="secondary" class="cursor-pointer">
                {{ t("item.delete_cancel") }}
              </Button>
            </DialogClose>
            <DialogClose as-child>
              <Button
                type="button"
                variant="destructive"
                class="cursor-pointer"
                @click="deleteItem()"
              >
                {{ t("item.delete_confirm") }}
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  </div>

  <div class="p-4 lg:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
    <section class="flex flex-col gap-4 lg:gap-6">
      <img
        v-if="supabaseLoaded && !itemImage.endsWith('undefined')"
        :src="itemImage"
        alt="Item Image"
        class="w-full object-cover object-center aspect-3/2 rounded-md shadow-sm md:hidden"
      />

      <div class="flex flex-col gap-2">
        <div>
          <h1 v-if="supabaseLoaded" class="font-semibold text-3xl">
            {{ item.name }}
          </h1>
          <div
            v-else
            class="bg-primary/25 animate-pulse h-10 w-64 rounded-md"
          ></div>
        </div>
        <div v-if="item.category || supabaseLoaded">
          <h1 v-if="supabaseLoaded" class="text-muted-foreground">
            {{
              item.category
                ? categories.find((c) => c.id === item.category)?.name ||
                  $t("item.unknown_category")
                : $t("item.unknown_category")
            }}
          </h1>
          <div
            v-else
            class="bg-primary/25 animate-pulse h-5 w-32 rounded-md"
          ></div>
        </div>
      </div>

      <div
        v-if="item.tags !== null && supabaseLoaded"
        class="flex flex-wrap gap-2 text-muted-foreground text-sm"
      >
        <div
          v-for="tag in item.tags"
          :key="tag"
          class="border border-muted-foreground/50 rounded-md px-2 py-1"
        >
          <IconTag class="size-4 inline-block mr-1" />
          {{ tags.find((t) => t.id === tag)?.name || $t("item.unknown_tag") }}
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4 lg:gap-6">
        <Card class="@container/card">
          <CardHeader>
            <CardDescription>{{ $t("item.mass") }}</CardDescription>
            <CardTitle
              class="text-xl font-semibold tabular-nums @[250px]/card:text-2xl"
            >
              <span v-if="supabaseLoaded"
                >{{
                  item.weight.toLocaleString($t("global.locale"), {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                  })
                }}
                {{ $t("global.mass") }}</span
              >
              <div
                v-else
                class="bg-primary/25 animate-pulse h-8 w-16 rounded-md"
              ></div>
            </CardTitle>
          </CardHeader>
        </Card>

        <Card class="@container/card">
          <CardHeader>
            <CardDescription>{{ $t("item.price") }}</CardDescription>
            <CardTitle
              class="text-xl font-semibold tabular-nums @[250px]/card:text-xl"
            >
              <span v-if="supabaseLoaded"
                >{{ $t("global.currency") }}
                {{
                  item.price.toLocaleString($t("global.locale"), {
                    maximumFractionDigits: 2,
                  })
                }}</span
              >
              <div
                v-else
                class="bg-primary/25 animate-pulse h-8 w-32 rounded-md"
              ></div>
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div>
        <Card class="@container/card" v-if="item.deployed === null">
          <CardHeader>
            <CardDescription>{{
              $t("item.deployment_status")
            }}</CardDescription>
            <CardTitle
              class="text-lg font-semibold tabular-nums @[250px]/card:text-xl"
            >
              <span v-if="supabaseLoaded">{{ $t("item.not_deployed") }}</span>
              <div
                v-else
                class="bg-primary/25 animate-pulse h-8 w-64 rounded-md"
              ></div>
            </CardTitle>
          </CardHeader>
        </Card>

        <div v-else class="flex flex-col lg:gap-3 gap-2">
          <Card class="@container/card" v-if="item.deployed !== null">
            <CardHeader class="flex flex-row justify-between">
              <CardDescription class="my-auto">{{
                $t("item.deployed_on")
              }}</CardDescription>
              <CardTitle
                class="text-lg font-semibold tabular-nums @[250px]/card:text-xl"
              >
                <span v-if="supabaseLoaded">{{
                  new Date(item.deployed).toLocaleDateString(
                    $t("global.locale"),
                    {
                      year: "numeric",
                      month: "numeric",
                      day: "numeric",
                    },
                  )
                }}</span>
                <div
                  v-else
                  class="bg-primary/25 animate-pulse h-8 w-64 rounded-md"
                ></div>
              </CardTitle>
            </CardHeader>
          </Card>
          <Card class="@container/card" v-if="item.deployed_at !== null">
            <CardHeader class="flex flex-row justify-between">
              <CardDescription class="my-auto">{{
                $t("item.deployed_at")
              }}</CardDescription>
              <CardTitle
                class="text-lg font-semibold tabular-nums @[250px]/card:text-xl"
              >
                <span v-if="supabaseLoaded">{{ item.deployed_at }}</span>
                <div
                  v-else
                  class="bg-primary/25 animate-pulse h-8 w-64 rounded-md"
                ></div>
              </CardTitle>
            </CardHeader>
          </Card>
          <Card class="@container/card" v-if="item.person_responsible !== null">
            <CardHeader class="flex flex-row justify-between">
              <CardDescription class="my-auto">{{
                $t("item.person_responsible")
              }}</CardDescription>
              <CardTitle
                class="text-lg font-semibold tabular-nums @[250px]/card:text-xl"
              >
                <span v-if="supabaseLoaded">{{ item.person_responsible }}</span>
                <div
                  v-else
                  class="bg-primary/25 animate-pulse h-8 w-64 rounded-md"
                ></div>
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      </div>

      <Field>
        <FieldLabel for="remarks">{{ $t("item.remarks") }}</FieldLabel>
        <Textarea
          id="remarks"
          :placeholder="$t('item.remarks_placeholder')"
          :default-value="remarksField"
          v-model="remarksField"
          @focus="startRemarksSync()"
          @blur="stopRemarksSync()"
        />
      </Field>

      <div class="flex md:hidden flex-col gap-2" v-if="supabaseLoaded">
        <div
          v-for="customField in item.custom"
          :key="customField.key"
          class="w-full border-b flex flex-row justify-between text-sm"
        >
          <span class="opacity-75">{{ customField.key }}</span>
          <span class="font-medium text-right">{{ customField.value }}</span>
        </div>
        <div class="w-full border-b flex flex-row justify-between text-sm">
          <span class="opacity-75">{{ $t("item.created_at") }}</span>
          <span class="font-medium text-right">{{
            item.created_at
              ? new Date(item.created_at).toLocaleDateString(
                  $t("global.locale"),
                  {
                    year: "numeric",
                    month: "numeric",
                    day: "numeric",
                  },
                )
              : ""
          }}</span>
        </div>
        <div class="w-full border-b flex flex-row justify-between text-sm">
          <span class="opacity-75">{{ $t("item.unique_id") }}</span>
          <span class="font-medium text-right">{{ item.id }}</span>
        </div>
      </div>
    </section>
    <section class="flex-col gap-4 lg:gap-6 hidden md:flex">
      <img
        v-if="supabaseLoaded && !itemImage.endsWith('undefined')"
        :src="itemImage"
        alt="Item Image"
        class="w-full object-cover object-center aspect-3/2 rounded-md shadow-sm"
      />

      <div class="flex flex-col gap-2" v-if="supabaseLoaded">
        <div
          v-for="customField in item.custom"
          :key="customField.key"
          class="w-full border-b flex flex-row justify-between text-sm"
        >
          <span class="opacity-75">{{ customField.key }}</span>
          <span class="font-medium text-right">{{ customField.value }}</span>
        </div>
        <div class="w-full border-b flex flex-row justify-between text-sm">
          <span class="opacity-75">{{ $t("item.created_at") }}</span>
          <span class="font-medium text-right">{{
            item.created_at
              ? new Date(item.created_at).toLocaleDateString(
                  $t("global.locale"),
                  {
                    year: "numeric",
                    month: "numeric",
                    day: "numeric",
                  },
                )
              : ""
          }}</span>
        </div>
        <div class="w-full border-b flex flex-row justify-between text-sm">
          <span class="opacity-75">{{ $t("item.unique_id") }}</span>
          <span class="font-medium text-right">{{ item.id }}</span>
        </div>
      </div>
    </section>
  </div>
</template>
