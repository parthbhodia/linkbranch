import assert from "node:assert/strict";
import { test } from "node:test";

import { groupLinksBySection, sortLinksBySection } from "./link-groups.ts";

type Row = { id: number; group_name: string };
const link = (id: number, group_name = ""): Row => ({ id, group_name });
const heading = (link: Row) => link.group_name;
const shape = (rows: Row[]) =>
  groupLinksBySection(rows, heading).map((group) => [
    group.name,
    group.links.map((item) => item.id),
  ]);

test("groups links by name in order of first appearance", () => {
  assert.deepEqual(shape([link(1, "Work"), link(2, "Work"), link(3, "Press")]), [
    ["Work", [1, 2]],
    ["Press", [3]],
  ]);
});

test("empty names form the unsectioned group", () => {
  assert.deepEqual(shape([link(1), link(2, "Shop"), link(3)]), [
    ["", [1, 3]],
    ["Shop", [2]],
  ]);
});

test("non-contiguous links with the same name collapse into one group", () => {
  assert.deepEqual(shape([link(1, "Work"), link(2, "Press"), link(3, "Work")]), [
    ["Work", [1, 3]],
    ["Press", [2]],
  ]);
});

test("whitespace-only names are treated as unsectioned", () => {
  const groups = groupLinksBySection([link(1, "   "), link(2, "Work")], heading);
  assert.deepEqual(
    groups.map((group) => group.name),
    ["", "Work"],
  );
});

test("sortLinksBySection keeps each section contiguous", () => {
  const sorted = sortLinksBySection(
    [link(1, "Work"), link(2, "Press"), link(3, "Work")],
    heading,
  );
  assert.deepEqual(
    sorted.map((item) => item.id),
    [1, 3, 2],
  );
});

test("an already-grouped list is left alone", () => {
  const links = [link(1, "Work"), link(2, "Work"), link(3, "")];
  assert.deepEqual(sortLinksBySection(links, heading), links);
});
