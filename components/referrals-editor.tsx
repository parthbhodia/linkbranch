"use client";

import AddRounded from "@mui/icons-material/AddRounded";
import DeleteOutlineRounded from "@mui/icons-material/DeleteOutlineRounded";
import LinkRounded from "@mui/icons-material/LinkRounded";
import {
  Box,
  Button,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { normalizeHttpUrl } from "@/lib/urls";

export type ReferralDraft = {
  id: number;
  provider: string;
  offer: string;
  url: string;
  code: string;
  color: string;
  is_active: boolean;
};

// Reused when a new card needs a colour and the creator has not picked one.
const REFERRAL_COLORS = ["#6d54d8", "#2e7d59", "#c64a16", "#1f6f8b", "#8b5ec7"];

/**
 * The referral offer list, shared by the dashboard and the setup wizard so both
 * edit offers the same way. It used to live only inside the wizard, which is
 * why the dashboard's "Edit referrals" button had to leave the page.
 */
export function ReferralsEditor({
  value,
  onChange,
}: {
  value: ReferralDraft[];
  onChange: (next: ReferralDraft[]) => void;
}) {
  function updateReferral(
    id: number,
    field: "provider" | "offer" | "url" | "code" | "color",
    next: string,
  ) {
    onChange(
      value.map((item) => (item.id === id ? { ...item, [field]: next } : item)),
    );
  }

  function addReferral() {
    const id = Math.max(0, ...value.map((item) => item.id)) + 1;
    onChange([
      ...value,
      {
        id,
        provider: "",
        offer: "",
        url: "",
        code: "",
        color: REFERRAL_COLORS[value.length % REFERRAL_COLORS.length],
        is_active: true,
      },
    ]);
  }

  function toggleReferralVisibility(id: number) {
    onChange(
      value.map((item) =>
        item.id === id ? { ...item, is_active: !item.is_active } : item,
      ),
    );
  }

  function removeReferral(id: number) {
    onChange(value.filter((item) => item.id !== id));
  }

  const referrals = value;

  return (
    <Box>
    <Stack spacing={2} sx={{ mt: 2.5 }}>
      {referrals.map((item, index) => (
        <Box className="referral-editor" key={item.id}>
          <div className="referral-editor__header">
            <Typography variant="caption" fontWeight={800}>
              REFERRAL {index + 1}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={item.is_active}
                    onChange={() => toggleReferralVisibility(item.id)}
                  />
                }
                label={item.is_active ? "Visible" : "Hidden"}
              />
              <Tooltip title="Remove referral" arrow>
                <IconButton
                  aria-label={`Remove ${item.provider || "referral"}`}
                  onClick={() => removeReferral(item.id)}
                  size="small"
                >
                  <DeleteOutlineRounded fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          </div>
          <div className="referral-editor__grid">
            <TextField
              label="Provider"
              placeholder="Lyft"
              value={item.provider}
              onChange={(event) =>
                updateReferral(item.id, "provider", event.target.value)
              }
              fullWidth
              size="small"
              required
            />
            <TextField
              label="Offer"
              placeholder="$15 off your first ride"
              value={item.offer}
              onChange={(event) =>
                updateReferral(item.id, "offer", event.target.value)
              }
              fullWidth
              size="small"
              required
            />
            <TextField
              label="Referral URL"
              type="url"
              placeholder="https://example.com/ref/your-name"
              value={item.url}
              onChange={(event) =>
                updateReferral(item.id, "url", event.target.value)
              }
              onBlur={() => {
                const normalized = normalizeHttpUrl(item.url);
                if (normalized) {
                  updateReferral(item.id, "url", normalized);
                }
              }}
              fullWidth
              size="small"
              required
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <LinkRounded fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <TextField
              label="Coupon code"
              placeholder="Optional"
              value={item.code}
              onChange={(event) =>
                updateReferral(item.id, "code", event.target.value.toUpperCase())
              }
              fullWidth
              size="small"
              helperText="Leave blank if the URL applies the offer automatically."
            />
            <label className="referral-editor__color">
              <span>Card color</span>
              <span>
                <input
                  type="color"
                  value={item.color}
                  onChange={(event) =>
                    updateReferral(item.id, "color", event.target.value)
                  }
                  aria-label={`Color for ${item.provider || `referral ${index + 1}`}`}
                />
                <code>{item.color}</code>
              </span>
            </label>
          </div>
        </Box>
      ))}
      {referrals.length === 0 && (
        <Box className="referral-editor__empty">
          <Typography variant="body2" color="text.secondary">
            No referral offers yet.
          </Typography>
          <Button size="small" startIcon={<AddRounded />} onClick={addReferral}>
            Add your first referral
          </Button>
        </Box>
      )}
    </Stack>
      <Button
        sx={{ mt: 2 }}
        variant="outlined"
        startIcon={<AddRounded />}
        onClick={addReferral}
      >
        Add referral
      </Button>
    </Box>
  );
}
