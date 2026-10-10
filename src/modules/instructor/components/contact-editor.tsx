"use client";

import {
  ArrowDownIcon,
  ArrowUpIcon,
  MessageCircleHeartIcon,
  PlusIcon,
  SaveIcon,
  Trash2Icon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ResponsiveSelect } from "@/components/ui/responsive-select";
import { Spinner } from "@/components/ui/spinner";
import { useRouter } from "@/i18n/navigation";
import { SocialIcon } from "@/modules/contact/components/social-icon";
import { socialUrl } from "@/modules/contact/schemas";
import {
  MAX_SOCIAL_LINKS,
  socialNetworks,
  type SocialNetwork,
  type StudioContact,
} from "@/modules/contact/types";
import { saveContact } from "@/modules/instructor/contact-actions";

import { LocalizedField } from "./localized-field";

type ContactFormState = {
  email: string;
  phone: string;
  address: { en: string; fa: string };
  telegram: string;
  instagram: string;
  otherSocials: Array<{ network: SocialNetwork; url: string }>;
};

/**
 * The studio's contact details, direct guidance channels (Telegram & Instagram), and social links.
 * Handles and WhatsApp numbers are accepted as typed; the schema turns them into full links.
 */
export function ContactEditor({ contact }: { contact: StudioContact }) {
  const t = useTranslations("Studio.settings.editor");
  const networks = useTranslations("Contact.networks");
  const router = useRouter();

  const initialTelegram =
    contact.socials.find((s) => s.network === "telegram")?.url ?? "";
  const initialInstagram =
    contact.socials.find((s) => s.network === "instagram")?.url ?? "";
  const initialOthers = contact.socials.filter(
    (s) => s.network !== "telegram" && s.network !== "instagram",
  );

  const form = useForm<ContactFormState>({
    defaultValues: {
      email: contact.email,
      phone: contact.phone,
      address: contact.address,
      telegram: initialTelegram,
      instagram: initialInstagram,
      otherSocials: initialOthers,
    },
  });

  const otherSocials = useFieldArray({
    control: form.control,
    name: "otherSocials",
  });
  const saving = form.formState.isSubmitting;

  const onSubmit = form.handleSubmit(async (values) => {
    // Validate email
    if (values.email.trim() && !z.string().email().safeParse(values.email.trim()).success) {
      form.setError("email", { message: t("validation.email") });
      return;
    }
    // Validate phone
    if (
      values.phone.trim() &&
      (!/^\+?[\d\s().-]+$/.test(values.phone) ||
        values.phone.replace(/\D/g, "").length < 5)
    ) {
      form.setError("phone", { message: t("validation.phone") });
      return;
    }
    // Validate address: both or none
    if (!values.address.en !== !values.address.fa) {
      form.setError("address", { message: t("validation.address") });
      return;
    }

    // Validate telegram if entered
    if (values.telegram.trim() && !socialUrl("telegram", values.telegram)) {
      form.setError("telegram", { message: t("validation.url") });
      return;
    }

    // Validate instagram if entered
    if (values.instagram.trim() && !socialUrl("instagram", values.instagram)) {
      form.setError("instagram", { message: t("validation.url") });
      return;
    }

    // Validate other socials
    for (let i = 0; i < values.otherSocials.length; i++) {
      const item = values.otherSocials[i];
      if (item && item.url.trim() && !socialUrl(item.network, item.url)) {
        form.setError(`otherSocials.${i}.url`, {
          message: t(item.network === "whatsapp" ? "validation.whatsapp" : "validation.url"),
        });
        return;
      }
    }

    const assembledSocials: Array<{ network: SocialNetwork; url: string }> = [];
    if (values.telegram.trim()) {
      assembledSocials.push({ network: "telegram", url: values.telegram.trim() });
    }
    if (values.instagram.trim()) {
      assembledSocials.push({ network: "instagram", url: values.instagram.trim() });
    }
    for (const item of values.otherSocials) {
      if (item.url.trim()) {
        assembledSocials.push({ network: item.network, url: item.url.trim() });
      }
    }

    const result = await saveContact({
      email: values.email,
      phone: values.phone,
      address: values.address,
      socials: assembledSocials,
    });

    if (!result.ok) {
      toast.error(t(`errors.${result.error}`));
      return;
    }

    toast.success(t("saved"));
    const savedTelegram =
      result.contact.socials.find((s) => s.network === "telegram")?.url ?? "";
    const savedInstagram =
      result.contact.socials.find((s) => s.network === "instagram")?.url ?? "";
    const savedOthers = result.contact.socials.filter(
      (s) => s.network !== "telegram" && s.network !== "instagram",
    );

    form.reset({
      email: result.contact.email,
      phone: result.contact.phone,
      address: result.contact.address,
      telegram: savedTelegram,
      instagram: savedInstagram,
      otherSocials: savedOthers,
    });
    router.refresh();
  });

  const networkOptions = socialNetworks.map((network) => ({
    value: network,
    label: networks(network),
  }));

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="flex flex-col gap-space-lg rounded-xl bg-surface-container-low p-space-md shadow-sm md:p-space-lg"
    >
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
        {/* Direct Channels (Telegram & Instagram) */}
        <section className="flex flex-col gap-space-md rounded-xl border border-primary/25 bg-surface-container/50 p-space-md shadow-xs">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-full bg-primary-fixed text-primary">
                <MessageCircleHeartIcon className="size-4" />
              </span>
              <h3 className="font-label-lg text-label-lg font-semibold text-on-surface">
                {t("directChannelsTitle")}
              </h3>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              {t("directChannelsHint")}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-space-md md:grid-cols-2">
            <Controller
              control={form.control}
              name="telegram"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <div className="flex items-center gap-2">
                    <SocialIcon network="telegram" className="size-4 text-[#229ED9]" />
                    <FieldLabel htmlFor="contact-telegram">{t("telegramLabel")}</FieldLabel>
                  </div>
                  <Input
                    {...field}
                    id="contact-telegram"
                    type="text"
                    dir="ltr"
                    inputMode="url"
                    autoComplete="off"
                    placeholder="@solstice_yoga or https://t.me/solstice_yoga"
                    aria-invalid={fieldState.invalid || undefined}
                  />
                  {fieldState.invalid ? (
                    <FieldError>{fieldState.error?.message ?? t("validation.url")}</FieldError>
                  ) : (
                    <FieldDescription>{t("telegramHint")}</FieldDescription>
                  )}
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="instagram"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <div className="flex items-center gap-2">
                    <SocialIcon network="instagram" className="size-4 text-[#E1306C]" />
                    <FieldLabel htmlFor="contact-instagram">{t("instagramLabel")}</FieldLabel>
                  </div>
                  <Input
                    {...field}
                    id="contact-instagram"
                    type="text"
                    dir="ltr"
                    inputMode="url"
                    autoComplete="off"
                    placeholder="@solstice_yoga or https://instagram.com/solstice_yoga"
                    aria-invalid={fieldState.invalid || undefined}
                  />
                  {fieldState.invalid ? (
                    <FieldError>{fieldState.error?.message ?? t("validation.url")}</FieldError>
                  ) : (
                    <FieldDescription>{t("instagramHint")}</FieldDescription>
                  )}
                </Field>
              )}
            />
          </div>
        </section>

        {/* General Contact Details */}
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
                  {fieldState.invalid && (
                    <FieldError>{fieldState.error?.message ?? t("validation.email")}</FieldError>
                  )}
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
                  {fieldState.invalid && (
                    <FieldError>{fieldState.error?.message ?? t("validation.phone")}</FieldError>
                  )}
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
                error={fieldState.invalid ? (fieldState.error?.message ?? t("validation.address")) : undefined}
              />
            )}
          />
        </section>

        {/* Other Social Links */}
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
              disabled={otherSocials.fields.length >= MAX_SOCIAL_LINKS}
              onClick={() => otherSocials.append({ network: "whatsapp", url: "" }, { shouldFocus: true })}
            >
              <PlusIcon data-icon="inline-start" />
              {t("addLink")}
            </Button>
          </div>

          {otherSocials.fields.length === 0 && (
            <p className="rounded-lg border border-dashed border-outline-variant p-space-md text-center font-body-sm text-body-sm text-on-surface-variant">
              {t("noLinks")}
            </p>
          )}

          {otherSocials.fields.map((item, index) => {
            const network = form.watch(`otherSocials.${index}.network`);
            return (
              <div key={item.id} className="flex flex-col gap-3 rounded-lg border border-hairline bg-surface p-space-sm">
                <div className="flex items-center gap-2">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-container text-primary">
                    <SocialIcon network={network} />
                  </span>
                  <Controller
                    control={form.control}
                    name={`otherSocials.${index}.network`}
                    render={({ field }) => (
                      <ResponsiveSelect
                        id={`other-social-network-${index}`}
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
                      onClick={() => otherSocials.move(index, index - 1)}
                    >
                      <ArrowUpIcon />
                    </Button>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      aria-label={t("moveDown")}
                      disabled={index === otherSocials.fields.length - 1}
                      onClick={() => otherSocials.move(index, index + 1)}
                    >
                      <ArrowDownIcon />
                    </Button>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      aria-label={t("removeLink")}
                      onClick={() => otherSocials.remove(index)}
                    >
                      <Trash2Icon />
                    </Button>
                  </div>
                </div>
                <Controller
                  control={form.control}
                  name={`otherSocials.${index}.url`}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid || undefined}>
                      <FieldLabel htmlFor={`other-social-url-${index}`} className="sr-only">
                        {t("fields.url", { network: networks(network) })}
                      </FieldLabel>
                      <Input
                        {...field}
                        id={`other-social-url-${index}`}
                        dir="ltr"
                        inputMode="url"
                        autoComplete="off"
                        placeholder={t(`placeholders.${network}`)}
                        aria-invalid={fieldState.invalid || undefined}
                      />
                      {fieldState.invalid ? (
                        <FieldError>
                          {fieldState.error?.message ??
                            t(network === "whatsapp" ? "validation.whatsapp" : "validation.url")}
                        </FieldError>
                      ) : (
                        <FieldDescription>
                          {t(
                            network === "whatsapp"
                              ? "fields.whatsappHint"
                              : network === "website"
                                ? "fields.websiteHint"
                                : "fields.urlHint",
                          )}
                        </FieldDescription>
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
