// Onboarding modal — first-launch flow.
// Step 1: Profile (Name, DOB, Email/Contact) — captured for personalisation.
// Step 2: Ask cycle-tracking question (Yes / No).
// Step 3 (if Yes): Pick last period start date + cycle length.

import { useState } from "react";

import Sheet from "@/components/Sheet";
import {
  DEFAULT_CYCLE_LENGTH,
  markOnboardingComplete,
  saveCyclePrefs,
  type CyclePrefs,
} from "@/utils/cycle-storage";
import { toDateKey } from "@/utils/cycle";
import { saveProfile, type Profile } from "@/utils/profile-storage";

type Props = {
  visible: boolean;
  onClose: () => void;
};

type Step = "profile" | "ask" | "details";

function defaultDob(): string {
  // Default DOB: 25 years ago — feels neutral.
  const d = new Date();
  d.setFullYear(d.getFullYear() - 25);
  return toDateKey(d);
}

export default function OnboardingModal({ visible, onClose }: Props) {
  const [step, setStep] = useState<Step>("profile");

  // Profile state
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [dob, setDob] = useState<string>(defaultDob);

  // Cycle state
  const [periodStart, setPeriodStart] = useState<string>(() =>
    toDateKey(new Date()),
  );
  const [cycleLengthInput, setCycleLengthInput] = useState<string>(
    String(DEFAULT_CYCLE_LENGTH),
  );

  const [saving, setSaving] = useState(false);

  const profileValid = name.trim().length > 0 && contact.trim().length > 0;
  const todayKey = toDateKey(new Date());

  const handleProfileNext = async () => {
    if (!profileValid || saving) return;
    setSaving(true);
    const profile: Profile = {
      name: name.trim(),
      dob: dob || null,
      contact: contact.trim(),
    };
    await saveProfile(profile);
    setSaving(false);
    setStep("ask");
  };

  const handleNo = async () => {
    setSaving(true);
    const prefs: CyclePrefs = {
      trackingEnabled: false,
      lastPeriodStart: null,
      cycleLength: DEFAULT_CYCLE_LENGTH,
    };
    await saveCyclePrefs(prefs);
    await markOnboardingComplete();
    setSaving(false);
    onClose();
  };

  const handleYes = () => setStep("details");

  const handleSaveDetails = async () => {
    const parsed = parseInt(cycleLengthInput, 10);
    const cycleLength =
      Number.isFinite(parsed) && parsed >= 20 && parsed <= 45
        ? parsed
        : DEFAULT_CYCLE_LENGTH;

    setSaving(true);
    const prefs: CyclePrefs = {
      trackingEnabled: true,
      lastPeriodStart: periodStart || todayKey,
      cycleLength,
    };
    await saveCyclePrefs(prefs);
    await markOnboardingComplete();
    setSaving(false);
    onClose();
  };

  return (
    <Sheet
      open={visible}
      onClose={() => {}}
      variant="center"
      testId="onboarding-modal"
    >
      {step === "profile" && (
        <>
          <div className="eyebrow" style={{ marginBottom: 8 }}>
            WELCOME
          </div>
          <div className="sheet-title">A bit about you</div>
          <div className="sheet-body-text" style={{ lineHeight: "24px" }}>
            We&apos;ll use these to personalise the app. Everything stays on
            this device.
          </div>

          <label className="field-label" style={{ color: "var(--text-secondary)" }}>
            Name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your full name"
            className="text-input"
            maxLength={60}
            data-testid="onboarding-name-input"
          />

          <label className="field-label" style={{ color: "var(--text-secondary)" }}>
            Date of birth
          </label>
          <input
            type="date"
            value={dob}
            max={todayKey}
            onChange={(e) => setDob(e.target.value)}
            className="text-input"
            data-testid="onboarding-dob-picker"
          />

          <label className="field-label" style={{ color: "var(--text-secondary)" }}>
            Email or contact number
          </label>
          <input
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="you@example.com or +1 555 0123"
            className="text-input"
            maxLength={80}
            data-testid="onboarding-contact-input"
          />

          <div className="actions-row" style={{ marginTop: 24 }}>
            <button
              className="btn btn-primary"
              onClick={handleProfileNext}
              disabled={!profileValid || saving}
              data-testid="onboarding-profile-next-button"
            >
              Continue
            </button>
          </div>
        </>
      )}

      {step === "ask" && (
        <>
          <div className="eyebrow" style={{ marginBottom: 8 }}>
            STEP 2 OF 2
          </div>
          <div className="sheet-title">Train with your body</div>
          <div className="sheet-body-text" style={{ lineHeight: "24px" }}>
            Would you like to track your menstrual cycle to adapt your training
            load to your energy levels?
          </div>

          <div className="actions-row" style={{ marginTop: 24 }}>
            <button
              className="btn btn-secondary"
              onClick={handleNo}
              disabled={saving}
              data-testid="onboarding-no-button"
            >
              No, thanks
            </button>
            <button
              className="btn btn-primary"
              onClick={handleYes}
              disabled={saving}
              data-testid="onboarding-yes-button"
            >
              Yes, track it
            </button>
          </div>
        </>
      )}

      {step === "details" && (
        <>
          <div className="eyebrow" style={{ marginBottom: 8 }}>
            CYCLE DETAILS
          </div>
          <div className="sheet-title">Set your baseline</div>
          <div className="sheet-body-text" style={{ lineHeight: "24px" }}>
            We&apos;ll use this to tailor your training load.
          </div>

          <label className="field-label" style={{ color: "var(--text-secondary)" }}>
            Start date of last period
          </label>
          <input
            type="date"
            value={periodStart}
            max={todayKey}
            onChange={(e) => setPeriodStart(e.target.value)}
            className="text-input"
            data-testid="onboarding-date-picker"
          />

          <label className="field-label" style={{ color: "var(--text-secondary)" }}>
            Average cycle length (days)
          </label>
          <input
            value={cycleLengthInput}
            onChange={(e) => setCycleLengthInput(e.target.value)}
            inputMode="numeric"
            className="text-input"
            placeholder="28"
            maxLength={2}
            data-testid="onboarding-cycle-length-input"
          />

          <div className="actions-row" style={{ marginTop: 24 }}>
            <button
              className="btn btn-secondary"
              onClick={() => setStep("ask")}
              disabled={saving}
              data-testid="onboarding-back-button"
            >
              Back
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSaveDetails}
              disabled={saving}
              data-testid="onboarding-save-button"
            >
              Save &amp; continue
            </button>
          </div>
        </>
      )}
    </Sheet>
  );
}
