import type { ProtocolDefinition, Scenario } from "../../domain/lesson";

const message = "https://www.rfc-editor.org/rfc/rfc1035.html#section-4.1";
const server = "https://www.rfc-editor.org/rfc/rfc1034.html#section-4.3.2";

const scenario: Scenario = {
  id: "authoritative-a",
  title: "DNS：名前解決",
  badge: "DNS / A",
  sceneLabel: "端末 ↔ .test の権威サーバー",
  nodes: [
    {
      id: "client",
      label: "端末",
      caption: "問い合わせ元",
      image: "./pixels/client.svg",
    },
    {
      id: "authority",
      label: "権威サーバー",
      caption: "example.test. ゾーン",
      image: "./pixels/server.svg",
    },
  ],
  prerequisites: [],
  notes: [
    "この例では、端末が example.test. の権威サーバーを事前に知っており、非再帰で直接問い合わせます。普段の端末から再帰リゾルバーへの問い合わせや、ルート・TLDからの探索は扱いません。",
    "example.test. ゾーンに www.example.test. IN A 192.0.2.10（TTL 300秒）を設定した架空の例です。.test はテスト用の名前、192.0.2.0/24 は文書用のアドレスです。実在する名前解決結果ではありません。",
    "1回の成功応答だけを示します。UDP/TCPの選択、再送、委任、CNAME、複数回答、DNSSEC、暗号化、キャッシュ、失敗応答は省略します。アニメーションの時間は通信の実測値ではありません。",
  ],
  steps: [
    {
      kind: "local",
      node: "client",
      id: "choose-question",
      phase: "問い合わせ",
      title: "名前とレコード種別を決める",
      wire: "www.example.test. / A / IN",
      description:
        "端末は、調べたい名前を QNAME、IPv4アドレスのレコード種別を QTYPE=A、インターネットのクラスを QCLASS=IN として質問を作ります。",
      fields: ["QNAME=www.example.test.", "QTYPE=A", "QCLASS=IN"],
      protection: "端末内の準備",
      source: "https://www.rfc-editor.org/rfc/rfc1035.html#section-4.1.2",
      effect: {
        kind: "stages",
        label: "質問の準備",
        stages: [{ text: "www.example.test. / A / IN", status: "質問を作成" }],
      },
    },
    {
      kind: "message",
      from: "client",
      to: "authority",
      id: "query",
      phase: "問い合わせ",
      title: "権威サーバーへ質問する",
      wire: "DNS QUERY · ID=0x1234 · RD=0 · www.example.test. A IN",
      displayWire: "DNS QUERY · A ?",
      description:
        "端末から権威サーバーへ標準問い合わせを送ります。RD=0 なので再帰処理は求めません。IDは、この応答を問い合わせと対応付ける値です。",
      fields: ["QR=0 / OPCODE=0", "ID=0x1234", "RD=0", "QDCOUNT=1"],
      protection: "この例ではDNSメッセージの暗号化・署名を扱いません。",
      source: "https://www.rfc-editor.org/rfc/rfc1035.html#section-4.1.1",
    },
    {
      kind: "local",
      node: "authority",
      id: "lookup-zone",
      phase: "権威サーバー",
      title: "ゾーンのAレコードを調べる",
      wire: "www.example.test. IN A 192.0.2.10",
      description:
        "権威サーバーは、自分が管理する example.test. ゾーンから一致するAレコードを見つけます。このレコードは教材用に設定した値です。",
      fields: ["名前：www.example.test.", "A：192.0.2.10", "TTL：300秒"],
      protection: "サーバー内の検索",
      source: server,
      effect: {
        kind: "stages",
        label: "ゾーン内の検索",
        stages: [
          { text: "www.example.test. の A", status: "該当レコードあり" },
        ],
      },
    },
    {
      kind: "message",
      from: "authority",
      to: "client",
      id: "answer",
      phase: "応答",
      title: "権威ある回答を返す",
      wire: "DNS RESPONSE · ID=0x1234 · AA=1 · NOERROR · A 192.0.2.10 · TTL=300",
      displayWire: "DNS RESPONSE · 192.0.2.10",
      description:
        "サーバーは同じIDで応答します。AA=1は権威ある回答、RCODE=0はエラーなしを示します。Answer欄にAレコードとTTLを入れます。",
      fields: [
        "QR=1 / ID=0x1234 / AA=1 / RCODE=0",
        "QDCOUNT=1 / ANCOUNT=1",
        "www.example.test. IN A 192.0.2.10",
        "TTL=300秒",
      ],
      protection: "この例ではDNSメッセージの暗号化・署名を扱いません。",
      source: message,
    },
    {
      kind: "local",
      node: "client",
      id: "use-answer",
      phase: "完了",
      title: "問い合わせ結果を確認する",
      wire: "www.example.test. → 192.0.2.10",
      description:
        "端末は応答のIDと質問を照合し、Answer欄のAレコードからIPv4アドレスを読み取ります。ここでは接続やキャッシュへの保存は示しません。",
      fields: ["ID=0x1234", "Answer：192.0.2.10"],
      protection: "端末内の処理",
      source: message,
      effect: {
        kind: "result",
        text: "192.0.2.10",
        prompt: "www.example.test. → ",
        pending: "回答を確認中",
        complete: "Aレコードを取得",
        label: "名前解決の結果",
      },
    },
  ],
};

export const dns: ProtocolDefinition = {
  id: "dns",
  title: "DNS",
  description: "名前からIPv4アドレスを調べるDNSの質問と権威ある回答",
  keywords: ["名前解決", "ドメイン名", "Aレコード", "権威サーバー"],
  defaultScenarioId: scenario.id,
  scenarios: [scenario],
};
