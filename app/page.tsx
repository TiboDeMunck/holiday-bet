"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type Destination = {
  id: string;
  name: string;
  total_stake: number;
};

type Bet = {
  id: string;
  destination_id: string;
  amount: number;
  destination: { name: string } | null;
};

type Game = {
  status: "open" | "closed" | "revealed";
  winning_destination_id: string | null;
  winning_destination_name: string | null;
};

function getParticipantId() {
  let id = window.localStorage.getItem("participant_id");
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem("participant_id", id);
  }
  return id;
}

export default function Home() {
  const [participantId, setParticipantId] = useState("");
  const [name, setName] = useState("");
  const [savedName, setSavedName] = useState("");
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [bets, setBets] = useState<Bet[]>([]);
  const [game, setGame] = useState<Game | null>(null);
  const [newDestination, setNewDestination] = useState("");
  const [selectedDestination, setSelectedDestination] = useState("");
  const [amount, setAmount] = useState(1);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (id: string) => {
    const response = await fetch(`/api/state?participantId=${encodeURIComponent(id)}`, {
      cache: "no-store",
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? "Kon gegevens niet laden.");

    setDestinations(data.destinations);
    setBets(data.bets);
    setGame(data.game);
    setSavedName(data.participant?.name ?? "");
    setName(data.participant?.name ?? "");
  }, []);

  useEffect(() => {
    const id = getParticipantId();
    setParticipantId(id);
    load(id).catch((error) => setMessage(error.message));
  }, [load]);

  const totalStake = useMemo(
    () => bets.reduce((sum, bet) => sum + bet.amount, 0),
    [bets]
  );

  const winningStake = useMemo(() => {
    if (!game?.winning_destination_id) return 0;
    return bets
      .filter((bet) => bet.destination_id === game.winning_destination_id)
      .reduce((sum, bet) => sum + bet.amount, 0);
  }, [bets, game]);

  async function post(url: string, body: object) {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Er ging iets mis.");
      await load(participantId);
      setMessage("Opgeslagen.");
      return data;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Er ging iets mis.");
    } finally {
      setBusy(false);
    }
  }

  async function saveName(event: FormEvent) {
    event.preventDefault();
    await post("/api/participant", { participantId, name });
  }

  async function addDestination(event: FormEvent) {
    event.preventDefault();
    const data = await post("/api/destinations", {
      participantId,
      name: newDestination,
    });
    if (data?.destination?.id) {
      setSelectedDestination(data.destination.id);
      setNewDestination("");
    }
  }

  async function placeBet(event: FormEvent) {
    event.preventDefault();
    await post("/api/bets", {
      participantId,
      destinationId: selectedDestination,
      amount,
    });
  }

  if (!participantId || !game) {
    return <main className="shell"><p>Laden…</p></main>;
  }

  if (!savedName) {
    return (
      <main className="shell">
        <section className="card">
          <p className="eyebrow">Vakantiepoll</p>
          <h1>Waar gaan we op reis?</h1>
          <p>Vul je naam in om bestemmingen toe te voegen en in te zetten.</p>
          <form onSubmit={saveName} className="stack">
            <label>
              Jouw naam
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                minLength={2}
                maxLength={40}
                required
              />
            </label>
            <button disabled={busy}>Deelnemen</button>
          </form>
          {message && <p className="message">{message}</p>}
        </section>
      </main>
    );
  }

  return (
    <main className="shell">
      <header className="hero">
        <p className="eyebrow">Vakantiepoll</p>
        <h1>Waar gaan we op reis?</h1>
        <p>Welkom, {savedName}. Je drinkt enkel de inzet op je foute bestemmingen.</p>
      </header>

      {game.status === "revealed" && (
        <section className="card result">
          <p className="eyebrow">Onthuld</p>
          <h2>{game.winning_destination_name}</h2>
          <div className="resultGrid">
            <div>
              <span>Zelf drinken</span>
              <strong>{totalStake - winningStake} adjes</strong>
            </div>
            <div>
              <span>Mag uitdelen</span>
              <strong>{winningStake} adjes</strong>
            </div>
          </div>
        </section>
      )}

      <section className="grid">
        <div className="card">
          <h2>Bestemmingen</h2>
          <div className="destinations">
            {destinations.length === 0 && <p>Nog geen bestemmingen.</p>}
            {destinations.map((destination) => (
              <button
                type="button"
                className={
                  selectedDestination === destination.id
                    ? "destination selected"
                    : "destination"
                }
                key={destination.id}
                onClick={() => setSelectedDestination(destination.id)}
                disabled={game.status !== "open"}
              >
                <span>{destination.name}</span>
                <small>{destination.total_stake} adjes ingezet</small>
              </button>
            ))}
          </div>

          {game.status === "open" && (
            <form onSubmit={addDestination} className="inlineForm">
              <input
                value={newDestination}
                onChange={(event) => setNewDestination(event.target.value)}
                placeholder="Nieuwe bestemming"
                minLength={2}
                maxLength={60}
                required
              />
              <button disabled={busy}>Toevoegen</button>
            </form>
          )}
        </div>

        <div className="card">
          <h2>Mijn inzetten</h2>
          {bets.length === 0 ? (
            <p>Je hebt nog niets ingezet.</p>
          ) : (
            <div className="betList">
              {bets.map((bet) => (
                <div className="betRow" key={bet.id}>
                  <span>{bet.destination?.name ?? "Onbekend"}</span>
                  <strong>{bet.amount}</strong>
                </div>
              ))}
              <div className="betRow total">
                <span>Totaal</span>
                <strong>{totalStake}</strong>
              </div>
            </div>
          )}

          {game.status === "open" && (
            <form onSubmit={placeBet} className="stack">
              <label>
                Aantal adjes
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={amount}
                  onChange={(event) => setAmount(Number(event.target.value))}
                  required
                />
              </label>
              <button disabled={busy || !selectedDestination}>
                Inzetten op geselecteerde bestemming
              </button>
              <small>
                Nogmaals inzetten op dezelfde bestemming vervangt je vorige inzet.
              </small>
            </form>
          )}

          {game.status === "closed" && (
            <p className="notice">De inzetten zijn afgesloten.</p>
          )}
        </div>
      </section>

      {message && <p className="message floating">{message}</p>}
    </main>
  );
}
