// import { test, chromium, firefox, webkit } from '@playwright/test';
// import { createClient } from '@supabase/supabase-js';

// const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// test('マルチブラウザテスト', async () => {
//   const targetUrl = process.env.TARGET_URL;
//   const browsers = process.env.CHOSEN_BROWSERS.split(',');
//   const takeScreenshot = process.env.TAKE_SCREENSHOT === 'true'; 
  

//   console.log(`テスト開始: ${targetUrl}`);

//   for (const browserType of browsers) {
//     console.log(`${browserType} でテスト開始...`);

//     //ブラウザの起動
//     const browser = await { chromium, firefox, webkit }[browserType].launch();
//     const page = await browser.newPage();
  
//   try {
//     // 1. 指定されたURLにアクセス
//     await page.goto(targetUrl, { waitUntil: 'networkidle' });

//     // 2. スクリーンショットの必要、不必要を確認後、必要であれば、フルページ撮影しBase64形式で取得
//     let screenshotBase64 = null;
//     if (takeScreenshot) {
//       const buffer = await page.screenshot({ fullPage: true });
//       screenshotBase64 = buffer.toString('base64');
//     }
    
// // Supabaseに保存（どのブラウザの結果か分かるように status にブラウザ名を入れるなど工夫）
//       await supabase.from('test_result').insert([{
//         url: targetUrl,
//         status: `${browserType}: success`,
//         screenshot: screenshotBase64
//       }]);
      
//     } catch (e) {
//       console.error(e);
//     } finally {
//       await browser.close();
//     }
//   }
// });

import { test, chromium, firefox, webkit } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

// 環境変数が正しく読み込まれているかチェック
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

test('マルチブラウザテスト', async () => {
  const targetUrl = process.env.TARGET_URL;
  // 空白が含まれていても動くように trim() を追加
  const browsers = (process.env.CHOSEN_BROWSERS || 'chromium').split(',').map(b => b.trim());
  const takeScreenshot = process.env.TAKE_SCREENSHOT === 'true'; 

  console.log(`テスト開始: ${targetUrl}`);

  for (const browserType of browsers) {
    console.log(`--- ${browserType} でのテストを開始 ---`);

    const engine = { chromium, firefox, webkit }[browserType];
    if (!engine) {
      console.error(`エラー: ブラウザタイプ "${browserType}" は無効です。`);
      continue;
    }

    // ブラウザの起動
    const browser = await engine.launch();
    
    // 【重要】Firefoxでのモバイルエラーを避けるため、デフォルトのコンテキスト設定を適用
    // 特定のモバイルデバイス設定を引き継がせないようにします
    const context = await browser.newContext(); 
    const page = await context.newPage();
  
    try {
      // タイムアウトを60秒に延長（重いサイト対策）
      await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 60000 });

      let screenshotBase64 = null;
      if (takeScreenshot) {
        // fullPage (Pが大文字) はOK
        const buffer = await page.screenshot({ fullPage: true });
        screenshotBase64 = buffer.toString('base64');
        console.log(`${browserType}: スクリーンショット撮影完了`);
      }
      
      // Supabaseに保存
      const { error } = await supabase.from('test_result').insert([{
        url: targetUrl,
        status: `${browserType}: success`,
        screenshot: screenshotBase64
      }]);

      if (error) {
        console.error(`${browserType}: Supabase保存エラー:`, error.message);
      } else {
        console.log(`${browserType}: Supabaseへ正常に保存されました`);
      }
      
    } catch (e) {
      console.error(`${browserType} 実行中にエラー発生:`, e.message);
      // 失敗しても履歴を残す
      await supabase.from('test_result').insert([{
        url: targetUrl,
        status: `${browserType}: failed (${e.message.slice(0, 30)})`,
        screenshot: null
      }]);
    } finally {
      await browser.close();
      console.log(`--- ${browserType} のブラウザを終了 ---`);
    }
  }
});