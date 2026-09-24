# プロトコルを追加する

## 1. 教材モジュールを作る

`src/protocols/<protocol-id>/`を作り、scenarios/にシナリオ、必要ならfragments/に再利用する通信部品を置きます。index.tsからProtocolDefinitionをexportします。小さな教材は不要な細分化をしません。

シナリオには以下を定義します。

- 一意なID、見出し、バッジ、通信図のラベル。
- ID・表示ラベル・説明名・画像を持つノード一覧。通常は2ノード、`topology.kind: "triangle"` を指定すると3ノードを公開できます。
- 前提となるプロトコルIDとラベル、教材の省略事項などのnotes。
- 空でないsteps。各ステップに一意なID、段階、見出し、wire、説明、fields、保護状態、HTTP(S)の出典URLを指定します。

通信はkind: "message"とfrom/to、端末内処理はkind: "local"とnode/effectで表します。同じノード宛てのmessageは使用しません。モデルの定義はsrc/domain/lesson/index.ts、最小例はtests/fixtures/example.tsを参照してください。

出典はRFCに限定されません。displayWireを省略するとwireがそのまま表示されます。プロトコル固有の省略表示や注意書きは教材側で指定します。

## 2. 部品を再利用する

別プロトコルの内部ファイルを直接importせず、公開窓口を使います。TCPの例:

```ts
import { createConnection } from "../tcp";

const steps = createConnection({
  nodes: { client: "browser", server: "origin" },
  phase: "接続の確立",
  idPrefix: "origin-",
});
```

戻り値を組み込み先で加工しても元の部品は変わりません。複数接続を一つのシナリオに含める場合は接頭辞でIDを区別します。配列添字で別教材を参照したり、ステップIDの検索結果に非nullアサーションを付けて部品を取得したりしません。

## 3. 公開する

app/catalog.tsで新しいProtocolDefinitionをimportし、createCatalogの配列に追加します。

```ts
{ protocol: exampleProtocol, publishedScenarioIds: ["normal"] }
```

defaultScenarioIdは必ず公開対象に含めます。公開しないシナリオはprotocol.scenariosに保持し、publishedScenarioIdsへ追加しません。検索付き教材一覧は登録から自動生成されます。

初回公開は既定シナリオの#/protocol-idを使います。追加の公開シナリオは#/protocol-id?scenario=scenario-idでアクセスできます。現在はシナリオ選択UIを提供していません。

## 4. 検証する

- モジュール内のテストでプロトコル固有の順序、フィールド、正常系・失敗系の内容を確認します。
- createCatalogは登録された全シナリオの整合性を検証します。未公開シナリオも検証対象です。
- npm testとnpm run buildを実行します。
- npm run test:e2eで再生・URL・画面配置を確認します。新しい教材についても表示幅、長い説明、各方向、ローカル演出を確認してください。

3ノードの三角形では、`topology.links` に一意なID・from/to・labelを持つ3本のリンクを定義します。各ステップの `linkStates` でリンクIDに `pending`・`forwarding`・`blocked`・`down` を指定し、`states` でノードの状態ラベルを指定できます。途中のURLからも復元できるよう、その場面の状態をすべて記述します。例は `src/protocols/stp/scenarios/convergence.ts` を参照してください。

構成図にノードごとの固定情報を表示する場合は `topology.nodeDetails`、ステップごとに変わる情報は `step.topologyAnnotations.nodeDetails` にノードIDをキーとして指定します。リンク両端のポート役割などは `step.topologyAnnotations.portRoles` にリンクIDをキーとして指定し、`from` と `to` に各端の表示文字列を設定します。不要な場面では省略できます。

それ以外の配置や新しい演出が必要な場合に限り、共通の描画機能を追加します。その際も分岐はプロトコル名ではなく、レイアウトや演出の種類を基準にします。

検索付き一覧にはdescriptionを短い用途説明として表示します。keywordsに日本語の用途や別名を指定すると、プロトコル名を知らなくても探せます。未指定の場合もプロトコル名・ID・公開シナリオの見出しで検索できます。
