"use client";

import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddRounded from "@mui/icons-material/AddRounded";
import DeleteOutlineRounded from "@mui/icons-material/DeleteOutlineRounded";
import {
  TIMELINE_DESCRIPTION_MAX,
  TIMELINE_ORG_MAX,
  TIMELINE_TITLE_MAX,
  rangeError,
  type TimelineKind,
} from "@/lib/timeline";

/** A row being edited. Ids are client-side until the rows are saved. */
export type TimelineDraft = {
  id: number;
  kind: TimelineKind;
  title: string;
  organisation: string;
  location: string;
  started_on: string;
  ended_on: string;
  is_current: boolean;
  description: string;
};

export function emptyTimelineDraft(id: number, kind: TimelineKind): TimelineDraft {
  return {
    id,
    kind,
    title: "",
    organisation: "",
    location: "",
    started_on: "",
    ended_on: "",
    is_current: false,
    description: "",
  };
}

const KIND_LABELS: Record<TimelineKind, string> = {
  education: "Education",
  experience: "Experience",
};

/**
 * Education and experience rows, shared by setup and the dashboard.
 *
 * One component in both places on purpose: the shop items shipped as a
 * setup-only feature and were unreachable afterwards, which is the mistake
 * this avoids.
 */
export function TimelineEditor({
  value,
  onChange,
  disabled = false,
}: {
  value: TimelineDraft[];
  onChange: (next: TimelineDraft[]) => void;
  disabled?: boolean;
}) {
  function update(id: number, patch: Partial<TimelineDraft>) {
    onChange(value.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  function add(kind: TimelineKind) {
    onChange([
      ...value,
      emptyTimelineDraft(Math.max(0, ...value.map((row) => row.id)) + 1, kind),
    ]);
  }

  return (
    <div className="timeline-editor">
      <Stack spacing={2}>
        {value.map((row) => {
          const dateError = rangeError({
            started_on: row.started_on || null,
            ended_on: row.ended_on || null,
            is_current: row.is_current,
          });
          return (
            <Stack key={row.id} spacing={1.5} className="timeline-editor__row">
              <Stack direction="row" spacing={1.5} alignItems="flex-start">
                <TextField
                  label="Type"
                  select
                  value={row.kind}
                  onChange={(event) =>
                    update(row.id, { kind: event.target.value as TimelineKind })
                  }
                  disabled={disabled}
                  sx={{ width: 148, flexShrink: 0 }}
                >
                  {(Object.keys(KIND_LABELS) as TimelineKind[]).map((kind) => (
                    <MenuItem value={kind} key={kind}>
                      {KIND_LABELS[kind]}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  label={row.kind === "education" ? "Course or degree" : "Role"}
                  value={row.title}
                  onChange={(event) =>
                    update(row.id, { title: event.target.value.slice(0, TIMELINE_TITLE_MAX) })
                  }
                  disabled={disabled}
                  fullWidth
                />
                <IconButton
                  aria-label={`Remove ${row.title || "entry"}`}
                  onClick={() => onChange(value.filter((item) => item.id !== row.id))}
                  disabled={disabled}
                >
                  <DeleteOutlineRounded />
                </IconButton>
              </Stack>

              <Stack direction="row" spacing={1.5} className="timeline-editor__where">
                <TextField
                  label={row.kind === "education" ? "University or college" : "Employer"}
                  value={row.organisation}
                  onChange={(event) =>
                    update(row.id, {
                      organisation: event.target.value.slice(0, TIMELINE_ORG_MAX),
                    })
                  }
                  disabled={disabled}
                  fullWidth
                />
                <TextField
                  label="Place"
                  value={row.location}
                  onChange={(event) =>
                    update(row.id, { location: event.target.value.slice(0, 120) })
                  }
                  disabled={disabled}
                  placeholder="Optional"
                  fullWidth
                />
              </Stack>

              <Stack direction="row" spacing={1.5} alignItems="flex-start" flexWrap="wrap" useFlexGap>
                {/* Month precision only: a CV never prints the day, so asking
                    for one is a field nobody can answer well. */}
                <TextField
                  label="From"
                  type="month"
                  value={row.started_on}
                  onChange={(event) => update(row.id, { started_on: event.target.value })}
                  disabled={disabled}
                  slotProps={{ inputLabel: { shrink: true } }}
                  sx={{ width: 168 }}
                />
                <TextField
                  label="To"
                  type="month"
                  value={row.ended_on}
                  onChange={(event) => update(row.id, { ended_on: event.target.value })}
                  disabled={disabled || row.is_current}
                  slotProps={{ inputLabel: { shrink: true } }}
                  sx={{ width: 168 }}
                  error={Boolean(dateError)}
                  helperText={dateError ?? " "}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={row.is_current}
                      onChange={(event) =>
                        update(row.id, { is_current: event.target.checked })
                      }
                      disabled={disabled}
                    />
                  }
                  label={row.kind === "education" ? "Still studying" : "Still here"}
                />
              </Stack>

              <TextField
                label="One line about it"
                value={row.description}
                onChange={(event) =>
                  update(row.id, {
                    description: event.target.value.slice(0, TIMELINE_DESCRIPTION_MAX),
                  })
                }
                disabled={disabled}
                placeholder="Optional"
                fullWidth
                multiline
                minRows={2}
              />
            </Stack>
          );
        })}
      </Stack>

      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: value.length ? 2 : 0 }}>
        <Button startIcon={<AddRounded />} onClick={() => add("education")} disabled={disabled}>
          Add education
        </Button>
        <Button startIcon={<AddRounded />} onClick={() => add("experience")} disabled={disabled}>
          Add experience
        </Button>
      </Stack>

      {value.length === 0 && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Nothing here yet. Rows without a title and a place are skipped when
            you save.
          </Typography>
        </Box>
      )}
    </div>
  );
}
