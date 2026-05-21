import { createRouter, createWebHistory } from "vue-router";
import { routes } from "vue-router/auto-routes";

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

if ((import.meta as ImportMeta & { hot?: unknown }).hot) {
}
