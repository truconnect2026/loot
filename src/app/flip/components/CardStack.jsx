"use client";

import { motion, useMotionValue, useTransform } from "motion/react";
import { useEffect } from "react";
import SwipeCard from "./SwipeCard.jsx";

/**
 * CardStack — owns the shared dragX MotionValue and renders up to 3 cards
 * (current + 2 peeks). Peek 1 binds to the top card's drag so it grows + tilts
 * counter to the top card, creating the "next card revealed" depth cue.
 */
export default function CardStack({ items, currentIndex, onSwipe, onDragX, firstRound }) {
  const x = useMotionValue(0);

  useEffect(() => {
    if (!onDragX) return;
    return x.on("change", (v) => onDragX(v));
  }, [x, onDragX]);

  // Peek 1: scales up and counter-tilts as top card moves toward an edge.
  const peek1Scale = useTransform(x, [-200, 0, 200], [0.98, 0.94, 0.98]);
  const peek1Y = useTransform(x, [-200, 0, 200], [6, 12, 6]);
  const peek1Rotate = useTransform(x, [-200, 0, 200], [0.9, 0, -0.9]); // 5% of top tilt

  const slots = [0, 1, 2]
    .map((depth) => {
      const idx = currentIndex + depth;
      if (idx >= items.length) return null;
      return { depth, item: items[idx], isTop: depth === 0 };
    })
    .filter(Boolean)
    .reverse();

  return (
    <div className="flip-card-stack">
      {slots.map(({ depth, item, isTop }) => {
        if (isTop) {
          return (
            <SwipeCard
              key={item.id}
              item={item}
              isTop
              firstRound={firstRound}
              onSwipe={onSwipe}
              onDrag={(latest) => x.set(latest)}
            />
          );
        }
        if (depth === 1) {
          return (
            <motion.div
              key={item.id}
              className="flip-swipe-card flip-swipe-card--peek"
              style={{
                scale: peek1Scale,
                y: peek1Y,
                rotate: peek1Rotate,
                zIndex: -1,
              }}
            >
              <SwipeCardPeek item={item} />
              <div className="flip-peek-tint flip-peek-tint--purple" aria-hidden="true" />
            </motion.div>
          );
        }
        return (
          <motion.div
            key={item.id}
            className="flip-swipe-card flip-swipe-card--peek"
            style={{ scale: 0.88, y: 24, zIndex: -2 }}
          >
            <SwipeCardPeek item={item} />
            <div className="flip-peek-tint flip-peek-tint--purple" aria-hidden="true" />
          </motion.div>
        );
      })}
    </div>
  );
}

function SwipeCardPeek({ item }) {
  return (
    <div className="flip-swipe-card-inner">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.image}
        alt=""
        aria-hidden="true"
        onError={(e) => {
          if (!e.currentTarget.src.endsWith("_placeholder.svg")) {
            e.currentTarget.src = "/items/_placeholder.svg";
          }
        }}
        style={{
          position: "absolute", inset: 0, width: "100%", height: "100%",
          objectFit: "cover",
        }}
      />
      <div className="flip-card-bottom">
        <div className="flip-card-bottom-fade" aria-hidden="true" />
      </div>
    </div>
  );
}
