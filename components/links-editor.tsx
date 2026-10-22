"use client";

import { useRef, useState } from "react";
import AddRounded from "@mui/icons-material/AddRounded";
import CloseRounded from "@mui/icons-material/CloseRounded";
import DeleteOutlineRounded from "@mui/icons-material/DeleteOutlineRounded";
import DragIndicatorRounded from "@mui/icons-material/DragIndicatorRounded";
import ImageOutlined from "@mui/icons-material/ImageOutlined";
import Crop169Rounded from "@mui/icons-material/Crop169Rounded";
import PlaylistAddRounded from "@mui/icons-material/PlaylistAddRounded";
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
  Typography,
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
import {
  bookingProviders,
  detectBookingProvider,
  type BookingProvider,
} from "@/lib/booking-providers";
import { detectLinkBrand } from "@/lib/link-brands";
import { detectMusicProvider } from "@/lib/music-providers";
import { groupLinksBySection, sortLinksBySection } from "@/lib/link-groups";
import { normalizeHttpUrl } from "@/lib/urls";
import { createClient } from "@/lib/supabase/client";
import {
  PUBLIC_ASSET_BUCKET,
  imageExtension,
  publicAssetUrl,
  validateImage,
} from "@/lib/storage";
import { EmojiPickerButton } from "@/components/emoji-picker";

