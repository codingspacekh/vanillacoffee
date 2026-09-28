import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
    testDir: "./tests/integration",
    use: {
        baseURL: "http://localhost:3000",
    },
    projects: [
        { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    ],
    webServer: [
        {
            command: "node tests/server.js",
            url: "http://localhost:3000",
            reuseExistingServer: !process.env.CI,
        },
        {
            // A host without SPA fallback, for tests/integration/static-host.spec.js
            command: "node tests/server.js",
            env: { PORT: "3001", SPA_FALLBACK: "false" },
            url: "http://localhost:3001",
            reuseExistingServer: !process.env.CI,
        },
    ],
});
