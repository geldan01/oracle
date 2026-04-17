"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Camera } from "@phosphor-icons/react";
import {
  uploadDashboardHeroImage,
  clearDashboardHeroImage,
  setDashboardHeroImagePosition,
} from "@/lib/settings-actions";

interface DashboardHeroUploadProps {
  currentImage: string | null;
  initialX: number;
  initialY: number;
}

export default function DashboardHeroUpload({
  currentImage,
  initialX,
  initialY,
}: DashboardHeroUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isPending, startTransition] = useTransition();
  const [x, setX] = useState(initialX ?? 50);
  const [y, setY] = useState(initialY ?? 50);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("image", file);
    startTransition(async () => {
      await uploadDashboardHeroImage(formData);
      setX(50);
      setY(50);
    });
  }

  function handleClear() {
    startTransition(async () => {
      await clearDashboardHeroImage();
      setX(50);
      setY(50);
    });
  }

  function scheduleSave(nextX: number, nextY: number) {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      startTransition(async () => {
        await setDashboardHeroImagePosition(nextX, nextY);
      });
    }, 250);
  }

  function handleX(e: React.ChangeEvent<HTMLInputElement>) {
    const val = Number(e.target.value);
    setX(val);
    scheduleSave(val, y);
  }

  function handleY(e: React.ChangeEvent<HTMLInputElement>) {
    const val = Number(e.target.value);
    setY(val);
    scheduleSave(x, val);
  }

  function handleReset() {
    setX(50);
    setY(50);
    startTransition(async () => {
      await setDashboardHeroImagePosition(50, 50);
    });
  }

  return (
    <div>
      {currentImage ? (
        <div className="space-y-4">
          {/* Live preview at the same aspect ratio as the dashboard hero */}
          <div className="relative aspect-16/5 w-full overflow-hidden rounded-lg">
            <Image
              src={currentImage}
              alt="Dashboard hero"
              fill
              className="object-cover transition-[object-position] duration-150"
              style={{ objectPosition: `${x}% ${y}%` }}
            />
            {/* Focal point indicator */}
            <div
              className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-md ring-2 ring-emerald-500"
              style={{ left: `${x}%`, top: `${y}%` }}
              aria-hidden
            />
            <div className="absolute bottom-3 right-3 flex gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={isPending}
                className="rounded-full bg-stone-900/70 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-stone-900 active:scale-[0.98] disabled:opacity-50"
              >
                {isPending ? "Working…" : "Change"}
              </button>
              <button
                type="button"
                onClick={handleClear}
                disabled={isPending}
                className="rounded-full bg-stone-900/70 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-red-600 active:scale-[0.98] disabled:opacity-50"
              >
                Remove
              </button>
            </div>
          </div>

          {/* Position sliders */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                Focal point
              </p>
              {(x !== 50 || y !== 50) && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs text-stone-400 underline-offset-2 transition-colors hover:text-emerald-600 hover:underline dark:text-stone-500 dark:hover:text-emerald-400"
                >
                  Reset to centre
                </button>
              )}
            </div>

            <div className="grid grid-cols-[3rem_1fr_3rem] items-center gap-3">
              <label
                htmlFor="hero-x"
                className="text-xs text-stone-500 dark:text-stone-400"
              >
                Left ↔
              </label>
              <input
                id="hero-x"
                type="range"
                min={0}
                max={100}
                step={1}
                value={x}
                onChange={handleX}
                className="accent-emerald-600 dark:accent-emerald-400"
              />
              <span className="text-right text-xs tabular-nums text-stone-500 dark:text-stone-400">
                {Math.round(x)}%
              </span>
            </div>

            <div className="grid grid-cols-[3rem_1fr_3rem] items-center gap-3">
              <label
                htmlFor="hero-y"
                className="text-xs text-stone-500 dark:text-stone-400"
              >
                Top ↕
              </label>
              <input
                id="hero-y"
                type="range"
                min={0}
                max={100}
                step={1}
                value={y}
                onChange={handleY}
                className="accent-emerald-600 dark:accent-emerald-400"
              />
              <span className="text-right text-xs tabular-nums text-stone-500 dark:text-stone-400">
                {Math.round(y)}%
              </span>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={isPending}
          className="flex aspect-16/5 w-full items-center justify-center rounded-lg border border-dashed border-stone-300 transition-colors hover:border-emerald-400 hover:bg-emerald-50/40 disabled:opacity-50 dark:border-stone-700 dark:hover:border-emerald-500 dark:hover:bg-emerald-900/10"
        >
          <div className="flex flex-col items-center gap-2 text-stone-400 dark:text-stone-500">
            <Camera size={28} weight="regular" />
            <p className="text-sm">
              {isPending ? "Uploading…" : "Upload a photo"}
            </p>
            <p className="text-xs">Wide aspect ratio works best</p>
          </div>
        </button>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}
