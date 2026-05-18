import { test, expect } from '@playwright/test';
import { Geolonia } from '../src/embed';
import { TEST_URL, waitForMapLoad } from './helper';

declare global {
  interface Window {
    geolonia: Geolonia,
    maplibregl?: Geolonia,
    mapboxgl?: Geolonia,
  }
}

test.describe('1. 基本的な地図表示', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${TEST_URL}/basic.html`);
    await waitForMapLoad(page);
  });

  test('1.1 ページ読み込み時に地図が表示されること', async ({ page }) => {
    await page.goto(`${TEST_URL}/basic.html`);
    await waitForMapLoad(page);
    const mapContainer = page.locator('.geolonia');
    await expect(mapContainer).toBeVisible();
    const canvas = page.locator('.geolonia canvas');
    await expect(canvas).toBeVisible();
  });

  test('1.2 デフォルトで原点に地図が表示されること', async ({ page }) => {
    await page.goto(`${TEST_URL}/basic.html`);
    await waitForMapLoad(page);
    const center = await page.evaluate(() => {
      const map = new window.geolonia.Map('map');
      return map.getCenter();
    });
    // 日本のおおよその中心座標
    expect(center.lat).toBeCloseTo(0.0, 0);
    expect(center.lng).toBeCloseTo(0.0, 0);
  });

  test('1.3 コンソールエラーが発生していないこと', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // タイル取得失敗などブラウザレベルのネットワークエラーは除外し、
        // アプリコードが出すエラーのみチェックする
        if (!text.startsWith('Failed to load resource')) {
          consoleErrors.push(text);
        }
      }
    });
    await page.goto(`${TEST_URL}/basic.html`);
    await waitForMapLoad(page);
    expect(consoleErrors).toHaveLength(0);
  });

  test('1.4 アトリビューションが表示されていること', async ({ page }, testInfo) => {
    // CI とローカルの両方でレスポンスを観測できるようにしておく。
    // 失敗時のみ artifact に添付する。
    const networkLog: { url: string; status: number }[] = [];
    page.on('response', (resp) => {
      const url = resp.url();
      if (/cdn\.geolonia\.com|tiles\.geolonia\.com|api\.geolonia\.com|tileserver/.test(url)) {
        networkLog.push({ url, status: resp.status() });
      }
    });

    await page.goto(`${TEST_URL}/basic.html`);
    await waitForMapLoad(page);

    // attribution は style/tileJSON が両方ロードされて初めて埋まる。
    // waitForMapLoad は canvas の出現しか保証しないので、
    // 実際に attribution が反映されるまで一定時間待つ。
    const readAttribution = () => {
      const containers = document.querySelectorAll(
        '.geolonia .maplibregl-control-container .maplibregl-ctrl-bottom-right > div',
      );
      for (const container of containers) {
        const shadow = (container as HTMLElement).shadowRoot;
        if (shadow) {
          const inner = shadow.querySelector('.maplibregl-ctrl-attrib-inner');
          if (inner) {
            return inner.innerHTML;
          }
        }
      }
      return null;
    };

    let attributionText: string | null = null;
    try {
      await page.waitForFunction(
        () => {
          const containers = document.querySelectorAll(
            '.geolonia .maplibregl-control-container .maplibregl-ctrl-bottom-right > div',
          );
          for (const container of containers) {
            const shadow = (container as HTMLElement).shadowRoot;
            if (shadow) {
              const inner = shadow.querySelector('.maplibregl-ctrl-attrib-inner');
              if (inner && inner.innerHTML.trim() !== '') return true;
            }
          }
          return false;
        },
        undefined,
        { timeout: 10_000 },
      );
      attributionText = await page.evaluate(readAttribution);
    } catch {
      // タイムアウト時は失敗扱いだが、診断情報を残してから assert に進む。
      attributionText = await page.evaluate(readAttribution);
    }

    // 失敗時に CI の artifact から原因を追えるよう、何があっても画面と
    // 関連ネットワーク状況を保存しておく。
    if (!attributionText) {
      await testInfo.attach('network-log.json', {
        body: JSON.stringify(networkLog, null, 2),
        contentType: 'application/json',
      });
      await page.screenshot({
        path: testInfo.outputPath('attribution-empty.png'),
        fullPage: true,
      });
    }

    expect(attributionText).not.toBeNull();
    expect(attributionText).not.toBe('');
  });
});

