import assert from "node:assert/strict";
import test from "node:test";

const { parseVideoAsset, parseYouTubeId, parseAparatHash } = await import(
  new URL("../src/infrastructure/video/assets.ts", import.meta.url).href
);
const { hasPublishableCurriculum, sameCurriculum, programFieldsSchema } =
  await import(
    new URL("../src/modules/programs/schemas.ts", import.meta.url).href
  );
const { formatChapterTime, parseChapterTime, sortChapters } = await import(
  new URL("../src/modules/practices/chapters.ts", import.meta.url).href
);
const { chapterSchema, practiceFormSchema } = await import(
  new URL("../src/modules/practices/schemas.ts", import.meta.url).href
);
const { DEFAULT_TESTIMONIALS } = await import(
  new URL("../src/modules/testimonials/defaults.ts", import.meta.url).href
);
const { testimonialFormSchema, testimonialReorderSchema } = await import(
  new URL("../src/modules/testimonials/schemas.ts", import.meta.url).href
);
const {
  calculateRepeatFactor,
  calculateSaveConversion,
  calculateCohortCurve,
  calculateHabitRhythm,
  DAY_MS,
} = await import(
  new URL("../src/modules/instructor/retention.ts", import.meta.url).href
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

test("Chapter time parser and formatter handle mm:ss, hh:mm:ss, and Persian digits", () => {
  // Format
  assert.equal(formatChapterTime(0), "00:00");
  assert.equal(formatChapterTime(5), "00:05");
  assert.equal(formatChapterTime(65), "01:05");
  assert.equal(formatChapterTime(255), "04:15");
  assert.equal(formatChapterTime(3600), "1:00:00");
  assert.equal(formatChapterTime(3665), "1:01:05");

  // Parse standard
  assert.equal(parseChapterTime("00:00"), 0);
  assert.equal(parseChapterTime("4:15"), 255);
  assert.equal(parseChapterTime("04:15"), 255);
  assert.equal(parseChapterTime("1:01:05"), 3665);
  assert.equal(parseChapterTime("255"), 255);
  assert.equal(parseChapterTime(255), 255);

  // Parse Persian numerals
  assert.equal(parseChapterTime("۰۴:۱۵"), 255);
  assert.equal(parseChapterTime("۱:۰۱:۰۵"), 3665);
  assert.equal(parseChapterTime("۲۵۵"), 255);

  // Parse edge cases
  assert.equal(parseChapterTime(""), 0);
  assert.equal(parseChapterTime("invalid"), 0);
  assert.equal(parseChapterTime(-10), 0);

  // Sorting
  const unsorted = [
    { title: { en: "C", fa: "ج" }, description: { en: "", fa: "" }, startSeconds: 300 },
    { title: { en: "A", fa: "الف" }, description: { en: "", fa: "" }, startSeconds: 0 },
    { title: { en: "B", fa: "ب" }, description: { en: "", fa: "" }, startSeconds: 120 },
  ];
  const sorted = sortChapters(unsorted);
  assert.deepEqual(
    sorted.map((c) => c.startSeconds),
    [0, 120, 300],
  );
});

test("Practice form schema validates and auto-sorts chapters", () => {
  const validBase = {
    title: { en: "Morning Solar Flow", fa: "توالی خورشیدی صبحگاهی" },
    summary: { en: "A gentle energizing flow.", fa: "جریانی آرام و انرژی‌بخش." },
    series: { en: "Solar Series", fa: "مجموعه خورشیدی" },
    category: "morning",
    intensityLevel: "gentle",
    intensityLabel: { en: "Gentle", fa: "ملایم" },
    props: "none",
    durationMinutes: 30,
    access: "open",
    previewSeconds: null,
    image: "/images/practices/solar.jpg",
    imageAlt: { en: "Yoga mat in morning light", fa: "مت یوگا در نور صبح" },
    poster: "",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  };

  // Valid with empty chapters
  const withNoChapters = practiceFormSchema.safeParse({ ...validBase, chapters: [] });
  assert.equal(withNoChapters.success, true);
  if (withNoChapters.success) {
    assert.deepEqual(withNoChapters.data.chapters, []);
  }

  // Valid with out-of-order chapters -> sorted by startSeconds
  const withUnsortedChapters = practiceFormSchema.safeParse({
    ...validBase,
    chapters: [
      {
        title: { en: "Savasana", fa: "شاوآسانا" },
        description: { en: "Final stillness", fa: "سکون پایانی" },
        startSeconds: 1500,
      },
      {
        title: { en: "Centering", fa: "مرکزیابی" },
        description: { en: "Breathwork", fa: "تنفس" },
        startSeconds: 0,
      },
      {
        title: { en: "Sun Salutation", fa: "سلام بر خورشید" },
        description: { en: "Flow sequence", fa: "توالی روان" },
        startSeconds: 300,
      },
    ],
  });
  assert.equal(withUnsortedChapters.success, true);
  if (withUnsortedChapters.success) {
    assert.deepEqual(
      withUnsortedChapters.data.chapters.map((c) => c.startSeconds),
      [0, 300, 1500],
    );
    assert.equal(withUnsortedChapters.data.chapters[0].title.en, "Centering");
  }

  // Invalid: chapter with missing title in one language
  const withMissingTitle = practiceFormSchema.safeParse({
    ...validBase,
    chapters: [
      {
        title: { en: "Centering", fa: "" },
        description: { en: "", fa: "" },
        startSeconds: 0,
      },
    ],
  });
  assert.equal(withMissingTitle.success, false);
});

test("Default testimonials and schema validation guard bilingual integrity", () => {
  assert.equal(DEFAULT_TESTIMONIALS.length, 3);
  for (const item of DEFAULT_TESTIMONIALS) {
    assert.ok(item.id.length > 0);
    assert.ok(item.name.en.length > 0);
    assert.ok(item.name.fa.length > 0);
    assert.ok(item.quote.en.length > 0);
    assert.ok(item.quote.fa.length > 0);
    assert.equal(item.rating, 5);
    assert.equal(typeof item.order, "number");
    assert.equal(item.hidden, false);

    const validated = testimonialFormSchema.safeParse(item);
    assert.equal(validated.success, true);
  }

  // Missing Persian name
  const missingFaName = testimonialFormSchema.safeParse({
    ...DEFAULT_TESTIMONIALS[0],
    name: { en: "Clara", fa: "" },
  });
  assert.equal(missingFaName.success, false);

  // Missing English quote
  const missingEnQuote = testimonialFormSchema.safeParse({
    ...DEFAULT_TESTIMONIALS[0],
    quote: { en: "", fa: "«نقل قول»" },
  });
  assert.equal(missingEnQuote.success, false);

  // Reorder schema
  assert.equal(
    testimonialReorderSchema.safeParse({ orderedIds: ["amina", "clara", "marcus"] }).success,
    true
  );
  assert.equal(
    testimonialReorderSchema.safeParse({ orderedIds: [] }).success,
    false
  );
});

test("Workshop schemas and CSV export ensure data integrity", async () => {
  const { workshopRegistrationSchema, workshopEventSchema } = await import(
    new URL("../src/modules/workshops/schemas.ts", import.meta.url).href
  );
  const { workshopAttendeesToCsv } = await import(
    new URL("../src/modules/workshops/csv.ts", import.meta.url).href
  );

  // Registration schema
  const validReg = workshopRegistrationSchema.safeParse({
    pageSlug: "spring-retreat-2027",
    name: "Aria Sol",
    email: "aria@example.com",
    phone: "+989121234567",
    notes: "Vegan meals please",
  });
  assert.equal(validReg.success, true);

  const invalidEmail = workshopRegistrationSchema.safeParse({
    pageSlug: "spring-retreat-2027",
    name: "Aria",
    email: "not-an-email",
    phone: "123456",
    notes: "",
  });
  assert.equal(invalidEmail.success, false);

  const invalidPhone = workshopRegistrationSchema.safeParse({
    pageSlug: "spring-retreat-2027",
    name: "Aria",
    email: "aria@example.com",
    phone: "12",
    notes: "",
  });
  assert.equal(invalidPhone.success, false);

  // Workshop event schema
  const validEvent = workshopEventSchema.safeParse({
    enabled: true,
    startDate: "2027-04-10T09:00",
    endDate: "2027-04-12T18:00",
    timezone: "Asia/Tehran",
    locationType: "in_person",
    location: { en: "Shemshak Sanctuary", fa: "پناهگاه شمشک" },
    capacity: 20,
    priceLabel: { en: "$250 / 12,000,000 Toman", fa: "۱۲,۰۰۰,۰۰۰ تومان" },
    paymentInstructions: { en: "Transfer upon confirmation", fa: "واریز پس از تایید" },
    registrationOpen: true,
  });
  assert.equal(validEvent.success, true);

  // CSV export with formula injection sanitization and UTF-8 BOM
  const csv = workshopAttendeesToCsv(
    [
      {
        id: 101,
        pageSlug: "spring-retreat-2027",
        name: "=1+1",
        email: "malicious@example.com",
        phone: "+1234567890",
        status: "confirmed",
        notes: "@maliciousFormula",
        createdAt: new Date("2027-01-01T10:00:00Z"),
      },
    ],
    "Spring Retreat",
  );
  assert.ok(csv.startsWith("\uFEFF")); // UTF-8 BOM
  assert.ok(csv.includes("'=1+1")); // Sanitized leading =
  assert.ok(csv.includes("'@maliciousFormula")); // Sanitized leading @
  assert.ok(csv.includes("malicious@example.com"));
});

test("Retention analytics: repeat factor, save conversion, cohort curve and habit rhythms", () => {
  // Repeat factor
  assert.equal(calculateRepeatFactor(10, 5), 2);
  assert.equal(calculateRepeatFactor(14, 4), 3.5);
  assert.equal(calculateRepeatFactor(0, 0), 1);

  // Save conversion
  assert.equal(calculateSaveConversion(4, 5), 80);
  assert.equal(calculateSaveConversion(0, 10), 0);
  assert.equal(calculateSaveConversion(5, 0), null);

  // Cohort curve
  const now = new Date("2026-10-10T12:00:00Z");
  const member1Joined = new Date(now.getTime() - 35 * DAY_MS); // 35 days ago (eligible)
  const member2Joined = new Date(now.getTime() - 40 * DAY_MS); // 40 days ago (eligible)
  const member3Joined = new Date(now.getTime() - 10 * DAY_MS); // 10 days ago (too new, not 28d+)

  const members = [
    { id: "m1", createdAt: member1Joined },
    { id: "m2", createdAt: member2Joined },
    { id: "m3", createdAt: member3Joined },
  ];

  const completions = [
    // m1 completed in W1, W2, W4
    { userId: "m1", completedAt: new Date(member1Joined.getTime() + 2 * DAY_MS) },
    { userId: "m1", completedAt: new Date(member1Joined.getTime() + 10 * DAY_MS) },
    { userId: "m1", completedAt: new Date(member1Joined.getTime() + 25 * DAY_MS) },
    // m2 completed in W1 and W2
    { userId: "m2", completedAt: new Date(member2Joined.getTime() + 5 * DAY_MS) },
    { userId: "m2", completedAt: new Date(member2Joined.getTime() + 12 * DAY_MS) },
  ];

  const { points, totalCohortMembers } = calculateCohortCurve(members, completions, now);
  assert.equal(totalCohortMembers, 2); // m1 and m2 only
  assert.equal(points.length, 4);
  assert.equal(points[0].rate, 100); // W1: 2/2 = 100%
  assert.equal(points[1].rate, 100); // W2: 2/2 = 100%
  assert.equal(points[2].rate, 0);   // W3: 0/2 = 0%
  assert.equal(points[3].rate, 50);  // W4: 1/2 = 50%

  // Habit rhythm
  const memberActivity = [
    { userId: "m1", count: 12 }, // 12 in 4 weeks = 3/wk -> frequent
    { userId: "m2", count: 6 },  // 6 in 4 weeks = 1.5/wk -> regular
    { userId: "m3", count: 2 },  // 2 in 4 weeks = 0.5/wk -> occasional
  ];
  const habit = calculateHabitRhythm(5, memberActivity, 4); // 5 total active members
  assert.equal(habit.frequent, 1);
  assert.equal(habit.regular, 1);
  assert.equal(habit.occasional, 1);
  assert.equal(habit.dormant, 2); // 5 - (1+1+1) = 2 dormant
  assert.equal(habit.total, 5);
});



