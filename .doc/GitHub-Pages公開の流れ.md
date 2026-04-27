# 快晴キープ判定 — GitHub Pages 公開がうまくいくまでの流れ

この資料は、リポジトリ `ToshiHata/kaisei-forecast` を **GitHub Pages でインターネット公開**し、スマホのブラウザからも使えるようにするまでに行った**作業の整理**です。

---

## 1. そもそもの前提

| 項目 | 内容 |
|------|------|
| アプリの実体 | 主に **`index.html`**（HTML・CSS・JavaScript が一体の静的ページ）。気象庁・Open-Meteo・Nominatim などは**ブラウザから直接取得**している。 |
| `server.js` | ローカルで **静的ファイルを配るため**の簡易サーバー。**GitHub Pages 上では実行されない**（Pages は静的ホスティングのみ）。 |
| 公開 URL の形（プロジェクトサイト） | `https://<ユーザー名>.github.io/<リポジトリ名>/` 本リポジトリの例: `https://toshihata.github.io/kaisei-forecast/` |

GitHub に **push しただけ**では、自動的にその URL にサイトは出ません。**「Pages の公開設定」と「実際にビルド／デプロイが成功する仕組み」**が二者択一（または連携）で必要です。

---

## 2. 当初うまくいかなかったときの状態

次のような状態でした。

1. **Settings → Pages** で **「Deploy from a branch」** を選び、`main` / `/(root)` を指定した。  
2. しばらく **「Your GitHub Pages site is currently being built from the `main` branch.」** の表示が続いた。  
3. ブラウザで `https://toshihata.github.io/kaisei-forecast/` を開くと **404**（「There isn't a GitHub Pages site here.」など）。

**意味の整理:** 「branch からの公開」を選んでも、裏側の **pages 用ビルド／デプロイが完了していない**、または **別の要因で公開に至らない**と、上記の「ビルド中のような表示のまま」や **404** が続くことがあります。待つだけでは解消しないケースもあります。

---

## 3. うまくいったときに採用した方法（全体像）

**GitHub Actions 経由で静的サイトをデプロイする**方式に切り替えました。

- リポジトリに **`.github/workflows/static.yml`（名前は可）** を追加する。  
- **Settings → Pages** の **Source** を **`GitHub Actions`** にする。  
- プッシュのたびに Actions が走り、成功すると **GitHub Pages 用の成果物**がデプロイされ、**公開 URL で `index.html` が配信**される。

最初に試していた **「Deploy from a branch」** との違いは、**「どの仕組みが HTML を Pages に載せるか」**です。今回は **Actions がデプロイを担当**する設定に統一した形です。

---

## 4. 必要な作業と内容（手順）

### 4.1 GitHub Actions 用ワークフローの追加

| 作業 | 内容 |
|------|------|
| テンプレートの選択 | **Actions** → **New workflow** → カテゴリ **「Pages」** のうち **「Static HTML」**（*Deploy static files in a repository without a build.*）を選ぶ。 |
| 作成するファイル | `.github/workflows/` 配下の YAML（例: `static.yml`）。中身は GitHub が出す **「Deploy static content to Pages」** の定型に近いもの。 |
| コミット | **`main` ブランチに直接コミット**でよい。メッセージは任意（例: *Add GitHub Actions workflow for static site deployment*）。 |

ワークフローは概ね次の役割を持ちます（表現は一般的な静的デプロイ用の例）。

- `main` への **push** で起動する。  
- **`actions/checkout`** でリポジトリを取得する。  
- **`actions/configure-pages`** などで Pages 用の設定を行う。  
- **`actions/upload-pages-artifact`** でデプロイ対象（リポジトリルートの静的ファイル）をアップロードする。  
- **`actions/deploy-pages`** で GitHub Pages にデプロイする。  
- 権限として **`pages: write`** と **`id-token: write`** などが必要（テンプレートに含まれることが多い）。

### 4.2 Pages の「公開元」を GitHub Actions に合わせる

| 作業 | 内容 |
|------|------|
| 画面 | **Settings** → **Pages**。 |
| **Build and deployment** の **Source** | **`GitHub Actions`** を選ぶ。以前 **「Deploy from a branch」** だった場合は、**ここを切り替える**のが重要。 |

**branch 指定**と **Actions 指定**は、同時に二重で使うというより、**実際にデプロイを担うのはどちらか**のイメージです。今回は **Source = GitHub Actions** に揃えました。

### 4.3 デプロイ成功の確認

| 作業 | 内容 |
|------|------|
| **Actions** タブ | ワークフロー（例: *Deploy static content to Pages*）が **成功（緑）** になっているか確認する。失敗時はログで原因を読む。 |
| **Settings → Pages** | **「Your site is live at https://…」** のような **緑の通知**と **公開 URL** が表示される。 |
| ブラウザ | 表示された **HTTPS の URL** を開き、`index.html` の画面が出るか確認する。 |

### 4.4 スマホから使う

| 作業 | 内容 |
|------|------|
| URL | PC と同じ **公開 URL**（例: `https://toshihata.github.io/kaisei-forecast/`）を、スマホの **Chrome / Safari** などに入力する。 |
| 注意 | **HTTPS** なので、位置情報などブラウザ API の挙動は、多くの環境で問題なく使える想定に近いです。 |

---

## 5. 流れのまとめ（シーケンスのイメージ）

1. コード（`index.html` など）を **`main` に push** する。  
2. **GitHub Actions** が起動し、静的ファイルを **Pages 用アーティファクト**としてまとめ、**デプロイ**する。  
3. **Settings → Pages** の **Source が GitHub Actions** になっているため、そのデプロイ結果が **`https://toshihata.github.io/kaisei-forecast/`** に反映される。  
4. ユーザーは **その URL を PC・スマホのブラウザで開く**。

---

## 6. ローカル開発（参考）

| 用途 | 方法 |
|------|------|
| PC で動作確認 | `node server.js` などで **`http://localhost:8085/`** にアクセス（`server.js` の想定ポートに合わせる）。 |
| 同一 Wi‑Fi のスマホ | サーバが **`0.0.0.0`** で待ち受けていれば、PC の **LAN IP**（例: `http://192.168.x.x:8085/`）で開ける場合がある。 |
| インターネット経由（本番に近い） | 今回のように **GitHub Pages の URL** を使う。 |

---

## 7. この資料の位置づけ

- **事実ベースの手順整理**であり、GitHub の UI 名・表示文言は時期によって多少変わる可能性があります。  
- トラブル時は **Actions の失敗ログ** と **Settings → Pages** の **Source** が **GitHub Actions** かどうかを、まず確認すると切り分けしやすいです。

---

*作成目的: 公開が通ったあと、何をどう設定したかを後から辿れるようにする。*
