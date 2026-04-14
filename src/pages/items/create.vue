<script setup lang="ts">
import { IconDeviceFloppy, IconX } from "@tabler/icons-vue";
import Button from "@/components/ui/button/Button.vue";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

import SiteHeader from "@/components/SiteHeader.vue";
import ErrorBanner from "@/components/ErrorBanner.vue";

import { supabase } from "@/lib/supabase";
import { ref, onMounted } from "vue";
import { useCookies } from "@vueuse/integrations/useCookies";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";

const router = useRouter();

const { t } = useI18n();

if (!useCookies(["sb-access-token"]).get("sb-access-token")) {
  router.replace({ path: "/login" });
}

const errorMessages = ref<string[]>([]);
const supabaseLoaded = ref(false);

const item = ref({
  name: t("pages.items.editor.name_placeholder"),
  category: t("pages.items.editor.unknown_category"),
  price: 0,
  weight: 0,
  tags: null,
  remarks: "" as string | null,
  custom: [{ key: "", value: "" }] as any[],
});

const categories = ref<any[]>([]);
const tags = ref<any[]>([]);

const remarksField = ref("");

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

  item.value.remarks = remarksField.value;

  const { data, error } = await supabase
    .from("items")
    .insert(item.value)
    .select();

  if (error !== null) {
    errorMessages.value.push(error.message);
  } else {
    console.log(data);
    router.push(`/items/${data[0].id}`);
  }
}

onMounted(async () => {
  const categoriesData = await supabase.from("categories").select();
  const tagsData = await supabase.from("tags").select();

  if (!categoriesData.error) {
    categories.value = categoriesData.data;
    errorMessages.value = [];
    supabaseLoaded.value = true;
  } else {
    console.error("Error fetching categories:", categoriesData.error);
    errorMessages.value.push(categoriesData.error.message);
    supabaseLoaded.value = false;
  }

  if (!tagsData.error) {
    tags.value = tagsData.data;
    errorMessages.value = [];
    supabaseLoaded.value = true;
  } else {
    console.error("Error fetching tags:", tagsData.error);
    errorMessages.value.push(tagsData.error.message);
    supabaseLoaded.value = false;
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
      @click="$router.back()"
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
                  class="focus:bg-input focus:text-accent-foreground"
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
                <SelectItem
                  :value="tag.id"
                  v-for="tag in tags"
                  :key="tag.id"
                  class="focus:bg-input focus:text-accent-foreground"
                >
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
    </section>
    <section class="flex-col hidden md:flex gap-2" v-if="supabaseLoaded">
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
    </section>
  </div>
</template>
