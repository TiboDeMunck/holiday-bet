"use client";

import { FormEvent, useEffect, useState } from "react";

type Destination = { id: string; name: string; total_stake: number };

export default function AdminPage() {
  const [secret, setSecret] = useState("");
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [winner, setWinner] = useState("");
  const [status, setStatus] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    const response = await fetch("/api/state?participantId=admin", { cache: "no-store" });
    const data = await response.json();
    if (response.ok) {
      setDestinations(data.destinations);
      setStatus(data.game.status);
    }
  }

  useEffect(() => { load(); }, []);

  async function action(event: FormEvent, action: "close" | "reopen" | "reveal") {
    event.preventDefault();
    setMessage("");
    const response = await fetch("/api/admin", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ secret, action, winningDestinationId: winner }),
    });
    const data = await response.json();
    setMessage(response.ok ? "Opgeslagen." : data.error ?? "Er ging iets mis.");
    if (response.ok) await load();
  }

  return (
    <main className="shell">
      <section className="card">
        <p className="eyebrow">Beheer</p>
        <h1>Reispoll beheren</h1>
        <p>Huidige status: <strong>{status}</strong></p>

        <label>
          Beheerderswachtwoord
          <input
            type="password"
            value={secret}
            onChange={(event) => setSecret(event.target.value)}
          />
        </label>

        <div className="adminActions">
          <button onClick={(event) => action(event, "close")}>Inzetten sluiten</button>
          <button className="secondary" onClick={(event) => action(event, "reopen")}>
            Heropenen
          </button>
        </div>

        <form onSubmit={(event) => action(event, "reveal")} className="stack">
          <label>
            Echte bestemming
            <select
              value={winner}
              onChange={(event) => setWinner(event.target.value)}
              required
            >
              <option value="">Kies een bestemming</option>
              {destinations.map((destination) => (
                <option key={destination.id} value={destination.id}>
                  {destination.name}
                </option>
              ))}
            </select>
          </label>
          <button className="danger">Bestemming onthullen</button>
        </form>

        {message && <p className="message">{message}</p>}
      </section>
    </main>
  );
}