export type LinkDraft = {
  id: number;
  title: string;
  url: string;
  is_active: boolean;
  is_featured: boolean;
  thumbnail_path: string | null;
  /** Free-form section heading; empty/absent keeps the link in the flat list. */
  group_name?: string;
  /** How this one link is drawn on the page. Absent is a row. */
  card_style?: string;
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
  onUpdate: (
    id: number,
    field: "title" | "url" | "card_style",
    value: string,
  ) => void;
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

  const titleInputRef = useRef<HTMLInputElement>(null);

  const booking = detectBookingProvider(item.url);
  const music = booking ? null : detectMusicProvider(item.url);
  const brand = music || booking ? null : detectLinkBrand(item.url);
  const special = music ?? booking ?? brand;
  const urlPlaceholder = special?.placeholder ?? "https://example.com";
  const imageCard = item.card_style === "image";

  // The caret, not the end: "🎟 Tickets" is the common shape, and appending
  // would fight anyone who has already typed a title.
  function insertEmoji(emoji: string) {
    const input = titleInputRef.current;
    const current = item.title ?? "";
    const start = input?.selectionStart ?? current.length;
    const end = input?.selectionEnd ?? start;
    onUpdate(item.id, "title", current.slice(0, start) + emoji + current.slice(end));
    const caret = start + emoji.length;
    requestAnimationFrame(() => {
      input?.focus();
      input?.setSelectionRange(caret, caret);
    });
  }

  return (
    <Box
      ref={setNodeRef}
      className={`link-editor${isDragging ? " is-dragging" : ""}${
        music ? " link-editor--music" : ""
      }${booking ? " link-editor--booking" : ""}${
        brand ? ` link-editor--brand link-editor--brand-${brand.id}` : ""
      }`}
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
          inputRef={titleInputRef}
          fullWidth
          size="small"
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <EmojiPickerButton
                    label="Add an emoji to this link's title"
                    onInsert={insertEmoji}
                  />
                </InputAdornment>
              ),
            },
          }}
        />
        <TextField
          label={
            music
              ? `${music.label} URL`
              : booking
                ? `${booking.label} booking URL`
                : brand
                  ? `${brand.label} URL`
                  : "URL"
          }
          type="url"
          placeholder={urlPlaceholder}
          helperText={
            music
              ? `Paste your full ${music.label} link — Cueful shows an inline player.`
              : booking
                ? `Paste your full ${booking.label} event link so people can schedule.`
                : brand
                  ? `${brand.label} detected — Cueful shows the brand mark on your page.`
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
          title={
            imageCard
              ? "Draw as a list row"
              : item.thumbnail_path
                ? "Draw as a full-width card"
                : "Add a photo to draw this as a card"
          }
          arrow
        >
          <span>
            <IconButton
              color={imageCard ? "primary" : "default"}
              // An image card is drawn out of the thumbnail, so without one
              // there is nothing to draw. Left disabled rather than hidden, so
              // the two shapes read as one control that is sometimes unavailable.
              disabled={!imageCard && !item.thumbnail_path}
              aria-label={
                imageCard
                  ? `Draw ${item.title || "link"} as a list row`
                  : `Draw ${item.title || "link"} as a full-width card`
              }
              onClick={() =>
                onUpdate(item.id, "card_style", imageCard ? "row" : "image")
              }
            >
              <Crop169Rounded />
            </IconButton>
          </span>
        </Tooltip>
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
 * Editable section title. Renaming is committed on blur or Enter rather than
 * on every keystroke: an in-progress empty value would otherwise dissolve the
 * section out from under the field.
 *
 * The unsectioned list gets one of these too, with its heading shown as the
 * placeholder rather than as a value. Renaming it writes a real heading onto
 * those links, which is how "My links" becomes whatever the creator calls it;
 * leaving it alone keeps them unheaded on the public page.
 *
 * `onRemove` is absent for that list: every section empties back into it, so it
 * is the one heading with nothing to be removed from.
 */
function SectionHeading({
  name,
  placeholder = "Section name",
  onRename,
  onRemove,
}: {
  name: string;
  placeholder?: string;
  onRename: (from: string, to: string) => void;
  onRemove?: () => void;
}) {
  const [text, setText] = useState(name);

  function commit() {
    const next = text.trim();
    if (!next || next === name) {
      setText(name);
      return;
    }
    onRename(name, next);
  }

  return (
    <div className="link-section__heading">
      <TextField
        value={text}
        onChange={(event) => setText(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commit();
            (event.target as HTMLInputElement).blur();
          }
        }}
        size="small"
        variant="standard"
        placeholder={placeholder}
        slotProps={{ input: { disableUnderline: true } }}
        inputProps={{
          maxLength: 60,
          "aria-label": name ? `${name} section name` : "Section name",
        }}
      />
      {onRemove && (
        <Tooltip title="Remove section" arrow>
          <IconButton
            size="small"
            onClick={onRemove}
            aria-label={`Remove ${name} section`}
          >
            <DeleteOutlineRounded fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </div>
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
}: {
  value: LinkDraft[];
  onChange: (next: LinkDraft[]) => void;
  userId: string;
  onNotice?: (notice: EditorNotice) => void;
  onThumbnailOrphaned?: (path: string) => void;
}) {
  const [uploadingThumbnailId, setUploadingThumbnailId] = useState<number | null>(
    null,
  );
  // Named-but-empty sections live only here until a link is dropped into them;
  // an empty section has no link to carry its name, so it cannot persist.
  const [pendingSections, setPendingSections] = useState<string[]>([]);

  const dragSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function notify(notice: EditorNotice) {
    onNotice?.(notice);
  }

  function updateLink(
    id: number,
    field: "title" | "url" | "card_style",
    next: string,
  ) {
    onChange(
      value.map((item) => (item.id === id ? { ...item, [field]: next } : item)),
    );
  }

  // A scheduler is the one link people arrive knowing they want, so it gets a
  // labelled row instead of a blank one they have to recognise from the URL.
  // This mirrors the wizard's "Book a call" rail; the URL is a host stub until
  // they paste their real booking page, and the row is not auto-spotlighted so
  // it can't collide with the one-featured-link rule on save.
  function addBookingLink(providerId: BookingProvider["id"]) {
    const provider = bookingProviders.find((item) => item.id === providerId);
    if (!provider) return;
    const starterUrl =
      provider.placeholder.split("/").slice(0, 3).join("/") + "/";
    onChange([
      ...value,
      {
        id: Math.max(0, ...value.map((item) => item.id)) + 1,
        title: provider.title,
        url: starterUrl,
        is_active: true,
        is_featured: false,
        thumbnail_path: null,
        group_name: "",
      },
    ]);
    notify({
      message: `${provider.label} booking link added — paste your full scheduling URL.`,
      severity: "success",
    });
  }

  // Every change funnels through here so the list stays contiguous by section:
  // a link can never sit between two sections that do not claim it.
  function commit(next: LinkDraft[]) {
    onChange(sortLinksBySection(next, (item) => item.group_name ?? ""));
  }

  function addLinkTo(group: string) {
    setPendingSections((current) => current.filter((name) => name !== group));
    commit([
      ...value,
      {
        id: Math.max(0, ...value.map((item) => item.id)) + 1,
        title: "",
        url: "",
        is_active: true,
        is_featured: false,
        thumbnail_path: null,
        group_name: group,
      },
    ]);
  }

  function addSection() {
    setPendingSections((current) => {
      const taken = new Set([...value.map((item) => item.group_name), ...current]);
      let index = 1;
      let name = "New section";
      while (taken.has(name)) {
        index += 1;
        name = `New section ${index}`;
      }
      return [...current, name];
    });
  }

  function renameSection(from: string, to: string) {
    commit(
      value.map((item) =>
        (item.group_name ?? "") === from ? { ...item, group_name: to } : item,
      ),
    );
  }

  function clearSection(name: string) {
    commit(
      value.map((item) =>
        (item.group_name ?? "") === name ? { ...item, group_name: "" } : item,
      ),
    );
  }

  function renamePendingSection(from: string, to: string) {
    // Renaming an empty section onto a name that already has links merges the
    // two rather than leaving a duplicate heading.
    if (value.some((item) => item.group_name === to)) {
      setPendingSections((current) => current.filter((name) => name !== from));
      return;
    }
    setPendingSections((current) =>
      current.map((name) => (name === from ? to : name)),
    );
  }

  function removePendingSection(name: string) {
    setPendingSections((current) => current.filter((item) => item !== name));
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

    const moved = arrayMove(value, previousIndex, nextIndex);
    // A link dropped next to a heading joins that section, so dragging across a
    // boundary is how a link moves from one section to another.
    const at = moved.findIndex((item) => item.id === active.id);
    const before = moved[at - 1];
    const after = moved[at + 1];
    if (before || after) {
      const group =
        before && after && before.group_name === after.group_name
          ? before.group_name
          : (before ?? after).group_name;
      moved[at] = { ...moved[at], group_name: group };
    }

    commit(moved);
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

  const sections = groupLinksBySection(value, (item) => item.group_name ?? "");
  // A list with no links has no groups at all, and the flat list still has to be
  // drawn: it is where the first link goes.
  const drawnSections = sections.length
    ? sections
    : [{ name: "", links: [] as LinkDraft[] }];

  return (
    <Box className="links-editor">
      <div className="link-quick-add">
        <Typography variant="caption" color="text.secondary">
          BOOK A CALL
        </Typography>
        <div>
          {bookingProviders.map((provider) => (
            <Button
              key={provider.id}
              size="small"
              variant="outlined"
              startIcon={provider.icon}
              onClick={() => addBookingLink(provider.id)}
            >
              {provider.label}
            </Button>
          ))}
        </div>
      </div>
      <DndContext
        sensors={dragSensors}
        collisionDetection={closestCenter}
        onDragEnd={reorderLinks}
      >
        <SortableContext
          items={value.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="link-sections">
            {drawnSections.map((section) => (
              <section
                className="link-section"
                key={section.name || "__ungrouped"}
              >
                {/* The flat list is drawn with a heading like any other so it can
                    be renamed; it reads "My links" as a placeholder until it is. */}
                <SectionHeading
                  name={section.name}
                  placeholder="My links"
                  onRename={renameSection}
                  onRemove={
                    section.name
                      ? () => clearSection(section.name)
                      : undefined
                  }
                />
                <Stack spacing={2}>
                  {section.links.map((item) => (
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
                {/* Adding belongs to the section being looked at, so a new link
                    cannot land in the wrong one. */}
                <Button
                  className="link-section__add"
                  size="small"
                  startIcon={<AddRounded fontSize="small" />}
                  onClick={() => addLinkTo(section.name)}
                >
                  {section.name ? `Add to ${section.name}` : "Add link"}
                </Button>
              </section>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {pendingSections.map((name) => (
        <section className="link-section" key={`pending-${name}`}>
          <SectionHeading
            name={name}
            onRename={renamePendingSection}
            onRemove={() => removePendingSection(name)}
          />
          <Button
            className="link-section__add"
            size="small"
            startIcon={<AddRounded fontSize="small" />}
            onClick={() => addLinkTo(name)}
          >
            Add to {name}
          </Button>
        </section>
      ))}

      <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
        <Button
          variant="text"
          startIcon={<PlaylistAddRounded />}
          onClick={addSection}
        >
          Add section
        </Button>
      </Stack>
    </Box>
  );
}
