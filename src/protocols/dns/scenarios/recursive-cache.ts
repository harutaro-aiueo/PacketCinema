import type { Scenario } from "../../../domain/lesson";

const message = "https://www.rfc-editor.org/rfc/rfc1035.html#section-4.1.1";
const cache = "https://www.rfc-editor.org/rfc/rfc1034.html#section-5.3.3";
const ttl = "https://www.rfc-editor.org/rfc/rfc1035.html#section-3.2.1";

export const recursiveCache: Scenario = {
  id: "recursive-cache",
  title: "DNSキャッシュ",
  badge: "DNS / キャッシュ",
  sceneLabel: "端末 ↔ 再帰リゾルバー",
  nodes: [
    { id: "client", label: "端末", caption: "名前を調べる", image: "./pixels/client.svg" },
    { id: "resolver", label: "再帰リゾルバー", caption: "キャッシュを持つ", image: "./pixels/server.svg" },
  ],
  prerequisites: [{ protocol: "dns", label: "DNSの質問と回答" }],
  notes: [
    "端末が設定済みの再帰リゾルバーへ質問する例です。リゾルバーは以前の問い合わせで www.example.test. のAレコードを取得済みで、まだ有効なキャッシュを持つとします。キャッシュを作るまでの上流サーバーとの通信は扱いません。",
    "架空の www.example.test. IN A 192.0.2.10 を使います。元のTTLは300秒、今回の問い合わせ時点の残りは240秒という例です。アニメーションの長さはTTLの経過時間を表しません。",
    "キャッシュがない場合の問い合わせ先探索、期限切れ後の再取得、UDP/TCPの選択、DNSSEC、暗号化、端末自身のキャッシュ、失敗応答は省略します。",
  ],
  steps: [
    {
      kind: "message", from: "client", to: "resolver", id: "recursive-query",
      phase: "問い合わせ", title: "再帰リゾルバーへ名前を尋ねる",
      wire: "DNS QUERY · ID=0x3001 · RD=1 · www.example.test. A IN",
      displayWire: "DNS QUERY · A ?",
      description: "端末は、設定済みの再帰リゾルバーへAレコードを尋ねます。RD=1で、答えを得るまでの処理をリゾルバーに求めます。",
      fields: ["QR=0 / ID=0x3001", "RD=1", "QNAME=www.example.test.", "QTYPE=A / QCLASS=IN"],
      protection: "この例ではDNSメッセージの暗号化・署名を扱いません。",
      source: message,
    },
    {
      kind: "local", node: "resolver", id: "cache-hit",
      phase: "リゾルバー", title: "有効な答えをキャッシュで見つける",
      wire: "www.example.test. A → 192.0.2.10 / 残り240秒",
      description: "リゾルバーは同じ名前と種別のAレコードをキャッシュで見つけます。TTLが残っているため、今回は上流サーバーへ問い合わせません。",
      fields: ["名前：www.example.test.", "種別：A", "値：192.0.2.10", "残りTTL：240秒"],
      protection: "リゾルバー内の検索",
      source: cache,
      effect: { kind: "stages", label: "キャッシュの検索", stages: [{ text: "www.example.test. / A", status: "有効な答えあり" }] },
    },
    {
      kind: "message", from: "resolver", to: "client", id: "cached-answer",
      phase: "応答", title: "キャッシュから答えを返す",
      wire: "DNS RESPONSE · ID=0x3001 · RA=1 · AA=0 · A 192.0.2.10 · TTL=240",
      displayWire: "DNS RESPONSE · 192.0.2.10",
      description: "リゾルバーは同じIDで答えを返します。AA=0は、この応答が権威サーバー自身の回答ではないことを示します。TTLには残り時間を入れます。",
      fields: ["QR=1 / ID=0x3001 / RCODE=0", "RD=1 / RA=1 / AA=0", "www.example.test. IN A 192.0.2.10", "TTL=240秒"],
      protection: "この例ではDNSメッセージの暗号化・署名を扱いません。",
      source: message,
    },
    {
      kind: "local", node: "client", id: "use-cached-answer",
      phase: "完了", title: "受け取ったアドレスを使う",
      wire: "www.example.test. → 192.0.2.10",
      description: "端末は質問とIDに合う応答からIPv4アドレスを読み取ります。リゾルバーのキャッシュが有効だったため、上流への問い合わせを待たずに答えが返りました。",
      fields: ["ID=0x3001", "A：192.0.2.10", "TTL：残り240秒"],
      protection: "端末内の処理",
      source: ttl,
      effect: { kind: "result", text: "192.0.2.10", prompt: "www.example.test. → ", pending: "回答を確認中", complete: "Aレコードを取得", label: "名前解決の結果" },
    },
  ],
};
