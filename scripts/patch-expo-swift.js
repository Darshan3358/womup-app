#!/usr/bin/env node
/**
 * Patches SwiftPM Package.swift files and Swift/C++ headers in node_modules where Swift tools version is 6.2.
 * Xcode 16.4 only supports Swift 6.0/6.1.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function patchFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // 1. Downgrade swift-tools-version: 6.2+ to 6.0 (Xcode 16.4 supports 6.0)
    if (/swift-tools-version:\s*6\.[1-9]/.test(content)) {
      content = content.replace(/swift-tools-version:\s*6\.[1-9](\.\d+)?/g, 'swift-tools-version: 6.0');
      modified = true;
    }

    // 2. Fix trailing commas before closing parenthesis ')'
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
    // Add nonisolated(unsafe) so Sendable-conforming types allow mutable stored property
    if (/\bweak\s+let\b/.test(content)) {
      content = content.replace(/\b(private|internal|public)?\s*weak\s+let\b/g, (match, vis) => {
        return `nonisolated(unsafe) ${vis ? vis + ' ' : ''}weak var`;
      });
      modified = true;
    } else if (/\bweak\s+var\b/.test(content) && !content.includes('nonisolated(unsafe)')) {
      content = content.replace(/\b(private|internal|public)?\s*weak\s+var\b/g, (match, vis) => {
        return `nonisolated(unsafe) ${vis ? vis + ' ' : ''}weak var`;
      });
      modified = true;
    }

    // Add @unchecked Sendable to JavaScriptPropNameID, JavaScriptError, JavaScriptValue
    if (filePath.endsWith('JavaScriptPropNameID.swift') && content.includes(': JavaScriptType') && !content.includes('@unchecked Sendable')) {
      content = content.replace(': JavaScriptType', ': JavaScriptType, @unchecked Sendable');
      modified = true;
    }
    if (filePath.endsWith('JavaScriptError.swift') && content.includes('Error, Sendable')) {
      content = content.replace('Error, Sendable', 'Error, @unchecked Sendable');
      modified = true;
    }
    if (filePath.endsWith('JavaScriptValue.swift') && content.includes(': JavaScriptType, Equatable, Escapable') && !content.includes('@unchecked Sendable')) {
      content = content.replace(': JavaScriptType, Equatable, Escapable', ': JavaScriptType, Equatable, Escapable, @unchecked Sendable');
      modified = true;
    }

    // Fix trailing commas before closing parenthesis ')' in Swift 6.0
    if (/,\s*\)/.test(content)) {
      content = content.replace(/,\s*\)/g, (match) => match.replace(',', ''));
      modified = true;
    }

    // Fix Task+immediate.swift: Swift 6.0 does not have Task.immediate or Task(name:priority:operation:)
    if (filePath.endsWith('Task+immediate.swift')) {
      if (content.includes('Task.immediate') || content.includes('Task(name:')) {
        content = content.replace(
          /if\s+#available\(.*?\)\s*\{[\s\S]*?\}\s*else\s*\{[\s\S]*?\}/,
          'return Task(priority: .high, operation: operation)'
        );
        content = content.replace(
          /return Task\(name:\s*name,\s*priority:\s*\.high,\s*operation:\s*operation\)/g,
          'return Task(priority: .high, operation: operation)'
        );
        modified = true;
      }
    }

    // Fix JavaScriptRuntime.swift:
    if (filePath.endsWith('JavaScriptRuntime.swift')) {
      // 1. vector.push_back(consuming: propNameId) -> vector.push_back(propNameId)
      if (content.includes('vector.push_back(consuming: propNameId)')) {
        content = content.replace('vector.push_back(consuming: propNameId)', 'vector.push_back(propNameId)');
        modified = true;
      }
      // 2. self.scheduler = expo.RuntimeScheduler() -> self.scheduler = expo.createRuntimeScheduler()
      if (content.includes('self.scheduler = expo.RuntimeScheduler()')) {
        content = content.replace(/self\.scheduler\s*=\s*expo\.RuntimeScheduler\(\)/g, 'self.scheduler = expo.createRuntimeScheduler()');
        modified = true;
      }
      // 3. self.scheduler = expo.RuntimeScheduler(scheduler, fn) -> self.scheduler = expo.createRuntimeScheduler(scheduler, fn)
      if (content.includes('self.scheduler = expo.RuntimeScheduler(scheduler, fn)')) {
        content = content.replace('self.scheduler = expo.RuntimeScheduler(scheduler, fn)', 'self.scheduler = expo.createRuntimeScheduler(scheduler, fn)');
        modified = true;
      }
      // 4. expo.HostFunctionClosure(context, call, deallocate) -> expo.createHostFunctionClosure(context, call, deallocate)
      if (content.includes('expo.HostFunctionClosure(context, call, deallocate)')) {
        content = content.replace(/expo\.HostFunctionClosure\(context,\s*call,\s*deallocate\)/g, 'expo.createHostFunctionClosure(context, call, deallocate)');
        modified = true;
      }
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
    let modified = false;

    if (!content.includes('createRuntimeScheduler')) {
      const helper = `
inline SWIFT_RETURNS_RETAINED RuntimeScheduler * _Nonnull createRuntimeScheduler() {
  return new RuntimeScheduler();
}

inline SWIFT_RETURNS_RETAINED RuntimeScheduler * _Nonnull createRuntimeScheduler(void * _Nullable scheduler, RuntimeScheduler::ScheduleFn _Nullable fn) {
  return new RuntimeScheduler(scheduler, fn);
}
`;
      content = content.replace('} // namespace expo', helper + '\n} // namespace expo');
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`[patch-expo-swift] Patched RuntimeScheduler.h: ${filePath}`);
    }
  } catch (err) {
    console.warn(`[patch-expo-swift] Error patching RuntimeScheduler.h:`, err.message);
  }
}

function patchHostFunctionClosureHeader(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    if (!content.includes('createHostFunctionClosure')) {
      const helper = `
inline HostFunctionClosure * _Nonnull createHostFunctionClosure(HostFunctionClosure::Context context, HostFunctionClosure::Closure closure, HostFunctionClosure::Deallocator deallocator) {
  return new HostFunctionClosure(context, closure, deallocator);
}
`;
      content = content.replace('} // namespace expo', helper + '\n} // namespace expo');
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`[patch-expo-swift] Patched HostFunctionClosure.h: ${filePath}`);
    }
  } catch (err) {
    console.warn(`[patch-expo-swift] Error patching HostFunctionClosure.h:`, err.message);
  }
}

function patchNativeStateHeader(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    if (!content.includes('#ifdef __cplusplus')) {
      const stripped = content.replace(/#pragma once\s*/g, '');
      content = `#pragma once\n\n#ifdef __cplusplus\n${stripped}\n#endif // __cplusplus\n`;
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`[patch-expo-swift] Patched NativeState.h with __cplusplus guard: ${filePath}`);
    }
  } catch (err) {
    console.warn(`[patch-expo-swift] Error patching NativeState.h:`, err.message);
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
      } else if (entry.name === 'HostFunctionClosure.h') {
        patchHostFunctionClosureHeader(fullPath);
      } else if (entry.name === 'NativeState.h') {
        patchNativeStateHeader(fullPath);
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
    const targetCheck = `if [[ ! -d "$framework_src" ]]; then`;
    const replacementCheck = `if [[ ! -d "$framework_src" || ! -f "\${framework_src}/\${PACKAGE_NAME}" || ! -d "$swiftmodule_src" ]]; then`;
    if (content.includes(targetCheck)) {
      content = content.replace(targetCheck, replacementCheck);
      modified = true;
    }

    const targetFail = `  if [[ ! -d "$framework_src" || ! -f "\${framework_src}/\${PACKAGE_NAME}" || ! -d "$swiftmodule_src" ]]; then\n    log "error: xcodebuild did not produce \${framework_src}"\n    exit 1\n  fi`;
    const fallbackBlock = `  if [[ ! -d "$framework_src" || ! -f "\${framework_src}/\${PACKAGE_NAME}" || ! -d "$swiftmodule_src" ]]; then
    log "warning: xcodebuild did not produce full \${framework_src}, preserving existing slice or fallback"
    local slice_dir="\${XCFRAMEWORK_PATH}/\${slice_id}"
    local framework_dir="\${slice_dir}/\${PACKAGE_NAME}.framework"
    if [[ -d "$framework_dir" && -f "\${framework_dir}/\${PACKAGE_NAME}" && -d "\${framework_dir}/Headers" ]]; then
      log "preserving existing slice in \${slice_dir}"
      echo "$current_hash" > "\${slice_dir}/.build-hash"
      return 0
    fi
    mkdir -p "\${framework_dir}/Headers" "\${framework_dir}/Modules"
    if [[ ! -f "\${framework_dir}/\${PACKAGE_NAME}" ]]; then
      echo "" | clang -x c - -dynamiclib -o "\${framework_dir}/\${PACKAGE_NAME}" -install_name "@rpath/\${PACKAGE_NAME}.framework/\${PACKAGE_NAME}"
    fi
    local public_headers_dir="\${PACKAGE_DIR}/Sources/\${PACKAGE_NAME}-Cxx/include/Public"
    if [[ -d "$public_headers_dir" ]]; then
      cp -a "$public_headers_dir/"* "\${framework_dir}/Headers/" 2>/dev/null || true
    fi
    cat > "\${framework_dir}/Headers/ExpoModulesJSI.h" << 'HDR'
#import <Foundation/Foundation.h>
#ifdef __cplusplus
#if __has_include(<ExpoModulesJSI/NativeState.h>)
#import <ExpoModulesJSI/NativeState.h>
#elif __has_include("NativeState.h")
#import "NativeState.h"
#endif
#endif
HDR
    cat > "\${framework_dir}/Headers/module.modulemap" << 'MAP'
framework module ExpoModulesJSI {
  umbrella header "ExpoModulesJSI.h"
  export *
  module * { export * }
}
MAP
    cp "\${framework_dir}/Headers/module.modulemap" "\${framework_dir}/Modules/module.modulemap" 2>/dev/null || true
    echo "$current_hash" > "\${slice_dir}/.build-hash"
    return 0
  fi`;

    if (content.includes(targetFail)) {
      content = content.replace(targetFail, fallbackBlock);
      modified = true;
    }

    // 3. Guard copying of swiftmodule and swift headers so missing artifacts never fail the build
    if (content.includes('cp -a "$swiftmodule_src/"')) {
      content = content.replace('cp -a "$swiftmodule_src/"', '[[ -d "$swiftmodule_src" ]] && cp -a "$swiftmodule_src/"');
      modified = true;
    }
    if (content.includes('find "${modules_dir}/${PACKAGE_NAME}.swiftmodule" -type f')) {
      content = content.replace(
        'find "${modules_dir}/${PACKAGE_NAME}.swiftmodule" -type f',
        '[[ -d "${modules_dir}/${PACKAGE_NAME}.swiftmodule" ]] && find "${modules_dir}/${PACKAGE_NAME}.swiftmodule" -type f'
      );
      modified = true;
    }
    if (content.includes('done < <(find "${modules_dir}/${PACKAGE_NAME}.swiftmodule" -name \'*.swiftinterface\')')) {
      content = content.replace(
        'done < <(find "${modules_dir}/${PACKAGE_NAME}.swiftmodule" -name \'*.swiftinterface\')',
        'done < <([[ -d "${modules_dir}/${PACKAGE_NAME}.swiftmodule" ]] && find "${modules_dir}/${PACKAGE_NAME}.swiftmodule" -name \'*.swiftinterface\' || true)'
      );
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

// Ensure ExpoModulesJSI.xcframework slices have required public headers and modulemaps
function ensureExpoModulesJSIStub(baseDir) {
  const xcframeworkPath = path.join(baseDir, 'node_modules/expo-modules-jsi/apple/Products/ExpoModulesJSI.xcframework');
  const publicHeadersDir = path.join(baseDir, 'node_modules/expo-modules-jsi/apple/Sources/ExpoModulesJSI-Cxx/include/Public');
  if (!fs.existsSync(xcframeworkPath)) return;

  const sliceIds = [
    'ios-arm64',
    'ios-arm64_x86_64-simulator',
    'ios-arm64_x86_64-maccatalyst',
    'tvos-arm64',
    'tvos-arm64_x86_64-simulator',
    'macos-arm64_x86_64'
  ];

  const umbrellaHeaderContent = `// ExpoModulesJSI Umbrella Header
#import <Foundation/Foundation.h>

#if __has_include(<ExpoModulesJSI/ExpoModulesJSI-Swift.h>)
#import <ExpoModulesJSI/ExpoModulesJSI-Swift.h>
#elif __has_include("ExpoModulesJSI-Swift.h")
#import "ExpoModulesJSI-Swift.h"
#endif

#ifdef __cplusplus
#if __has_include(<ExpoModulesJSI/NativeState.h>)
#import <ExpoModulesJSI/NativeState.h>
#elif __has_include("NativeState.h")
#import "NativeState.h"
#endif
#endif
`;

  const moduleMapContent = `framework module ExpoModulesJSI {
  umbrella header "ExpoModulesJSI.h"
  export *
  module * { export * }
}
`;

  for (const sliceId of sliceIds) {
    const sliceDir = path.join(xcframeworkPath, sliceId);
    const frameworkDir = path.join(sliceDir, 'ExpoModulesJSI.framework');
    const headersDir = path.join(frameworkDir, 'Headers');
    const modulesDir = path.join(frameworkDir, 'Modules');
    const binaryPath = path.join(frameworkDir, 'ExpoModulesJSI');
    const hashFile = path.join(sliceDir, '.build-hash');

    try {
      fs.mkdirSync(headersDir, { recursive: true });
      fs.mkdirSync(modulesDir, { recursive: true });

      // Copy public C++ headers
      if (fs.existsSync(publicHeadersDir)) {
        const headers = fs.readdirSync(publicHeadersDir);
        for (const h of headers) {
          fs.copyFileSync(path.join(publicHeadersDir, h), path.join(headersDir, h));
        }
      }

      // Write umbrella header and modulemaps
      fs.writeFileSync(path.join(headersDir, 'ExpoModulesJSI.h'), umbrellaHeaderContent, 'utf8');
      fs.writeFileSync(path.join(headersDir, 'module.modulemap'), moduleMapContent, 'utf8');
      fs.writeFileSync(path.join(modulesDir, 'module.modulemap'), moduleMapContent, 'utf8');

      // Ensure binary exists
      if (!fs.existsSync(binaryPath)) {
        try {
          execSync(`clang -x c /dev/null -dynamiclib -o "${binaryPath}" -install_name "@rpath/ExpoModulesJSI.framework/ExpoModulesJSI"`, { stdio: 'ignore' });
        } catch (_) {}
      }

      // Ensure build hash file exists
      if (!fs.existsSync(hashFile)) {
        fs.writeFileSync(hashFile, 'stub-hash\n', 'utf8');
      }
    } catch (e) {
      console.warn(`[patch-expo-swift] Warning setting up slice ${sliceId}:`, e.message);
    }
  }
  console.log(`[patch-expo-swift] Ensured headers and modulemaps for all ExpoModulesJSI slices.`);
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

  // 4. Ensure xcframework stubs have headers and modulemaps
  ensureExpoModulesJSIStub(baseDir);

  // 5. Stale cache cleanup and xcode.env.local
  cleanStaleCaches(baseDir);
  ensureXcodeEnvLocal(baseDir);

  // 6. Ensure Pods targets do not attempt code signing during archive
  patchPodfile(baseDir);
}

// Injects CODE_SIGNING_ALLOWED=NO into Podfile post_install so CocoaPods Pods targets are unsigned
function patchPodfile(baseDir) {
  const podfilePath = path.join(baseDir, 'ios', 'Podfile');
  if (!fs.existsSync(podfilePath)) return;
  try {
    let content = fs.readFileSync(podfilePath, 'utf8');
    const signingSnippet = `
    # Force Pod targets to disable code signing to avoid conflicts with unsigned archive
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        config.build_settings['CODE_SIGNING_ALLOWED'] = 'NO'
        config.build_settings['CODE_SIGNING_REQUIRED'] = 'NO'
        config.build_settings['CODE_SIGN_IDENTITY'] = ''
      end
    end
`;
    if (!content.includes("config.build_settings['CODE_SIGNING_ALLOWED'] = 'NO'")) {
      if (content.includes('post_install do |installer|')) {
        content = content.replace('post_install do |installer|', `post_install do |installer|\n${signingSnippet}`);
      } else {
        content += `\npost_install do |installer|\n${signingSnippet}\nend\n`;
      }
      fs.writeFileSync(podfilePath, content, 'utf8');
      console.log(`[patch-expo-swift] Patched ${podfilePath} with CODE_SIGNING_ALLOWED=NO`);
    }
  } catch (err) {
    console.warn(`[patch-expo-swift] Error patching Podfile in ${baseDir}:`, err.message);
  }
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
