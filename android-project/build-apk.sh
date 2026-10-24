#!/usr/bin/env bash
set -e

echo "========================================================"
echo "  RemindMe Android APK Builder (Kotlin + Compose + Room)"
echo "========================================================"

if command -v ./gradlew >/dev/null 2>&1; then
  ./gradlew assembleDebug
elif command -v gradle >/dev/null 2>&1; then
  gradle assembleDebug
else
  echo "Error: Neither ./gradlew nor gradle was found in PATH."
  echo "Open this folder in Android Studio (Ladybug or newer) and click:"
  echo "  Build -> Build Bundle(s) / APK(s) -> Build APK(s)"
  exit 1
fi

echo ""
echo "APK successfully generated at:"
echo "  app/build/outputs/apk/debug/app-debug.apk"
