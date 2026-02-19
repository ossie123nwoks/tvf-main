# PowerShell script to extract SHA-1 fingerprint from debug keystore

Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "Getting SHA-1 Fingerprint for Google Auth" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

# Try to find Java
$javaPaths = @(
    "$env:JAVA_HOME\bin\keytool.exe",
    "C:\Program Files\Java\*\bin\keytool.exe",
    "C:\Program Files\Eclipse Adoptium\*\bin\keytool.exe",
    "C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe",
    "C:\Program Files (x86)\Java\*\bin\keytool.exe",
    "C:\Android\Sdk\java\*\bin\keytool.exe"
)

$keytoolPath = $null
foreach ($path in $javaPaths) {
    $found = Get-ChildItem -Path $path -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty FullName
    if ($found) {
        $keytoolPath = $found
        Write-Host "Found keytool at: $keytoolPath" -ForegroundColor Green
        break
    }
}

if (-not $keytoolPath) {
    Write-Host "===========================================" -ForegroundColor Red
    Write-Host "ERROR: Java/keytool not found!" -ForegroundColor Red
    Write-Host "===========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please choose one of these options:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Option 1: Use EAS Build (Recommended)" -ForegroundColor Cyan
    Write-Host "  Run: npx eas build --platform android --profile development" -ForegroundColor White
    Write-Host "  The build output will show your SHA-1 fingerprint" -ForegroundColor White
    Write-Host ""
    Write-Host "Option 2: Install Java" -ForegroundColor Cyan
    Write-Host "  Download from: https://adoptium.net/" -ForegroundColor White
    Write-Host "  Install OpenJDK 17 or later" -ForegroundColor White
    Write-Host "  Then run this script again" -ForegroundColor White
    Write-Host ""
    Write-Host "Option 3: Use Android Studio" -ForegroundColor Cyan
    Write-Host "  Install Android Studio" -ForegroundColor White
    Write-Host "  Build your app once, then keytool will be available" -ForegroundColor White
    Write-Host ""
    exit 1
}

# Get SHA-1 from debug keystore
$keystorePath = Join-Path $PSScriptRoot "..\android\app\debug.keystore"
if (-not (Test-Path $keystorePath)) {
    Write-Host "ERROR: debug.keystore not found at: $keystorePath" -ForegroundColor Red
    exit 1
}

Write-Host "Extracting SHA-1 from debug keystore..." -ForegroundColor Yellow
Write-Host ""

try {
    $output = & $keytoolPath -list -v -keystore $keystorePath -alias androiddebugkey -storepass android -keypass android 2>&1
    
    # Find SHA-1 line
    $sha1Line = $output | Select-String -Pattern "SHA1:"
    
    if ($sha1Line) {
        Write-Host "===========================================" -ForegroundColor Green
        Write-Host "SUCCESS! Your SHA-1 Fingerprint:" -ForegroundColor Green
        Write-Host "===========================================" -ForegroundColor Green
        Write-Host ""
        
        # Extract just the SHA-1 value
        $sha1 = ($sha1Line.ToString() -split "SHA1:")[1].Trim()
        Write-Host $sha1 -ForegroundColor White -BackgroundColor DarkGreen
        Write-Host ""
        
        # Copy to clipboard if available
        try {
            Set-Clipboard -Value $sha1
            Write-Host "SHA-1 has been copied to your clipboard!" -ForegroundColor Green
        } catch {
            Write-Host "Could not copy to clipboard automatically" -ForegroundColor Yellow
        }
        
        Write-Host ""
        Write-Host "===========================================" -ForegroundColor Cyan
        Write-Host "Next Steps:" -ForegroundColor Cyan
        Write-Host "===========================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "1. Go to: https://console.cloud.google.com/apis/credentials" -ForegroundColor White
        Write-Host "2. Create or edit Android OAuth Client" -ForegroundColor White
        Write-Host "3. Package name: com.tvffellowship.app" -ForegroundColor White
        Write-Host "4. Paste SHA-1 fingerprint above" -ForegroundColor White
        Write-Host ""
        Write-Host "Your SHA-1 Fingerprint (with colons):" -ForegroundColor Yellow
        Write-Host $sha1 -ForegroundColor White
        
        Write-Host ""
        Write-Host "Your SHA-1 Fingerprint (without colons):" -ForegroundColor Yellow
        $sha1NoColons = $sha1 -replace ':', ''
        Write-Host $sha1NoColons -ForegroundColor White
        Write-Host ""
        
    } else {
        Write-Host "ERROR: Could not find SHA-1 in keytool output" -ForegroundColor Red
        Write-Host ""
        Write-Host "Full output:" -ForegroundColor Yellow
        $output | ForEach-Object { Write-Host $_ }
        exit 1
    }
} catch {
    Write-Host "ERROR: Failed to extract SHA-1" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

Write-Host "===========================================" -ForegroundColor Green
Write-Host "Done!" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Green

