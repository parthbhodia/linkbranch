import assert from "node:assert/strict";
import test from "node:test";
import {
  isUndefinedColumn,
  selectToleratingColumn,
  withoutColumn,
  UNDEFINED_COLUMN,
} from "./optional-columns.ts";

test("a missing column is recognised by its postgres code", () => {
  assert.equal(
    isUndefinedColumn({
      code: UNDEFINED_COLUMN,
      message: "column links.card_style does not exist",
    } as never),
    true,
  );
});

test("other errors and empty errors are not treated as a missing column", () => {
  assert.equal(isUndefinedColumn({ code: "23505", message: "dup" } as never), false);
  assert.equal(isUndefinedColumn(null), false);
  assert.equal(isUndefinedColumn(undefined), false);
});

test("the column comes out of the select string", () => {
  assert.equal(withoutColumn("id,title,card_style", "card_style"), "id,title");
  assert.equal(withoutColumn("a, b , c", "b"), "a,c");
});

test("a column whose name is a prefix of another is not removed with it", () => {
  assert.equal(
    withoutColumn("id,profile_id,card_style", "id"),
    "profile_id,card_style",
  );
});

test("removing the only column leaves an empty string rather than a stray comma", () => {
  assert.equal(withoutColumn("card_style", "card_style"), "");
});

test("a select that works is not retried", async () => {
  const attempts: string[] = [];
  const rows = await selectToleratingColumn(
    "id,card_style",
    "card_style",
    async (columns) => {
      attempts.push(columns);
      return { data: [{ id: 1, card_style: "image" }], error: null };
    },
  );
  assert.deepEqual(attempts, ["id,card_style"]);
  assert.deepEqual(rows, [{ id: 1, card_style: "image" }]);
});

test("a missing column falls back and still returns the other rows", async () => {
  const attempts: string[] = [];
  const rows = await selectToleratingColumn<{ id: number; card_style?: string }>(
    "id,title,card_style",
    "card_style",
    async (columns) => {
      attempts.push(columns);
      if (columns.includes("card_style")) {
        return {
          data: null,
          error: {
            code: UNDEFINED_COLUMN,
            message: "column links.card_style does not exist",
          } as never,
        };
      }
      return { data: [{ id: 1, title: "One" }], error: null };
    },
  );
  assert.deepEqual(attempts, ["id,title,card_style", "id,title"]);
  assert.deepEqual(rows, [{ id: 1, title: "One" }]);
});

test("an unrelated failure is not retried, and is not thrown at the page", async () => {
  const attempts: string[] = [];
  const rows = await selectToleratingColumn("id,card_style", "card_style", async (columns) => {
    attempts.push(columns);
    return {
      data: null,
      error: { code: "57014", message: "canceling statement" } as never,
    };
  });
  assert.deepEqual(attempts, ["id,card_style"]);
  assert.deepEqual(rows, []);
});

test("a failure on the fallback query returns no rows instead of throwing", async () => {
  const rows = await selectToleratingColumn("id,card_style", "card_style", async (columns) => ({
    data: null,
    error: {
      code: columns.includes("card_style") ? UNDEFINED_COLUMN : "57014",
      message: "nope",
    } as never,
  }));
  assert.deepEqual(rows, []);
});
