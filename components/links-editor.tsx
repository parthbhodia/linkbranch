"use client";

import { useState } from "react";
import AddRounded from "@mui/icons-material/AddRounded";
import CloseRounded from "@mui/icons-material/CloseRounded";
import DeleteOutlineRounded from "@mui/icons-material/DeleteOutlineRounded";
import DragIndicatorRounded from "@mui/icons-material/DragIndicatorRounded";
import ImageOutlined from "@mui/icons-material/ImageOutlined";
import LinkRounded from "@mui/icons-material/LinkRounded";
import StarOutlineRounded from "@mui/icons-material/StarOutlineRounded";
import StarRounded from "@mui/icons-material/StarRounded";
import {
  Box,
  Button,
  CircularProgress,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Stack,
  Switch,
  TextField,
  Tooltip,
} from "@mui/material";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { detectBookingProvider } from "@/lib/booking-providers";
import { detectMusicProvider } from "@/lib/music-providers";
import { normalizeHttpUrl } from "@/lib/urls";
import { createClient } from "@/lib/supabase/client";
import {
  PUBLIC_ASSET_BUCKET,
  imageExtension,
  publicAssetUrl,
  validateImage,
} from "@/lib/storage";

export type LinkDraft = {
  id: number;
  title: string;
  url: string;
  is_active: boolean;
  is_featured: boolean;
  thumbnail_path: string | null;
};

export type EditorNotice = {
  message: string;
  severity: "success" | "error" | "warning" | "info";
};

export function SortableLinkEditor({
  item,
  uploading,
  onUpdate,
  onFeature,
  onVisibility,
  onRemove,
  onUpload,
  onRemoveThumbnail,
}: {
  item: LinkDraft;
  uploading: boolean;
  onUpdate: (id: number, field: "title" | "url", value: string) => void;
  onFeature: (id: number) => void;
  onVisibility: (id: number) => void;
  onRemove: (id: number) => void;
  onUpload: (id: number, event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveThumbnail: (id: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const booking = detectBookingProvider(item.url);
  const music = booking ? null : detectMusicProvider(item.url);
  const special = music ?? booking;
  const urlPlaceholder = special?.placeholder ?? "https://example.com";

  return (
    <Box
      ref={setNodeRef}
      className={`link-editor${isDragging ? " is-dragging" : ""}${
        music ? " link-editor--music" : ""
      }${booking ? " link-editor--booking" : ""}`}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <Tooltip title="Drag to reorder" arrow>
        <IconButton
          className="link-editor__handle"
          aria-label={`Reorder ${item.title || "link"}`}
          {...attributes}
          {...listeners}
        >
          <DragIndicatorRounded />
        </IconButton>
      </Tooltip>

      <div className="link-editor__fields">
        <TextField
          label="Link title"
          value={item.title}
          onChange={(event) => onUpdate(item.id, "title", event.target.value)}
          fullWidth
          size="small"
        />
        <TextField
          label={
            music
              ? `${music.label} URL`
              : booking
                ? `${booking.label} booking URL`
                : "URL"
          }
          type="url"
          placeholder={urlPlaceholder}
          helperText={
            music
              ? `Paste your full ${music.label} link — Cueful shows an inline player.`
              : booking
                ? `Paste your full ${booking.label} event link so people can schedule.`
                : undefined
          }
          value={item.url}
          onChange={(event) => onUpdate(item.id, "url", event.target.value)}
          onBlur={() => {
            const normalized = normalizeHttpUrl(item.url);
            if (normalized) {
              onUpdate(item.id, "url", normalized);
            }
          }}
          fullWidth
          size="small"
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  {special?.icon ?? <LinkRounded fontSize="small" />}
                </InputAdornment>
              ),
            },
          }}
        />
      </div>

      <div className="link-editor__thumbnail">
        {item.thumbnail_path ? (
          <>
            <Box
              component="img"
              src={publicAssetUrl(item.thumbnail_path)}
              alt=""
            />
            <Tooltip title="Remove thumbnail" arrow>
              <IconButton
                size="small"
                aria-label={`Remove ${item.title || "link"} thumbnail`}
                onClick={() => onRemoveThumbnail(item.id)}
              >
                <CloseRounded fontSize="small" />
              </IconButton>
            </Tooltip>
          </>
        ) : (
          <Button
            component="label"
            size="small"
            variant="outlined"
            startIcon={
              uploading ? <CircularProgress size={14} /> : <ImageOutlined />
            }
            disabled={uploading}
          >
            Thumbnail
            <input
              hidden
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => onUpload(item.id, event)}
            />
          </Button>
        )}
      </div>

      <div className="link-editor__actions">
        <Tooltip
          title={item.is_featured ? "Remove spotlight" : "Spotlight this link"}
          arrow
        >
          <IconButton
            color={item.is_featured ? "primary" : "default"}
            aria-label={
              item.is_featured
                ? `Remove ${item.title || "link"} from spotlight`
                : `Spotlight ${item.title || "link"}`
            }
            onClick={() => onFeature(item.id)}
          >
            {item.is_featured ? <StarRounded /> : <StarOutlineRounded />}
          </IconButton>
        </Tooltip>
        <FormControlLabel
          className="link-editor__visibility"
          control={
            <Switch
              size="small"
              checked={item.is_active}
              onChange={() => onVisibility(item.id)}
            />
          }
          label={item.is_active ? "Visible" : "Hidden"}
        />
        <Tooltip title="Remove link" arrow>
          <IconButton
            aria-label={`Remove ${item.title || "link"}`}
            onClick={() => onRemove(item.id)}
          >
            <DeleteOutlineRounded />
          </IconButton>
        </Tooltip>
      </div>
    </Box>
  );
}

