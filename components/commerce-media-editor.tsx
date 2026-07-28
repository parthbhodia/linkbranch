"use client";

import { useState } from "react";
import AddRounded from "@mui/icons-material/AddRounded";
import DeleteOutlineRounded from "@mui/icons-material/DeleteOutlineRounded";
import MusicNoteRounded from "@mui/icons-material/MusicNoteRounded";
import PhotoCameraOutlined from "@mui/icons-material/PhotoCameraOutlined";
import StorefrontOutlined from "@mui/icons-material/StorefrontOutlined";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { createClient } from "@/lib/supabase/client";
import {
  imageExtension,
  publicAssetUrl,
  PUBLIC_ASSET_BUCKET,
  validateImage,
} from "@/lib/storage";

export type DashboardProduct = {
  id: number;
  title: string;
  description: string;
  price_amount: number | null;
  currency: string;
  category: string;
  badge: string | null;
  image_path: string | null;
  destination_url: string;
  cta_label: string;
  position: number;
  is_active: boolean;
  is_featured: boolean;
};

export type DashboardMediaEmbed = {
  id: number;
  title: string;
  provider: string;
  url: string;
  layout: string;
  position: number;
  is_active: boolean;
};

function normalizeUrl(value: string) {
  const candidate = /^https?:\/\//i.test(value.trim())
    ? value.trim()
    : `https://${value.trim()}`;
  try {
    const parsed = new URL(candidate);
    return ["http:", "https:"].includes(parsed.protocol) ? parsed.toString() : null;
  } catch {
    return null;
  }
}

function detectProvider(value: string) {
  const host = normalizeUrl(value);
  if (!host) return null;
  const hostname = new URL(host).hostname.replace(/^www\./, "");
  if (hostname.includes("spotify.com")) return "spotify";
  if (hostname.includes("music.apple.com")) return "apple_music";
  if (hostname.includes("soundcloud.com")) return "soundcloud";
  if (hostname.includes("youtube.com") || hostname === "youtu.be") return "youtube";
  if (hostname.includes("bandcamp.com")) return "bandcamp";
  if (hostname.includes("twitch.tv")) return "twitch";
  if (hostname.includes("vimeo.com")) return "vimeo";
  return null;
}

