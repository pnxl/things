<script setup lang="ts">
import SiteHeader from "@/components/SiteHeader.vue";

import {
  IconArrowLeft,
  IconDeviceFloppy,
  IconLoader2,
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
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldError,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Textarea from "@/components/ui/textarea/Textarea.vue";

import { supabase } from "@/lib/supabase";
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const route = useRoute();
const router = useRouter();

const remarksField = ref("");
const remarksInterval = ref<ReturnType<typeof setInterval> | null>(null);

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
const itemImageExists = ref(false);
const itemImageUplaoding = ref(false);
const itemImageDeleting = ref(false);
const categories = ref<any[]>([]);
const tags = ref<any[]>([]);

const supabaseLoaded = ref(false);
const errorUpdating = ref("");

async function upsertImage() {
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "image/jpeg, image/png, image/webp";
  fileInput.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    itemImageUplaoding.value = true;

    // Upload image to Supabase Storage
    const { error } = await supabase.storage
      .from("items")
      .upload(String(item.value.id), file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      itemImageUplaoding.value = false;
      console.error("Error uploading image:", error);
      errorUpdating.value = error.message;
    } else {
      // Update item image URL
      const { data } = await supabase.storage
        .from("items")
        .getPublicUrl(String(item.value.id));
      itemImage.value = data?.publicUrl;
      itemImageUplaoding.value = false;
    }
  };
  fileInput.click();
}

async function deleteImage() {
  itemImageDeleting.value = true;
  const { error } = await supabase.storage
    .from("items")
    .remove([String(item.value.id)]);

  if (error) {
    itemImageDeleting.value = false;
    console.error("Error deleting image:", error);
    errorUpdating.value = error.message;
  } else {
    itemImage.value = "undefined";
    itemImageDeleting.value = false;
  }
}

