#!/usr/bin/env node
/**
 * Patches SwiftPM Package.swift files in node_modules where Swift tools version is 6.2.
 * Xcode 16.2 only supports Swift tools version up to 6.0.0.
 */

const fs = require('fs');
const path = require('path');

function patchFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // 1. Downgrade swift-tools-version: 6.2+ to 6.0 (Xcode 16.2 only supports up to 6.0)
    if (/swift-tools-version:\s*6\.[1-9]/.test(content)) {
      content = content.replace(/swift-tools-version:\s*6\.[1-9](\.\d+)?/g, 'swift-tools-version: 6.0');
      modified = true;
    }

    // 2. Fix trailing commas before closing parenthesis ')'
    // Swift 6.0 (Xcode 16.2) does NOT support trailing commas in function argument lists (added in Swift 6.2).
    if (/,\s*\)/.test(content)) {
      content = content.replace(/,\s*\)/g, (match) => match.replace(',', ''));
      modified = true;
    }

    // 3. Remove/comment upcoming features introduced in Swift 6.2
    if (content.includes('NonisolatedNonsendingByDefault') || content.includes('InferIsolatedConformances')) {
      const updated = content.replace(
        /^[ \t]*\.enableUpcomingFeature\("(NonisolatedNonsendingByDefault|InferIsolatedConformances)"\),?/gm,
        '        // .enableUpcomingFeature("$1"),'
      );
      if (updated !== content) {
        content = updated;
        modified = true;
      }
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`[patch-expo-swift] Successfully patched: ${filePath}`);
    }
  } catch (err) {
    console.warn(`[patch-expo-swift] Error reading/writing ${filePath}:`, err.message);
  }
}

function walkDir(dir) {
  if (!fs.existsSync(dir)) return;
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === '.git' || entry.name === '.build' || entry.name === '.DerivedData') continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walkDir(fullPath);
      } else if (entry.name === 'Package.swift') {
        patchFile(fullPath);
      }
    }
  } catch (err) {
    console.warn(`[patch-expo-swift] Error scanning ${dir}:`, err.message);
  }
}

// Clean stale build directories in expo-modules-jsi/apple if present
function cleanStaleCaches(baseDir) {
  const dirsToClean = [
    path.join(baseDir, 'node_modules/expo-modules-jsi/apple/.DerivedData'),
    path.join(baseDir, 'node_modules/expo-modules-jsi/apple/.build'),
    path.join(baseDir, 'node_modules/expo-modules-jsi/apple/.swiftpm')
  ];
  for (const d of dirsToClean) {
    if (fs.existsSync(d)) {
      try {
        fs.rmSync(d, { recursive: true, force: true });
        console.log(`[patch-expo-swift] Removed stale build cache: ${d}`);
      } catch (_) {}
    }
  }
}

// Ensure ios/.xcode.env.local defines NODE_BINARY for Xcode build phases (Hermes, bundle, Expo)
function ensureXcodeEnvLocal(baseDir) {
  const iosDir = path.join(baseDir, 'ios');
  if (fs.existsSync(iosDir)) {
    try {
      const envLocalPath = path.join(iosDir, '.xcode.env.local');
      const nodeBinary = process.execPath;
      const content = `export NODE_BINARY="${nodeBinary}"\n`;
      fs.writeFileSync(envLocalPath, content, 'utf8');
      console.log(`[patch-expo-swift] Created ${envLocalPath} -> NODE_BINARY=${nodeBinary}`);
    } catch (err) {
      console.warn(`[patch-expo-swift] Error creating .xcode.env.local in ${iosDir}:`, err.message);
    }
  }
}

const targetDirs = process.argv.slice(2);
if (targetDirs.length === 0) {
  const rootNodeModules = path.resolve(process.cwd(), 'node_modules');
  walkDir(rootNodeModules);
  cleanStaleCaches(process.cwd());
  ensureXcodeEnvLocal(process.cwd());
} else {
  for (const dir of targetDirs) {
    const resolved = path.resolve(process.cwd(), dir);
    walkDir(resolved);
    cleanStaleCaches(resolved);
    ensureXcodeEnvLocal(resolved);
  }
}
