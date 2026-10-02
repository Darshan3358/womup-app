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
    if (content.includes('swift-tools-version: 6.2')) {
      content = content.replace(/swift-tools-version:\s*6\.2/g, 'swift-tools-version: 6.0');
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`[patch-expo-swift] Successfully patched: ${filePath} -> swift-tools-version: 6.0`);
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

const targetDirs = process.argv.slice(2);
if (targetDirs.length === 0) {
  const rootNodeModules = path.resolve(process.cwd(), 'node_modules');
  walkDir(rootNodeModules);
  cleanStaleCaches(process.cwd());
} else {
  for (const dir of targetDirs) {
    const resolved = path.resolve(process.cwd(), dir);
    walkDir(resolved);
    cleanStaleCaches(resolved);
  }
}
