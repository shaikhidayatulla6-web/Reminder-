import React, { useState } from 'react';
import {
  Check,
  Code2,
  Copy,
  Download,
  FileCode,
  FolderTree,
  Terminal,
} from 'lucide-react';
import { ANDROID_PROJECT_FILES, AndroidProjectFile } from '../data/androidProjectFiles';

export const AndroidProjectExplorer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<AndroidProjectFile>(
    ANDROID_PROJECT_FILES[0]
  );
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  const folders = Array.from(new Set(ANDROID_PROJECT_FILES.map((f) => f.folder)));

  const handleCopyCode = async (file: AndroidProjectFile) => {
    try {
      await navigator.clipboard.writeText(file.content);
      setCopiedPath(file.path);
      setTimeout(() => setCopiedPath(null), 2000);
    } catch {
      // Fallback
    }
  };

  const handleDownloadSingleFile = (file: AndroidProjectFile) => {
    const blob = new Blob([file.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.path.replace(/\//g, '_');
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadFullProjectBundle = () => {
    const bundleContent = ANDROID_PROJECT_FILES.map(
      (f) =>
        `================================================================================\nFILE: ${f.path}\nDESCRIPTION: ${f.description}\n================================================================================\n\n${f.content}\n\n`
    ).join('\n');

    const blob = new Blob([bundleContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'RemindMe-Android-Studio-Project-Source.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-[28px] liquid-glass p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400">
            <Code2 className="w-4 h-4" />
            <span>Complete Native Android Studio Project (Kotlin + Jetpack Compose + Room)</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            RemindMe Android Architecture & Source Files
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-3xl">
            Inspect or download every Kotlin source file, Room DAO & Entity, AlarmManager
            scheduler, BroadcastReceiver, AndroidManifest.xml, Gradle configuration, and JUnit 4
            test suite. All files are also written to <code className="font-mono">/android-project/</code>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <a
            href="/downloads/RemindMe-Android-Studio-Project.zip"
            download="RemindMe-Android-Studio-Project.zip"
            className="px-4 py-2.5 rounded-xl liquid-btn-primary text-white text-xs font-semibold inline-flex items-center gap-2 transition-all whitespace-nowrap shrink-0"
          >
            <Download className="w-4 h-4" />
            Download Project (.zip + APK Builder)
          </a>
          <button
            type="button"
            onClick={handleDownloadFullProjectBundle}
            className="px-3.5 py-2.5 rounded-xl liquid-btn-secondary text-slate-800 dark:text-slate-100 text-xs font-semibold inline-flex items-center gap-2 transition-all whitespace-nowrap shrink-0"
          >
            <Download className="w-4 h-4" />
            Source Bundle (.txt)
          </button>
        </div>
      </div>

      {/* Main Split: Left Tree, Right Source Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Project Tree Sidebar */}
        <div className="lg:col-span-4 rounded-[28px] liquid-glass p-5 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white pb-2 border-b border-white/40 dark:border-white/10">
            <FolderTree className="w-4 h-4 text-blue-600" />
            <span>Android Project Hierarchy ({ANDROID_PROJECT_FILES.length} files)</span>
          </div>

          <div className="space-y-4">
            {folders.map((folderName) => {
              const filesInFolder = ANDROID_PROJECT_FILES.filter(
                (f) => f.folder === folderName
              );
              return (
                <div key={folderName} className="space-y-1">
                  <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 px-2">
                    {folderName}
                  </p>
                  {filesInFolder.map((file) => {
                    const isSelected = selectedFile.path === file.path;
                    return (
                      <button
                        key={file.path}
                        type="button"
                        onClick={() => setSelectedFile(file)}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-2 transition-all ${
                          isSelected
                            ? 'liquid-btn-primary font-semibold'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-white/40 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        <FileCode className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate font-mono">{file.name}</span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* Code Viewer & APK Instructions */}
        <div className="lg:col-span-8 space-y-6">
          <div className="rounded-[28px] bg-slate-950/90 backdrop-blur-xl text-slate-100 border border-white/15 overflow-hidden shadow-xl">
            <div className="px-5 py-3.5 bg-slate-900/80 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-mono font-semibold text-blue-400">
                  {selectedFile.path}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">{selectedFile.description}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyCode(selectedFile)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-white/10 text-xs font-medium text-slate-200 inline-flex items-center gap-1.5 transition-colors"
                >
                  {copiedPath === selectedFile.path ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy File
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadSingleFile(selectedFile)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-white/10 text-xs font-medium text-slate-200 inline-flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </button>
              </div>
            </div>

            <pre className="p-5 text-xs font-mono leading-relaxed overflow-x-auto max-h-[600px] text-slate-200">
              <code>{selectedFile.content}</code>
            </pre>
          </div>

          {/* Quick APK Build & Install Terminal Instructions */}
          <div className="rounded-[28px] liquid-glass p-6 space-y-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Terminal className="w-4 h-4 text-blue-600" />
              Build & Install APK Instructions
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Open the <code className="font-mono">android-project</code> directory in Android
              Studio (Ladybug 2024.2.1+ with JDK 17 & Android SDK 35) and run:
            </p>
            <div className="rounded-2xl bg-slate-900/90 text-slate-100 p-4 font-mono text-xs space-y-1.5 overflow-x-auto border border-white/10">
              <div># 1. Run JUnit 4 recurrence and scheduling unit tests</div>
              <div className="text-cyan-400">./gradlew testDebugUnitTest</div>
              <div className="pt-2"># 2. Assemble the installable Debug APK</div>
              <div className="text-cyan-400">./gradlew assembleDebug</div>
              <div className="pt-2"># 3. Install on a connected Android device or emulator</div>
              <div className="text-emerald-400">
                adb install -r app/build/outputs/apk/debug/app-debug.apk
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
