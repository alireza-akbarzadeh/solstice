"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckIcon, ImageIcon, LoaderCircleIcon, RotateCcwIcon, SaveIcon } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetBrandAssetsAction, saveBrandAssetsAction } from "@/modules/brand/actions";
import { brandAssetsSchema, type BrandAssetsFormValues } from "@/modules/brand/schemas";
import { DEFAULT_BRAND_ASSETS, type BrandAssets } from "@/modules/brand/types";

export function BrandAssetsEditor({ initial }: { initial: BrandAssets }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isResetting, startReset] = useTransition();

  const form = useForm<BrandAssetsFormValues>({
    resolver: zodResolver(brandAssetsSchema),
    defaultValues: initial,
  });

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isDirty },
  } = form;

  const logoUrl = watch("logoUrl");
  const signInPhotoUrl = watch("signInPhotoUrl");
  const signUpPhotoUrl = watch("signUpPhotoUrl");
  const instructorAvatarUrl = watch("instructorAvatarUrl");

  const onSubmit = (values: BrandAssetsFormValues) => {
    startTransition(async () => {
      const res = await saveBrandAssetsAction(values);
      if (res.success) {
        toast.success("Brand assets updated successfully");
        reset(values);
        router.refresh();
      } else {
        toast.error("Could not save brand assets. Please check URLs and try again.");
      }
    });
  };

  const handleReset = () => {
    if (window.confirm("Reset all brand assets to sanctuary defaults?")) {
      startReset(async () => {
        const res = await resetBrandAssetsAction();
        if (res.success) {
          toast.success("Brand assets reset to defaults");
          reset(DEFAULT_BRAND_ASSETS);
          router.refresh();
        } else {
          toast.error("Failed to reset brand assets.");
        }
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-space-lg">
      <div className="rounded-xl border border-outline-variant/30 bg-surface-container-low p-space-md shadow-xs md:p-space-lg">
        <h2 className="font-headline-sm text-headline-sm text-on-surface">Sanctuary Brand & Identity</h2>
        <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
          Customize fixed brand visual assets across the sanctuary. Accepts local paths (e.g.{" "}
          <code className="text-xs">/images/brand/...</code>) and full secure HTTPS image URLs.
        </p>

        <div className="mt-space-lg grid grid-cols-1 gap-space-lg lg:grid-cols-2">
          {/* Logo Section */}
          <div className="space-y-3">
            <Label htmlFor="logoUrl" className="font-label-md text-label-md">
              Studio Logo Path / URL
            </Label>
            <Input
              id="logoUrl"
              {...register("logoUrl")}
              placeholder="/images/brand/logo.svg"
              className="bg-surface"
            />
            {errors.logoUrl && (
              <p className="font-body-xs text-body-xs text-tertiary">{errors.logoUrl.message}</p>
            )}

            {/* Logo Preview */}
            <div className="flex items-center gap-4 rounded-lg border border-hairline bg-surface p-3">
              <div className="relative flex size-14 shrink-0 items-center justify-center rounded-md bg-surface-container-high p-1">
                {logoUrl ? (
                  <Image
                    src={logoUrl}
                    alt=""
                    width={40}
                    height={40}
                    unoptimized
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <ImageIcon className="size-6 text-outline" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-label-sm text-label-sm font-medium text-on-surface">Logo Preview</p>
                <p className="font-body-xs text-body-xs text-on-surface-variant line-clamp-1">
                  Header, footer, lockups, and favicon
                </p>
              </div>
            </div>

            {/* Localized Logo Alt */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <Label htmlFor="logoAlt-en" className="font-label-xs text-label-xs text-on-surface-variant">
                  Alt text (EN)
                </Label>
                <Input
                  id="logoAlt-en"
                  {...register("logoAlt.en")}
                  placeholder="Solstice Sanctuary"
                  className="bg-surface text-xs"
                />
              </div>
              <div>
                <Label htmlFor="logoAlt-fa" className="font-label-xs text-label-xs text-on-surface-variant">
                  Alt text (FA)
                </Label>
                <Input
                  id="logoAlt-fa"
                  {...register("logoAlt.fa")}
                  placeholder="پناهگاه سلستیس"
                  className="bg-surface text-xs"
                />
              </div>
            </div>
          </div>

          {/* Instructor Avatar Section */}
          <div className="space-y-3">
            <Label htmlFor="instructorAvatarUrl" className="font-label-md text-label-md">
              Instructor Portrait Avatar URL
            </Label>
            <Input
              id="instructorAvatarUrl"
              {...register("instructorAvatarUrl")}
              placeholder="/images/brand/elena-portrait.jpg"
              className="bg-surface"
            />
            {errors.instructorAvatarUrl && (
              <p className="font-body-xs text-body-xs text-tertiary">
                {errors.instructorAvatarUrl.message}
              </p>
            )}

            {/* Avatar Preview */}
            <div className="flex items-center gap-4 rounded-lg border border-hairline bg-surface p-3">
              <div className="relative size-14 shrink-0 overflow-hidden rounded-full bg-surface-container-high">
                {instructorAvatarUrl ? (
                  <Image
                    src={instructorAvatarUrl}
                    alt=""
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                ) : (
                  <ImageIcon className="size-6 text-outline" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-label-sm text-label-sm font-medium text-on-surface">Avatar Preview</p>
                <p className="font-body-xs text-body-xs text-on-surface-variant line-clamp-1">
                  Auth cards, practice cards, and bio
                </p>
              </div>
            </div>

            {/* Localized Instructor Name */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <Label htmlFor="instructorName-en" className="font-label-xs text-label-xs text-on-surface-variant">
                  Instructor Name (EN)
                </Label>
                <Input
                  id="instructorName-en"
                  {...register("instructorName.en")}
                  placeholder="Elena Rostova"
                  className="bg-surface text-xs"
                />
              </div>
              <div>
                <Label htmlFor="instructorName-fa" className="font-label-xs text-label-xs text-on-surface-variant">
                  Instructor Name (FA)
                </Label>
                <Input
                  id="instructorName-fa"
                  {...register("instructorName.fa")}
                  placeholder="النا روستووا"
                  className="bg-surface text-xs"
                />
              </div>
            </div>
          </div>

          {/* Sign-in Hero Photo */}
          <div className="space-y-3">
            <Label htmlFor="signInPhotoUrl" className="font-label-md text-label-md">
              Sign-In Page Photo URL
            </Label>
            <Input
              id="signInPhotoUrl"
              {...register("signInPhotoUrl")}
              placeholder="/images/auth/sign-in.jpg"
              className="bg-surface"
            />
            {errors.signInPhotoUrl && (
              <p className="font-body-xs text-body-xs text-tertiary">
                {errors.signInPhotoUrl.message}
              </p>
            )}

            {/* Preview */}
            <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-hairline bg-surface-container">
              {signInPhotoUrl && (
                <Image
                  src={signInPhotoUrl}
                  alt=""
                  fill
                  sizes="320px"
                  className="object-cover"
                />
              )}
            </div>
          </div>

          {/* Sign-up Sanctuary Photo */}
          <div className="space-y-3">
            <Label htmlFor="signUpPhotoUrl" className="font-label-md text-label-md">
              Sign-Up Page Sanctuary Photo URL
            </Label>
            <Input
              id="signUpPhotoUrl"
              {...register("signUpPhotoUrl")}
              placeholder="/images/auth/sanctuary-interior.jpg"
              className="bg-surface"
            />
            {errors.signUpPhotoUrl && (
              <p className="font-body-xs text-body-xs text-tertiary">
                {errors.signUpPhotoUrl.message}
              </p>
            )}

            {/* Preview */}
            <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-hairline bg-surface-container">
              {signUpPhotoUrl && (
                <Image
                  src={signUpPhotoUrl}
                  alt=""
                  fill
                  sizes="320px"
                  className="object-cover"
                />
              )}
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="mt-space-lg flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-space-md">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={isResetting || isPending}
            className="gap-1.5"
          >
            {isResetting ? <LoaderCircleIcon className="size-4 animate-spin" /> : <RotateCcwIcon className="size-4" />}
            Reset to Defaults
          </Button>

          <Button
            type="submit"
            size="sm"
            disabled={isPending || isResetting || !isDirty}
            className="gap-1.5 rounded-lg bg-primary text-on-primary hover:bg-primary-container"
          >
            {isPending ? <LoaderCircleIcon className="size-4 animate-spin" /> : <SaveIcon className="size-4" />}
            Save Brand Assets
          </Button>
        </div>
      </div>
    </form>
  );
}
