import { Page } from '@playwright/test';
// テスト用の設定
export const TEST_URL = 'http://localhost:3000/e2e';
export const LOAD_TIMEOUT = 15000;

// ヘルパー関数
export async function waitForMapLoad(page: Page, selector = '.geolonia') {
  // コンソールエラーを出力（タイムアウト時のデバッグ用）
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.log(`[Browser Error] ${msg.text()}`);
    }
  });
  page.on('pageerror', (err) => {
    console.log(`[Page Error] ${err.message}`);
  });
  page.on('requestfailed', (req) => {
    console.log(`[Request Failed] ${req.url()} - ${req.failure()?.errorText}`);
  });

  // 地図コンテナの存在を確認
  await page.waitForSelector(selector);
  // MapLibre の canvas が表示されるまで待機
  await page.waitForSelector(`${selector} canvas`, { timeout: LOAD_TIMEOUT });
}
