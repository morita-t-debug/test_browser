import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

test('サイトを開いて結果をSupabaseに保存する', async ({ page }) => {
  const targetUrl = process.env.TARGET_URL || 'https://yahoo.co.jp';
  let testStatus = 'success';
  let screenshotBase64 = ''; // 画像データをいれる変数

  console.log(`テスト開始: ${targetUrl}`);

  try {
    // 1. 指定されたURLにアクセス
    await page.goto(targetUrl, { waitUntil: 'networkidle' });

    // 2. スクリーンショットを撮影し、Base64形式で取得
    const buffer = await page.screenshot({ fullPage: true });
    screenshotBase64 = buffer.toString('base64');

  } catch (error) {
    console.error('テスト失敗:', error);
    testStatus = 'failure';
  } finally {
    // 3. Supabaseに結果と画像を保存
    console.log(`Supabaseへ保存中... ステータス: ${testStatus}`);
    
    const { data, error } = await supabase
      .from('test_result')
      .insert([
        {
          url: targetUrl,
          status: testStatus,
          screenshot: screenshotBase64 
        }
      ]);

    if (error) {
      console.error('Supabase保存エラー:', error);
    } else {
      console.log('Supabaseへの保存が完了しました！');
    }
  }
});