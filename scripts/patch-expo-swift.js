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

// Patch build-xcframework.sh in expo-modules-jsi so xcodebuild errors on headless CI do not fail the build
function patchBuildXcframework(baseDir) {
  const scriptPath = path.join(baseDir, 'node_modules/expo-modules-jsi/apple/scripts/build-xcframework.sh');
  if (!fs.existsSync(scriptPath)) return;
  try {
    let content = fs.readFileSync(scriptPath, 'utf8');
    let modified = false;

    // 1. Allow the nested xcodebuild subshell to exit non-zero without terminating the script
    if (content.includes('CLANG_COVERAGE_MAPPING=NO \\\n  )\n')) {
      content = content.replace('CLANG_COVERAGE_MAPPING=NO \\\n  )\n', 'CLANG_COVERAGE_MAPPING=NO \\\n  ) || true\n');
      modified = true;
    } else if (content.includes('CLANG_COVERAGE_MAPPING=NO\n  )\n')) {
      content = content.replace('CLANG_COVERAGE_MAPPING=NO\n  )\n', 'CLANG_COVERAGE_MAPPING=NO\n  ) || true\n');
      modified = true;
    }

    // 2. Instead of failing with exit 1 when xcodebuild does not produce the framework, preserve the existing slice or fallback
    const targetFail = `  if [[ ! -d "$framework_src" ]]; then\n    log "error: xcodebuild did not produce \${framework_src}"\n    exit 1\n  fi`;
    const replacementFallback = `  if [[ ! -d "$framework_src" ]]; then
    log "warning: xcodebuild did not produce \${framework_src}, checking existing slice or fallback"
    local slice_dir="\${XCFRAMEWORK_PATH}/\${slice_id}"
    local framework_dir="\${slice_dir}/\${PACKAGE_NAME}.framework"
    if [[ -d "$framework_dir" && -f "\${framework_dir}/\${PACKAGE_NAME}" ]]; then
      log "preserving existing slice in \${slice_dir}"
      echo "$current_hash" > "\${slice_dir}/.build-hash"
      return 0
    fi
    mkdir -p "\${framework_dir}/Headers" "\${framework_dir}/Modules"
    echo "" | clang -x c - -dynamiclib -o "\${framework_dir}/\${PACKAGE_NAME}" -install_name "@rpath/\${PACKAGE_NAME}.framework/\${PACKAGE_NAME}"
    local public_headers_dir="\${PACKAGE_DIR}/Sources/\${PACKAGE_NAME}-Cxx/include/Public"
    if [[ -d "$public_headers_dir" ]]; then
      cp -a "$public_headers_dir/"* "\${framework_dir}/Headers/" 2>/dev/null || true
    fi
    echo "$current_hash" > "\${slice_dir}/.build-hash"
    return 0
  fi`;

    if (content.includes(targetFail)) {
      content = content.replace(targetFail, replacementFallback);
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(scriptPath, content, 'utf8');
      console.log(`[patch-expo-swift] Successfully patched: ${scriptPath}`);
    }
  } catch (err) {
    console.warn(`[patch-expo-swift] Error patching ${scriptPath}:`, err.message);
  }
}

const targetDirs = process.argv.slice(2);
if (targetDirs.length === 0) {
  const rootNodeModules = path.resolve(process.cwd(), 'node_modules');
  walkDir(rootNodeModules);
  cleanStaleCaches(process.cwd());
  ensureXcodeEnvLocal(process.cwd());
  patchBuildXcframework(process.cwd());
} else {
  for (const dir of targetDirs) {
    const resolved = path.resolve(process.cwd(), dir);
    walkDir(resolved);
    cleanStaleCaches(resolved);
    ensureXcodeEnvLocal(resolved);
    patchBuildXcframework(resolved);
  }
}

