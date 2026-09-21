import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "../../src/app/App";
import { createCatalog } from "../../src/app/catalog";
import { example } from "./example";
import "../../src/styles/index.css";
const additional = new URLSearchParams(location.search).has("many")
  ? Array.from({ length: 60 }, (_, index) => ({
      protocol: {
        ...example,
        id: "demo-" + (index + 1),
        title: "教材 " + (index + 1),
        description: "目的" + (index + 1) + "を学ぶ教材",
      },
      publishedScenarioIds: ["roundtrip"],
    }))
  : [];
const catalog = createCatalog([
  ...additional,
  { protocol: example, publishedScenarioIds: ["roundtrip", "alternate"] },
]);
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App catalog={catalog} defaultProtocolId="example" />
  </React.StrictMode>,
);
