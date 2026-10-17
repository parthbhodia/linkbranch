import assert from "node:assert/strict";
import { test } from "node:test";

import {
  DEFAULT_WORKSPACE_SECTION,
  parseWorkspaceSection,
  workspaceSectionIds,
} from "./workspace-sections.ts";

test("round-trips every section the dashboard can open", () => {
  for (const id of workspaceSectionIds) {
    assert.equal(parseWorkspaceSection(id), id);
  }
});

test("the section the user was on survives a reload", () => {
  // The whole point: ?tab=appearance has to come back as "appearance", or an
  // OS-initiated reload during the photo picker drops them on Profile.
  assert.equal(parseWorkspaceSection("appearance"), "appearance");
});

test("an unrecognised tab lands on the default, never a blank workspace", () => {
  // The value arrives from the URL, so it can be stale or hand-edited.
  assert.equal(parseWorkspaceSection("designn"), null);
  assert.equal(parseWorkspaceSection("Appearance"), null);
  assert.equal(parseWorkspaceSection(""), null);
});

test("ignores anything that is not a string", () => {
  // Next hands repeated query keys over as an array.
  assert.equal(parseWorkspaceSection(["appearance"]), null);
  assert.equal(parseWorkspaceSection(undefined), null);
  assert.equal(parseWorkspaceSection(null), null);
  assert.equal(parseWorkspaceSection(0), null);
  assert.equal(parseWorkspaceSection({ tab: "appearance" }), null);
});

test("prototype keys are not sections", () => {
  assert.equal(parseWorkspaceSection("toString"), null);
  assert.equal(parseWorkspaceSection("constructor"), null);
});

test("the default is a real section", () => {
  assert.equal(
    parseWorkspaceSection(DEFAULT_WORKSPACE_SECTION),
    DEFAULT_WORKSPACE_SECTION,
  );
});
