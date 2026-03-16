import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

// GitHub Actionsから渡される環境変数（URLと鍵）を使ってSupabaseに接続
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

test('サイトを開いて結果をSupabaseに保存する', async ({ page }) => {
  // GitHub Actionsから対象URLが渡される想定（なければYahooを開く）
  const targetUrl = process.env.TARGET_URL || 'https://yahoo.co.jp';
  let testStatus = 'success';

  console.log(`テスト開始: ${targetUrl}`);

  try {
    // 1. 指定されたURLにアクセス
    await page.goto(targetUrl);

    
    // 今回はシンプルに「ページが開けたら成功」とします

  } catch (error) {
    console.error('テスト失敗:', error);
    testStatus = 'failure'; // エラーが起きたらステータスを失敗にする
  } finally {
    // 2. テスト終了後、必ずSupabaseに結果を書き込む
    console.log(`Supabaseへ保存中... ステータス: ${testStatus}`);
    
    const { data, error } = await supabase
      .from('test_result')
      .insert([
        {
          url: targetUrl,
          status: testStatus,
          screenshot: 'no_image_yet' 
        }
      ]);

    if (error) {
      console.error('Supabase保存エラー:', error);
    } else {
      console.log('✅ Supabaseへの保存が完了しました！');
    }
  }
});