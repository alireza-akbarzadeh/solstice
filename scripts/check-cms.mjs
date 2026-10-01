// Integration verification against the configured database; creates and removes only its own fixtures.
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { registerHooks } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
registerHooks({
  resolve(specifier, context, nextResolve) {
    let base;
    if (specifier.startsWith("@/"))
      base = path.join(root, "src", specifier.slice(2));
    else if (
      specifier.startsWith(".") &&
      context.parentURL?.startsWith(pathToFileURL(path.join(root, "src")).href)
    )
      base = path.resolve(
        path.dirname(fileURLToPath(context.parentURL)),
        specifier,
      );
    if (base)
      for (const candidate of [
        base,
        `${base}.ts`,
        `${base}.js`,
        path.join(base, "index.ts"),
      ]) {
        if (existsSync(candidate) && /\.(ts|js)$/.test(candidate))
          return { url: pathToFileURL(candidate).href, shortCircuit: true };
      }
    return nextResolve(specifier, context);
  },
});

const { eq, and } = await import("drizzle-orm");
const { db } = await import(
  new URL("../src/server/db/index.ts", import.meta.url).href
);
const { practices, programs, programEnrollments, practiceCompletions, user } =
  await import(new URL("../src/server/db/schema.ts", import.meta.url).href);
const practiceService = await import(
  new URL("../src/modules/instructor/server/publish.ts", import.meta.url).href
);
const programService = await import(
  new URL("../src/modules/instructor/server/programs.ts", import.meta.url).href
);
const { getPractice } = await import(
  new URL("../src/modules/practices/server/get-practice.ts", import.meta.url)
    .href
);
const { getProgram } = await import(
  new URL("../src/modules/programs/server/get-program.ts", import.meta.url).href
);

const fixture = `cms-check-${Date.now().toString(36)}`;
const localized = { en: "CMS verification", fa: "بررسی مدیریت محتوا" };
const empty = { en: "", fa: "" };
let createdProgram;
let completionId;
try {
  await db.insert(user).values({
    id: fixture,
    name: "CMS check",
    email: `${fixture}@solstice.test`,
    emailVerified: false,
    role: "member",
  });
  assert.equal(
    await practiceService.createPractice(fixture, {
      title: localized,
      summary: localized,
      series: localized,
      category: "morning",
      intensityLevel: "gentle",
      intensityLabel: localized,
      props: "none",
      durationMinutes: 10,
      access: "open",
      previewSeconds: null,
      image: "/images/home/04.jpg",
      imageAlt: localized,
      poster: null,
      videoAssetId: "jNQXAC9IVRw",
      videoProvider: "youtube",
    }),
    true,
  );
  assert.equal(
    await getPractice("en", fixture),
    null,
    "draft practice must stay private",
  );
  assert.equal(
    await practiceService.setPracticeStatus(fixture, "published"),
    true,
  );
  assert.equal((await getPractice("en", fixture)).videoProvider, "youtube");
  assert.equal(
    await practiceService.updatePracticeMeta({
      slug: fixture,
      title: localized,
      summary: localized,
      series: localized,
      category: "morning",
      intensityLevel: "gentle",
      intensityLabel: localized,
      props: "none",
      durationMinutes: 12,
      access: "open",
      previewSeconds: null,
      image: "/images/home/05.jpg",
      imageAlt: localized,
      poster: "/images/home/04.jpg",
    }),
    true,
  );
  assert.equal(
    (await getPractice("fa", fixture)).image,
    "/images/home/05.jpg",
    "cover edits must persist",
  );

  const [other] = await db
    .select({ slug: practices.slug })
    .from(practices)
    .where(and(eq(practices.status, "published")))
    .limit(1);
  const fields = {
    title: { en: fixture, fa: "برنامهٔ بررسی" },
    description: localized,
    heroTitle: empty,
    lede: empty,
    badge: empty,
    cta: localized,
    note: empty,
    image: "/images/home/07.jpg",
    imageAlt: localized,
    tone: "primary",
    icon: "sunrise",
    pacing: "self",
    weeks: [
      {
        label: localized,
        title: localized,
        description: empty,
        focus: empty,
        practices: [fixture, other.slug],
      },
    ],
  };
  const created = await programService.createProgram(fields);
  assert.equal(created.ok, true);
  createdProgram = created.slug;
  assert.equal(
    await getProgram("en", createdProgram),
    null,
    "draft program must stay private",
  );
  assert.equal(
    (await programService.setProgramStatus(createdProgram, "published")).ok,
    true,
  );
  const publicProgram = await getProgram("fa", createdProgram);
  assert.equal(publicProgram.totalDays, 2);
  assert.equal(publicProgram.title, "برنامهٔ بررسی");
  assert.equal(
    (
      await programService.updateProgram(createdProgram, {
        ...fields,
        weeks: [{ ...fields.weeks[0], practices: ["missing-practice"] }],
      })
    ).error,
    "practices",
  );
  assert.equal(
    await practiceService.deletePractice(fixture),
    false,
    "a referenced practice must not be deleted",
  );

  const tester = { id: fixture };
  if (tester) {
    await db
      .insert(programEnrollments)
      .values({ userId: tester.id, programSlug: createdProgram });
    assert.equal(
      (
        await programService.updateProgram(createdProgram, {
          ...fields,
          weeks: [{ ...fields.weeks[0], practices: [other.slug, fixture] }],
        })
      ).error,
      "enrolled",
    );
    assert.equal(
      (
        await programService.updateProgram(createdProgram, {
          ...fields,
          description: { en: "Edited description", fa: "توضیح ویرایش‌شده" },
        })
      ).ok,
      true,
    );
    const [completion] = await db
      .insert(practiceCompletions)
      .values({
        userId: tester.id,
        practiceSlug: fixture,
        minutes: 12,
        programSlug: createdProgram,
        programDay: 1,
      })
      .returning({ id: practiceCompletions.id });
    completionId = completion.id;
  }
  assert.equal((await programService.deleteProgram(createdProgram)).ok, true);
  assert.equal(await getProgram("en", createdProgram), null);
  assert.equal(await practiceService.deletePractice(fixture), true);
  assert.equal(await getPractice("en", fixture), null);
  if (completionId)
    assert.equal(
      (
        await db
          .select()
          .from(practiceCompletions)
          .where(eq(practiceCompletions.id, completionId))
      ).length,
      1,
      "deleting content must preserve completed practice history",
    );
  console.log(
    "CMS database checks passed: draft privacy, YouTube metadata, cover edits, curriculum validation, enrollment protection and deletion/history.",
  );
} finally {
  if (createdProgram) {
    await db
      .delete(programEnrollments)
      .where(eq(programEnrollments.programSlug, createdProgram));
    await db.delete(programs).where(eq(programs.slug, createdProgram));
  }
  if (completionId)
    await db
      .delete(practiceCompletions)
      .where(eq(practiceCompletions.id, completionId));
  await db.delete(practices).where(eq(practices.slug, fixture));
  await db.delete(user).where(eq(user.id, fixture));
  await db.$client.end();
}
