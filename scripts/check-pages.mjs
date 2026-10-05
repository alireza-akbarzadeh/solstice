// Creates and removes its own database fixtures. Existing website content is never changed.
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
      ])
        if (existsSync(candidate) && /\.(ts|js)$/.test(candidate))
          return { url: pathToFileURL(candidate).href, shortCircuit: true };
    return nextResolve(specifier, context);
  },
});

const { eq } = await import("drizzle-orm");
const { db } = await import(
  new URL("../src/server/db/index.ts", import.meta.url).href
);
const { sitePages } = await import(
  new URL("../src/server/db/schema/index.ts", import.meta.url).href
);
const { defaultContentFor, editableContentFor } = await import(
  new URL("../src/modules/pages/defaults.ts", import.meta.url).href
);
const definitions = await import(
  new URL("../src/modules/pages/definitions.ts", import.meta.url).href
);
const validation = await import(
  new URL("../src/modules/pages/schemas.ts", import.meta.url).href
);
const service = await import(
  new URL("../src/modules/pages/server/mutations.ts", import.meta.url).href
);
const library = await import(
  new URL("../src/modules/pages/server/library.ts", import.meta.url).href
);

for (const { slug } of definitions.pageDefinitions) {
  const content = validation.pageContentSchema.parse(defaultContentFor(slug));
  assert.ok(
    validation.validBuiltinContent(content, content),
    `${slug}: default content must be editable`,
  );
}
for (const slug of [
  "about",
  "api",
  "instructor",
  "fa",
  "membership",
  "sign-up",
  "checkout",
  "test",
  "../retreat",
  "new_page",
  "retreat/booking",
])
  assert.equal(
    definitions.isCustomPageSlug(slug),
    false,
    `${slug} must not shadow an existing route`,
  );
assert.equal(definitions.isCustomPageSlug("spring-retreat-2027"), true);
for (const link of [
  "javascript:alert(1)",
  "//example.com",
  "/\\example.com",
  "http://example.com",
  "https://user:secret@example.com",
])
  assert.equal(validation.safePageLink(link), false);
assert.equal(validation.safePageLink("/membership"), true);
assert.equal(validation.safePageLink("https://example.com/book"), true);

const previousSettings = defaultContentFor("site-settings");
delete previousSettings.copy.en.Footer.statement;
delete previousSettings.copy.fa.Footer.statement;
previousSettings.copy.en.Footer.retiredField = "Old copy";
previousSettings.copy.fa.Footer.retiredField = "متن قبلی";
// Social links moved to studio settings; saved pages still carry the old asset keys.
previousSettings.assets.instagram = "https://instagram.com";
const inherited = editableContentFor("site-settings", previousSettings);
assert.ok(inherited.copy.en.Footer.statement);
assert.equal(inherited.copy.en.Footer.retiredField, undefined);
assert.deepEqual(inherited.assets, {});
assert.ok(
  validation.validBuiltinContent(inherited, defaultContentFor("site-settings")),
  "older content inherits new editable fields",
);

const reorderedPolicy = defaultContentFor("privacy");
reorderedPolicy.copy.en["Legal.privacy"].sections.reverse();
reorderedPolicy.copy.fa["Legal.privacy"].sections.reverse();
assert.deepEqual(
  editableContentFor("privacy", reorderedPolicy).copy,
  reorderedPolicy.copy,
  "normalizing reordered sections preserves optional list items",
);

