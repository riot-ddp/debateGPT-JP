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
| `POSTGRES_URL` | optional | Vercel Storage Postgres/Neon接続文字列 |

Prisma Postgres を使う場合、Vercel側で `DATABASE_URL` が自動作成されることがあります。その場合は同じ接続文字列を `POSTGRES_URL` としても追加してください。

## 履歴保存

`POSTGRES_URL` を設定すると、討論ログをサーバー側に保存し、画面の「履歴読込」から過去の議論を見返せます。

Vercelで使う場合は、Project → Storage → Create Database → Postgres または Prisma Postgres を作成し、このプロジェクトに接続してください。接続すると `POSTGRES_URL` や `DATABASE_URL` などの環境変数が自動で追加されます。

保存される主なデータは、テーマ、モデル、立場、パーソナライズ有無、プロフィール項目、討論前後の同意度、討論ログです。実験参加者のデータとして保存する場合は、事前同意と倫理面の確認が必要です。

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
- `POSTGRES_URL` 未設定時はサーバー保存できず、ブラウザ側JSONダウンロードのみ利用できます。
