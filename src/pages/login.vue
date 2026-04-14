<script setup lang="ts">
import SiteHeader from "@/components/SiteHeader.vue";

import type { HTMLAttributes } from "vue";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { IconLoader2, IconX } from "@tabler/icons-vue";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const props = defineProps<{
  class?: HTMLAttributes["class"];
}>();

import { supabase } from "@/lib/supabase";
import { ref } from "vue";
import { useCookies } from "@vueuse/integrations/useCookies";
import { useStorage } from "@vueuse/core";
import { useRouter } from "vue-router";

const router = useRouter();

const cookies = useCookies([
  "sb-access-token",
  "sb-refresh-token",
  "sb-expires-at",
]);

const email = ref("");
const password = ref("");
const loggingIn = ref(false);
const invalidCredentials = ref("");

async function login() {
  loggingIn.value = true;
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.value,
    password: password.value,
  });
  if (error) {
    invalidCredentials.value = error.message;
  } else {
    cookies.set("sb-access-token", data.session.access_token);
    cookies.set("sb-refresh-token", data.session.refresh_token);
    cookies.set("sb-expires-at", data.session.expires_at);

    useStorage("sb-user-data", data.user);

    location.reload();
  }
  loggingIn.value = false;
}

if (cookies.get("sb-access-token")) {
  router.push("/");
}
</script>

<template>
  <SiteHeader :title="$t('pages.login.title')" />
  <div
    class="bg-background flex min-h-[92svh] md:min-h-[80svh] flex-col items-center justify-center gap-6 p-6 md:p-10"
  >
    <div class="w-full max-w-sm">
      <div :class="cn('flex flex-col gap-6', props.class)">
        <form>
          <FieldGroup class="">
            <div
              class="flex flex-col items-center gap-2 text-center transition-all ease-in-out"
            >
              <h1 class="text-xl font-bold">
                {{ $t("pages.login.form_title") }}
              </h1>
              <FieldDescription>
                {{ $t("pages.login.form_description") }}
              </FieldDescription>
            </div>
            <div
              class="flex flex-row justify-between gap-2 text-center text-destructive bg-destructive/10 rounded-md p-4 border border-destructive"
              v-if="invalidCredentials !== ''"
            >
              <span class="my-auto">{{ invalidCredentials }}</span>
              <Button
                variant="ghost"
                size="icon-sm"
                @click="invalidCredentials = ''"
              >
                <IconX />
              </Button>
            </div>
            <Field class="transition-all ease-in-out">
              <FieldLabel for="email">
                {{ $t("pages.login.email_label") }}
              </FieldLabel>
              <Input
                id="email"
                type="email"
                placeholder="example@domain.ext"
                required
                v-model="email"
              />
            </Field>
            <Field>
              <div class="flex items-center">
                <FieldLabel for="password">
                  {{ $t("pages.login.password_label") }}
                </FieldLabel>
                <a
                  href="#"
                  class="ml-auto inline-block text-sm underline-offset-4 hover:underline opacity-50 hover:opacity-70 transition-all duration-200"
                >
                  {{ $t("pages.login.forgot_password") }}
                </a>
              </div>
              <Input
                id="password"
                type="password"
                required
                v-model="password"
              />
            </Field>
            <Field>
              <Button
                type="submit"
                class="disabled:bg-secondary bg-accent text-accent-foreground hover:bg-accent/80"
                :disabled="
                  email.length === 0 || password.length === 0 || loggingIn
                "
                @click.prevent="
                  email.length > 0 && password.length > 0 ? login() : null
                "
              >
                <IconLoader2 v-if="loggingIn" class="size-5 animate-spin" />
                <span v-else>{{ $t("pages.login.login_button") }}</span>
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </div>
    </div>
  </div>
</template>
