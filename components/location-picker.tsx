"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import MyLocationRounded from "@mui/icons-material/MyLocationRounded";
import SearchRounded from "@mui/icons-material/SearchRounded";
import DeleteOutlineRounded from "@mui/icons-material/DeleteOutlineRounded";
import { isSearchableQuery, type GeocodeResult } from "@/lib/geocode";
import {
  MAP_ADDRESS_MAX_LENGTH,
  formatPin,
  parseCoordinateQuery,
  roundPin,
  type MapPin,
} from "@/lib/map-location";

const LocationMap = dynamic(
  () => import("@/components/location-map").then((mod) => mod.LocationMap),
  { ssr: false, loading: () => <div className="location-map" aria-hidden="true" /> },
);

/** What the dashboard and the wizard hold in state for the map. */
export type MapPinDraft = {
  lat: number | null;
  lng: number | null;
  address: string;
  show: boolean;
};

export const EMPTY_MAP_PIN: MapPinDraft = { lat: null, lng: null, address: "", show: true };

export function draftPin(draft: MapPinDraft): MapPin | null {
  return typeof draft.lat === "number" && typeof draft.lng === "number"
    ? { lat: draft.lat, lng: draft.lng }
    : null;
}

/**
 * Three ways in, because shop owners arrive with different things: a Google
 * Maps link or coordinates (pasted straight in), an address (searched), or
 * nothing but the phone in their hand at the counter (device location).
 * Whichever they use, the pin can then be dragged to the right doorway.
 */
export function LocationPicker({
  value,
  onChange,
  suggestedQuery = "",
  disabled = false,
}: {
  value: MapPinDraft;
  onChange: (next: MapPinDraft) => void;
  /** Prefills the search box, typically the short location text. */
  suggestedQuery?: string;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState(suggestedQuery);
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const pin = draftPin(value);

  function place(next: MapPin, address?: string) {
    const rounded = roundPin(next);
    onChange({
      ...value,
      lat: rounded.lat,
      lng: rounded.lng,
      address: value.address.trim() ? value.address : (address ?? value.address),
    });
  }

  async function search() {
    setMessage(null);
    setResults([]);
    const pasted = parseCoordinateQuery(query);
    if (pasted) {
      place(pasted);
      setMessage("Pin placed from the coordinates you pasted. Drag it if it is not quite right.");
      return;
    }
    if (!isSearchableQuery(query)) {
      setMessage("Type a street, area or place name to search for.");
      return;
    }
    setSearching(true);
    try {
      const response = await fetch(`/api/geocode?q=${encodeURIComponent(query.trim())}`);
      const payload = (await response.json()) as {
        results?: GeocodeResult[];
        error?: string;
      };
      if (!response.ok) {
        setMessage(payload.error ?? "Address search failed. Try again in a moment.");
      } else if (!payload.results?.length) {
        setMessage("Nothing found for that. Try adding the city, or paste a Google Maps link.");
      } else {
        setResults(payload.results);
      }
    } catch {
      setMessage("Address search failed. Check your connection and try again.");
    } finally {
      setSearching(false);
    }
  }

  function useDeviceLocation() {
    setMessage(null);
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setMessage("This browser cannot share its location. Search for the address instead.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        place({ lat: position.coords.latitude, lng: position.coords.longitude });
        setMessage("Pin placed where you are now. Drag it onto the entrance if needed.");
      },
      (error) => {
        setLocating(false);
        setMessage(
          error.code === error.PERMISSION_DENIED
            ? "Location permission was refused. Search for the address instead."
            : "Could not read your location. Search for the address instead.",
        );
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  }

  return (
    <div className="location-picker">
      <div className="location-picker__search">
        <TextField
          label="Search address, or paste a Google Maps link"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void search();
            }
          }}
          fullWidth
          disabled={disabled}
          slotProps={{ htmlInput: { maxLength: 500 } }}
        />
        <Button
          variant="outlined"
          onClick={() => void search()}
          disabled={disabled || searching}
          startIcon={searching ? <CircularProgress size={16} /> : <SearchRounded />}
          sx={{ flexShrink: 0, whiteSpace: "nowrap" }}
        >
          Find
        </Button>
      </div>

      {results.length > 0 && (
        <Stack className="location-picker__results" role="list" aria-label="Matching places">
          {results.map((result) => (
            <Button
              key={`${result.lat},${result.lng}`}
              role="listitem"
              variant="text"
              onClick={() => {
                place(result, result.label);
                setResults([]);
                setMessage(null);
              }}
              sx={{ justifyContent: "flex-start", textAlign: "left", textTransform: "none" }}
            >
              {result.label}
            </Button>
          ))}
        </Stack>
      )}

      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center">
        <Button
          size="small"
          onClick={useDeviceLocation}
          disabled={disabled || locating}
          startIcon={locating ? <CircularProgress size={14} /> : <MyLocationRounded />}
        >
          Use my current location
        </Button>
        {pin && (
          <Button
            size="small"
            color="inherit"
            onClick={() => {
              onChange({ ...value, lat: null, lng: null });
              setResults([]);
              setMessage(null);
            }}
            disabled={disabled}
            startIcon={<DeleteOutlineRounded />}
          >
            Remove pin
          </Button>
        )}
      </Stack>

      {message && (
        <Typography variant="body2" color="text.secondary" role="status">
          {message}
        </Typography>
      )}

      {pin && (
        <>
          <Box className="location-picker__map">
            <LocationMap
              pin={pin}
              label={value.address || "your pin"}
              interactive
              onPinChange={(next) => place(next)}
            />
          </Box>
          <Typography className="location-picker__meta" variant="caption">
            Drag the pin or tap the map to fine-tune. {formatPin(pin)}
          </Typography>
          <TextField
            label="Address shown beside the map"
            value={value.address}
            onChange={(event) =>
              onChange({ ...value, address: event.target.value.slice(0, MAP_ADDRESS_MAX_LENGTH) })
            }
            fullWidth
            disabled={disabled}
            helperText="Optional. Keep it short: street, area, landmark."
            slotProps={{ htmlInput: { maxLength: MAP_ADDRESS_MAX_LENGTH } }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={value.show}
                onChange={(event) => onChange({ ...value, show: event.target.checked })}
                disabled={disabled}
              />
            }
            label="Show the map on my page"
          />
        </>
      )}
    </div>
  );
}
