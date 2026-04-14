<script setup lang="ts">
import SiteHeader from "@/components/SiteHeader.vue";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { IconX } from "@tabler/icons-vue";

import { useCookies } from "@vueuse/integrations/useCookies";
import { useRouter } from "vue-router";
import { supabase } from "@/lib/supabase";
import { ref } from "vue";

const cookies = useCookies(["sb-access-token"]);
const router = useRouter();

if (!cookies.get("sb-access-token")) {
  router.push({ path: "/login" });
}

const userdata = JSON.parse(localStorage.getItem("sb-user-data") || "{}");

const errorUpdating = ref("");
const successUpdating = ref("");

const appearance = ref(userdata.user_metadata.settings?.appearance || "system");
const language = ref(userdata.user_metadata.settings?.language || "id");

async function saveChanges() {
  const settings = {
    appearance: appearance.value,
    language: language.value,
  };

  localStorage.setItem(
    "sb-user-data",
    JSON.stringify({
      ...userdata,
      user_metadata: {
        ...userdata.user_metadata,
        settings: settings,
      },
    }),
  );

  const { data, error } = await supabase.auth.updateUser({
    data: {
      settings: settings,
    },
  });
  if (error) {
    errorUpdating.value = error.message;
  } else {
    successUpdating.value = "Changes saved successfully!";
    location.reload();
  }
}
</script>

<template>
  <SiteHeader :title="$t('pages.settings.title')" />

  <div class="w-full max-w-md gap-4 p-4 lg:gap-6 lg:p-6">
    <form>
      <FieldGroup>
        <FieldSet>
          <FieldLegend>{{ $t("pages.settings.general") }}</FieldLegend>
          <FieldDescription>
            {{ $t("pages.settings.general_description") }}
          </FieldDescription>

          <div
            class="flex flex-row justify-between gap-2 text-center text-destructive bg-destructive/10 rounded-md p-4 border border-destructive"
            v-if="errorUpdating !== ''"
          >
            <span class="my-auto">{{ errorUpdating }}</span>
            <Button variant="ghost" size="icon-sm" @click="errorUpdating = ''">
              <IconX />
            </Button>
          </div>
          <div
            class="flex flex-row justify-between gap-2 text-center text-accent bg-accent/10 rounded-md p-4 border border-accent"
            v-if="successUpdating !== ''"
          >
            <span class="my-auto">{{ successUpdating }}</span>
            <Button
              variant="ghost"
              size="icon-sm"
              @click="successUpdating = ''"
            >
              <IconX />
            </Button>
          </div>
          <FieldGroup
            ><Field>
              <FieldLabel for="appearance">
                {{ $t("pages.settings.appearance") }}
              </FieldLabel>
              <Select v-model="appearance" :default-value="appearance">
                <SelectTrigger id="appearance">
                  <SelectValue
                    placeholder="{{ $t('pages.settings.appearance_system') }}"
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">
                    {{ $t("pages.settings.appearance_light") }}
                  </SelectItem>
                  <SelectItem value="dark">
                    {{ $t("pages.settings.appearance_dark") }}
                  </SelectItem>
                  <SelectItem value="system">
                    {{ $t("pages.settings.appearance_system") }}
                  </SelectItem>
                </SelectContent>
              </Select> </Field
            ><Field>
              <FieldLabel for="appearance">
                {{ $t("pages.settings.language") }}
              </FieldLabel>
              <Select v-model="language" :default-value="language">
                <SelectTrigger id="language">
                  <SelectValue
                    :placeholder="$t('pages.settings.language_placeholder')"
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="id"> Bahasa Indonesia </SelectItem>
                  <SelectItem value="en"> English </SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>

          <Field orientation="horizontal">
            <Button type="submit" @click="saveChanges()">
              {{ $t("pages.settings.save_button") }}
            </Button>
            <Button
              variant="outline"
              type="button"
              @click="
                appearance =
                  userdata.user_metadata.settings?.appearance || 'system'
              "
            >
              {{ $t("pages.settings.discard_button") }}
            </Button>
          </Field>
        </FieldSet>
      </FieldGroup>
    </form>
  </div>
</template>
