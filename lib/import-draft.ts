export const IMPORT_DRAFT_STORAGE_KEY = "cueful.import-draft.v1";

export type ImportedLink = {
  title: string;
  url: string;
  subtitle?: string;
};

export type ImportedSocial = {
  platform: string;
  url: string;
};

export type ImportedProfileDraft = {
  sourceUrl: string;
  suggestedUsername: string;
  displayName: string;
  bio: string;
  links: ImportedLink[];
  socials: ImportedSocial[];
  importedAt: string;
};

export function readImportedProfileDraft() {
  if (typeof window === "undefined") return null;

  try {
    const value = window.sessionStorage.getItem(IMPORT_DRAFT_STORAGE_KEY);
    if (!value) return null;
    const draft = JSON.parse(value) as ImportedProfileDraft;
    if (
      !draft.sourceUrl ||
      !draft.suggestedUsername ||
      !Array.isArray(draft.links) ||
      !Array.isArray(draft.socials)
    ) {
      return null;
    }
    return draft;
  } catch {
    return null;
  }
}
