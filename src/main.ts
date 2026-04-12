import { createApp } from "vue";
import App from "./App.vue";
import { router } from "./router";
import { createI18n } from "vue-i18n";

import "./assets/index.css";

const i18n = createI18n({
  locale: "id",
  fallbackLocale: "en",
  messages: {},
});

createApp(App).use(router).use(i18n).mount("#app");
