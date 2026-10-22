import type { Scenario } from "../../../domain/lesson";

const query = "https://www.rfc-editor.org/rfc/rfc1035.html#section-4.1.1";
const negative = "https://www.rfc-editor.org/rfc/rfc2308.html#section-5";
const cached = "https://www.rfc-editor.org/rfc/rfc2308.html#section-6";

export const negativeCache: Scenario = {
  id: "negative-cache",
  title: "DNSの名前エラー",
  badge: "DNS / NXDOMAIN",
  sceneLabel: "端末 ↔ 再帰リゾルバー",
  nodes: [
    { id: "client", label: "端末", caption: "名前を調べる", image: "./pixels/client.svg" },
    { id: "resolver", label: "再帰リゾルバー", caption: "負のキャッシュを持つ", image: "./pixels/server.svg" },
  ],
  prerequisites: [{ protocol: "dns", label: "DNSの質問と回答" }],
  notes: [
    "端末が存在しない missing.example.test. のAレコードを、設定済みの再帰リゾルバーへ尋ねる例です。.test はテスト用の名前です。権威サーバーは以前の問い合わせにNXDOMAINとSOAを返し、リゾルバーはその結果を保存済みとします。上流との通信は描きません。",
    "この例では権威サーバーのSOA TTLとSOA MINIMUMの小さい方を300秒とし、問い合わせ時点で180秒残っているものとします。実際の値はゾーンと経過時間で変わります。アニメーションの長さはTTLの経過時間ではありません。",
    "NXDOMAINは名前自体が存在しないことを示し、名前はあるがAレコードだけないNODATAとは異なります。TTLが0になった負の回答は再利用できません。CNAME、DNSSEC、端末側キャッシュ、UDP/TCPの選択、期限切れ後の上流再問い合わせは扱いません。",
  ],
  steps: [
    {
      kind: "message", from: "client", to: "resolver", id: "ask-missing",
      phase: "問い合わせ", title: "存在しない名前を尋ねる",
      wire: "DNS QUERY · ID=0x3002 · RD=1 · missing.example.test. A IN",
      displayWire: "DNS QUERY · A ?",
      description: "端末は再帰リゾルバーへAレコードを尋ねます。RD=1で再帰処理を求めますが、今回はリゾルバーに以前の問い合わせ結果が残っています。",
      fields: ["QR=0 / ID=0x3002", "RD=1", "QNAME=missing.example.test.", "QTYPE=A / QCLASS=IN"],
      protection: "この例ではDNSメッセージの暗号化・署名を扱いません。", source: query,
    },
    {
      kind: "local", node: "resolver", id: "find-negative",
      phase: "リゾルバー", title: "存在しない結果をキャッシュで見つける",
      wire: "missing.example.test. / IN → NXDOMAIN · 残り180秒",
      description: "リゾルバーは同じ名前とクラスについて、SOAを伴うNXDOMAINを負のキャッシュで見つけます。TTLが残っているため、今回の質問では上流に問い合わせません。NXDOMAINはAレコードだけでなく名前そのものが存在しない結果です。",
      fields: ["名前：missing.example.test.", "クラス：IN", "結果：NXDOMAIN", "SOAの残りTTL：180秒"],
      protection: "リゾルバー内の検索", source: negative,
      effect: { kind: "stages", label: "負のキャッシュ", stages: [{ text: "missing.example.test. / IN", status: "NXDOMAIN・有効" }] },
    },
    {
      kind: "message", from: "resolver", to: "client", id: "cached-nxdomain",
      phase: "応答", title: "存在しない結果を返す",
      wire: "DNS RESPONSE · ID=0x3002 · RCODE=NXDOMAIN · SOA TTL=180",
      displayWire: "DNS RESPONSE · NXDOMAIN",
      description: "リゾルバーは質問と同じIDでNXDOMAINを返します。保存したSOAをAuthority欄に含め、TTLを残り180秒に減らします。AA=0は、この応答を権威サーバー自身が返したわけではないことを示します。",
      fields: ["QR=1 / ID=0x3002 / RCODE=3（NXDOMAIN）", "RD=1 / RA=1 / AA=0", "Answer：空", "Authority：example.test. SOA / TTL=180秒"],
      protection: "この例ではDNSメッセージの暗号化・署名を扱いません。", source: cached,
    },
    {
      kind: "local", node: "client", id: "no-address",
      phase: "完了", title: "アドレスは得られない",
      wire: "missing.example.test. → NXDOMAIN",
      description: "端末は質問とIDに合う応答のRCODEを読み、名前が存在しないと分かります。Aレコードは得られません。この例は名前解決の結果までを示し、アプリのエラー表示は扱いません。",
      fields: ["ID=0x3002", "RCODE=3（NXDOMAIN）", "Aレコード：なし"],
      protection: "端末内の確認", source: query,
      effect: { kind: "result", label: "名前解決の結果", prompt: "missing.example.test. → ", text: "NXDOMAIN", pending: "応答を確認中", complete: "名前が存在しない" },
    },
  ],
};