/**
 * The link list, its drag-reorder and its thumbnail uploads, owned in one place
 * so the dashboard and the setup wizard edit links the same way. It lived
 * inside the wizard, which is why the dashboard's "Edit links" button had to
 * navigate into the setup flow to offer any editing at all.
 *
 * State stays with the caller: the wizard saves through save_profile_bundle at
 * the end of setup, the dashboard writes the links table on its own. Replaced
 * thumbnails are reported through onThumbnailOrphaned rather than deleted here,
 * because until the caller saves, the old path is still the live one.
 */
export function LinksEditor({
  value,
  onChange,
  userId,
  onNotice,
  onThumbnailOrphaned,
  addLabel = "Add link",
}: {
  value: LinkDraft[];
  onChange: (next: LinkDraft[]) => void;
  userId: string;
  onNotice?: (notice: EditorNotice) => void;
  onThumbnailOrphaned?: (path: string) => void;
  addLabel?: string;
}) {
  const [uploadingThumbnailId, setUploadingThumbnailId] = useState<number | null>(
    null,
  );

  const dragSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function notify(notice: EditorNotice) {
    onNotice?.(notice);
  }

  function updateLink(id: number, field: "title" | "url", next: string) {
    onChange(
      value.map((item) => (item.id === id ? { ...item, [field]: next } : item)),
    );
  }

  function addLink() {
    onChange([
      ...value,
      {
        // Client-side ids only: the caller assigns real ones when it saves.
        id: Math.max(0, ...value.map((item) => item.id)) + 1,
        title: "",
        url: "",
        is_active: true,
        is_featured: false,
        thumbnail_path: null,
      },
    ]);
  }

  function featureLink(id: number) {
    onChange(
      value.map((item) => ({
        ...item,
        is_featured: item.id === id ? !item.is_featured : false,
      })),
    );
  }

  function toggleLinkVisibility(id: number) {
    onChange(
      value.map((item) =>
        item.id === id ? { ...item, is_active: !item.is_active } : item,
      ),
    );
  }

  function removeLink(id: number) {
    const removed = value.find((item) => item.id === id);
    onChange(value.filter((item) => item.id !== id));
    if (removed?.thumbnail_path) onThumbnailOrphaned?.(removed.thumbnail_path);
  }

  function reorderLinks(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const previousIndex = value.findIndex((item) => item.id === active.id);
    const nextIndex = value.findIndex((item) => item.id === over.id);
    if (previousIndex < 0 || nextIndex < 0) return;

    onChange(arrayMove(value, previousIndex, nextIndex));
    notify({ message: "Link order updated", severity: "success" });
  }

  async function uploadLinkThumbnail(
    id: number,
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const validationError = validateImage(file);
    if (validationError) {
      notify({ message: validationError, severity: "error" });
      return;
    }

    setUploadingThumbnailId(id);
    const supabase = createClient();
    const path = `${userId}/links/link-${id}-${crypto.randomUUID()}.${imageExtension(file)}`;
    const { error } = await supabase.storage
      .from(PUBLIC_ASSET_BUCKET)
      .upload(path, file, {
        cacheControl: "31536000",
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      setUploadingThumbnailId(null);
      notify({ message: error.message, severity: "error" });
      return;
    }

    const previousPath = value.find((item) => item.id === id)?.thumbnail_path;
    onChange(
      value.map((item) =>
        item.id === id ? { ...item, thumbnail_path: path } : item,
      ),
    );
    if (previousPath) onThumbnailOrphaned?.(previousPath);

    setUploadingThumbnailId(null);
    notify({ message: "Thumbnail added", severity: "success" });
  }

  function removeLinkThumbnail(id: number) {
    const path = value.find((item) => item.id === id)?.thumbnail_path;
    onChange(
      value.map((item) =>
        item.id === id ? { ...item, thumbnail_path: null } : item,
      ),
    );
    if (path) onThumbnailOrphaned?.(path);
    notify({ message: "Thumbnail removed", severity: "warning" });
  }

  return (
    <Box>
      <DndContext
        sensors={dragSensors}
        collisionDetection={closestCenter}
        onDragEnd={reorderLinks}
      >
        <SortableContext
          items={value.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <Stack spacing={2}>
            {value.map((item) => (
              <SortableLinkEditor
                key={item.id}
                item={item}
                uploading={uploadingThumbnailId === item.id}
                onUpdate={updateLink}
                onFeature={featureLink}
                onVisibility={toggleLinkVisibility}
                onRemove={removeLink}
                onUpload={uploadLinkThumbnail}
                onRemoveThumbnail={removeLinkThumbnail}
              />
            ))}
          </Stack>
        </SortableContext>
      </DndContext>
      <Button
        sx={{ mt: 2 }}
        variant="outlined"
        startIcon={<AddRounded />}
        onClick={addLink}
      >
        {addLabel}
      </Button>
    </Box>
  );
}
