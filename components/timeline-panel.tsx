"use client";

import { useState } from "react";
import { Alert, Box, Button, CircularProgress, Paper, Stack, Typography } from "@mui/material";
import SchoolOutlined from "@mui/icons-material/SchoolOutlined";
import { createClient } from "@/lib/supabase/client";
import {
  TimelineEditor,
  type TimelineDraft,
} from "@/components/timeline-editor";
import { isCompleteEntry, type TimelineEntry } from "@/lib/timeline";

/**
 * Editing education and experience after setup.
 *
 * This exists because the shop items shipped as a setup-only feature and were
 * unreachable afterwards, which is exactly the complaint that started this
 * work. Anything setup can create, the dashboard can edit.
 */
export function TimelinePanel({
  profileId,
  initialEntries,
}: {
  profileId: string;
  initialEntries: TimelineEntry[];
}) {
  const [rows, setRows] = useState<TimelineDraft[]>(() =>
    initialEntries.map((entry) => ({
      id: entry.id,
      kind: entry.kind,
      title: entry.title,
      organisation: entry.organisation,
      location: entry.location,
      // The column is a date; the editor works in months.
      started_on: entry.started_on?.slice(0, 7) ?? "",
      ended_on: entry.ended_on?.slice(0, 7) ?? "",
      is_current: entry.is_current,
      description: entry.description,
    })),
  );
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{
    severity: "success" | "error";
    message: string;
  } | null>(null);

  async function save() {
    setSaving(true);
    setNotice(null);
    const supabase = createClient();
    const keep = rows.filter(isCompleteEntry);

    // Replace wholesale rather than diff: the rows are few, reordering is the
    // common edit, and a partial failure would leave a half-written CV.
    const { error: clearError } = await supabase
      .from("profile_timeline")
      .delete()
      .eq("user_id", profileId);
    if (clearError) {
      setSaving(false);
      setNotice({ severity: "error", message: clearError.message });
      return;
    }

    if (keep.length > 0) {
      const { error } = await supabase.from("profile_timeline").insert(
        keep.map((row, index) => ({
          user_id: profileId,
          kind: row.kind,
          title: row.title.trim(),
          organisation: row.organisation.trim(),
          location: row.location.trim(),
          started_on: row.started_on ? `${row.started_on}-01` : null,
          ended_on: row.is_current || !row.ended_on ? null : `${row.ended_on}-01`,
          is_current: row.is_current,
          description: row.description.trim(),
          position: index,
        })),
      );
      if (error) {
        setSaving(false);
        setNotice({ severity: "error", message: error.message });
        return;
      }
    }

    const dropped = rows.length - keep.length;
    setSaving(false);
    setNotice({
      severity: "success",
      message: dropped
        ? `Background saved. ${dropped} incomplete ${dropped === 1 ? "row was" : "rows were"} skipped.`
        : "Background saved.",
    });
  }

  return (
    <Paper className="workspace-settings-card" variant="outlined">
      <div className="workspace-settings-card__heading">
        <SchoolOutlined />
        <Box>
          <Typography variant="h3">Background</Typography>
          <Typography variant="body2" color="text.secondary">
            Education and experience, shown on your page most recent first.
          </Typography>
        </Box>
      </div>

      <TimelineEditor value={rows} onChange={setRows} disabled={saving} />

      {notice && (
        <Alert severity={notice.severity} sx={{ mt: 2 }} onClose={() => setNotice(null)}>
          {notice.message}
        </Alert>
      )}

      <Stack direction="row" sx={{ mt: 2 }}>
        <Button
          variant="contained"
          onClick={() => void save()}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={16} /> : undefined}
        >
          {saving ? "Saving…" : "Save background"}
        </Button>
      </Stack>
    </Paper>
  );
}
