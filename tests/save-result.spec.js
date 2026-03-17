import { test, chromium, firefox, webkit } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

test('マルチブラウザテスト', async () => {
  const targetUrl = process.env.TARGET_URL;
  const browsers = process.env.CHOSEN_BROWSERS.split(',');
  const takeScreenshot = process.env.TAKE_SCREENSHOT === 'true'; 
  

  console.log(`テスト開始: ${targetUrl}`);

  for (const browserType of browsers) {
    console.log(`${browserType} でテスト開始...`);

    //ブラウザの起動
    const browser = await { chromium, firefox, webkit }[browserType].launch();
    const page = await browser.newPage();
  
  try {
    // 1. 指定されたURLにアクセス
    await page.goto(targetUrl, { waitUntil: 'networkidle' });

    // 2. スクリーンショットの必要、不必要を確認後、必要であれば、フルページ撮影しBase64形式で取得
    let screenshotBase64 = null;
    if (takeScreenshot) {
      const buffer = await page.screenshot({ fullPage: true });
      screenshotBase64 = buffer.toString('base64');
    }
    
// Supabaseに保存（どのブラウザの結果か分かるように status にブラウザ名を入れるなど工夫）
      await supabase.from('test_result').insert([{
        url: targetUrl,
        status: `${browserType}: success`,
        screenshot: screenshotBase64
      }]);
      
    } catch (e) {
      console.error(e);
    } finally {
      await browser.close();
    }
  }
});