const template = defaultContentFor("about");
const changed = structuredClone(template);
changed.copy.en.About.hero.title = "An instructor story edited in the studio";
assert.ok(validation.validBuiltinContent(changed, template));
const injected = structuredClone(template);
injected.copy.en.Auth = { signIn: "Unexpected override" };
assert.equal(
  validation.validBuiltinContent(injected, template),
  false,
  "page copy cannot change unrelated namespaces",
);
const unpaired = structuredClone(template);
unpaired.copy.en.About.faq.items.pop();
assert.equal(
  validation.validBuiltinContent(unpaired, template),
  false,
  "repeatable items must stay paired across locales",
);
assert.equal(
  validation.compatibleCopy("Year {year}", "Copyright {year}"),
  true,
);
assert.equal(
  validation.compatibleCopy("Copyright {date}", "Copyright {year}"),
  false,
);
assert.equal(
  validation.compatibleCopy("Copyright {year", "Copyright {year}"),
  false,
);
assert.equal(
  validation.compatibleCopy("Hello <b>friend</b>", "Hello <link>friend</link>"),
  false,
);
assert.equal(
  validation.compatibleCopy(
    "{count, plural, one {day} other {days}}",
    "{count, plural, one {day} other {days}}",
  ),
  true,
);
const base = {
  About: { hero: { title: "Default", newlyAdded: "New default field" } },
  Studio: { title: "Protected" },
};
assert.deepEqual(
  definitions.mergePublishedCopy(base, "en", [
    { slug: "about", publishedContent: changed },
  ]).About.hero.newlyAdded,
  "New default field",
);
assert.equal(
  definitions.mergePublishedCopy(base, "en", [
    { slug: "about", publishedContent: injected },
  ]).Studio.title,
  "Protected",
);
assert.equal(
  definitions.mergePublishedCopy(base, "en", [
    { slug: "unregistered", publishedContent: injected },
  ]).About.hero.title,
  "Default",
);
assert.equal(
  definitions.mergePublishedCopy(base, "en", [
    { slug: "about", publishedContent: null },
  ]).About.hero.title,
  "Default",
);
console.log(
  "Page validation passed: 16 templates, bilingual pairing, reserved routes, safe links, namespace limits and translation variables.",
);

const slug = `page-check-${Date.now().toString(36)}`;
const content = {
  ...definitions.blankPageContent(),
  title: { en: `Workshop ${slug}`, fa: `کارگاه ${slug}` },
  description: { en: "A workshop landing page", fa: "صفحهٔ معرفی کارگاه" },
  image: "/images/home/04.jpg",
  imageAlt: { en: "Yoga studio", fa: "استودیوی یوگا" },
  videoUrl: "https://youtu.be/jNQXAC9IVRw",
  actionHref: "/membership",
  actionLabel: { en: "Join the studio", fa: "عضویت در استودیو" },
  showInNavigation: true,
  showInFooter: true,
  body: [
    {
      type: "p",
      text: {
        en: "First published workshop details",
        fa: "جزئیات منتشرشدهٔ کارگاه",
      },
    },
  ],
};

const baseURL = process.env.CMS_CHECK_URL;
async function checkURL(locale, status, expected, absent) {
  if (!baseURL) return;
  const response = await fetch(
    `${baseURL}${locale === "fa" ? "/fa" : ""}/${slug}`,
    { signal: AbortSignal.timeout(55000) },
  );
  assert.equal(response.status, status);
  const html = await response.text();
  const visible = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, "")
    .replace(/<[^>]*>/g, " ");
  if (expected)
    assert.ok(
      visible.includes(expected),
      `public ${locale} must render the published text`,
    );
  if (absent)
    assert.ok(
      !visible.includes(absent),
      "draft edits must not appear publicly",
    );
  if (status === 200) {
    assert.ok(html.includes("youtube-nocookie.com/embed/jNQXAC9IVRw"));
    assert.ok(
      html.includes(`href="${locale === "fa" ? "/fa" : ""}/membership"`),
    );
    if (locale === "fa") assert.ok(html.includes('dir="rtl"'));
    const pathname = `${locale === "fa" ? "/fa" : ""}/${slug}`;
    assert.ok(
      html.includes(
        `rel="canonical" href="${new URL(pathname, baseURL).href}"`,
      ),
      "custom pages must use their localized public address as the canonical URL",
    );
    for (const [language, prefix] of [
      ["en", ""],
      ["fa", "/fa"],
    ])
      assert.ok(
        html.includes(
          `hrefLang="${language}" href="${new URL(`${prefix}/${slug}`, baseURL).href}"`,
        ),
        "custom pages must expose both translated addresses",
      );
  }
}

