// Adaptive training banner — Recovery vs Peak Energy.
// Only renders when cycle tracking is enabled (parent passes `status.enabled`).

import { IoFlash, IoLeaf } from "react-icons/io5";

import type { CycleStatus } from "@/utils/cycle";

import "./logger.css";

type Props = {
  status: CycleStatus;
};

const COPY = {
  recovery: {
    title: "Recovery Phase",
    body: "We suggest lighter weights today. Recovery is progress.",
  },
  peak: {
    title: "Peak Energy Phase",
    body: "Great day to push for personal records!",
  },
};

export default function AdaptiveBanner({ status }: Props) {
  if (!status.enabled || !status.phase) return null;

  const copy = COPY[status.phase];
  const isRecovery = status.phase === "recovery";

  return (
    <div
      className={`adaptive-banner ${isRecovery ? "recovery" : "peak"}`}
      data-testid="adaptive-banner"
    >
      <div className="banner-bubble">
        {isRecovery ? <IoLeaf /> : <IoFlash />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="banner-title-row">
          <span className="banner-title" data-testid="adaptive-banner-title">
            {copy.title}
          </span>
          <span className="banner-day-pill" data-testid="adaptive-banner-day">
            Day {status.day}
          </span>
        </div>
        <div className="banner-body" data-testid="adaptive-banner-body">
          {copy.body}
        </div>
      </div>
    </div>
  );
}
