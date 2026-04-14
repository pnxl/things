<script setup lang="ts">
import { IconDeviceFloppy, IconLoader2, IconX } from "@tabler/icons-vue";
import Button from "@/components/ui/button/Button.vue";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Textarea from "@/components/ui/textarea/Textarea.vue";

import SiteHeader from "@/components/SiteHeader.vue";
import ErrorBanner from "@/components/ErrorBanner.vue";

import { supabase } from "@/lib/supabase";
import { ref, onMounted } from "vue";
import { useCookies } from "@vueuse/integrations/useCookies";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import Separator from "@/components/ui/separator/Separator.vue";

const route = useRoute();
const router = useRouter();

const { t } = useI18n();

if (!useCookies(["sb-access-token"]).get("sb-access-token")) {
  router.replace({ path: "/login" });
}

const errorMessages = ref<string[]>([]);
const supabaseLoaded = ref(false);

const item = ref({
  id: "",
  name: t("pages.items.editor.name_placeholder"),
  category: t("pages.items.editor.unknown_category"),
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
const itemImageIsUploading = ref(false);
const itemImageIsDeleting = ref(false);

const categories = ref<any[]>([]);
const tags = ref<any[]>([]);

const remarksField = ref("");
const remarksInterval = ref<ReturnType<typeof setInterval> | null>(null);

async function upsertItemImage() {
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "image/jpeg, image/png, image/webp";
  fileInput.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    itemImageIsUploading.value = true;

    // Upload image to Supabase Storage
    const { error } = await supabase.storage
      .from("items")
      .upload(String(item.value.id), file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      itemImageIsUploading.value = false;
      console.error("Error uploading image:", error);
      errorMessages.value.push(error.message);
    } else {
      // Update item image URL
      const { data } = await supabase.storage
        .from("items")
        .getPublicUrl(String(item.value.id));
      itemImage.value = data?.publicUrl;
      itemImageIsUploading.value = false;
      itemImageExists.value = true;
    }
  };
  fileInput.click();
}

async function deleteItemImage() {
  itemImageIsDeleting.value = true;
  const { error } = await supabase.storage
    .from("items")
    .remove([String(item.value.id)]);

  if (error) {
    itemImageIsDeleting.value = false;
    console.error("Error deleting image:", error);
    errorMessages.value.push(error.message);
  } else {
    itemImage.value = "undefined";
    itemImageExists.value = false;
    itemImageIsDeleting.value = false;
  }
}

async function startRemarksSync() {
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

async function addBlankCustomField() {
  if (item.value.custom[item.value.custom.length - 1].key !== "") {
    item.value.custom.push({ key: "", value: "" });
  }
}

async function trimBlankCustomFields() {
  item.value.custom = item.value.custom.filter(
    (field) => field.key.trim() !== "" && field.value.trim() !== "",
  );
}

async function saveChanges() {
  trimBlankCustomFields();

  const { error } = await supabase
    .from("items")
    .update(item.value)
    .eq("id", item.value.id);

  if (error !== null) {
    errorMessages.value.push(error.message);
  } else {
    router.push(`/items/${item.value.id}`);
  }
}

onMounted(async () => {
  let id = "00000000";
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

    const fetchItemImage = await supabase.storage
      .from("items")
      .getPublicUrl(String(item.value.id));
    itemImage.value = fetchItemImage.data?.publicUrl;

    const doesItemImageExist = await supabase.storage
      .from("items")
      .exists(String(item.value.id));

    if (doesItemImageExist.data === true) {
      itemImageExists.value = true;
    }

    errorMessages.value = [];
    supabaseLoaded.value = true;

    remarksField.value = item.value.remarks || "";
    addBlankCustomField();
  } else {
    if (itemData.error.code === "22P02") {
      router.push("/404");
      return;
    }

    errorMessages.value.push(itemData.error.message);
    console.error("Error fetching items:", itemData.error);
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
  <SiteHeader :title="item.name" />
  <ErrorBanner :errors="errorMessages" />
  <div
    class="flex flex-row justify-between text-sm m-4 mb-0 lg:mb-0 lg:m-6 gap-1 text-primary"
  >
    <Button
      @click="$router.push(`/items/${item.id}`)"
      variant="ghost"
      class="flex flex-row gap-1 cursor-pointer -ml-3 hover:bg-transparent! hover:text-primary/80 hover:underline duration-200 transition-colors"
    >
      <IconX class="size-4 my-auto" />
      {{ t("pages.items.editor.discard_changes") }}
    </Button>
    <Button
      @click="saveChanges()"
      variant="ghost"
      class="flex flex-row gap-1 cursor-pointer -mr-3 hover:bg-transparent! hover:text-primary/80 hover:underline duration-200 transition-colors"
    >
      <IconDeviceFloppy class="size-4 my-auto" />
      {{ t("pages.items.editor.save_item") }}
    </Button>
  </div>

  <div class="p-4 lg:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
    <section class="flex flex-col gap-4 lg:gap-6">
      <div class="flex flex-col gap-2 md:hidden">
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
            @click.prevent="upsertItemImage()"
            class="w-full"
            ><IconLoader2
              v-if="itemImageIsUploading === true"
              class="size-5 animate-spin"
            /><span v-else>
              {{
                itemImageExists
                  ? $t("pages.items.editor.replace_image")
                  : $t("pages.items.editor.add_image")
              }}
            </span></Button
          >
          <Button
            variant="secondary"
            class="w-full"
            v-if="itemImageExists"
            @click.prevent="deleteItemImage()"
            ><IconLoader2
              v-if="itemImageIsDeleting === true"
              class="size-5 animate-spin"
            /><span v-else>
              {{ $t("pages.items.editor.remove_image") }}
            </span></Button
          >
        </div>

        <Separator orientation="horizontal" class="my-4 block md:hidden" />
      </div>

      <FieldGroup class="flex flex-col gap-4">
        <Field>
          <FieldLabel for="item_name">
            {{ $t("pages.items.editor.name") }}
          </FieldLabel>
          <Input
            id="item_name"
            :placeholder="$t('pages.items.editor.name_placeholder')"
            required
            :disabled="supabaseLoaded ? false : true"
            :class="supabaseLoaded ? '' : 'animate-pulse!'"
            v-model="item.name"
          />
        </Field>
        <div class="flex lg:flex-row flex-col gap-4">
          <Field class="lg:w-2/3">
            <FieldLabel for="category">
              {{ $t("pages.items.editor.category") }}
            </FieldLabel>
            <Select
              v-model="item.category"
              :disabled="supabaseLoaded ? false : true"
              :class="supabaseLoaded ? '' : 'animate-pulse!'"
            >
              <SelectTrigger id="category">
                <SelectValue
                  :placeholder="$t('pages.items.editor.category_placeholder')"
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
          <Field class="lg:w-1/3">
            <FieldLabel for="tags">
              {{ $t("pages.items.editor.tags") }}
            </FieldLabel>
            <Select
              multiple
              v-model="item.tags"
              :disabled="supabaseLoaded ? false : true"
              :class="supabaseLoaded ? '' : 'animate-pulse!'"
            >
              <SelectTrigger id="tags">
                <SelectValue
                  :placeholder="$t('pages.items.editor.tags_placeholder')"
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem :value="tag.id" v-for="tag in tags" :key="tag.id">
                  {{ tag.name }}
                </SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
      </FieldGroup>

      <Separator orientation="horizontal" class="my-2" />

      <FieldGroup class="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
        <Field>
          <FieldLabel for="mass">
            {{ $t("pages.items.editor.mass") }}
          </FieldLabel>
          <div class="relative">
            <div
              class="absolute right-3 z-10 h-full text-sm flex-col flex justify-center"
            >
              <span class="opacity-75">{{ $t("language.units.mass") }}</span>
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
            {{ $t("pages.items.editor.price") }}
          </FieldLabel>
          <div class="relative">
            <div
              class="absolute right-3 z-10 h-full text-sm flex-col flex justify-center"
            >
              <span class="opacity-75">{{
                $t("language.units.currency")
              }}</span>
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
        <FieldLabel for="remarks">{{
          $t("pages.items.editor.remarks")
        }}</FieldLabel>
        <Textarea
          id="remarks"
          :disabled="supabaseLoaded ? false : true"
          :class="supabaseLoaded ? '' : 'animate-pulse!'"
          :placeholder="$t('pages.items.editor.remarks_placeholder')"
          :default-value="remarksField"
          v-model="remarksField"
          @focus="startRemarksSync()"
          @blur="stopRemarksSync()"
        />
      </Field>

      <div class="flex md:hidden flex-col gap-2 lg:gap-4">
        <Separator orientation="horizontal" class="my-2" />
        <div class="flex flex-col gap-4" v-if="supabaseLoaded">
          <FieldLabel>
            {{ $t("pages.items.editor.custom_fields") }}
          </FieldLabel>
          <div
            v-for="(field, i) in item.custom"
            :key="i"
            class="flex flex-col sm:flex-row gap-2"
          >
            <Input
              :id="`key-${field.key}`"
              :placeholder="$t('pages.items.editor.custom_field_key')"
              class="sm:w-1/3!"
              v-model="field.key"
              @focus="addBlankCustomField()"
            />
            <Input
              :id="`value-${field.value}`"
              class="sm:w-2/3!"
              :placeholder="$t('pages.items.editor.custom_field_value')"
              v-model="field.value"
              @focus="addBlankCustomField()"
            />
          </div>
        </div>
      </div>

      <div class="flex md:hidden flex-col gap-2" v-if="supabaseLoaded">
        <div class="w-full border-b flex flex-row justify-between text-sm">
          <span class="opacity-75">{{
            $t("pages.items.editor.created_at")
          }}</span>
          <span class="font-medium text-right">{{
            item.created_at
              ? new Date(item.created_at).toLocaleDateString(
                  $t("language.locale"),
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
          <span class="opacity-75">{{
            $t("pages.items.editor.unique_id")
          }}</span>
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
            @click.prevent="upsertItemImage()"
            class="w-full"
            ><IconLoader2
              v-if="itemImageIsUploading === true"
              class="size-5 animate-spin"
            /><span v-else>
              {{
                itemImageExists
                  ? $t("pages.items.editor.replace_image")
                  : $t("pages.items.editor.add_image")
              }}
            </span></Button
          >
          <Button
            variant="secondary"
            class="w-full"
            v-if="itemImageExists"
            @click.prevent="deleteItemImage()"
            ><IconLoader2
              v-if="itemImageIsDeleting === true"
              class="size-5 animate-spin"
            /><span v-else>
              {{ $t("pages.items.editor.remove_image") }}
            </span></Button
          >
        </div>
      </div>

      <div class="flex flex-col gap-2 lg:gap-4">
        <Separator orientation="horizontal" class="mt-1 mb-3" />
        <div class="flex flex-col gap-2" v-if="supabaseLoaded">
          <FieldLabel>
            {{ $t("pages.items.editor.custom_fields") }}
          </FieldLabel>
          <div
            v-for="(field, i) in item.custom"
            :key="i"
            class="flex flex-row gap-2"
          >
            <Input
              :id="`key-${field.key}`"
              :placeholder="$t('pages.items.editor.custom_field_key')"
              class="w-1/3!"
              required
              v-model="field.key"
              @focus="addBlankCustomField()"
            />
            <Input
              :id="`value-${field.value}`"
              class="w-2/3!"
              :placeholder="$t('pages.items.editor.custom_field_value')"
              required
              v-model="field.value"
              @focus="addBlankCustomField()"
            />
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-2" v-if="supabaseLoaded">
        <div class="w-full border-b flex flex-row justify-between text-sm">
          <span class="opacity-75">{{
            $t("pages.items.editor.created_at")
          }}</span>
          <span class="font-medium text-right">{{
            item.created_at
              ? new Date(item.created_at).toLocaleDateString(
                  $t("language.locale"),
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
          <span class="opacity-75">{{
            $t("pages.items.editor.unique_id")
          }}</span>
          <span class="font-medium text-right">{{ item.id }}</span>
        </div>
      </div>
    </section>
  </div>
</template>
