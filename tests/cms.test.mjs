import assert from "node:assert/strict";
import test from "node:test";

const { parseVideoAsset, parseYouTubeId, parseAparatHash } = await import(
  new URL("../src/infrastructure/video/assets.ts", import.meta.url).href
);
const { hasPublishableCurriculum, sameCurriculum, programFieldsSchema } =
  await import(
    new URL("../src/modules/programs/schemas.ts", import.meta.url).href
  );

test("YouTube links use the embed provider even when the default provider is a file player", () => {
  for (const link of [
    "https://youtu.be/jNQXAC9IVRw?t=1",
    "https://www.youtube.com/watch?v=jNQXAC9IVRw",
    "https://m.youtube.com/shorts/jNQXAC9IVRw",
    "https://youtube.com/live/jNQXAC9IVRw",
    "https://www.youtube-nocookie.com/embed/jNQXAC9IVRw",
  ]) {
    assert.deepEqual(parseVideoAsset(link, "mock"), {
      providerId: "youtube",
      assetId: "jNQXAC9IVRw",
    });
  }
});

test("Invalid IDs and lookalike platform domains never become a file-player URL", () => {
  assert.equal(
    parseYouTubeId("https://youtube.com.evil.test/watch?v=jNQXAC9IVRw"),
    null,
  );
  assert.equal(
    parseVideoAsset("https://youtube.com/watch?v=invalid", "mock"),
    null,
  );
  assert.equal(
    parseVideoAsset("https://example.com/ordinary-webpage", "mock"),
    null,
  );
  assert.equal(parseVideoAsset("javascript:alert(1)"), null);
  assert.equal(parseAparatHash("https://fakeaparat.com/v/abcdefgh"), null);
});

test("Aparat and direct video files retain their providers", () => {
  assert.deepEqual(
    parseVideoAsset("https://www.aparat.com/v/abcdefgh", "mock"),
    { providerId: "aparat", assetId: "abcdefgh" },
  );
  assert.deepEqual(parseVideoAsset("https://example.com/class.mp4?token=abc"), {
    providerId: "mock",
    assetId: "https://example.com/class.mp4?token=abc",
  });
});

test("Publishing requires a nonempty curriculum with every referenced practice published", () => {
  const available = new Set(["flow", "rest"]);
  assert.equal(hasPublishableCurriculum([], available), false);
  assert.equal(hasPublishableCurriculum([{ practices: [] }], available), false);
  assert.equal(
    hasPublishableCurriculum([{ practices: ["flow", "draft"] }], available),
    false,
  );
  assert.equal(
    hasPublishableCurriculum(
      [{ practices: ["flow", "rest", "flow"] }],
      available,
    ),
    true,
  );
});

test("Enrolled curricula allow prose edits while detecting day moves and pacing changes", () => {
  const original = {
    pacing: "daily",
    weeks: [{ title: "Week one", practices: ["flow", "rest"] }],
  };
  assert.equal(
    sameCurriculum(original, {
      pacing: "daily",
      weeks: [{ title: "Better words", practices: ["flow", "rest"] }],
    }),
    true,
  );
  assert.equal(
    sameCurriculum(original, {
      pacing: "daily",
      weeks: [{ practices: ["rest", "flow"] }],
    }),
    false,
  );
  assert.equal(
    sameCurriculum(original, {
      pacing: "self",
      weeks: [{ practices: ["flow", "rest"] }],
    }),
    false,
  );
});

test("CMS rejects whitespace-only titles and unsafe cover URLs", () => {
  const localized = { en: "Practice", fa: "تمرین" };
  const empty = { en: "", fa: "" };
  const fields = {
    title: localized,
    description: localized,
    heroTitle: empty,
    lede: empty,
    badge: empty,
    cta: empty,
    note: empty,
    image: "/images/home/07.jpg",
    imageAlt: localized,
    tone: "primary",
    icon: "sunrise",
    pacing: "self",
    weeks: [],
  };
  assert.equal(programFieldsSchema.safeParse(fields).success, true);
  assert.equal(
    programFieldsSchema.safeParse({
      ...fields,
      title: { en: " ", fa: "تمرین" },
    }).success,
    false,
  );
  assert.equal(
    programFieldsSchema.safeParse({ ...fields, image: "javascript:alert(1)" })
      .success,
    false,
  );
});

const {
  extractIcuVariables,
  getIcuVarName,
  isMicrocopyKey,
  isMicrocopyNamespace,
} = await import(
  new URL("../src/modules/pages/microcopy.ts", import.meta.url).href
);

test("ICU variable extraction discovers variables and extracts root identifiers", () => {
  const sample = "Welcome {name}! You have completed {count, plural, one {# session} other {# sessions}} in {duration}.";
  const vars = extractIcuVariables(sample);
  assert.deepEqual(vars, ["{name}", "{count, plural, one {# session} other {# sessions}}", "{duration}"]);

  assert.equal(getIcuVarName("{name}"), "name");
  assert.equal(getIcuVarName("{count, plural, one {# session}}"), "count");
  assert.equal(getIcuVarName("{number, number}"), "number");
  assert.equal(getIcuVarName("invalid"), "invalid");

  assert.deepEqual(extractIcuVariables("No variables in plain text"), []);
});

test("Microcopy classifier separates app interactive elements from marketing copy", () => {
  // Microcopy keys
  assert.equal(isMicrocopyKey("actions"), true);
  assert.equal(isMicrocopyKey("buttons"), true);
  assert.equal(isMicrocopyKey("errors"), true);
  assert.equal(isMicrocopyKey("status"), true);
  assert.equal(isMicrocopyKey("toast"), true);
  assert.equal(isMicrocopyKey("saveButton"), true);
  assert.equal(isMicrocopyKey("genericError"), true);
  assert.equal(isMicrocopyKey("linkCopied"), true);

  // Marketing keys
  assert.equal(isMicrocopyKey("title"), false);
  assert.equal(isMicrocopyKey("subtitle"), false);
  assert.equal(isMicrocopyKey("hero"), false);
  assert.equal(isMicrocopyKey("intro"), false);
  assert.equal(isMicrocopyKey("philosophy"), false);
  assert.equal(isMicrocopyKey("body"), false);

  // Namespaces
  assert.equal(isMicrocopyNamespace("Practice"), true);
  assert.equal(isMicrocopyNamespace("PracticeDetail"), true);
  assert.equal(isMicrocopyNamespace("PracticeActions"), true);
  assert.equal(isMicrocopyNamespace("Program"), true);
  assert.equal(isMicrocopyNamespace("Auth"), true);
  assert.equal(isMicrocopyNamespace("About"), false);
  assert.equal(isMicrocopyNamespace("Home"), false);
  assert.equal(isMicrocopyNamespace("Membership"), false);
  assert.equal(isMicrocopyNamespace("Journal"), false);
});

