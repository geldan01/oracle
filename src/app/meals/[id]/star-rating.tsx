"use client";

import { useState, useTransition } from "react";
import { Star } from "@phosphor-icons/react";
import { rateMeal } from "@/lib/meal-actions";

interface StarRatingProps {
  mealId: string;
  currentRating: number | null;
}

export default function StarRating({ mealId, currentRating }: StarRatingProps) {
  const [hovered, setHovered] = useState(0);
  const [isPending, startTransition] = useTransition();

  function handleRate(rating: number) {
    startTransition(async () => {
      await rateMeal(mealId, rating);
    });
  }

  return (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= (hovered || currentRating || 0);
        return (
          <button
            key={star}
            type="button"
            disabled={isPending}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => handleRate(star)}
            className="transition-transform active:scale-90 disabled:opacity-50"
            aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
          >
            <Star
              size={20}
              weight={filled ? "fill" : "regular"}
              className={
                filled
                  ? "text-amber-500 dark:text-amber-400"
                  : "text-stone-300 dark:text-stone-600"
              }
            />
          </button>
        );
      })}
    </div>
  );
}
