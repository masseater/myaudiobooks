# myaudiobooks

## セットアップ

```sh
vp install
vp exec --filter web alchemy profile edit --add Cloudflare
vp run verify
```

Cloudflare の認証情報は環境変数ではなく Alchemy のプロファイル（`~/.alchemy`）で管理する。
デプロイと `.mcp.json` の Cloudflare MCP は、どちらもこのプロファイルの認証情報を使う。

## GitHub の設定

リポジトリの Actions secrets に次を登録する。

| 名前                      | 用途                                       |
| ------------------------- | ------------------------------------------ |
| `CLAUDE_CODE_OAUTH_TOKEN` | verify 失敗時に Claude Code が自動修正する |

Settings → Actions → General で「Allow GitHub Actions to create and approve pull requests」を有効にする。
release-pleaseと自動修正がPRを作るためである。

## 起動とデプロイ

```sh
cd apps/web
vp run dev
vp run deploy
```
