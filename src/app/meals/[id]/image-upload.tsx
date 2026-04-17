"use client";

import { useRef, useTransition } from "react";
import Image from "next/image";
import { Camera } from "@phosphor-icons/react";
import { uploadMealImage } from "@/lib/meal-actions";

interface ImageUploadProps {
  mealId: string;
  currentImage: string | null;
}

export default function ImageUpload({
  mealId,
  currentImage,
}: ImageUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    startTransition(async () => {
      await uploadMealImage(mealId, formData);
    });
  }

  return (
    <div>
      {currentImage ? (
        <div className="relative aspect-video overflow-hidden rounded-lg">
          <Image
            src={currentImage}
            alt="Meal"
            fill
            className="object-cover"
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={isPending}
            className="absolute bottom-3 right-3 rounded-full bg-stone-900/70 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-stone-900 active:scale-[0.98] disabled:opacity-50"
          >
            {isPending ? "Uploading…" : "Change photo"}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={isPending}
          className="flex aspect-video w-full items-center justify-center rounded-lg border border-dashed border-stone-300 transition-colors hover:border-emerald-400 hover:bg-emerald-50/50 disabled:opacity-50 dark:border-stone-700 dark:hover:border-emerald-500 dark:hover:bg-emerald-900/10"
        >
          <div className="flex flex-col items-center gap-2 text-stone-400 dark:text-stone-500">
            <Camera size={24} weight="regular" />
            <p className="text-sm">{isPending ? "Uploading…" : "Upload a photo"}</p>
          </div>
        </button>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}
