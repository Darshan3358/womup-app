# =============================================
# Womup Admin - Android SDK Setup Script
# Run this AFTER Java JDK 17 is installed
# =============================================

Write-Host "=== Womup Admin Android SDK Setup ===" -ForegroundColor Cyan

# --- Step 1: Find & Setup JAVA_HOME ---
Write-Host "`n[1/5] Setting JAVA_HOME..." -ForegroundColor Yellow
$jdkPaths = @(
    "C:\Program Files\Eclipse Adoptium\jdk-17*",
    "C:\Program Files\Microsoft\jdk-17*",
    "C:\Program Files\Java\jdk-17*"
)
$javaHome = $null
foreach ($pattern in $jdkPaths) {
    $found = Get-Item $pattern -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($found) { $javaHome = $found.FullName; break }
}
if (-not $javaHome) {
    $cmd = Get-Command java -ErrorAction SilentlyContinue
    if ($cmd) {
        $javaHome = $cmd.Source | Split-Path | Split-Path
    }
}
if ($javaHome) {
    [System.Environment]::SetEnvironmentVariable("JAVA_HOME", $javaHome, "User")
    $env:JAVA_HOME = $javaHome
    $env:PATH = "$javaHome\bin;$env:PATH"
    Write-Host "JAVA_HOME set to: $javaHome" -ForegroundColor Green
} else {
    Write-Host "WARNING: Could not auto-detect JAVA_HOME. Set it manually." -ForegroundColor Yellow
}

# --- Step 2: Verify Java ---
Write-Host "`n[2/5] Checking Java JDK..." -ForegroundColor Yellow
try {
    $javaVersion = & java -version 2>&1
    Write-Host "Java found: $javaVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Java not found! Install JDK 17 first." -ForegroundColor Red
    exit 1
}

# --- Step 3: Setup Android SDK Directory ---
Write-Host "`n[3/5] Setting up Android SDK directory..." -ForegroundColor Yellow
$sdkRoot = "$env:LOCALAPPDATA\Android\Sdk"
if (-not (Test-Path $sdkRoot)) {
    New-Item -ItemType Directory -Path $sdkRoot -Force | Out-Null
    Write-Host "Created SDK directory: $sdkRoot" -ForegroundColor Green
} else {
    Write-Host "SDK directory exists: $sdkRoot" -ForegroundColor Green
}

# Set ANDROID_HOME
[System.Environment]::SetEnvironmentVariable("ANDROID_HOME", $sdkRoot, "User")
[System.Environment]::SetEnvironmentVariable("ANDROID_SDK_ROOT", $sdkRoot, "User")
$env:ANDROID_HOME = $sdkRoot
$env:ANDROID_SDK_ROOT = $sdkRoot
Write-Host "ANDROID_HOME set to: $sdkRoot" -ForegroundColor Green

# --- Step 4: Download & Install Android SDK Components ---
Write-Host "`n[4/5] Installing Android SDK Build Tools and Platform..." -ForegroundColor Yellow


# Use the Android CLI tool installed via winget
$androidCmd = Get-Command android -ErrorAction SilentlyContinue
$androidCli = if ($androidCmd) { $androidCmd.Source } else { $null }

# Download cmdline-tools manually if CLI not found in PATH
$cmdToolsUrl = "https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip"
$cmdToolsZip = "$env:TEMP\cmdline-tools.zip"
$cmdToolsDir = "$sdkRoot\cmdline-tools\latest"

if (-not (Test-Path "$cmdToolsDir\bin\sdkmanager.bat")) {
    Write-Host "Downloading Android Command Line Tools (~135MB)..." -ForegroundColor Cyan
    curl.exe -L -o $cmdToolsZip $cmdToolsUrl
    
    Write-Host "Extracting..." -ForegroundColor Cyan
    $extractDir = "$env:TEMP\cmdtools-extract"
    Expand-Archive -Path $cmdToolsZip -DestinationPath $extractDir -Force
    
    # Move to correct location
    New-Item -ItemType Directory -Path $cmdToolsDir -Force | Out-Null
    Get-ChildItem "$extractDir\cmdline-tools" | Move-Item -Destination $cmdToolsDir -Force
    Remove-Item $extractDir -Recurse -Force
    Remove-Item $cmdToolsZip -Force
    Write-Host "Command Line Tools installed." -ForegroundColor Green
} else {
    Write-Host "Command Line Tools already installed." -ForegroundColor Green
}

# Add sdkmanager to PATH for this session
$sdkManagerPath = "$cmdToolsDir\bin"
$env:PATH = "$sdkManagerPath;$env:PATH"

# Install required SDK packages
Write-Host "`nInstalling Android SDK packages (this may take a few minutes)..." -ForegroundColor Cyan
$sdkManager = "$cmdToolsDir\bin\sdkmanager.bat"

# Accept licenses first
echo "y" | & $sdkManager --licenses 2>&1 | Out-Null

# Install platform-tools, build-tools, and platform
& $sdkManager "platform-tools" "build-tools;35.0.0" "platforms;android-35" --sdk_root="$sdkRoot" 2>&1 | ForEach-Object { Write-Host $_ }

# --- Step 5: Update System PATH ---
Write-Host "`n[5/5] Updating system PATH..." -ForegroundColor Yellow
$userPath = [System.Environment]::GetEnvironmentVariable("PATH", "User")
$additions = @(
    "$sdkRoot\platform-tools",
    "$sdkRoot\build-tools\35.0.0",
    "$cmdToolsDir\bin"
)
foreach ($addition in $additions) {
    if ($userPath -notlike "*$addition*") {
        $userPath = "$addition;$userPath"
    }
}
[System.Environment]::SetEnvironmentVariable("PATH", $userPath, "User")
Write-Host "PATH updated." -ForegroundColor Green

# --- Summary ---
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host " ✅ Android SDK Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "JAVA_HOME   = $env:JAVA_HOME"
Write-Host "ANDROID_HOME= $env:ANDROID_HOME"
Write-Host ""
Write-Host "Next step: Close this PowerShell window and open a NEW one, then run:" -ForegroundColor Yellow
Write-Host ""
Write-Host '  cd "c:\Users\PCS\Desktop\Womup Admin\android"' -ForegroundColor White
Write-Host "  .\gradlew.bat assembleRelease" -ForegroundColor White
Write-Host ""
Write-Host "APK will be at:" -ForegroundColor Yellow
Write-Host "  android\app\build\outputs\apk\release\app-release.apk" -ForegroundColor White
