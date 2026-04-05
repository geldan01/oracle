"use client";

import { useRef, useTransition } from "react";
import Image from "next/image";
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
        <div className="relative aspect-video overflow-hidden rounded-xl">
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
            className="absolute right-3 bottom-3 rounded-lg bg-black/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/80 disabled:opacity-50"
          >
            {isPending ? "Uploading..." : "Change photo"}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={isPending}
          className="flex aspect-video w-full items-center justify-center rounded-xl border-2 border-dashed border-stone-300 bg-stone-50 transition-colors hover:border-amber-400 hover:bg-amber-50 disabled:opacity-50 dark:border-stone-600 dark:bg-stone-800 dark:hover:border-amber-500 dark:hover:bg-stone-700"
        >
          <div className="text-center">
            <p className="text-3xl">&#128247;</p>
            <p className="mt-1 text-sm text-stone-400">
              {isPending ? "Uploading..." : "Upload a photo"}
            </p>
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
