"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  EyeIcon,
  GlobeIcon,
  KeyRoundIcon,
  MailCheckIcon,
  RotateCcwIcon,
  SaveIcon,
  SendIcon,
  SparklesIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { emailTemplatesFormSchema, type EmailTemplatesInput } from "@/modules/email/schemas";
import {
  DEFAULT_EMAIL_TEMPLATES,
  EMAIL_TEMPLATE_KEYS,
  EMAIL_TEMPLATE_METAS,
  interpolateEmailText,
  type AllEmailTemplates,
  type EmailTemplateKey,
} from "@/modules/email/templates";
import {
  resetEmailTemplate,
  saveEmailTemplates,
  sendTemplatePreviewEmail,
} from "@/modules/instructor/email-actions";

type LocaleKey = "en" | "fa";

export function EmailTemplatesEditor({ initial }: { initial: AllEmailTemplates }) {
  const t = useTranslations("Studio.email.templates");
  const [activeTemplate, setActiveTemplate] = useState<EmailTemplateKey>("verify");
  const [activeLocale, setActiveLocale] = useState<LocaleKey>("en");
  const [sendingTest, startSendTest] = useTransition();
  const [resetting, startReset] = useTransition();

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const form = useForm<EmailTemplatesInput>({
    resolver: zodResolver(emailTemplatesFormSchema),
    defaultValues: initial,
  });

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { isSubmitting },
  } = form;

  const currentSubject = watch(`${activeTemplate}.${activeLocale}.subject`);
  const currentBody = watch(`${activeTemplate}.${activeLocale}.body`);

  const meta = EMAIL_TEMPLATE_METAS[activeTemplate];
  const isUrlRequired = meta.requiredVariables.includes("{url}");
  const hasUrlInBody = currentBody?.includes("{url}") ?? false;

  // Inserts variable at cursor position in the active textarea
  const insertVariable = (variable: string) => {
    const el = textareaRef.current;
    if (!el) {
      const updated = currentBody ? `${currentBody} ${variable}` : variable;
      setValue(`${activeTemplate}.${activeLocale}.body`, updated, { shouldDirty: true, shouldValidate: true });
      return;
    }

    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    const before = el.value.slice(0, start);
    const after = el.value.slice(end);
    const updated = `${before}${variable}${after}`;

    setValue(`${activeTemplate}.${activeLocale}.body`, updated, { shouldDirty: true, shouldValidate: true });

    // Restore focus and selection
    setTimeout(() => {
      el.focus();
      const nextPos = start + variable.length;
      el.setSelectionRange(nextPos, nextPos);
    }, 0);
  };

  const onSubmit = handleSubmit(async (values) => {
    const result = await saveEmailTemplates(values);
    if (!result.ok) {
      if (result.error === "invalid" && result.detail?.includes("missing_url")) {
        toast.error(t("requiredMissing", { variable: "{url}" }));
      } else {
        toast.error(t("errors.saveFailed"));
      }
      return;
    }
    toast.success(t("saved"));
    reset(result.templates);
  });

  const handleResetToDefault = () => {
    if (!window.confirm(t("resetConfirm"))) return;
    startReset(async () => {
      const result = await resetEmailTemplate(activeTemplate);
      if (!result.ok) {
        toast.error(t("errors.resetFailed"));
        return;
      }
      toast.success(t("resetSuccess"));
      reset(result.templates);
    });
  };

  const handleSendPreview = () => {
    startSendTest(async () => {
      const result = await sendTemplatePreviewEmail({
        key: activeTemplate,
        locale: activeLocale,
        subject: currentSubject,
        body: currentBody,
      });

      if (result.ok) {
        toast.success(t("testSent", { email: result.to }));
      } else if (result.error === "delivery") {
        toast.error(t("errors.deliveryFailed", { detail: result.detail }), { duration: 8000 });
      } else {
        toast.error(t("errors.forbidden"));
      }
    });
  };

  // Sample data for preview rendering
  const sampleName = activeLocale === "fa" ? "النا" : "Elena";
  const sampleUrl = "https://arteyoga.com/sanctuary";
  const previewSubject = interpolateEmailText(currentSubject || "", { name: sampleName, url: sampleUrl });
  const previewBody = interpolateEmailText(currentBody || "", { name: sampleName, url: sampleUrl });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-space-lg">
      {/* Template Type Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/30 pb-space-sm">
        <div className="flex flex-wrap items-center gap-2">
          {EMAIL_TEMPLATE_KEYS.map((key) => {
            const isSelected = activeTemplate === key;
            const Icon = key === "verify" ? MailCheckIcon : key === "reset" ? KeyRoundIcon : SparklesIcon;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTemplate(key)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 font-label-md text-label-md transition-all ${
                  isSelected
                    ? "bg-primary text-on-primary shadow-sm"
                    : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                }`}
              >
                <Icon className="size-4" />
                <span>{t(`types.${key}.label`)}</span>
              </button>
            );
          })}
        </div>

        {/* Language Tabs */}
        <div className="flex items-center rounded-lg bg-surface-container-low p-1 border border-outline-variant/30">
          <button
            type="button"
            onClick={() => setActiveLocale("en")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-label-sm text-label-sm transition-colors ${
              activeLocale === "en"
                ? "bg-surface text-on-surface shadow-xs font-semibold"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <GlobeIcon className="size-3.5" />
            <span>English</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveLocale("fa")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-label-sm text-label-sm transition-colors ${
              activeLocale === "fa"
                ? "bg-surface text-on-surface shadow-xs font-semibold"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <GlobeIcon className="size-3.5" />
            <span>فارسی</span>
          </button>
        </div>
      </div>

      {/* Editor & Live Preview Grid */}
      <div className="grid grid-cols-1 items-start gap-gutter lg:grid-cols-12">
        {/* Left Column: Form Fields */}
        <div className="flex flex-col gap-space-md lg:col-span-7">
          <div className="rounded-xl border border-outline-variant/30 bg-surface-container-low/40 p-space-md flex flex-col gap-4">
            <div>
              <h3 className="font-label-lg text-label-lg text-on-surface">
                {t(`types.${activeTemplate}.label`)} — {activeLocale === "en" ? "English" : "فارسی"}
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                {t(`types.${activeTemplate}.description`)}
              </p>
            </div>

            {/* Variable Chips Toolbar & Protection Alert */}
            <div className="flex flex-col gap-2 rounded-lg bg-surface p-3 border border-outline-variant/40">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  {t("fields.variablesHint")}
                </span>
                <div className="flex items-center gap-1.5">
                  {isUrlRequired && (
                    hasUrlInBody ? (
                      <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 gap-1 text-xs py-0.5">
                        <CheckCircle2Icon className="size-3 text-emerald-600 dark:text-emerald-400" />
                        {t("fields.urlProtected")}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200 gap-1 text-xs py-0.5">
                        <AlertCircleIcon className="size-3 text-amber-600 dark:text-amber-400" />
                        {t("fields.requiredMissing", { variable: "{url}" })}
                      </Badge>
                    )
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                {meta.allowedVariables.map((v) => {
                  const isRequired = meta.requiredVariables.includes(v);
                  return (
                    <button
                      key={v}
                      type="button"
                      onClick={() => insertVariable(v)}
                      className="group flex items-center gap-1.5 rounded-md border border-outline-variant/60 bg-surface-container-low px-2.5 py-1 text-xs font-mono transition-all hover:border-primary hover:bg-primary-container/20 active:scale-95"
                      title={t("fields.insertVariable", { variable: v })}
                    >
                      <span className="font-semibold text-primary">{v}</span>
                      <span className="text-[10px] text-on-surface-variant opacity-70 group-hover:opacity-100">
                        {isRequired ? t("fields.required") : t("fields.optional")}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Subject Input */}
            <Controller
              control={control}
              name={`${activeTemplate}.${activeLocale}.subject`}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel htmlFor={`subject-${activeTemplate}-${activeLocale}`}>
                    {t("fields.subject")}
                  </FieldLabel>
                  <Input
                    {...field}
                    id={`subject-${activeTemplate}-${activeLocale}`}
                    dir={activeLocale === "fa" ? "rtl" : "ltr"}
                    className="font-medium"
                    placeholder={DEFAULT_EMAIL_TEMPLATES[activeTemplate][activeLocale].subject}
                  />
                  {fieldState.invalid && (
                    <FieldError>
                      {fieldState.error?.message === "too_long"
                        ? t("validation.too_long")
                        : fieldState.error?.message === "missing_url"
                          ? t("validation.missing_url")
                          : t("validation.required")}
                    </FieldError>
                  )}
                </Field>
              )}
            />

            {/* Body Textarea */}
            <Controller
              control={control}
              name={`${activeTemplate}.${activeLocale}.body`}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel htmlFor={`body-${activeTemplate}-${activeLocale}`}>
                    {t("fields.body")}
                  </FieldLabel>
                  <Textarea
                    {...field}
                    ref={(node) => {
                      field.ref(node);
                      textareaRef.current = node;
                    }}
                    id={`body-${activeTemplate}-${activeLocale}`}
                    dir={activeLocale === "fa" ? "rtl" : "ltr"}
                    rows={8}
                    className="leading-relaxed resize-y font-normal"
                    placeholder={DEFAULT_EMAIL_TEMPLATES[activeTemplate][activeLocale].body}
                  />
                  {fieldState.invalid && (
                    <FieldError>
                      {fieldState.error?.message === "too_long"
                        ? t("validation.too_long")
                        : fieldState.error?.message === "missing_url"
                          ? t("validation.missing_url")
                          : t("validation.required")}
                    </FieldError>
                  )}
                </Field>
              )}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="gap-2 bg-primary text-on-primary hover:bg-primary-container"
              >
                {isSubmitting ? <Spinner className="size-4" /> : <SaveIcon className="size-4" />}
                {t("fields.save")}
              </Button>

              <Button
                type="button"
                variant="outline"
                disabled={sendingTest}
                onClick={handleSendPreview}
                className="gap-2"
              >
                {sendingTest ? <Spinner className="size-4" /> : <SendIcon className="size-4" />}
                {t("fields.sendTest")}
              </Button>
            </div>

            <Button
              type="button"
              variant="ghost"
              disabled={resetting}
              onClick={handleResetToDefault}
              className="text-on-surface-variant hover:text-error gap-1.5 text-xs"
            >
              {resetting ? <Spinner className="size-3.5" /> : <RotateCcwIcon className="size-3.5" />}
              {t("fields.resetDefault")}
            </Button>
          </div>
        </div>

        {/* Right Column: Interactive Live Preview Card */}
        <div className="flex flex-col gap-3 lg:col-span-5 sticky top-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <EyeIcon className="size-4 text-primary" />
              <h4 className="font-label-md text-label-md text-on-surface font-semibold">{t("fields.preview")}</h4>
            </div>
            <span className="text-xs text-on-surface-variant uppercase tracking-wider font-mono">
              {activeLocale.toUpperCase()}
            </span>
          </div>

          <div
            dir={activeLocale === "fa" ? "rtl" : "ltr"}
            className="overflow-hidden rounded-xl border border-outline-variant/40 bg-surface shadow-sm"
          >
            {/* Mock Email Header */}
            <div className="border-b border-outline-variant/20 bg-surface-container-low/60 p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs text-on-surface-variant">
                <span className="font-semibold text-on-surface">Arte Yoga Studio</span>
                <span className="opacity-70 font-mono text-[11px]">&lt;sanctuary@arteyoga.com&gt;</span>
              </div>
              <div className="flex items-center justify-between text-xs text-on-surface-variant">
                <span>{t("fields.previewRecipient")}:</span>
                <span className="font-mono text-[11px] text-primary">{sampleName} &lt;member@example.com&gt;</span>
              </div>
              <div className="pt-2 border-t border-outline-variant/15 font-label-md text-label-md text-on-surface font-semibold">
                {previewSubject || <span className="text-outline italic">({t("fields.noSubject")})</span>}
              </div>
            </div>

            {/* Mock Email Message Body */}
            <div className="p-5 flex flex-col gap-4 bg-surface text-on-surface">
              <div className="whitespace-pre-wrap font-body-md text-body-md leading-relaxed text-on-surface-variant">
                {previewBody || <span className="text-outline italic">({t("fields.noBody")})</span>}
              </div>

              {/* Action Button Link Preview if {url} present */}
              {hasUrlInBody && (
                <div className="pt-2 flex items-center">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 px-4 py-2 font-label-sm text-label-sm font-semibold select-none">
                    <span>{t(`types.${activeTemplate}.actionLabel`)}</span>
                    <span className="text-xs opacity-70">↗</span>
                  </span>
                </div>
              )}
            </div>

            {/* Email Footer Stamp */}
            <div className="border-t border-outline-variant/20 bg-surface-container-lowest p-3 text-center text-[11px] text-outline">
              Arte Yoga Studio · {activeLocale === "fa" ? "پناهگاه آرامش و تن‌آگاهی" : "A Sanctuary for Presence & Ease"}
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
