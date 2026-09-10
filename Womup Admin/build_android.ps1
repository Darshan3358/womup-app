# Build Android APK and Bundle locally
$ErrorActionPreference = "Stop"

$javaHome = "C:\Program Files\Eclipse Adoptium\jdk-17.0.20.101-hotspot"
$androidHome = "$env:LOCALAPPDATA\Android\Sdk"

$env:JAVA_HOME = $javaHome
$env:ANDROID_HOME = $androidHome
$env:PATH = "$javaHome\bin;$androidHome\platform-tools;$androidHome\build-tools\35.0.0;$env:PATH"

Write-Host "Java version:" -ForegroundColor Cyan
& "$javaHome\bin\java.exe" -version

Write-Host "`nProject root: $PSScriptRoot" -ForegroundColor Cyan
Set-Location "$PSScriptRoot\android"

Write-Host "`n==============================================" -ForegroundColor Green
Write-Host "Building Release APK (assembleRelease)..." -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green

& ".\gradlew.bat" assembleRelease --no-daemon

Write-Host "`n==============================================" -ForegroundColor Green
Write-Host "Building Release Bundle (bundleRelease)..." -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green

& ".\gradlew.bat" bundleRelease --no-daemon

Write-Host "`n==============================================" -ForegroundColor Cyan
Write-Host "Build finished! Checking generated artifacts:" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan

$apkPath = "$PSScriptRoot\android\app\build\outputs\apk\release\app-release.apk"
$aabPath = "$PSScriptRoot\android\app\build\outputs\bundle\release\app-release.aab"
$outputDir = "$PSScriptRoot\build_output"

if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
}

if (Test-Path $apkPath) {
    $apkItem = Get-Item $apkPath
    Write-Host "APK File : $($apkItem.FullName)" -ForegroundColor Green
    Write-Host "APK Size : $([math]::Round($apkItem.Length / 1MB, 2)) MB" -ForegroundColor Green
    Copy-Item $apkPath "$outputDir\WomupAdmin-release.apk" -Force
    Write-Host "Copied to: $outputDir\WomupAdmin-release.apk" -ForegroundColor Green
} else {
    Write-Host "APK not found at $apkPath" -ForegroundColor Red
}

if (Test-Path $aabPath) {
    $aabItem = Get-Item $aabPath
    Write-Host "AAB File : $($aabItem.FullName)" -ForegroundColor Green
    Write-Host "AAB Size : $([math]::Round($aabItem.Length / 1MB, 2)) MB" -ForegroundColor Green
    Copy-Item $aabPath "$outputDir\WomupAdmin-release.aab" -Force
    Write-Host "Copied to: $outputDir\WomupAdmin-release.aab" -ForegroundColor Green
} else {
    Write-Host "AAB not found at $aabPath" -ForegroundColor Yellow
}

