import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    const registrations = await navigator.serviceWorker.getRegistrations();

    await Promise.all(
      registrations.map((registration) => {
        const url =
          registration.active?.scriptURL ||
          registration.installing?.scriptURL ||
          registration.waiting?.scriptURL ||
          "";

        if (!url.endsWith("/sw.js")) {
          return registration.unregister();
        }

        return Promise.resolve();
      })
    );

    navigator.serviceWorker.register("/sw.js");
  });
}
