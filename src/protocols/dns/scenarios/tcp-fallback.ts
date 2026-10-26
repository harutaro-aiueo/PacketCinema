import type { Scenario, Step } from "../../../domain/lesson";
import { createConnection } from "../../tcp";

const header = "https://www.rfc-editor.org/rfc/rfc1035.html#section-4.1.1";
const fallback = "https://www.rfc-editor.org/rfc/rfc7766.html#section-4";
const transport = "https://www.rfc-editor.org/rfc/rfc7766.html#section-5";
const framing = "https://www.rfc-editor.org/rfc/rfc1035.html#section-4.2.2";
const connected = { client: "ESTABLISHED", resolver: "ESTABLISHED" };

const steps: Step[] = [
  {
    kind: "message", from: "client", to: "resolver", id: "udp-query",
    phase: "UDPで質問", title: "まずUDPでTXTを尋ねる",
    wire: "UDP/53 · DNS QUERY · ID=0x3003 · RD=1 · large.example.test. TXT IN",
    displayWire: "UDP · DNS QUERY",
    description: "端末は設定済みの再帰リゾルバーへTXTレコードを尋ねます。この例ではEDNSを使わず、UDP応答の上限は512バイトです。",
    fields: ["UDP / 宛先ポート53", "QR=0 / ID=0x3003 / RD=1", "QNAME=large.example.test.", "QTYPE=TXT / QCLASS=IN"],
    protection: "この例ではDNSの暗号化を扱いません。", source: fallback,
  },
  {
    kind: "message", from: "resolver", to: "client", id: "truncated",
    phase: "切り詰め", title: "応答が収まらずTC=1を返す",
    wire: "UDP/53 · DNS RESPONSE · ID=0x3003 · TC=1",
    displayWire: "UDP · TC=1",
    description: "リゾルバーは完全な回答がUDPの上限に収まらないため、応答を切り詰めてTC=1を立てます。端末はこの不完全な回答を最終結果として使いません。",
    fields: ["QR=1 / ID=0x3003", "TC=1：切り詰め", "完全なTXT回答：まだ得られない"],
    protection: "この例ではDNSの暗号化を扱いません。", source: header,
  },
  {
    kind: "local", node: "client", id: "choose-tcp",
    phase: "切り替え", title: "TCPで問い合わせ直す",
    wire: "TC=1 → TCP/53",
    description: "端末はTC=1を見て、同じ質問をTCPでやり直します。DNSは最初からTCPを選ぶこともできますが、この例ではUDPから切り替えます。",
    fields: ["UDP応答：不完全", "次の通信：TCP / 宛先ポート53"],
    protection: "端末内の判断", source: transport,
    effect: { kind: "stages", label: "問い合わせ方法", stages: [{ text: "TC=1", status: "TCPへ切り替え" }] },
  },
  ...createConnection({ nodes: { client: "client", server: "resolver" }, phase: "TCP接続", idPrefix: "tcp-" }),
  {
    kind: "message", from: "client", to: "resolver", id: "tcp-query",
    phase: "TCPで再質問", title: "同じ名前と種別をTCPで尋ねる",
    wire: "TCP/53 · 2-octet length + DNS QUERY · ID=0x3004 · large.example.test. TXT IN",
    displayWire: "TCP · DNS QUERY",
    description: "端末は確立したTCP接続で同じ名前とTXT種別を尋ねます。DNSメッセージの前に2バイトの長さを付け、応答を対応付けるIDはこの例では新しい値にします。",
    fields: ["TCP / 宛先ポート53", "長さ：2バイトの接頭部", "QR=0 / ID=0x3004 / RD=1", "QNAME=large.example.test. / QTYPE=TXT"],
    protection: "TCPだけでは暗号化されません。", source: framing, states: connected,
  },
  {
    kind: "message", from: "resolver", to: "client", id: "tcp-answer",
    phase: "完全な応答", title: "TCPでTXTの回答を返す",
    wire: "TCP/53 · 2-octet length + DNS RESPONSE · ID=0x3004 · TC=0 · TXT RR set",
    displayWire: "TCP · 完全な回答",
    description: "リゾルバーは同じTCP接続で、質問IDに対応する完全なTXT回答を返します。長さの接頭部により、TCPのバイト列からDNSメッセージの境界を読み取れます。",
    fields: ["QR=1 / ID=0x3004 / TC=0", "同じTCP接続で返信", "Answer：TXTレコード群", "長さ：2バイトの接頭部"],
    protection: "TCPだけでは暗号化されません。", source: framing, states: connected,
  },
  {
    kind: "local", node: "client", id: "use-complete-answer",
    phase: "完了", title: "完全なTXT回答を読み取る",
    wire: "large.example.test. → TXT RR set",
    description: "端末はTCP上の応答IDと質問を照合し、完全なTXTレコード群を読み取ります。この例は結果の取得までを示し、アプリでの利用は扱いません。",
    fields: ["ID=0x3004", "TC=0", "完全なTXT回答を取得"],
    protection: "端末内の処理", source: header, states: connected,
    effect: { kind: "result", label: "名前解決の結果", prompt: "large.example.test. → ", text: "TXT回答", pending: "応答を確認中", complete: "完全な回答" },
  },
];

export const tcpFallback: Scenario = {
  id: "tcp-fallback", title: "DNS：UDPからTCPへ", badge: "DNS / TCP",
  sceneLabel: "端末 ↔ 再帰リゾルバー",
  nodes: [
    { id: "client", label: "端末", caption: "問い合わせ元", image: "./pixels/client.svg" },
    { id: "resolver", label: "再帰リゾルバー", caption: "回答を持つ", image: "./pixels/server.svg" },
  ],
  prerequisites: [{ protocol: "dns", label: "DNSの質問と回答" }, { protocol: "tcp", label: "TCPの接続確立" }, { protocol: "udp", label: "UDPの基本" }],
  notes: [
    "端末が再帰リゾルバーにTXTを尋ねる例です。リゾルバーは完全な架空の回答を用意済みとし、上流サーバーとの通信は省略します。large.example.test. は教材用の名前で、実在する結果ではありません。",
    "EDNSを使わず、UDPの512バイト上限に回答が収まらない場合を示します。EDNSが使える場合は512バイトより大きいUDP応答もあり、DNSは最初からTCPを選ぶこともできます。TCPのDNSメッセージには2バイトの長さが付きます。",
    "TCP接続の番号1000/5000は説明用です。TXTの具体的な内容、TCPの分割・再送・終了、DNSSEC、暗号化、キャッシュ、上流での回答取得は扱いません。アニメーションは実測時間を示しません。",
  ],
  steps,
};