export function CommerceMediaEditor({
  profileId,
  initialProducts,
  initialMedia,
}: {
  profileId: string;
  initialProducts: DashboardProduct[];
  initialMedia: DashboardMediaEmbed[];
}) {
  const [products, setProducts] = useState(initialProducts);
  const [media, setMedia] = useState(initialMedia);
  const [productDraft, setProductDraft] = useState({
    title: "",
    description: "",
    price: "",
    currency: "USD",
    category: "digital",
    badge: "",
    url: "",
    cta: "View product",
  });
  const [mediaDraft, setMediaDraft] = useState({ title: "", url: "", layout: "player" });
  const [notice, setNotice] = useState<string | null>(null);
  const [uploadingProductId, setUploadingProductId] = useState<number | null>(
    null,
  );

  async function addProduct() {
    const destination = normalizeUrl(productDraft.url);
    if (!productDraft.title.trim() || !destination) {
      setNotice("Add a product name and a valid destination URL.");
      return;
    }
    const supabase = createClient();
    const { data, error } = await supabase
      .from("products")
      .insert({
        user_id: profileId,
        title: productDraft.title.trim(),
        description: productDraft.description.trim(),
        price_amount: productDraft.price ? Number(productDraft.price) : null,
        currency: productDraft.currency,
        category: productDraft.category,
        badge: productDraft.badge.trim() || null,
        destination_url: destination,
        cta_label: productDraft.cta.trim() || "View product",
        position: products.length,
      })
      .select("*")
      .single();
    if (error || !data) {
      setNotice(error?.message ?? "Product could not be saved.");
      return;
    }
    setProducts((current) => [...current, data as DashboardProduct]);
    setProductDraft({
      title: "",
      description: "",
      price: "",
      currency: "USD",
      category: "digital",
      badge: "",
      url: "",
      cta: "View product",
    });
    setNotice("Product added. Checkout stays on your destination website.");
  }

  async function addMedia() {
    const url = normalizeUrl(mediaDraft.url);
    const provider = url ? detectProvider(url) : null;
    if (!mediaDraft.title.trim() || !url || !provider) {
      setNotice(
        "Use a Spotify, Apple Music, SoundCloud, YouTube, Bandcamp, Twitch, or Vimeo URL.",
      );
      return;
    }
    const supabase = createClient();
    const { data, error } = await supabase
      .from("media_embeds")
      .insert({
        user_id: profileId,
        title: mediaDraft.title.trim(),
        provider,
        url,
        layout: mediaDraft.layout,
        position: media.length,
      })
      .select("*")
      .single();
    if (error || !data) {
      setNotice(error?.message ?? "Media could not be saved.");
      return;
    }
    setMedia((current) => [...current, data as DashboardMediaEmbed]);
    setMediaDraft({ title: "", url: "", layout: "player" });
    setNotice(`${provider.replace("_", " ")} media added.`);
  }

  async function toggle(
    table: "products" | "media_embeds",
    id: number,
    active: boolean,
  ) {
    const supabase = createClient();
    const { error } = await supabase.from(table).update({ is_active: active }).eq("id", id);
    if (error) {
      setNotice(error.message);
      return;
    }
    if (table === "products") {
      setProducts((current) =>
        current.map((item) => (item.id === id ? { ...item, is_active: active } : item)),
      );
    } else {
      setMedia((current) =>
        current.map((item) => (item.id === id ? { ...item, is_active: active } : item)),
      );
    }
  }

  async function remove(table: "products" | "media_embeds", id: number) {
    const supabase = createClient();
    const productImage =
      table === "products"
        ? products.find((item) => item.id === id)?.image_path
        : null;
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) {
      setNotice(error.message);
      return;
    }
    if (table === "products") {
      if (productImage) {
        await supabase.storage
          .from(PUBLIC_ASSET_BUCKET)
          .remove([productImage]);
      }
      setProducts((current) => current.filter((item) => item.id !== id));
    } else {
      setMedia((current) => current.filter((item) => item.id !== id));
    }
  }

  async function uploadProductImage(
    product: DashboardProduct,
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const validationError = validateImage(file);
    if (validationError) {
      setNotice(validationError);
      return;
    }

    setUploadingProductId(product.id);
    const supabase = createClient();
    const path = `${profileId}/products/${product.id}-${crypto.randomUUID()}.${imageExtension(file)}`;
    const { error: uploadError } = await supabase.storage
      .from(PUBLIC_ASSET_BUCKET)
      .upload(path, file, {
        cacheControl: "31536000",
        contentType: file.type,
        upsert: false,
      });
    if (uploadError) {
      setUploadingProductId(null);
      setNotice(uploadError.message);
      return;
    }

    const { error } = await supabase
      .from("products")
      .update({ image_path: path })
      .eq("id", product.id);
    if (error) {
      await supabase.storage.from(PUBLIC_ASSET_BUCKET).remove([path]);
      setUploadingProductId(null);
      setNotice(error.message);
      return;
    }
    if (product.image_path) {
      await supabase.storage
        .from(PUBLIC_ASSET_BUCKET)
        .remove([product.image_path]);
    }
    setProducts((current) =>
      current.map((item) =>
        item.id === product.id ? { ...item, image_path: path } : item,
      ),
    );
    setUploadingProductId(null);
    setNotice("Product image updated.");
  }

  return (
    <Stack spacing={3}>
      {notice && <Alert severity="info" onClose={() => setNotice(null)}>{notice}</Alert>}
      <Paper className="commerce-editor" variant="outlined">
        <div className="commerce-editor__heading">
          <Box>
            <Chip icon={<StorefrontOutlined />} label="EXTERNAL CHECKOUT" size="small" />
            <Typography variant="h3">Shop cards</Typography>
            <Typography variant="body2" color="text.secondary">
              Add products, services, courses, or affiliate picks. Cueful sends
              visitors to your existing checkout and never processes payment.
            </Typography>
          </Box>
          <strong>{products.filter((item) => item.is_active).length} live</strong>
        </div>
        <div className="commerce-editor__form">
          <TextField
            label="Product name"
            value={productDraft.title}
            onChange={(event) => setProductDraft({ ...productDraft, title: event.target.value })}
          />
          <TextField
            select
            label="Category"
            value={productDraft.category}
            onChange={(event) => setProductDraft({ ...productDraft, category: event.target.value })}
          >
            {["digital", "merch", "service", "course", "affiliate"].map((item) => (
              <MenuItem value={item} key={item}>{item}</MenuItem>
            ))}
          </TextField>
          <TextField
            label="Short description"
            value={productDraft.description}
            onChange={(event) => setProductDraft({ ...productDraft, description: event.target.value })}
            className="commerce-editor__wide"
          />
          <TextField
            label="Price"
            type="number"
            value={productDraft.price}
            onChange={(event) => setProductDraft({ ...productDraft, price: event.target.value })}
          />
          <TextField
            label="Currency"
            value={productDraft.currency}
            inputProps={{ maxLength: 3 }}
            onChange={(event) =>
              setProductDraft({ ...productDraft, currency: event.target.value.toUpperCase() })
            }
          />
          <TextField
            label="Badge"
            placeholder="New, Sale, Popular"
            value={productDraft.badge}
            onChange={(event) => setProductDraft({ ...productDraft, badge: event.target.value })}
          />
          <TextField
            label="Button label"
            value={productDraft.cta}
            onChange={(event) => setProductDraft({ ...productDraft, cta: event.target.value })}
          />
          <TextField
            label="Destination URL"
            placeholder="https://gumroad.com/your-product"
            value={productDraft.url}
            onChange={(event) => setProductDraft({ ...productDraft, url: event.target.value })}
            className="commerce-editor__wide"
          />
        </div>
        <Button variant="contained" startIcon={<AddRounded />} onClick={addProduct}>
          Add product
        </Button>
        <div className="commerce-editor__items">
          {products.map((product) => (
            <div key={product.id}>
              <span className="commerce-editor__thumb">
                {product.image_path ? (
                  <Box component="img" src={publicAssetUrl(product.image_path)} alt="" />
                ) : (
                  <StorefrontOutlined />
                )}
              </span>
              <span><b>{product.title}</b><small>{product.category} · {product.currency} {product.price_amount ?? "—"}</small></span>
              <Button
                component="label"
                size="small"
                color="inherit"
                startIcon={
                  uploadingProductId === product.id ? (
                    <CircularProgress size={14} />
                  ) : (
                    <PhotoCameraOutlined />
                  )
                }
                disabled={uploadingProductId === product.id}
              >
                {product.image_path ? "Replace" : "Add image"}
                <input
                  hidden
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => uploadProductImage(product, event)}
                />
              </Button>
              <Switch
                size="small"
                checked={product.is_active}
                onChange={(event) => toggle("products", product.id, event.target.checked)}
              />
              <IconButton aria-label={`Delete ${product.title}`} onClick={() => remove("products", product.id)}>
                <DeleteOutlineRounded />
              </IconButton>
            </div>
          ))}
        </div>
      </Paper>

      <Paper className="commerce-editor" variant="outlined">
        <div className="commerce-editor__heading">
          <Box>
            <Chip icon={<MusicNoteRounded />} label="SAFE MEDIA" size="small" />
            <Typography variant="h3">Music and media</Typography>
            <Typography variant="body2" color="text.secondary">
              Paste an allow-listed media URL. Players load lazily and never autoplay.
            </Typography>
          </Box>
          <strong>{media.filter((item) => item.is_active).length} live</strong>
        </div>
        <div className="commerce-editor__form">
          <TextField
            label="Block title"
            placeholder="Listen to my latest release"
            value={mediaDraft.title}
            onChange={(event) => setMediaDraft({ ...mediaDraft, title: event.target.value })}
          />
          <TextField
            select
            label="Layout"
            value={mediaDraft.layout}
            onChange={(event) => setMediaDraft({ ...mediaDraft, layout: event.target.value })}
          >
            <MenuItem value="player">Full player</MenuItem>
            <MenuItem value="compact">Compact card</MenuItem>
          </TextField>
          <TextField
            label="Spotify, Apple Music, SoundCloud, YouTube, Bandcamp, Twitch, or Vimeo URL"
            value={mediaDraft.url}
            onChange={(event) => setMediaDraft({ ...mediaDraft, url: event.target.value })}
            className="commerce-editor__wide"
          />
        </div>
        <Button variant="contained" startIcon={<AddRounded />} onClick={addMedia}>
          Add media
        </Button>
        <div className="commerce-editor__items commerce-editor__items--media">
          {media.map((item) => (
            <div key={item.id}>
              <span><b>{item.title}</b><small>{item.provider.replace("_", " ")} · {item.layout}</small></span>
              <Switch
                size="small"
                checked={item.is_active}
                onChange={(event) => toggle("media_embeds", item.id, event.target.checked)}
              />
              <IconButton aria-label={`Delete ${item.title}`} onClick={() => remove("media_embeds", item.id)}>
                <DeleteOutlineRounded />
              </IconButton>
            </div>
          ))}
        </div>
      </Paper>
    </Stack>
  );
}
