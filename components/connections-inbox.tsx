"use client";

import { useMemo, useState } from "react";
import AddRounded from "@mui/icons-material/AddRounded";
import ArchiveOutlined from "@mui/icons-material/ArchiveOutlined";
import DeleteOutlineRounded from "@mui/icons-material/DeleteOutlineRounded";
import DownloadRounded from "@mui/icons-material/DownloadRounded";
import GroupsOutlined from "@mui/icons-material/GroupsOutlined";
import HandshakeOutlined from "@mui/icons-material/HandshakeOutlined";
import LinkedIn from "@mui/icons-material/LinkedIn";
import LocalFireDepartmentOutlined from "@mui/icons-material/LocalFireDepartmentOutlined";
import PlaylistAddCheckRounded from "@mui/icons-material/PlaylistAddCheckRounded";
import PlaceOutlined from "@mui/icons-material/PlaceOutlined";
import QrCode2Rounded from "@mui/icons-material/QrCode2Rounded";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { linkedInSearchUrl } from "@/lib/linkedin";
import { createClient } from "@/lib/supabase/client";

export type ConnectionStatus = "new" | "meet" | "warm" | "archived";

export type DashboardConnection = {
  id: number;
  name: string;
  email: string;
  phone: string;
  company: string;
  job_title: string;
  note: string;
  event_tag: string;
  status: ConnectionStatus;
  source: string;
  met_at: string;
  /** Set the first time you open their LinkedIn search, so a second pass skips them. */
  connected_at: string | null;
};

const CONNECTION_COLUMNS =
  "id,name,email,phone,company,job_title,note,event_tag,status,source,met_at,connected_at";

/** OP's two piles, plus the untriaged stack they get sorted out of. */
const statusMeta: Record<
  ConnectionStatus,
  { label: string; short: string; icon: React.ReactNode }
> = {
  new: { label: "To sort", short: "To sort", icon: <GroupsOutlined /> },
  meet: { label: "Meet 1:1", short: "Meet", icon: <HandshakeOutlined /> },
  warm: {
    label: "Keep warm",
    short: "Warm",
    icon: <LocalFireDepartmentOutlined />,
  },
  archived: { label: "Archived", short: "Archived", icon: <ArchiveOutlined /> },
};

const filters: Array<{ id: ConnectionStatus | "all"; label: string }> = [
  { id: "all", label: "Everyone" },
  { id: "new", label: "To sort" },
  { id: "meet", label: "Meet 1:1" },
  { id: "warm", label: "Keep warm" },
  { id: "archived", label: "Archived" },
];

const emptyDraft = {
  name: "",
  email: "",
  phone: "",
  company: "",
  job_title: "",
  note: "",
};

function formatMetAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * A leading =, +, - or @ makes a spreadsheet treat the cell as a formula. These
 * rows are typed by strangers at events, so neutralise it before it reaches
 * anyone's Excel.
 */
