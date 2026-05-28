# DebateGPT Japan-Adaptive on Vercel

日本適応型パーソナライズ版の DebateGPT を、Vercel で常時利用するための最小構成です。

## 構成

- `public/index.html`: ブラウザUI
- `api/prompt.js`: 討論ステージごとのプロンプト生成
- `api/generate.js`: OpenAI Responses API 呼び出し

OpenAI APIキーはブラウザに露出させず、Vercel の環境変数 `OPENAI_API_KEY` として保存します。公開URLの乱用を避けるため、`APP_ACCESS_TOKEN` で簡易保護します。

## Vercel環境変数

VercelのProject Settings → Environment Variablesで以下を設定してください。

| Name | Required | Example |
| --- | --- | --- |
| `OPENAI_API_KEY` | yes | `sk-...` |
| `APP_ACCESS_TOKEN` | recommended | 任意の長いランダム文字列 |
| `OPENAI_MODEL` | optional | `gpt-5.2` |

## GitHub + Vercelで公開する手順

1. GitHubで新規リポジトリを作る
2. この `vercel-debategpt` ディレクトリの中身をpushする
3. Vercelで `Add New Project` → GitHubリポジトリをImport
4. Framework Presetは `Other` のままでよい
5. Environment Variablesを設定
6. Deploy

## ローカルで確認する場合

Vercel CLIが必要です。

```bash
npm i -g vercel
cd vercel-debategpt
vercel dev
```

## 注意

- `APP_ACCESS_TOKEN` を設定しない場合、URLを知っている人がAPIを使えてしまいます。
- 実験参加者に使わせる場合は、個人情報や態度データを保存しない設計か、保存する場合の同意文書・倫理審査が必要です。
- 現在のログ保存はブラウザ側のJSONダウンロードのみで、サーバーには保存しません。
