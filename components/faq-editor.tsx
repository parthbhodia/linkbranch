"use client";

import { useState } from "react";
import AddRounded from "@mui/icons-material/AddRounded";
import ArrowDownwardRounded from "@mui/icons-material/ArrowDownwardRounded";
import ArrowUpwardRounded from "@mui/icons-material/ArrowUpwardRounded";
import DeleteOutlineRounded from "@mui/icons-material/DeleteOutlineRounded";
import EditRounded from "@mui/icons-material/EditRounded";
import HelpOutlineRounded from "@mui/icons-material/HelpOutlineRounded";
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
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { createClient } from "@/lib/supabase/client";

export type DashboardFaq = {
  id: number;
  question: string;
  answer: string;
  position: number;
  is_active: boolean;
};

const starterQuestions = [
  "What do you create?",
  "How can we work together?",
  "Where can people find your latest work?",
];

const emptyDraft = { question: "", answer: "" };

export function FaqEditor({
  profileId,
  initialFaqs,
}: {
  profileId: string;
  initialFaqs: DashboardFaq[];
}) {
  const [faqs, setFaqs] = useState(initialFaqs);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{
    severity: "success" | "error";
    message: string;
  } | null>(null);

  function startAdd(question = "") {
    setEditingId(null);
    setDraft({ question, answer: "" });
    setAdding(true);
  }

  function startEdit(faq: DashboardFaq) {
    setAdding(false);
    setEditingId(faq.id);
    setDraft({ question: faq.question, answer: faq.answer });
  }

  function cancelEdit() {
    setAdding(false);
    setEditingId(null);
    setDraft(emptyDraft);
  }

  async function saveFaq() {
    const question = draft.question.trim();
    const answer = draft.answer.trim();
    if (!question || !answer) {
      setNotice({
        severity: "error",
        message: "Add both a question and an answer.",
      });
      return;
    }

    setSaving(true);
    const supabase = createClient();
    if (editingId) {
      const { data, error } = await supabase
        .from("profile_faqs")
        .update({ question, answer })
        .eq("id", editingId)
        .eq("user_id", profileId)
        .select("id,question,answer,position,is_active")
        .single();
      setSaving(false);
      if (error || !data) {
        setNotice({
          severity: "error",
          message: error?.message ?? "Could not update that answer.",
        });
        return;
      }
      setFaqs((current) =>
        current.map((item) => (item.id === editingId ? data : item)),
      );
      setNotice({ severity: "success", message: "FAQ updated." });
    } else {
      const { data, error } = await supabase
        .from("profile_faqs")
        .insert({
          user_id: profileId,
          question,
          answer,
          position: faqs.length,
        })
        .select("id,question,answer,position,is_active")
        .single();
      setSaving(false);
      if (error || !data) {
        setNotice({
          severity: "error",
          message: error?.message ?? "Could not add that question.",
        });
        return;
      }
      setFaqs((current) => [...current, data]);
      setNotice({ severity: "success", message: "FAQ added to your page." });
    }
    cancelEdit();
  }

  async function toggleFaq(faq: DashboardFaq) {
    const next = !faq.is_active;
    setFaqs((current) =>
      current.map((item) =>
        item.id === faq.id ? { ...item, is_active: next } : item,
      ),
    );
    const { error } = await createClient()
      .from("profile_faqs")
      .update({ is_active: next })
      .eq("id", faq.id)
      .eq("user_id", profileId);
    if (error) {
      setFaqs((current) =>
        current.map((item) =>
          item.id === faq.id ? { ...item, is_active: faq.is_active } : item,
        ),
      );
      setNotice({ severity: "error", message: error.message });
    }
  }

  async function moveFaq(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= faqs.length) return;
    const previous = faqs;
    const next = [...faqs];
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    const normalized = next.map((item, position) => ({ ...item, position }));
    setFaqs(normalized);

    const supabase = createClient();
    const results = await Promise.all(
      normalized
        .filter((item, position) => previous[position]?.id !== item.id)
        .map((item) =>
          supabase
            .from("profile_faqs")
            .update({ position: item.position })
            .eq("id", item.id)
            .eq("user_id", profileId),
        ),
    );
    const error = results.find((result) => result.error)?.error;
    if (error) {
      setFaqs(previous);
      setNotice({ severity: "error", message: error.message });
    }
  }

  async function deleteFaq() {
    if (deleteId === null) return;
    const previous = faqs;
    setDeleteId(null);
    setFaqs((current) => current.filter((item) => item.id !== deleteId));
    const { error } = await createClient()
      .from("profile_faqs")
      .delete()
      .eq("id", deleteId)
      .eq("user_id", profileId);
    if (error) {
      setFaqs(previous);
      setNotice({ severity: "error", message: error.message });
      return;
    }
    setNotice({ severity: "success", message: "FAQ deleted." });
  }

  const form = (mode: "add" | "edit") => (
    <Paper className="faq-editor__form" variant="outlined">
      <Stack spacing={2}>
        <Box>
          <Typography fontWeight={850}>
            {mode === "add" ? "Add a useful answer" : "Edit answer"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Keep it brief. Visitors can expand it without leaving your page.
          </Typography>
        </Box>
        {mode === "add" && (
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            {starterQuestions.map((question) => (
              <Chip
                key={question}
                label={question}
                variant="outlined"
                onClick={() =>
                  setDraft((current) => ({ ...current, question }))
                }
              />
            ))}
          </Stack>
        )}
        <TextField
          label="Question"
          value={draft.question}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              question: event.target.value.slice(0, 160),
            }))
          }
          helperText={`${draft.question.length}/160`}
          fullWidth
        />
        <TextField
          label="Answer"
          value={draft.answer}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              answer: event.target.value.slice(0, 600),
            }))
          }
          helperText={`${draft.answer.length}/600`}
          multiline
          minRows={3}
          fullWidth
        />
        <Stack direction="row" spacing={1}>
          <Button variant="contained" onClick={saveFaq} disabled={saving}>
            {saving ? "Saving…" : mode === "add" ? "Add FAQ" : "Save changes"}
          </Button>
          <Button color="inherit" onClick={cancelEdit} disabled={saving}>
            Cancel
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );

  return (
    <section className="faq-editor" aria-labelledby="faq-editor-heading">
      <div className="workspace-panel__heading">
        <Box>
          <Typography id="faq-editor-heading" variant="h3">
            Questions & answers
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Answer common questions directly on your public page.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<AddRounded />}
          onClick={() => startAdd()}
          disabled={adding}
        >
          Add question
        </Button>
      </div>

      {adding && form("add")}

      <div className="faq-editor__list">
        {faqs.map((faq, index) =>
          editingId === faq.id ? (
            <div key={faq.id}>{form("edit")}</div>
          ) : (
            <Paper className="faq-editor__item" variant="outlined" key={faq.id}>
              <div className="faq-editor__index">
                <HelpOutlineRounded />
                <span>{String(index + 1).padStart(2, "0")}</span>
              </div>
              <div className="faq-editor__copy">
                <Typography fontWeight={850}>{faq.question}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {faq.answer}
                </Typography>
              </div>
              <div className="faq-editor__actions">
                <Tooltip title={faq.is_active ? "Visible on profile" : "Hidden"}>
                  <Switch
                    size="small"
                    checked={faq.is_active}
                    onChange={() => toggleFaq(faq)}
                    inputProps={{
                      "aria-label": `${faq.is_active ? "Hide" : "Show"} ${faq.question}`,
                    }}
                  />
                </Tooltip>
                <Tooltip title="Move up">
                  <span>
                    <IconButton
                      size="small"
                      disabled={index === 0}
                      onClick={() => moveFaq(index, -1)}
                      aria-label={`Move ${faq.question} up`}
                    >
                      <ArrowUpwardRounded fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Move down">
                  <span>
                    <IconButton
                      size="small"
                      disabled={index === faqs.length - 1}
                      onClick={() => moveFaq(index, 1)}
                      aria-label={`Move ${faq.question} down`}
                    >
                      <ArrowDownwardRounded fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Edit">
                  <IconButton
                    size="small"
                    onClick={() => startEdit(faq)}
                    aria-label={`Edit ${faq.question}`}
                  >
                    <EditRounded fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => setDeleteId(faq.id)}
                    aria-label={`Delete ${faq.question}`}
                  >
                    <DeleteOutlineRounded fontSize="small" />
                  </IconButton>
                </Tooltip>
              </div>
            </Paper>
          ),
        )}
      </div>

      {faqs.length === 0 && !adding && (
        <Box className="workspace-empty faq-editor__empty">
          <HelpOutlineRounded />
          <Typography fontWeight={850}>No FAQs yet</Typography>
          <Typography variant="body2" color="text.secondary">
            Add answers about your work, availability, shipping, or referrals.
          </Typography>
          <Button variant="contained" onClick={() => startAdd(starterQuestions[0])}>
            Add your first answer
          </Button>
        </Box>
      )}

      <Dialog open={deleteId !== null} onClose={() => setDeleteId(null)}>
        <DialogTitle>Delete this FAQ?</DialogTitle>
        <DialogContent>
          It will disappear from your public page immediately.
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={() => setDeleteId(null)}>
            Cancel
          </Button>
          <Button color="error" variant="contained" onClick={deleteFaq}>
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
