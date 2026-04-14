<script setup lang="ts">
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import SiteHeader from "@/components/SiteHeader.vue";
import ErrorBanner from "@/components/ErrorBanner.vue";

import { useCookies } from "@vueuse/integrations/useCookies";
import { useRouter } from "vue-router";
import { supabase } from "@/lib/supabase";
import { ref, onMounted } from "vue";

if (!useCookies(["sb-access-token"]).get("sb-access-token")) {
  useRouter().replace({ path: "/login" });
}

const errorMessages = ref<string[]>([]);

const userdata = JSON.parse(localStorage.getItem("sb-user-data") || "{}");
const displayname = ref(userdata.user_metadata.display_name);
const email = ref(userdata.email);
const profilePictureUrl = ref("");

async function getProfilePicture() {
  const fetchedProfilePicture = supabase.storage
    .from("profile_pictures")
    .getPublicUrl(userdata.id);

  profilePictureUrl.value =
    fetchedProfilePicture.data.publicUrl + "?t=" + new Date().getTime();
}

async function uploadProfilePicture() {
  const fileInput = document.createElement("input");

  fileInput.type = "file";
  fileInput.accept = "image/png, image/jpeg, image/webp";

  fileInput.onchange = async () => {
    const file = fileInput.files?.[0];
    if (!file) return;

    const { error } = await supabase.storage
      .from("profile_pictures")
      .upload(userdata.id, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      errorMessages.value.push(error.message);
    } else {
      errorMessages.value = [];
      getProfilePicture();
    }
  };

  fileInput.click();
}

async function deleteProfilePicture() {
  const { error } = await supabase.storage
    .from("profile_pictures")
    .remove([userdata.id]);

  if (error) {
    errorMessages.value.push(error.message);
  } else {
    errorMessages.value = [];
    profilePictureUrl.value = "";
  }

  location.reload();
}

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

  const { error } = await supabase.auth.updateUser(updates);
  if (error) {
    errorMessages.value.push(error.message);
  } else {
    errorMessages.value = [];
    localStorage.setItem(
      "sb-user-data",
      JSON.stringify({
        ...userdata,
        email: updates.email,
        user_metadata: {
          ...userdata.user_metadata,
          display_name: updates.data.display_name,
        },
      }),
    );
  }
}

onMounted(async () => {
  getProfilePicture();
});
</script>

<template>
  <SiteHeader :title="$t('pages.account.title')" />
  <div class="w-full max-w-md gap-4 p-4 lg:gap-6 lg:p-6">
    <form>
      <FieldGroup>
        <FieldSet>
          <FieldLegend>{{ $t("pages.account.account_settings") }}</FieldLegend>
          <FieldDescription>
            {{ $t("pages.account.account_settings_description") }}
          </FieldDescription>
          <ErrorBanner :errors="errorMessages" />
          <FieldGroup>
            <div class="flex flex-row gap-4">
              <Avatar class="h-24 w-24 max-w-24 rounded-lg bg-secondary">
                <AvatarImage
                  :src="profilePictureUrl"
                  :alt="$t('pages.account.profile_picture_alt')"
                />
                <AvatarFallback class="rounded-lg my-auto"> 👤 </AvatarFallback>
              </Avatar>

              <div class="flex flex-col my-auto gap-1">
                <FieldLabel for="user-id">
                  {{ $t("pages.account.profile_picture") }}
                </FieldLabel>
                <FieldDescription>
                  {{ $t("pages.account.profile_picture_description") }}
                </FieldDescription>

                <Field orientation="horizontal" class="mt-2">
                  <Button type="submit" @click.prevent="uploadProfilePicture()">
                    {{ $t("pages.account.upload_button") }}
                  </Button>
                  <Button
                    variant="outline"
                    type="button"
                    @click.prevent="deleteProfilePicture()"
                  >
                    {{ $t("pages.account.clear_button") }}
                  </Button>
                </Field>
              </div>
            </div>
            <Field>
              <FieldLabel for="display-name">
                {{ $t("pages.account.display_name") }}
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
                {{ $t("pages.account.email_address") }}
              </FieldLabel>
              <Input
                id="email-address"
                v-model="email"
                :placeholder="userdata.email"
              />
            </Field>
            <Field>
              <FieldLabel for="user-id">
                {{ $t("pages.account.user_id") }}
              </FieldLabel>
              <FieldDescription>
                {{ $t("pages.account.user_id_description") }}
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
              {{ $t("pages.account.save_button") }}
            </Button>
            <Button
              variant="outline"
              type="button"
              @click="
                displayname = userdata.user_metadata.display_name;
                email = userdata.email;
              "
            >
              {{ $t("pages.account.discard_button") }}
            </Button>
          </Field>
        </FieldSet>
        <FieldSeparator />
        <FieldSet>
          <FieldLegend>{{
            $t("pages.account.password_and_authentication")
          }}</FieldLegend>
          <FieldDescription>
            {{ $t("pages.account.password_and_authentication_description") }}
          </FieldDescription>
          <FieldGroup>
            <Field>
              <Button> {{ $t("pages.account.change_password") }} </Button>
            </Field>
          </FieldGroup>
        </FieldSet>
      </FieldGroup>
    </form>
  </div>
</template>
