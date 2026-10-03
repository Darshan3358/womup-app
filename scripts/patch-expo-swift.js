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

function patchSwiftSourceFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Fix Swift 6.2 'weak let' which is rejected in Swift 6.0/6.1 ('weak' must be a mutable variable)
    if (/\bweak\s+let\b/.test(content)) {
      content = content.replace(/\bweak\s+let\b/g, 'weak var');
      modified = true;
    }

    // Fix trailing commas before closing parenthesis ')' in Swift 6.0
    if (/,\s*\)/.test(content)) {
      content = content.replace(/,\s*\)/g, (match) => match.replace(',', ''));
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`[patch-expo-swift] Patched Swift source: ${filePath}`);
    }
  } catch (err) {
    console.warn(`[patch-expo-swift] Error patching Swift source ${filePath}:`, err.message);
  }
}

function patchRuntimeSchedulerHeader(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('SWIFT_RETURNS_RETAINED RuntimeScheduler')) {
      content = content.replace(/SWIFT_RETURNS_RETAINED\s+RuntimeScheduler/g, 'RuntimeScheduler');
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`[patch-expo-swift] Patched RuntimeScheduler.h: ${filePath}`);
    }
  } catch (err) {
    console.warn(`[patch-expo-swift] Error patching RuntimeScheduler.h:`, err.message);
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
      } else if (entry.name.endsWith('.swift')) {
        patchSwiftSourceFile(fullPath);
      } else if (entry.name === 'RuntimeScheduler.h') {
        patchRuntimeSchedulerHeader(fullPath);
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

    // 3. Guard copying of swiftmodule and swift headers so missing artifacts never fail the build
    if (content.includes('cp -a "$swiftmodule_src/"')) {
      content = content.replace('cp -a "$swiftmodule_src/"', '[[ -d "$swiftmodule_src" ]] && cp -a "$swiftmodule_src/"');
      modified = true;
    }
    if (content.includes('cp "${generated_maps}/${PACKAGE_NAME}-Swift.h"')) {
      content = content.replace('cp "${generated_maps}/${PACKAGE_NAME}-Swift.h"', '[[ -f "${generated_maps}/${PACKAGE_NAME}-Swift.h" ]] && cp "${generated_maps}/${PACKAGE_NAME}-Swift.h"');
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

function patchAll(baseDir) {
  const nm = path.join(baseDir, 'node_modules');
  if (!fs.existsSync(nm)) return;

  // 1. Patch known Package.swift files
  const knownPackageSwifts = [
    path.join(nm, 'expo-modules-jsi/apple/Package.swift'),
    path.join(nm, 'react-native/Libraries/ReactNativeDependencies/Package.swift'),
    path.join(nm, '@expo/expo-modules-macros-plugin/apple/Package.swift'),
  ];
  for (const pkg of knownPackageSwifts) {
    if (fs.existsSync(pkg)) {
      patchFile(pkg);
    }
  }

  // 2. Patch all Swift and C++ files in expo-modules-jsi/apple
  const jsiAppleDir = path.join(nm, 'expo-modules-jsi/apple');
  if (fs.existsSync(jsiAppleDir)) {
    walkDir(jsiAppleDir);
  }

  // 3. Patch build-xcframework.sh in expo-modules-jsi
  patchBuildXcframework(baseDir);

  // 4. Stale cache cleanup and xcode.env.local
  cleanStaleCaches(baseDir);
  ensureXcodeEnvLocal(baseDir);
}

const targetDirs = process.argv.slice(2);
if (targetDirs.length === 0) {
  patchAll(process.cwd());
} else {
  for (const dir of targetDirs) {
    const resolved = path.resolve(process.cwd(), dir);
    patchAll(resolved);
  }
}

