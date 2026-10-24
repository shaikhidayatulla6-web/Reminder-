import React, { useState } from 'react';
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  FileArchive,
  Smartphone,
  Sparkles,
  Terminal,
  X,
} from 'lucide-react';

interface ApkDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAndroidSource: () => void;
}

export const ApkDownloadModal: React.FC<ApkDownloadModalProps> = ({
  isOpen,
  onClose,
  onOpenAndroidSource,
}) => {
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  if (!isOpen) return null;

  const sharedAppUrl =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://ais-pre-7c6ihy6pjddfe5sk4hy22r-541101464545.asia-northeast1.run.app';

  const zipDownloadUrl = `${sharedAppUrl}/downloads/RemindMe-Android-Studio-Project.zip`;

  const gradleCmd = `./gradlew assembleDebug && adb install -r app/build/outputs/apk/debug/app-debug.apk`;

  const handleCopy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem(key);
      setTimeout(() => setCopiedItem(null), 2200);
    } catch {
      // Fallback
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="apk-download-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md"
    >
      <div className="w-full max-w-2xl rounded-[32px] liquid-glass p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto relative">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-white/60 dark:border-white/10">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full origin-atomic-capsule text-white text-xs font-semibold">
              <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
              <span>RemindMe v1.0.0 — Android Package & APK Build Center</span>
            </div>
            <h2
              id="apk-download-modal-title"
              className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight pt-1"
            >
              Download RemindMe for Android
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Download the complete Android Studio Kotlin + Jetpack Compose project archive (with
              automated GitHub Actions APK compiler) or install the WebAPK directly onto your phone.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close APK download dialog"
            className="p-2 rounded-xl liquid-btn-secondary text-slate-600 dark:text-slate-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Option 1: Direct ZIP Download of Complete Native Android Studio Project + Cloud APK Workflow */}
        <div className="rounded-2xl liquid-glass-interactive p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl origin-droplet-badge flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                <FileArchive className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    1. Complete Android Studio Project (.zip) + Cloud APK Builder
                  </h3>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-blue-500/15 text-blue-700 dark:text-blue-300">
                    22 Files · Kotlin + Compose
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Contains all Kotlin source files, Room Database, AlarmManager exact scheduler,
                  BroadcastReceiver, Gradle config, and a pre-configured{' '}
                  <code className="font-mono text-[11px]">.github/workflows/build-apk.yml</code>{' '}
                  that compiles <code className="font-mono text-[11px]">app-debug.apk</code> automatically.
                </p>
              </div>
            </div>

            <a
              href="/downloads/RemindMe-Android-Studio-Project.zip"
              download="RemindMe-Android-Studio-Project.zip"
              className="px-4 py-2.5 rounded-xl liquid-btn-primary text-white text-xs font-semibold inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
            >
              <Download className="w-4 h-4" />
              Download Project (.zip)
            </a>
          </div>

          {/* Direct Download Link Copy Row */}
          <div className="flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl liquid-glass-input text-xs">
            <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300 truncate">
              {zipDownloadUrl}
            </span>
            <button
              type="button"
              onClick={() => handleCopy(zipDownloadUrl, 'zip-url')}
              className="px-2.5 py-1 rounded-lg liquid-btn-secondary text-[11px] font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1 shrink-0"
            >
              {copiedItem === 'zip-url' ? (
                <>
                  <Check className="w-3 h-3 text-emerald-500" />
                  Copied Link
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  Copy Link
                </>
              )}
            </button>
          </div>
        </div>

        {/* Option 2: Instant Android WebAPK / Home Screen Installation Link */}
        <div className="rounded-2xl liquid-glass-interactive p-5 space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl origin-droplet-badge flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    2. Instant Android Home Screen App (WebAPK / PWA Link)
                  </h3>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                    No Compiler Required
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Open this link in Chrome on any Android phone and tap{' '}
                  <strong className="font-semibold text-slate-800 dark:text-slate-200">
                    ⋮ Menu → Add to Home screen / Install app
                  </strong>{' '}
                  to install RemindMe with full-screen OriginOS 7 Liquid Glass UI, live countdown
                  widgets, and Vibration API haptics.
                </p>
              </div>
            </div>

            <a
              href={sharedAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl liquid-btn-secondary text-slate-800 dark:text-slate-100 text-xs font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open Mobile Link
            </a>
          </div>

          <div className="flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl liquid-glass-input text-xs">
            <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300 truncate">
              {sharedAppUrl}
            </span>
            <button
              type="button"
              onClick={() => handleCopy(sharedAppUrl, 'pwa-url')}
              className="px-2.5 py-1 rounded-lg liquid-btn-secondary text-[11px] font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1 shrink-0"
            >
              {copiedItem === 'pwa-url' ? (
                <>
                  <Check className="w-3 h-3 text-emerald-500" />
                  Copied URL
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  Copy URL
                </>
              )}
            </button>
          </div>
        </div>

        {/* Option 3: 1-Command Gradle APK Compile & ADB Install */}
        <div className="rounded-2xl bg-slate-950/90 text-slate-100 p-5 space-y-3 border border-white/15">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-400">
              <Terminal className="w-4 h-4" />
              <span>Compile Binary APK Locally or via GitHub Actions</span>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(gradleCmd, 'gradle-cmd')}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-200 inline-flex items-center gap-1"
            >
              {copiedItem === 'gradle-cmd' ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  Copy Command
                </>
              )}
            </button>
          </div>

          <pre className="text-[11px] font-mono text-emerald-300 bg-slate-900/90 p-3 rounded-xl overflow-x-auto">
            {gradleCmd}
          </pre>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            Note: Because this web preview container runs Node.js without the Android SDK/Gradle
            toolchain installed, binary <code className="font-mono">.apk</code> compilation is
            performed either by unzipping the project into Android Studio / running{' '}
            <code className="font-mono">./build-apk.sh</code>, or by pushing the unzipped folder to
            GitHub where the included <code className="font-mono">.github/workflows/build-apk.yml</code>{' '}
            action automatically builds and publishes <code className="font-mono">app-debug.apk</code>.
          </p>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenAndroidSource();
            }}
            className="px-4 py-2 rounded-xl liquid-btn-secondary text-xs font-semibold text-slate-700 dark:text-slate-200"
          >
            Inspect All 20 Kotlin Source Files
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl liquid-btn-primary text-white text-xs font-semibold"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
