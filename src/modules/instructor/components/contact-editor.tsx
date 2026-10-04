"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowDownIcon, ArrowUpIcon, PlusIcon, SaveIcon, Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ResponsiveSelect } from "@/components/ui/responsive-select";
import { Spinner } from "@/components/ui/spinner";
import { useRouter } from "@/i18n/navigation";
import { SocialIcon } from "@/modules/contact/components/social-icon";
import { contactSchema, type ContactFormValues } from "@/modules/contact/schemas";
import { MAX_SOCIAL_LINKS, socialNetworks, type StudioContact } from "@/modules/contact/types";
import { saveContact } from "@/modules/instructor/contact-actions";

import { LocalizedField } from "./localized-field";

/**
 * The studio's contact details and social links. Handles and WhatsApp numbers are accepted
 * as typed; the shared schema turns them into full links and the saved form shows the result.
 */
export function ContactEditor({ contact }: { contact: StudioContact }) {
  const t = useTranslations("Studio.settings.editor");
  const networks = useTranslations("Contact.networks");
  const router = useRouter();

  const form = useForm<ContactFormValues, unknown, z.output<typeof contactSchema>>({
    resolver: zodResolver(contactSchema),
    defaultValues: contact,
  });
  const socials = useFieldArray({ control: form.control, name: "socials" });
  const saving = form.formState.isSubmitting;

  const onSubmit = form.handleSubmit(async (values) => {
    const result = await saveContact(values);
    if (!result.ok) {
      toast.error(t(`errors.${result.error}`));
      return;
    }
    toast.success(t("saved"));
    form.reset(result.contact);
    router.refresh();
  });

  const networkOptions = socialNetworks.map((network) => ({ value: network, label: networks(network) }));

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-space-lg rounded-xl bg-surface-container-low p-space-md shadow-sm md:p-space-lg">
      <div className="flex flex-wrap items-start justify-between gap-space-md">
        <div>
          <h2 className="font-headline-sm text-headline-sm">{t("title")}</h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant">{t("lede")}</p>
        </div>
        <Button type="submit" size="sm" disabled={saving || !form.formState.isDirty}>
          {saving ? <Spinner data-icon="inline-start" /> : <SaveIcon data-icon="inline-start" />}
          {t("save")}
        </Button>
      </div>

      <FieldGroup>
        <section className="flex flex-col gap-space-md">
          <h3 className="font-label-lg text-label-lg text-on-surface">{t("contactTitle")}</h3>
          <div className="grid grid-cols-1 gap-space-md md:grid-cols-2">
            <Controller
              control={form.control}
              name="email"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel htmlFor="contact-email">{t("fields.email")}</FieldLabel>
                  <Input
                    {...field}
                    id="contact-email"
                    type="email"
                    dir="ltr"
                    autoComplete="email"
                    placeholder="hello@example.com"
                    aria-invalid={fieldState.invalid || undefined}
                  />
                  {fieldState.invalid && <FieldError>{t("validation.email")}</FieldError>}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="phone"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel htmlFor="contact-phone">{t("fields.phone")}</FieldLabel>
                  <Input
                    {...field}
                    id="contact-phone"
                    type="tel"
                    dir="ltr"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="+98 21 1234 5678"
                    aria-invalid={fieldState.invalid || undefined}
                  />
                  {fieldState.invalid && <FieldError>{t("validation.phone")}</FieldError>}
                </Field>
              )}
            />
          </div>
          <Controller
            control={form.control}
            name="address"
            render={({ field, fieldState }) => (
              <LocalizedField
                label={t("fields.address")}
                description={t("fields.addressHint")}
                value={field.value}
                onChange={field.onChange}
                maxLength={300}
                multiline
                rows={3}
                error={fieldState.invalid ? t("validation.address") : undefined}
              />
            )}
          />
        </section>

        <section className="flex flex-col gap-space-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-label-lg text-label-lg text-on-surface">{t("socialTitle")}</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">{t("socialHint")}</p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={socials.fields.length >= MAX_SOCIAL_LINKS}
              onClick={() => socials.append({ network: "instagram", url: "" }, { shouldFocus: true })}
            >
              <PlusIcon data-icon="inline-start" />
              {t("addLink")}
            </Button>
          </div>

          {socials.fields.length === 0 && (
            <p className="rounded-lg border border-dashed border-outline-variant p-space-md text-center font-body-sm text-body-sm text-on-surface-variant">
              {t("noLinks")}
            </p>
          )}

          {socials.fields.map((item, index) => {
            const network = form.watch(`socials.${index}.network`);
            return (
              <div key={item.id} className="flex flex-col gap-3 rounded-lg border border-hairline bg-surface p-space-sm">
                <div className="flex items-center gap-2">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-container text-primary">
                    <SocialIcon network={network} />
                  </span>
                  <Controller
                    control={form.control}
                    name={`socials.${index}.network`}
                    render={({ field }) => (
                      <ResponsiveSelect
                        id={`social-network-${index}`}
                        label={t("fields.network")}
                        value={field.value}
                        onValueChange={field.onChange}
                        options={networkOptions}
                        className="min-w-0 flex-1 sm:max-w-56"
                      />
                    )}
                  />
                  <div className="ms-auto flex shrink-0 items-center gap-1">
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      aria-label={t("moveUp")}
                      disabled={index === 0}
                      onClick={() => socials.move(index, index - 1)}
                    >
                      <ArrowUpIcon />
                    </Button>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      aria-label={t("moveDown")}
                      disabled={index === socials.fields.length - 1}
                      onClick={() => socials.move(index, index + 1)}
                    >
                      <ArrowDownIcon />
                    </Button>
                    <Button type="button" size="icon-sm" variant="ghost" aria-label={t("removeLink")} onClick={() => socials.remove(index)}>
                      <Trash2Icon />
                    </Button>
                  </div>
                </div>
                <Controller
                  control={form.control}
                  name={`socials.${index}.url`}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid || undefined}>
                      <FieldLabel htmlFor={`social-url-${index}`} className="sr-only">
                        {t("fields.url", { network: networks(network) })}
                      </FieldLabel>
                      <Input
                        {...field}
                        id={`social-url-${index}`}
                        dir="ltr"
                        inputMode="url"
                        autoComplete="off"
                        placeholder={t(`placeholders.${network}`)}
                        aria-invalid={fieldState.invalid || undefined}
                      />
                      {fieldState.invalid ? (
                        <FieldError>{t(network === "whatsapp" ? "validation.whatsapp" : "validation.url")}</FieldError>
                      ) : (
                        <FieldDescription>{t(network === "whatsapp" ? "fields.whatsappHint" : network === "website" ? "fields.websiteHint" : "fields.urlHint")}</FieldDescription>
                      )}
                    </Field>
                  )}
                />
              </div>
            );
          })}
        </section>
      </FieldGroup>
    </form>
  );
}
