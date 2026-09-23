import type { ProtocolDefinition } from "../domain/lesson";
import "./home.css";

export function Home({ catalog }: { catalog: readonly ProtocolDefinition[] }) {
  return (
    <main className="home">
      <h1>PacketCinema</h1>
      <nav className="home-lessons" aria-label="教材一覧">
        {catalog.map((protocol) => (
          <a className="home-card" href={"#/" + protocol.id} key={protocol.id}>
            {protocol.title}
          </a>
        ))}
      </nav>
    </main>
  );
}
