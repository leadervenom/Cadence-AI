import { createApp } from "vue";
import App from "./App.vue";
import "./style.css";

const app = createApp(App);

// Without this, an uncaught render error in any one component (e.g. malformed
// event data) can break the whole reactive tree in the same update flush,
// including TopBar's logout/back buttons, with no way to recover but a reload.
app.config.errorHandler = (err, instance, info) => {
  console.error("Unhandled Vue error:", err, info);
};

app.mount("#app");
