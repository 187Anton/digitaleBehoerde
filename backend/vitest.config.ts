import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
    fileParallelism: false,
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      reporter: ["text", "text-summary", "json-summary", "html"],
      reportsDirectory: "coverage",
    },
    env: {
      UPLOAD_DIR: path.resolve(".test-uploads"),
    },
  },
});