function csvCell(value: string) {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

function toCsv(rows: DashboardConnection[]) {
  const header = [
    "Name",
    "Email",
    "Phone",
    "Company",
    "Title",
    "Event",
    "Met on",
    "Status",
    "Note",
  ];
  const body = rows.map((row) =>
    [
      row.name,
      row.email,
      row.phone,
      row.company,
      row.job_title,
      row.event_tag,
      formatMetAt(row.met_at),
      statusMeta[row.status].label,
      row.note,
    ]
      .map((cell) => csvCell(cell ?? ""))
      .join(","),
  );
  return [header.map(csvCell).join(","), ...body].join("\r\n");
}

export function ConnectionsInbox({
  profileId,
  initialConnections,
  initialEventTag,
  viewsByEvent = {},
}: {
  profileId: string;
  initialConnections: DashboardConnection[];
  initialEventTag: string;
  /** Page opens per event tag. Lets a group show conversion, not just yield. */
  viewsByEvent?: Record<string, number>;
}) {
  const [connections, setConnections] = useState(initialConnections);
  const [eventTag, setEventTag] = useState(initialEventTag);
  const [eventDraft, setEventDraft] = useState(initialEventTag);
  const [eventSaving, setEventSaving] = useState(false);
  const [filter, setFilter] = useState<ConnectionStatus | "all">("all");
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [noteDrafts, setNoteDrafts] = useState<Record<number, string>>({});
  const [notice, setNotice] = useState<{
    severity: "success" | "error";
    message: string;
  } | null>(null);

  const counts = useMemo(() => {
    const base: Record<ConnectionStatus, number> = {
      new: 0,
      meet: 0,
      warm: 0,
      archived: 0,
    };
    for (const item of connections) base[item.status] += 1;
    return base;
  }, [connections]);

  const visible = useMemo(
    () =>
      filter === "all"
        ? // Archived is a pile you sort *into*, so it stays out of the default
          // view -- otherwise the list never gets shorter and never feels done.
          connections.filter((item) => item.status !== "archived")
        : connections.filter((item) => item.status === filter),
    [connections, filter],
  );

  /** Group by the night you met them, newest event first. */
  const groups = useMemo(() => {
    const byEvent = new Map<string, DashboardConnection[]>();
    for (const item of visible) {
      const key = item.event_tag || "";
      const bucket = byEvent.get(key);
      if (bucket) bucket.push(item);
      else byEvent.set(key, [item]);
    }
    return [...byEvent.entries()]
      .map(([tag, items]) => ({
        tag,
        items: [...items].sort(
          (a, b) => new Date(b.met_at).getTime() - new Date(a.met_at).getTime(),
        ),
      }))
      .sort(
        (a, b) =>
          new Date(b.items[0].met_at).getTime() -
          new Date(a.items[0].met_at).getTime(),
      );
  }, [visible]);

  async function saveEventTag(next: string) {
    setEventSaving(true);
    const { error } = await createClient()
      .from("profiles")
      .update({ current_event_tag: next || null })
      .eq("id", profileId);
    setEventSaving(false);
    if (error) {
      setNotice({ severity: "error", message: error.message });
      return;
    }
    setEventTag(next);
    setEventDraft(next);
    setNotice({
      severity: "success",
      message: next
        ? `New contacts will be filed under “${next}”.`
        : "Event mode off.",
    });
  }

  async function setStatus(connection: DashboardConnection, next: ConnectionStatus) {
    const previous = connection.status;
    setConnections((current) =>
      current.map((item) =>
        item.id === connection.id ? { ...item, status: next } : item,
      ),
    );
    const { error } = await createClient()
      .from("connections")
      .update({ status: next })
      .eq("id", connection.id)
      .eq("profile_id", profileId);
    if (error) {
      setConnections((current) =>
        current.map((item) =>
          item.id === connection.id ? { ...item, status: previous } : item,
        ),
      );
      setNotice({ severity: "error", message: error.message });
    }
  }

  async function saveNote(connection: DashboardConnection) {
    const next = (noteDrafts[connection.id] ?? connection.note).slice(0, 2000);
    setNoteDrafts((current) => {
      const rest = { ...current };
      delete rest[connection.id];
      return rest;
    });
    if (next === connection.note) return;

    setConnections((current) =>
      current.map((item) =>
        item.id === connection.id ? { ...item, note: next } : item,
      ),
    );
    const { error } = await createClient()
      .from("connections")
      .update({ note: next })
      .eq("id", connection.id)
      .eq("profile_id", profileId);
    if (error) {
      setConnections((current) =>
        current.map((item) =>
          item.id === connection.id ? { ...item, note: connection.note } : item,
        ),
      );
      setNotice({ severity: "error", message: error.message });
    }
  }

  /**
   * Opening the search is the only signal we get that a contact has been dealt
   * with on LinkedIn -- there is no API to confirm a request was sent. Good
   * enough to stop the second pass re-offering everyone.
   */
  function markConnected(connection: DashboardConnection) {
    if (connection.connected_at) return;
    const stamp = new Date().toISOString();
    setConnections((current) =>
      current.map((item) =>
        item.id === connection.id ? { ...item, connected_at: stamp } : item,
      ),
    );
    void createClient()
      .from("connections")
      .update({ connected_at: stamp })
      .eq("id", connection.id)
      .eq("profile_id", profileId);
  }

  async function addConnection() {
    const name = draft.name.trim();
    if (!name) {
      setNotice({ severity: "error", message: "Add a name." });
      return;
    }

    setSaving(true);
    const { data, error } = await createClient()
      .from("connections")
      .insert({
        profile_id: profileId,
        name: name.slice(0, 100),
        email: draft.email.trim().slice(0, 254),
        phone: draft.phone.trim().slice(0, 32),
        company: draft.company.trim().slice(0, 100),
        job_title: draft.job_title.trim().slice(0, 100),
        note: draft.note.trim().slice(0, 2000),
        event_tag: eventTag,
        source: "manual",
      })
      .select(CONNECTION_COLUMNS)
      .single();
    setSaving(false);

    if (error || !data) {
      setNotice({
        severity: "error",
        message: error?.message ?? "Could not add that contact.",
      });
      return;
    }
    setConnections((current) => [data as DashboardConnection, ...current]);
    setDraft(emptyDraft);
    setAdding(false);
    setNotice({ severity: "success", message: `${name} added.` });
  }

  async function deleteConnection() {
    if (deleteId === null) return;
    const previous = connections;
    setDeleteId(null);
    setConnections((current) => current.filter((item) => item.id !== deleteId));
    const { error } = await createClient()
      .from("connections")
      .delete()
      .eq("id", deleteId)
      .eq("profile_id", profileId);
    if (error) {
      setConnections(previous);
      setNotice({ severity: "error", message: error.message });
      return;
    }
    setNotice({ severity: "success", message: "Contact deleted." });
  }

  function exportCsv() {
    if (connections.length === 0) return;
    // Export everything, not the filtered view -- this is the handoff into a
    // CRM, and a half-empty file is worse than no file.
    const blob = new Blob([`﻿${toCsv(connections)}`], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "cueful-contacts.csv";
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setNotice({ severity: "success", message: "CSV downloaded." });
  }

  return (
    <section className="connections" aria-labelledby="connections-heading">
      <div className="workspace-panel__heading">
        <Box>
          <Typography id="connections-heading" variant="h3">
            People you met
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Everyone who sent their details back, grouped by where you met them.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          {counts.new > 0 && (
            <Button
              component={Link}
              href="/sort"
              variant="contained"
              startIcon={<PlaylistAddCheckRounded />}
            >
              Sort {counts.new}
            </Button>
          )}
          <Button
            component={Link}
            href="/card"
            variant="outlined"
            startIcon={<QrCode2Rounded />}
          >
            Show my card
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadRounded />}
            onClick={exportCsv}
            disabled={connections.length === 0}
          >
            Export CSV
          </Button>
          <Button
            variant="contained"
            startIcon={<AddRounded />}
            onClick={() => setAdding(true)}
          >
            Add someone
          </Button>
        </Stack>
      </div>

      <Paper className="connections__event" variant="outlined">
        <div className="connections__event-copy">
          <Typography fontWeight={850}>
            <PlaceOutlined fontSize="small" aria-hidden="true" />
            Event mode
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {eventTag
              ? `Anyone who swaps details with you today is filed under “${eventTag}”.`
              : "Name where you are and every contact you collect today gets stamped with it."}
          </Typography>
        </div>
        <Stack direction="row" spacing={1} className="connections__event-form">
          <TextField
            label="Where are you?"
            placeholder="SaaStr 2026 — Tuesday mixer"
            value={eventDraft}
            onChange={(event) => setEventDraft(event.target.value.slice(0, 80))}
            size="small"
            fullWidth
            disabled={eventSaving}
          />
          <Button
            variant="contained"
            onClick={() => saveEventTag(eventDraft.trim())}
            disabled={eventSaving || eventDraft.trim() === eventTag}
          >
            {eventTag ? "Update" : "Start"}
          </Button>
          {eventTag && (
            <Button
              color="inherit"
              onClick={() => saveEventTag("")}
              disabled={eventSaving}
            >
              End
            </Button>
          )}
        </Stack>
      </Paper>

      <div className="connections__filters">
        {filters.map((item) => (
          <Chip
            key={item.id}
            label={
              item.id === "all"
                ? `${item.label} (${connections.length})`
                : `${item.label} (${counts[item.id]})`
            }
            variant={filter === item.id ? "filled" : "outlined"}
            color={filter === item.id ? "primary" : "default"}
            onClick={() => setFilter(item.id)}
          />
        ))}
      </div>

      {groups.map((group) => (
        <div className="connections__group" key={group.tag || "__none"}>
          <div className="connections__group-heading">
            <Typography className="section-label">
              {group.tag || "No event"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {/* Opens first: a low number here means nobody scanned, a high
                  one with few sends means the ask is not landing. */}
              {group.tag && viewsByEvent[group.tag]
                ? `${viewsByEvent[group.tag]} opened your page · ${
                    group.items.length
                  } sent details · `
                : `${group.items.length} ${
                    group.items.length === 1 ? "person" : "people"
                  } · `}
              {formatMetAt(group.items[0].met_at)}
            </Typography>
            {group.items.some((item) => item.status === "new") && (
              <Button
                component={Link}
                href={`/sort?event=${encodeURIComponent(group.tag)}`}
                size="small"
                startIcon={<PlaylistAddCheckRounded />}
              >
                Sort these
              </Button>
            )}
          </div>

          <div className="connections__list">
            {group.items.map((connection) => (
              <Paper
                className="connections__item"
                variant="outlined"
                key={connection.id}
              >
                <div className="connections__identity">
                  <Typography fontWeight={850}>{connection.name}</Typography>
                  {(connection.job_title || connection.company) && (
                    <Typography variant="body2" color="text.secondary">
                      {[connection.job_title, connection.company]
                        .filter(Boolean)
                        .join(" · ")}
                    </Typography>
                  )}
                  <div className="connections__contact">
                    {connection.email && (
                      <a href={`mailto:${connection.email}`}>{connection.email}</a>
                    )}
                    {connection.phone && (
                      <a href={`tel:${connection.phone}`}>{connection.phone}</a>
                    )}
                  </div>
                </div>

                <TextField
                  className="connections__note"
                  label="Notes"
                  placeholder="What you talked about, and what happens next."
                  value={noteDrafts[connection.id] ?? connection.note}
                  onChange={(event) =>
                    setNoteDrafts((current) => ({
                      ...current,
                      [connection.id]: event.target.value.slice(0, 2000),
                    }))
                  }
                  onBlur={() => saveNote(connection)}
                  size="small"
                  fullWidth
                  multiline
                  minRows={2}
                />

                <div className="connections__actions">
                  {(["meet", "warm", "archived"] as ConnectionStatus[]).map(
                    (option) => (
                      <Button
                        key={option}
                        size="small"
                        variant={
                          connection.status === option ? "contained" : "outlined"
                        }
                        startIcon={statusMeta[option].icon}
                        onClick={() =>
                          setStatus(
                            connection,
                            connection.status === option ? "new" : option,
                          )
                        }
                      >
                        {statusMeta[option].short}
                      </Button>
                    ),
                  )}
                  <Tooltip
                    title={
                      connection.connected_at
                        ? "Already searched"
                        : "Search for them on LinkedIn"
                    }
                  >
                    <Button
                      component="a"
                      href={linkedInSearchUrl(connection.name, connection.company)}
                      target="_blank"
                      rel="noopener noreferrer"
                      size="small"
                      startIcon={<LinkedIn />}
                      className={
                        connection.connected_at ? "is-connected" : undefined
                      }
                      onClick={() => markConnected(connection)}
                    >
                      {connection.connected_at ? "Searched" : "LinkedIn"}
                    </Button>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => setDeleteId(connection.id)}
                      aria-label={`Delete ${connection.name}`}
                    >
                      <DeleteOutlineRounded fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </div>
              </Paper>
            ))}
          </div>
        </div>
      ))}

      {visible.length === 0 && (
        <Box className="workspace-empty">
          <GroupsOutlined />
          <Typography fontWeight={850}>
            {connections.length === 0
              ? "Nobody here yet"
              : "Nothing in this pile"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {connections.length === 0
              ? "Turn on event mode before your next event. Anyone who scans your page can send their details straight back to this list."
              : "Try another filter, or sort a few people from the to-sort pile."}
          </Typography>
        </Box>
      )}

      <Dialog open={adding} onClose={() => setAdding(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add someone you met</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Name"
              value={draft.name}
              onChange={(event) =>
                setDraft({ ...draft, name: event.target.value.slice(0, 100) })
              }
              fullWidth
              required
            />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Email"
                type="email"
                value={draft.email}
                onChange={(event) =>
                  setDraft({ ...draft, email: event.target.value.slice(0, 254) })
                }
                fullWidth
              />
              <TextField
                label="Phone"
                value={draft.phone}
                onChange={(event) =>
                  setDraft({ ...draft, phone: event.target.value.slice(0, 32) })
                }
                fullWidth
              />
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Company"
                value={draft.company}
                onChange={(event) =>
                  setDraft({ ...draft, company: event.target.value.slice(0, 100) })
                }
                fullWidth
              />
              <TextField
                label="Title"
                value={draft.job_title}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    job_title: event.target.value.slice(0, 100),
                  })
                }
                fullWidth
              />
            </Stack>
            <TextField
              label="Notes"
              placeholder="What you talked about, and what happens next."
              value={draft.note}
              onChange={(event) =>
                setDraft({ ...draft, note: event.target.value.slice(0, 2000) })
              }
              fullWidth
              multiline
              minRows={3}
            />
            {eventTag && (
              <Alert severity="info">
                Filed under “{eventTag}”.
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={() => setAdding(false)} disabled={saving}>
            Cancel
          </Button>
          <Button variant="contained" onClick={addConnection} disabled={saving}>
            {saving ? "Adding…" : "Add contact"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteId !== null} onClose={() => setDeleteId(null)}>
        <DialogTitle>Delete this contact?</DialogTitle>
        <DialogContent>
          Their details and your notes are removed for good.
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={() => setDeleteId(null)}>
            Cancel
          </Button>
          <Button color="error" variant="contained" onClick={deleteConnection}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(notice)}
        autoHideDuration={3200}
        onClose={() => setNotice(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        {notice ? (
          <Alert
            severity={notice.severity}
            variant="filled"
            onClose={() => setNotice(null)}
          >
            {notice.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </section>
  );
}
