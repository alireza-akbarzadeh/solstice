"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { SaveIcon, SendIcon, ServerIcon, SparklesIcon, TriangleAlertIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useRouter } from "@/i18n/navigation";
import { aiModes } from "@/infrastructure/ai/types";

import { assistantSettingsSchema, type AssistantSettingsFormValues } from "../schemas";
import type { AssistantSettingsView } from "../server/settings";
import { saveAssistant, tryAssistant } from "../studio-actions";

const formValues = (view: AssistantSettingsView): AssistantSettingsFormValues => ({
  mode: view.mode,
  model: view.model,
  apiKey: "",
  clearApiKey: false,
  instructions: view.instructions,
  guidanceAi: view.guidanceAi,
  replyHours: view.replyHours,
  dailyLimit: view.dailyLimit,
});

/**
 * The assistant: off, test replies, or Gemini with a key (write-only; GEMINI_API_KEY wins).
 * The studio's instructions are added to what the assistant already knows from the site (plans,
 * prices, trials, payment methods, guidance places).
 */
export function AssistantSettingsEditor({ initial }: { initial: AssistantSettingsView }) {
  const t = useTranslations("Studio.assistant.editor");
  const router = useRouter();
  const [view, setView] = useState(initial);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<{ text: string; model: string } | null>(null);
  const [trying, startTry] = useTransition();

  const form = useForm<AssistantSettingsFormValues, unknown, z.output<typeof assistantSettingsSchema>>({
    resolver: zodResolver(assistantSettingsSchema),
    defaultValues: formValues(initial),
  });
  const saving = form.formState.isSubmitting;
  const mode = form.watch("mode");
  const clearApiKey = form.watch("clearApiKey");

  const onSubmit = form.handleSubmit(async (values) => {
    const result = await saveAssistant(values);
    if (!result.ok) {
      toast.error(t(`errors.${result.error}`));
      return;
    }
    toast.success(t("saved"));
    setView(result.view);
    form.reset(formValues(result.view));
    router.refresh();
  });

  const tryIt = () =>
    startTry(async () => {
      setAnswer(null);
      const result = await tryAssistant(question);
      if (result.ok) setAnswer({ text: result.text, model: result.model });
      else toast.error(t(`tryErrors.${result.reason}`, { detail: result.detail ?? "" }), { duration: 10_000 });
    });

  const status = view.mode === "off" ? "off" : view.missingKey ? "missingKey" : view.mode;

  return (
    <div className="flex flex-col gap-gutter">
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-space-lg rounded-xl bg-surface-container-low p-space-md shadow-sm md:p-space-lg">
        <div className="flex flex-wrap items-start justify-between gap-space-md">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-headline-sm text-headline-sm">{t("title")}</h2>
              <Badge variant={status === "gemini" ? "default" : "secondary"}>{t(`status.${status}`)}</Badge>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">{t("lede")}</p>
          </div>
          <Button type="submit" size="sm" disabled={saving || !form.formState.isDirty}>
            {saving ? <Spinner data-icon="inline-start" /> : <SaveIcon data-icon="inline-start" />}
            {t("save")}
          </Button>
        </div>

        <FieldGroup>
          <Controller
            control={form.control}
            name="mode"
            render={({ field }) => (
              <Field>
                <FieldLabel>{t("fields.mode")}</FieldLabel>
                <ToggleGroup type="single" variant="outline" value={field.value} onValueChange={(v) => v && field.onChange(v)} className="w-full sm:w-auto">
                  {aiModes.map((m) => (
                    <ToggleGroupItem key={m} value={m} className="flex-1 px-4 sm:flex-none">
                      {t(`modes.${m}`)}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
                <FieldDescription>{t(`modeHints.${mode}`)}</FieldDescription>
              </Field>
            )}
          />

          {mode === "gemini" && (
            <div className="grid grid-cols-1 gap-space-md md:grid-cols-2">
              <Controller
                control={form.control}
                name="apiKey"
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor="assistant-key">{t("fields.apiKey")}</FieldLabel>
                    <Input
                      {...field}
                      id="assistant-key"
                      type="password"
                      autoComplete="off"
                      dir="ltr"
                      disabled={view.fromEnv.apiKey}
                      placeholder={view.apiKeyLast4 && !clearApiKey ? `•••• ${view.apiKeyLast4}` : t("notSet")}
                    />
                    <FieldDescription className="flex flex-wrap items-center gap-1.5">
                      {view.fromEnv.apiKey ? (
                        <>
                          <ServerIcon aria-hidden className="size-3.5" />
                          {t("fromEnv")}
                        </>
                      ) : view.apiKeyLast4 ? (
                        <>
                          {clearApiKey ? t("willRemove") : t("keySaved")}
                          <button
                            type="button"
                            className="underline underline-offset-4 hover:text-primary"
                            onClick={() => form.setValue("clearApiKey", !clearApiKey, { shouldDirty: true })}
                          >
                            {clearApiKey ? t("keep") : t("remove")}
                          </button>
                        </>
                      ) : (
                        t.rich("hints.apiKey", {
                          link: (chunks) => (
                            <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="underline underline-offset-4 hover:text-primary">
                              {chunks}
                            </a>
                          ),
                        })
                      )}
                    </FieldDescription>
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="model"
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor="assistant-model">{t("fields.model")}</FieldLabel>
                    <Input {...field} id="assistant-model" dir="ltr" autoComplete="off" disabled={view.fromEnv.model} list="assistant-models" />
                    <datalist id="assistant-models">
                      <option value="gemini-2.5-flash" />
                      <option value="gemini-2.5-flash-lite" />
                    </datalist>
                    <FieldDescription>{view.fromEnv.model ? t("fromEnv") : t("hints.model")}</FieldDescription>
                  </Field>
                )}
              />
            </div>
          )}

          <Controller
            control={form.control}
            name="instructions"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel htmlFor="assistant-instructions">{t("fields.instructions")}</FieldLabel>
                <Textarea {...field} id="assistant-instructions" rows={10} dir="auto" placeholder={t("instructionsPlaceholder")} className="min-h-48" />
                {fieldState.invalid ? <FieldError>{t("validation.instructions")}</FieldError> : <FieldDescription>{t("hints.instructions")}</FieldDescription>}
              </Field>
            )}
          />

          <div className="grid grid-cols-1 gap-space-md md:grid-cols-2">
            <Controller
              control={form.control}
              name="replyHours"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel htmlFor="assistant-reply-hours">{t("fields.replyHours")}</FieldLabel>
                  <Input {...field} id="assistant-reply-hours" inputMode="numeric" dir="ltr" aria-invalid={fieldState.invalid || undefined} />
                  {fieldState.invalid ? <FieldError>{t("validation.replyHours")}</FieldError> : <FieldDescription>{t("hints.replyHours")}</FieldDescription>}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="dailyLimit"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel htmlFor="assistant-daily">{t("fields.dailyLimit")}</FieldLabel>
                  <Input {...field} id="assistant-daily" inputMode="numeric" dir="ltr" aria-invalid={fieldState.invalid || undefined} />
                  {fieldState.invalid ? <FieldError>{t("validation.dailyLimit")}</FieldError> : <FieldDescription>{t("hints.dailyLimit")}</FieldDescription>}
                </Field>
              )}
            />
          </div>

          <Controller
            control={form.control}
            name="guidanceAi"
            render={({ field }) => (
              <Field orientation="horizontal" className="rounded-lg bg-surface p-space-md">
                <FieldContent>
                  <FieldLabel htmlFor="assistant-guidance">{t("fields.guidanceAi")}</FieldLabel>
                  <FieldDescription>{t("hints.guidanceAi")}</FieldDescription>
                  {field.value && mode === "gemini" && (
                    <p className="mt-1 flex items-start gap-1.5 font-body-sm text-body-sm text-tertiary">
                      <TriangleAlertIcon className="mt-0.5 size-3.5 shrink-0" />
                      {t("guidanceAiWarning")}
                    </p>
                  )}
                </FieldContent>
                <Switch id="assistant-guidance" checked={field.value} onCheckedChange={field.onChange} />
              </Field>
            )}
          />
        </FieldGroup>
      </form>

      <section className="flex flex-col gap-space-sm rounded-xl bg-surface-container-low p-space-md shadow-sm md:p-space-lg">
        <h2 className="flex items-center gap-2 font-headline-sm text-headline-sm">
          <SparklesIcon className="size-5 text-primary" />
          {t("try.title")}
        </h2>
        <p className="font-body-sm text-body-sm text-on-surface-variant">{t("try.lede")}</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input value={question} onChange={(event) => setQuestion(event.target.value)} dir="auto" placeholder={t("try.placeholder")} maxLength={1000} />
          <Button type="button" variant="outline" onClick={tryIt} disabled={trying || !question.trim() || form.formState.isDirty} title={form.formState.isDirty ? t("saveFirst") : undefined}>
            {trying ? <Spinner data-icon="inline-start" /> : <SendIcon data-icon="inline-start" />}
            {t("try.ask")}
          </Button>
        </div>
        {answer && (
          <div className="rounded-xl border border-dashed border-primary/40 bg-primary-fixed/25 p-4">
            <p className="mb-1 font-label-sm text-label-sm text-primary">{t("try.answerLabel", { model: answer.model })}</p>
            <p dir="auto" className="font-body-md text-body-md whitespace-pre-wrap text-on-surface">
              {answer.text}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
