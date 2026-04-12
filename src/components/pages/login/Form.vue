<script setup lang="ts">
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
  <div :class="cn('flex flex-col gap-6', props.class)">
    <form>
      <FieldGroup class="">
        <div
          class="flex flex-col items-center gap-2 text-center transition-all ease-in-out"
        >
          <h1 class="text-xl font-bold">Log in to your account</h1>
          <FieldDescription>
            Enter your email below to log in to your account
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
          <FieldLabel for="email"> Email Address </FieldLabel>
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
            <FieldLabel for="password"> Password </FieldLabel>
            <a
              href="#"
              class="ml-auto inline-block text-sm underline-offset-4 hover:underline opacity-50 hover:opacity-70 transition-all duration-200"
            >
              Forgot your password?
            </a>
          </div>
          <Input id="password" type="password" required v-model="password" />
        </Field>
        <Field>
          <Button
            type="submit"
            class="disabled:bg-secondary bg-accent text-accent-foreground hover:bg-accent/80"
            :disabled="email.length === 0 || password.length === 0 || loggingIn"
            @click.prevent="
              email.length > 0 && password.length > 0 ? login() : null
            "
          >
            <IconLoader2 v-if="loggingIn" class="size-5 animate-spin" />
            <span v-else>Log In</span>
          </Button>
        </Field>
      </FieldGroup>
    </form>
    <FieldDescription class="px-6 text-center">
      By clicking continue, you agree to our
      <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
    </FieldDescription>
  </div>
</template>
