import { defineConfig, devices } from "@playwright/test";

/* 배포 전 기본 점검: 프로덕션 빌드를 띄워 주요 페이지가 오류 없이 뜨는지 본다.
   로컬: npm run build && npm run test:smoke   (CI는 .github/workflows/ci.yml) */
const PORT = Number(process.env.PORT ?? 3100);

export default defineConfig({
  testDir: "tests",
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: { baseURL: `http://127.0.0.1:${PORT}` },
  webServer: {
    command: `npx next start -p ${PORT}`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
});
