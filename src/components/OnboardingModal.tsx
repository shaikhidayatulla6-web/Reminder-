import React, { useState } from 'react';
import { BellRing, CalendarCheck, CheckCircle2, Shield, Sparkles, X } from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SLIDES = [
  {
    title: 'Welcome to RemindMe',
    subtitle: 'Your All-in-One Android Reminder Companion',
    description:
      'Set unlimited reminders across 13 life categories — from Water Drinking and Medicine to Work, Study, Fitness, and Birthdays — or create your own custom categories.',
    icon: Sparkles,
    accent: 'text-blue-600 bg-blue-50 dark:bg-blue-950/60',
  },
  {
    title: 'Flexible Recurring Schedules',
    subtitle: 'One-Time, Hourly, Daily, Weekdays, or Custom Intervals',
    description:
      'Schedule reminders for any date and time with optional end dates. When a recurring reminder is completed, RemindMe automatically advances it to the next occurrence.',
    icon: CalendarCheck,
    accent: 'text-purple-600 bg-purple-50 dark:bg-purple-950/60',
  },
  {
    title: 'Smart Notifications & Offline Privacy',
    subtitle: 'Exact Alarms, Snooze 5–60m, and 100% Local Room Storage',
    description:
      'Receive rich alerts with custom chimes, vibration, Mark as Done, and Snooze controls. All data persists locally on your device with zero accounts and zero ads.',
    icon: BellRing,
    accent: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-950/60',
  },
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(0);

  if (!isOpen) return null;

  const current = SLIDES[step];
  const IconComp = current.icon;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 backdrop-blur-md p-4"
    >
      <div className="w-full max-w-lg rounded-[28px] liquid-glass p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400">
            <Shield className="w-4 h-4" />
            <span>RemindMe Interactive Walkthrough ({step + 1} / {SLIDES.length})</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close walkthrough"
            className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl liquid-btn-secondary text-slate-500 hover:text-slate-900 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border border-white/50 dark:border-white/15 shadow-xs ${current.accent}`}>
            <IconComp className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {current.subtitle}
            </p>
            <h2
              id="onboarding-title"
              className="text-2xl font-bold text-slate-900 dark:text-white mt-1 tracking-tight"
            >
              {current.title}
            </h2>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            {current.description}
          </p>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-white/40 dark:border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          >
            Skip Tour
          </button>

          <div className="flex items-center gap-2">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="px-4 py-2 rounded-xl liquid-btn-secondary text-xs font-semibold text-slate-700 dark:text-slate-200"
              >
                Back
              </button>
            )}
            {step < SLIDES.length - 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                className="px-5 py-2 rounded-xl liquid-btn-primary text-xs font-semibold"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-xl liquid-btn-primary text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                Get Started
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
