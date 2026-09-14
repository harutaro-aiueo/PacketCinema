# Packet Atlas

通信のしくみを、ひとつずつ。日本語の操作できるシーケンス図でSSHとTCPを学ぶ静的Web教材です。

## 起動と検証

Node.js 22.17以上とnpmを使用します。

```sh
npm ci
npm run dev
```

表示されたローカルURLを開きます。初期状態は停止です。

```sh
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npm run preview
```

`npm run build`はTypeScriptの型検査と本番ビルドを行います。成果物は`dist/`です。実際のSSH接続、パスワード入力、パケット取得は行いません。

## 学習と操作

- SSH：公開鍵認証・パスワード認証を切り替え、接続の準備から単一コマンド`whoami`の実行・終了まで学びます。
- TCP：SYN / SYN + ACK / ACKと、番号・状態の変化を学びます。
- 再生・停止、前後ステップ、先頭へ戻る、速度変更、段階へのジャンプ、概要・詳細表示に対応。
- 操作部以外にフォーカスがある場合、左右キーでステップ移動、Spaceで再生・停止できます。ボタンと選択欄は通常のキーボード操作に対応します。
- OSの動きを減らす設定を初期値に使用し、画面でも切り替えられます。
- `#/ssh?step=12&auth=password&detail=1`のようなURLで表示状態を共有できます。stepは0始まりです。
- SSHからTCP教材へ移り、専用の戻るボタンで元のステップ・認証方式・詳細表示を復元できます。復元時は停止します。復帰情報は同一タブのsessionStorageに保存します。

## 教材を追加する

`src/model.ts`が教材の共通型、`src/lessons.ts`が教材データ、`src/main.tsx`が共通プレーヤーです。

1. `lessons`に一意なIDを持つ`Lesson`を追加します。一覧ページへ自動で追加されます。
2. 2つの登場主体と順序付き`Step`を定義します。段階、説明、正式名称、方向、主要項目、保護状態、出典を指定します。同じ送受信主体を指定するとローカル処理を描画します。
3. 共通処理は`prerequisites`で既存教材を参照し、メッセージを複製しません。前提表示のリンクから移動できます。
4. `npm test`でID・参照・必須情報の整合性を検証し、ブラウザーで内容と操作を確認します。

初期版の共通プレーヤーは2主体間の順序付きフローを対象とします。3主体以上や任意分岐は将来拡張です。

## 仕様と簡略化

矢印はSSHの論理メッセージ単位です。TCPセグメントとの一対一対応を表しません。SSHにはTCPハンドシェイクを重複表示せず、「TCP接続済み」の前提から参照教材へ移動します。

- [RFC 4253](https://www.rfc-editor.org/rfc/rfc4253)：SSHトランスポート、識別文字列、アルゴリズム交渉、NEWKEYS。NEWKEYS自体は旧鍵状態で送信し、送信後から方向別に新鍵へ切り替えます。
- [RFC 8731](https://www.rfc-editor.org/rfc/rfc8731)・[RFC 5656](https://www.rfc-editor.org/rfc/rfc5656)：curve25519-sha256の鍵交換とECDHメッセージ。
- [RFC 8709](https://www.rfc-editor.org/rfc/rfc8709)：Ed25519の鍵・署名表現。サーバーのホスト鍵とユーザー認証鍵は別の鍵です。
- [RFC 4252](https://www.rfc-editor.org/rfc/rfc4252)：公開鍵認証（任意の署名なし問い合わせを含む例）とpassword方式。keyboard-interactiveは扱いません。
- [RFC 4254](https://www.rfc-editor.org/rfc/rfc4254)：sessionチャネル、exec、出力と終了。終了コード、EOFなどの順序は代表例です。
- [RFC 9293 §3.5](https://www.rfc-editor.org/rfc/rfc9293#section-3.5)：TCP接続確立。初期番号は説明用の1000と5000を使用します。

SSHは暗号化方式aes128-ctrとMAC hmac-sha2-256を使う説明例です。推奨設定の一覧ではありません。拡張交渉、認証方式探索、再鍵交換、フロー制御の更新、失敗系、TCP切断は省略しています。初回ホスト鍵確認は信頼できる別経路の指紋と照合するものとして説明し、ユーザー操作のパケットを捏造しません。

## GitHub Pages公開手順

公開はまだ実施していません。リポジトリへアップロードする前に、公開対象の内容とライセンス方針を確認してください。

1. GitHubに公開先リポジトリを用意し、ソースと`package-lock.json`を登録します。`node_modules`や認証情報は含めません。
2. リポジトリの **Settings → Pages → Build and deployment → Source** を **GitHub Actions** にします。
3. **Actions → Build and deploy Pages → Run workflow** を手動実行します。テストとビルドの成功後、`dist/`を公開します。

ワークフローは手動起動のみです。Viteの`base: './'`とハッシュルーティングにより、ユーザーサイトと`/<repository>/`配下のプロジェクトサイトの両方に対応します。ページの再読み込みに404用の書き換えは不要です。デプロイ手順は[GitHub公式ドキュメント](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)を参照してください。
