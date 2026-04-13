<script setup lang="ts">
import SiteHeader from "@/components/SiteHeader.vue";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import { IconX } from "@tabler/icons-vue";

import { useCookies } from "@vueuse/integrations/useCookies";
import { useRouter } from "vue-router";
import { supabase } from "@/lib/supabase";
import { ref, onMounted } from "vue";

const cookies = useCookies(["sb-access-token"]);
const router = useRouter();

if (!cookies.get("sb-access-token")) {
  router.replace({ path: "/login" });
}

const userdata = JSON.parse(localStorage.getItem("sb-user-data") || "{}");

const displayname = ref(userdata.user_metadata.display_name);
const email = ref(userdata.email);
const errorUpdating = ref("");
const successUpdating = ref("");
const profilePictureUrl = ref("");

async function saveChanges() {
  const updates = {
    email: email.value || userdata.email,
    data: {
      display_name:
        displayname.value ||
        userdata.user_metadata.display_name ||
        "Unknown User",
    },
  };

  const { data, error } = await supabase.auth.updateUser(updates);
  if (error) {
    errorUpdating.value = error.message;
  } else {
    successUpdating.value = "Changes saved successfully!";
    console.log(data);
  }
}

async function getProfilePicture() {
  const { data } = supabase.storage
    .from("profile_pictures")
    .getPublicUrl(userdata.id);

  return data.publicUrl;
}

async function uploadProfilePicture() {
  const fileInput = document.createElement("input");

  fileInput.type = "file";
  fileInput.accept = "image/png, image/jpeg, image/webp";
  fileInput.click();

  fileInput.onchange = async () => {
    const file = fileInput.files?.[0];
    if (!file) return;

    const { data, error } = await supabase.storage
      .from("profile_pictures")
      .upload(userdata.id, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      errorUpdating.value = error.message;
    } else {
      profilePictureUrl.value = await getProfilePicture();
      successUpdating.value = "Profile picture updated successfully!";
    }
  };
}

async function deleteProfilePicture() {
  const { data, error } = await supabase.storage
    .from("profile_pictures")
    .remove([userdata.id]);

  if (error) {
    errorUpdating.value = error.message;
  } else {
    profilePictureUrl.value = "";
    successUpdating.value = "Profile picture cleared successfully!";
  }

  location.reload();
}

onMounted(async () => {
  profilePictureUrl.value = await getProfilePicture();
});
</script>

<template>
  <SiteHeader :title="$t('account.title')" />

  <div class="w-full max-w-md gap-4 p-4 lg:gap-6 lg:p-6">
    <form>
      <FieldGroup>
        <FieldSet>
          <FieldLegend>{{ $t("account.account_settings") }}</FieldLegend>
          <FieldDescription>
            {{ $t("account.account_settings_description") }}
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
          <FieldGroup>
            <div class="flex flex-row gap-4">
              <Avatar class="h-24 w-24 max-w-24 rounded-lg bg-secondary">
                <AvatarImage
                  :src="profilePictureUrl"
                  :alt="$t('account.profile_picture_alt')"
                />
                <AvatarFallback class="rounded-lg my-auto"> 👤 </AvatarFallback>
              </Avatar>

              <div class="flex flex-col my-auto gap-1">
                <FieldLabel for="user-id">
                  {{ $t("account.profile_picture") }}
                </FieldLabel>
                <FieldDescription>
                  {{ $t("account.profile_picture_description") }}
                </FieldDescription>

                <Field orientation="horizontal" class="mt-2">
                  <Button type="submit" @click.prevent="uploadProfilePicture()">
                    {{ $t("account.upload_button") }}
                  </Button>
                  <Button
                    variant="outline"
                    type="button"
                    @click.prevent="deleteProfilePicture()"
                  >
                    {{ $t("account.clear_button") }}
                  </Button>
                </Field>
              </div>
            </div>
            <Field>
              <FieldLabel for="display-name">
                {{ $t("account.display_name") }}
              </FieldLabel>
              <Input
                id="display-name"
                v-model="displayname"
                :placeholder="
                  userdata.user_metadata.display_name || 'Unknown User'
                "
              />
            </Field>
            <Field>
              <FieldLabel for="email-address">
                {{ $t("account.email_address") }}
              </FieldLabel>
              <Input
                id="email-address"
                v-model="email"
                :placeholder="userdata.email"
              />
            </Field>
            <Field>
              <FieldLabel for="user-id">
                {{ $t("account.user_id") }}
              </FieldLabel>
              <FieldDescription>
                {{ $t("account.user_id_description") }}
              </FieldDescription>
              <Input
                id="user-id"
                v-model="userdata.id"
                :placeholder="userdata.id"
                disabled
              />
            </Field>
          </FieldGroup>

          <Field orientation="horizontal">
            <Button type="submit" @click="saveChanges()">
              {{ $t("account.save_button") }}
            </Button>
            <Button
              variant="outline"
              type="button"
              @click="
                displayname = userdata.user_metadata.display_name;
                email = userdata.email;
              "
            >
              {{ $t("account.discard_button") }}
            </Button>
          </Field>
        </FieldSet>
        <FieldSeparator />
        <FieldSet>
          <FieldLegend>{{
            $t("account.password_and_authentication")
          }}</FieldLegend>
          <FieldDescription>
            {{ $t("account.password_and_authentication_description") }}
          </FieldDescription>
          <FieldGroup>
            <Field>
              <Button> {{ $t("account.change_password") }} </Button>
            </Field>
          </FieldGroup>
        </FieldSet>
      </FieldGroup>
    </form>
  </div>
</template>
