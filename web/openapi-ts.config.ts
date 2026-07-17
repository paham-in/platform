import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  input: "./swagger.json",
  output: "./src/lib/api",
  client: "@hey-api/client-fetch",
  plugins: ["@tanstack/react-query"],
});