async function checkPublishedLinks(locale, published) {
  if (!baseURL) return;
  const prefix = locale === "fa" ? "/fa" : "";
  const response = await fetch(`${baseURL}${prefix}/about`, {
    signal: AbortSignal.timeout(55000),
  });
  assert.equal(response.status, 200);
  const html = await response.text();
  for (const tag of ["header", "footer"]) {
    const attributes =
      tag === "footer" ? '[^>]*id="site-footer"[^>]*' : "[^>]*";
    const section = html.match(
      new RegExp(`<${tag}\\b${attributes}>[\\s\\S]*?</${tag}>`),
    )?.[0];
    assert.ok(section, `${tag} must be rendered`);
    assert.equal(
      section.includes(`href="${prefix}/${slug}"`),
      published,
      `the ${locale} ${tag} must only link to published pages`,
    );
  }
}

try {
  assert.equal(
    (await service.createSitePage("about", content)).error,
    "reserved",
  );
  assert.equal(
    (await service.createSitePage(`${slug}-invalid`, undefined)).error,
    "invalid",
  );
  assert.equal((await service.createSitePage(slug, content)).ok, true);
  assert.equal(
    (await service.createSitePage(slug, content)).error,
    "duplicate",
  );
  assert.equal(await library.getPublishedCustomPage(slug), null);
  assert.ok(
    !(await library.getNavigationPages("en")).some(
      (page) => page.href === `/${slug}`,
    ),
  );
  await checkURL("en", 404);
  await checkPublishedLinks("en", false);
  assert.equal(
    (
      await service.saveSitePage(
        slug,
        { ...content, description: { en: "", fa: "" } },
        true,
      )
    ).error,
    "incomplete",
  );
  assert.equal((await service.saveSitePage(slug, content, true)).ok, true);
  assert.equal(
    (await library.getPublishedCustomPage(slug)).publishedContent.videoUrl,
    content.videoUrl,
  );
  assert.ok(
    (await library.getNavigationPages("fa")).some(
      (page) => page.href === `/${slug}` && page.label === content.title.fa,
    ),
  );
  assert.ok(
    (await library.getFooterPages("en")).some((page) => page.slug === slug),
  );
  await checkURL("en", 200, content.body[0].text.en);
  await checkURL("fa", 200, content.body[0].text.fa);
  await checkPublishedLinks("en", true);
  await checkPublishedLinks("fa", true);
  const draft = {
    ...content,
    body: [
      {
        type: "p",
        text: {
          en: "Unpublished revised workshop",
          fa: "ویرایش منتشرنشدهٔ کارگاه",
        },
      },
    ],
  };
  assert.equal((await service.saveSitePage(slug, draft)).ok, true);
  const row = await library.getSitePage(slug);
  assert.equal(row.draftContent.body[0].text.en, draft.body[0].text.en);
  assert.equal(row.publishedContent.body[0].text.en, content.body[0].text.en);
  await checkURL("en", 200, content.body[0].text.en, draft.body[0].text.en);
  assert.equal((await service.unpublishSitePage("about")).error, "protected");
  assert.equal((await service.deleteSitePage("about")).error, "protected");
  assert.equal(
    (await service.saveSitePage("about", injected, true)).error,
    "copy",
  );
  assert.equal((await service.unpublishSitePage(slug)).ok, true);
  assert.equal(await library.getPublishedCustomPage(slug), null);
  assert.ok(
    !(await library.getFooterPages("en")).some((page) => page.slug === slug),
  );
  await checkURL("en", 404);
  await checkPublishedLinks("en", false);
  await checkPublishedLinks("fa", false);
  assert.equal((await service.deleteSitePage(slug)).ok, true);
  assert.equal(await library.getSitePage(slug), null);
  assert.equal((await service.saveSitePage(slug, content)).error, "missing");
  console.log(
    `Page database${baseURL ? " and HTTP" : ""} checks passed: create/edit/publish, private drafts, YouTube, bilingual pages, menu/footer visibility, protected built-ins, unpublish and delete.`,
  );
} finally {
  await db.delete(sitePages).where(eq(sitePages.slug, slug));
  await db.$client.end();
}