async function saveChanges() {
  const { error } = await supabase
    .from("items")
    .update(item.value)
    .eq("id", item.value.id);

  if (error !== null) {
    errorUpdating.value = error.message;
  } else {
    router.push(`/items/${item.value.id}`);
  }
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

    const itemImageFetch = await supabase.storage
      .from("items")
      .getPublicUrl(String(item.value.id));
    itemImage.value = itemImageFetch.data?.publicUrl;

    const doesItemExist = await supabase.storage
      .from("items")
      .exists(String(item.value.id));

    if (doesItemExist.data === true) {
      itemImageExists.value = true;
    }

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
      @click="$router.push(`/items/${item.id}`)"
      variant="ghost"
      class="flex flex-row gap-1 cursor-pointer -ml-3 hover:bg-transparent! hover:text-primary/80 hover:underline duration-200 transition-colors"
    >
      <IconX class="size-4 my-auto" />
      {{ t("item.editor.discard_changes") }}
    </Button>
    <Button
      @click="saveChanges()"
      variant="ghost"
      class="flex flex-row gap-1 cursor-pointer -mr-3 hover:bg-transparent! hover:text-primary/80 hover:underline duration-200 transition-colors"
    >
      <IconDeviceFloppy class="size-4 my-auto" />
      {{ t("item.editor.save_item") }}
    </Button>
  </div>

  <div class="p-4 lg:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
    <section class="flex flex-col gap-4 lg:gap-6">
      <img
        v-if="supabaseLoaded && itemImageExists"
        :src="itemImage"
        alt="Item Image"
        class="w-full object-cover object-center aspect-3/2 rounded-md shadow-sm md:hidden"
      />

      <FieldGroup class="flex flex-col gap-4">
        <Field>
          <FieldLabel for="item_name">
            {{ $t("item.editor.name") }}
          </FieldLabel>
          <Input
            id="item_name"
            :placeholder="$t('item.editor.name_placeholder')"
            required
            :disabled="supabaseLoaded ? false : true"
            :class="supabaseLoaded ? '' : 'animate-pulse!'"
            v-model="item.name"
          />
        </Field>
        <Field class="w-2/3">
          <FieldLabel for="cateegory">
            {{ $t("item.editor.category") }}
          </FieldLabel>
          <Select
            v-model="item.category"
            :disabled="supabaseLoaded ? false : true"
            :class="supabaseLoaded ? '' : 'animate-pulse!'"
          >
            <SelectTrigger id="category">
              <SelectValue
                :placeholder="$t('item.editor.category_placeholder')"
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                :value="category.id"
                v-for="category in categories"
                :key="category.id"
              >
                {{ category.name }}
              </SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </FieldGroup>

      <FieldGroup class="grid grid-cols-2 gap-6">
        <Field>
          <FieldLabel for="mass">
            {{ $t("item.editor.mass") }}
          </FieldLabel>
          <div class="relative">
            <div
              class="absolute right-3 z-10 h-full text-sm flex-col flex justify-center"
            >
              <span class="opacity-75">{{ $t("global.mass") }}</span>
            </div>
            <Input
              id="mass"
              placeholder=""
              :disabled="supabaseLoaded ? false : true"
              :class="supabaseLoaded ? '' : 'animate-pulse!'"
              required
              v-model="item.weight"
            />
          </div>
        </Field>
        <Field>
          <FieldLabel for="price">
            {{ $t("item.editor.price") }}
          </FieldLabel>
          <div class="relative">
            <div
              class="absolute right-3 z-10 h-full text-sm flex-col flex justify-center"
            >
              <span class="opacity-75">{{ $t("global.currency") }}</span>
            </div>
            <Input
              id="price"
              placeholder=""
              :disabled="supabaseLoaded ? false : true"
              :class="supabaseLoaded ? '' : 'animate-pulse!'"
              required
              v-model="item.price"
            />
          </div>
        </Field>
      </FieldGroup>

      <Field>
        <FieldLabel for="remarks">{{ $t("item.remarks") }}</FieldLabel>
        <Textarea
          id="remarks"
          :disabled="supabaseLoaded ? false : true"
          :class="supabaseLoaded ? '' : 'animate-pulse!'"
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
      <div class="flex flex-col gap-2 lg:gap-4">
        <img
          v-if="supabaseLoaded && itemImageExists"
          :src="itemImage"
          alt="Item Image"
          class="w-full object-cover object-center aspect-3/2 rounded-md shadow-sm"
        />
        <div
          v-if="supabaseLoaded"
          :class="
            (itemImageExists ? 'grid-cols-2' : 'grid-cols-1 mt-8') +
            ' grid gap-2 lg:gap-4'
          "
        >
          <Button
            variant="secondary"
            @click.prevent="upsertImage()"
            class="w-full"
            ><IconLoader2
              v-if="itemImageUplaoding === true"
              class="size-5 animate-spin"
            /><span v-else>
              {{
                itemImageExists
                  ? $t("item.editor.replace_image")
                  : $t("item.editor.add_image")
              }}
            </span></Button
          >
          <Button
            variant="secondary"
            class="w-full"
            v-if="itemImageExists"
            @click.prevent="deleteImage()"
            ><IconLoader2
              v-if="itemImageDeleting === true"
              class="size-5 animate-spin"
            /><span v-else>
              {{ $t("item.editor.remove_image") }}
            </span></Button
          >
        </div>
      </div>

      <div class="flex flex-col gap-2 lg:gap-4">
        <div class="flex flex-col gap-2" v-if="supabaseLoaded">
          <FieldLabel>
            {{ $t("item.editor.custom_fields") }}
          </FieldLabel>
          <div
            v-for="(field, i) in item.custom"
            :key="i"
            class="grid grid-cols-2 gap-2"
          >
            <Input
              :id="`key-${field.key}`"
              :placeholder="$t('item.editor.custom_field_key')"
              required
              v-model="field.key"
            />
            <Input
              :id="`value-${field.value}`"
              :placeholder="$t('item.editor.custom_field_value')"
              required
              v-model="field.value"
            />
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-2" v-if="supabaseLoaded">
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
