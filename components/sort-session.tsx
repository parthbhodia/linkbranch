"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ArchiveOutlined from "@mui/icons-material/ArchiveOutlined";
import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import CheckCircleRounded from "@mui/icons-material/CheckCircleRounded";
import HandshakeOutlined from "@mui/icons-material/HandshakeOutlined";
import LinkedIn from "@mui/icons-material/LinkedIn";
import LocalFireDepartmentOutlined from "@mui/icons-material/LocalFireDepartmentOutlined";
import UndoRounded from "@mui/icons-material/UndoRounded";
import {
  Alert,
  Button,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { VoiceNoteButton } from "@/components/voice-note-button";
import type {
  ConnectionStatus,
  DashboardConnection,
} from "@/components/connections-inbox";
import { linkedInSearchUrl } from "@/lib/linkedin";
import { createClient } from "@/lib/supabase/client";

/**
 * The ritual, as a screen. One person at a time, three choices, done in the
 * time it takes to get a coffee.
 *
 * The inbox list is for looking things up. This is for deciding, which is a
 * different job and wants a different shape -- no scrolling, no scanning, one
 * question at a time.
 */

type Pile = Exclude<ConnectionStatus, "new">;

const piles: Array<{
  id: Pile;
  label: string;
  key: string;
  icon: React.ReactNode;
}> = [
  { id: "meet", label: "Meet 1:1", key: "1", icon: <HandshakeOutlined /> },
  { id: "warm", label: "Keep warm", key: "2", icon: <LocalFireDepartmentOutlined /> },
  { id: "archived", label: "Archive", key: "3", icon: <ArchiveOutlined /> },
];

/**
 * One person. Mounted with `key={person.id}` so the note resets with the card
 * rather than being synchronised by an effect, and so the key handler always
 * closes over the note belonging to whoever is on screen.
 */
function SortCard({
  person,
  onChoose,
  onConnected,
  onUndo,
  canUndo,
}: {
  person: DashboardConnection;
  onChoose: (pile: Pile, note: string) => void;
  onConnected: () => void;
  onUndo: () => void;
  canUndo: boolean;
}) {
  const [note, setNote] = useState(person.note);

  const appendToNote = useCallback((text: string) => {
    setNote((current) => (current ? `${current} ${text}` : text).slice(0, 2000));
  }, []);

  // 1 / 2 / 3 to sort, u to undo. Ignored while a field has focus, or typing
  // "1" into a note would fling the card away.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA)$/.test(target.tagName)) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      const pile = piles.find((option) => option.key === event.key);
      if (pile) {
        event.preventDefault();
        onChoose(pile.id, note);
        return;
      }
      if (event.key.toLowerCase() === "u" && canUndo) {
        event.preventDefault();
        onUndo();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [note, onChoose, onUndo, canUndo]);

  // Horizontal swipe: right sets up a meeting, left archives. Vertical
  // movement is scrolling and must not be hijacked.
  const touchRef = useRef<{ x: number; y: number } | null>(null);

  return (
    <>
      <article
        className="sort__card"
        onTouchStart={(event) => {
          const touch = event.changedTouches[0];
          touchRef.current = { x: touch.clientX, y: touch.clientY };
        }}
        onTouchEnd={(event) => {
          const start = touchRef.current;
          touchRef.current = null;
          if (!start) return;
          const touch = event.changedTouches[0];
          const dx = touch.clientX - start.x;
          const dy = touch.clientY - start.y;
          if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
          onChoose(dx > 0 ? "meet" : "archived", note);
        }}
      >
        {person.event_tag && <span className="sort__event">{person.event_tag}</span>}
        <Typography component="h1" className="sort__name">
          {person.name}
        </Typography>
        {(person.job_title || person.company) && (
          <Typography className="sort__role">
            {[person.job_title, person.company].filter(Boolean).join(" · ")}
          </Typography>
        )}

        <div className="sort__contact">
          {person.email && <a href={`mailto:${person.email}`}>{person.email}</a>}
          {person.phone && <a href={`tel:${person.phone}`}>{person.phone}</a>}
        </div>

        <div className="sort__note">
          <TextField
            label="Notes"
            placeholder="What you talked about, and what happens next."
            value={note}
            onChange={(event) => setNote(event.target.value.slice(0, 2000))}
            fullWidth
            multiline
            minRows={3}
            size="small"
          />
          <VoiceNoteButton onTranscript={appendToNote} label="Speak it" />
        </div>

        <Button
          component="a"
          href={linkedInSearchUrl(person.name, person.company)}
          target="_blank"
          rel="noopener noreferrer"
          startIcon={<LinkedIn />}
          size="small"
          color="inherit"
          className="sort__linkedin"
          onClick={onConnected}
        >
          {person.connected_at ? "Searched on LinkedIn" : "Find on LinkedIn"}
        </Button>
      </article>

      <div className="sort__piles">
        {piles.map((pile) => (
          <Button
            key={pile.id}
            onClick={() => onChoose(pile.id, note)}
            startIcon={pile.icon}
            variant="outlined"
            className={`sort__pile sort__pile--${pile.id}`}
          >
            {pile.label}
            <kbd>{pile.key}</kbd>
          </Button>
        ))}
      </div>
    </>
  );
}

export function SortSession({
  profileId,
  queue,
  eventTag,
}: {
  profileId: string;
  queue: DashboardConnection[];
  eventTag: string | null;
}) {
  const [items, setItems] = useState(queue);
  const [index, setIndex] = useState(0);
  const [history, setHistory] = useState<
    Array<{ id: number; previous: ConnectionStatus; previousNote: string }>
  >([]);
  const [notice, setNotice] = useState<string | null>(null);

  const total = items.length;
  const current = items[index];
  const done = index >= total;

  const tally = useMemo(() => {
    const counts = { meet: 0, warm: 0, archived: 0 };
    for (const item of items.slice(0, index)) {
      if (item.status in counts) counts[item.status as keyof typeof counts] += 1;
    }
    return counts;
  }, [items, index]);

  const persist = useCallback(
    async (id: number, patch: Record<string, unknown>) => {
      const { error } = await createClient()
        .from("connections")
        .update(patch)
        .eq("id", id)
        .eq("profile_id", profileId);
      if (error) setNotice(error.message);
    },
    [profileId],
  );

  // State updaters must stay pure -- React can call them twice in development,
  // which would double-write the row and double-push the undo entry. So the
  // record is read from the closure and the write happens out here.
  const choose = useCallback(
    (pile: Pile, note: string) => {
      const person = items[index];
      if (!person) return;
      const nextNote = note.slice(0, 2000);

      setHistory((h) => [
        ...h,
        { id: person.id, previous: person.status, previousNote: person.note },
      ]);
      setItems((current) =>
        current.map((item, position) =>
          position === index ? { ...item, status: pile, note: nextNote } : item,
        ),
      );
      setIndex((value) => value + 1);

      const patch: Record<string, unknown> = { status: pile };
      if (nextNote !== person.note) patch.note = nextNote;
      void persist(person.id, patch);
    },
    [items, index, persist],
  );

  const undo = useCallback(() => {
    const last = history[history.length - 1];
    if (!last) return;

    setHistory((h) => h.slice(0, -1));
    setItems((current) =>
      current.map((item) =>
        item.id === last.id
          ? { ...item, status: last.previous, note: last.previousNote }
          : item,
      ),
    );
    setIndex((value) => Math.max(0, value - 1));
    void persist(last.id, { status: last.previous, note: last.previousNote });
  }, [history, persist]);

  const markConnected = useCallback(() => {
    const person = items[index];
    if (!person || person.connected_at) return;
    const stamp = new Date().toISOString();
    setItems((list) =>
      list.map((item) =>
        item.id === person.id ? { ...item, connected_at: stamp } : item,
      ),
    );
    void persist(person.id, { connected_at: stamp });
  }, [items, index, persist]);

  if (total === 0) {
    return (
      <main className="sort">
        <div className="sort__done">
          <CheckCircleRounded />
          <Typography variant="h2">Nothing to sort</Typography>
          <Typography color="text.secondary">
            {eventTag
              ? `Everyone from ${eventTag} has been through the pile.`
              : "Every contact has been sorted already."}
          </Typography>
          <Button component={Link} href="/dashboard" variant="contained">
            Back to the inbox
          </Button>
        </div>
      </main>
    );
  }

  if (done) {
    return (
      <main className="sort">
        <div className="sort__done">
          <CheckCircleRounded />
          <Typography variant="h2">
            {total} sorted{eventTag ? `, ${eventTag}` : ""}
          </Typography>
          <Typography color="text.secondary">
            {tally.meet} to meet · {tally.warm} kept warm · {tally.archived} archived
          </Typography>
          <div className="sort__done-actions">
            <Button component={Link} href="/dashboard" variant="contained">
              Open the meet pile
            </Button>
            {history.length > 0 && (
              <Button onClick={undo} startIcon={<UndoRounded />} color="inherit">
                Undo last
              </Button>
            )}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="sort">
      <header className="sort__bar">
        <Button
          component={Link}
          href="/dashboard"
          startIcon={<ArrowBackRounded />}
          color="inherit"
          size="small"
        >
          Inbox
        </Button>
        <span className="sort__count">
          {index + 1} of {total}
        </span>
        <Button
          onClick={undo}
          startIcon={<UndoRounded />}
          color="inherit"
          size="small"
          disabled={history.length === 0}
        >
          Undo
        </Button>
      </header>

      <div className="sort__progress" aria-hidden="true">
        <span style={{ width: `${(index / total) * 100}%` }} />
      </div>

      <SortCard
        key={current.id}
        person={current}
        onChoose={choose}
        onConnected={markConnected}
        onUndo={undo}
        canUndo={history.length > 0}
      />

      <p className="sort__hint">
        Swipe right to meet, left to archive. Or press 1, 2, 3 — and u to undo.
      </p>

      <Snackbar
        open={Boolean(notice)}
        autoHideDuration={4000}
        onClose={() => setNotice(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        {notice ? (
          <Alert severity="error" variant="filled" onClose={() => setNotice(null)}>
            {notice}
          </Alert>
        ) : undefined}
      </Snackbar>
    </main>
  );
}
