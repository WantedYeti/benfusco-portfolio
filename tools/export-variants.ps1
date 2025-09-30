param(
  [Parameter(Mandatory = $true)] [string]$SourceDir,
  [string]$OutDir = $null,
  [string[]]$Formats = @("webp"),
  [int[]]$Sizes = @(60,640,1024,1600,2048),
  [int]$Quality = 80,
  [switch]$Recurse
)

# Check prerequisites
$magick = Get-Command magick -ErrorAction SilentlyContinue
if (-not $magick) {
  Write-Error "ImageMagick ('magick') is not installed or not in PATH. Install from https://imagemagick.org/script/download.php#windows and retry."
  exit 1
}

# Normalize paths
$SourceDir = (Resolve-Path $SourceDir).Path
if (-not $OutDir) { $OutDir = Join-Path $SourceDir "web" }
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

# Collect input files
$patterns = @("*.jpg","*.jpeg","*.png")
$optRecurse = @{}
if ($Recurse) { $optRecurse["Recurse"] = $true }
$files = Get-ChildItem -Path $SourceDir @optRecurse -File -Include $patterns
if (-not $files -or $files.Count -eq 0) {
  Write-Error "No input images found in $SourceDir (supported: JPG, JPEG, PNG)."
  exit 1
}

# Process
foreach ($size in $Sizes) {
  $sizeDir = Join-Path $OutDir $size
  New-Item -ItemType Directory -Force -Path $sizeDir | Out-Null

  foreach ($file in $files) {
    $base = [System.IO.Path]::GetFileNameWithoutExtension($file.Name)

    foreach ($fmt in $Formats) {
      $ext = if ($fmt -ieq 'jpg' -or $fmt -ieq 'jpeg') { '.jpg' } else { '.' + ($fmt.ToLower()) }
      $q = if ($size -le 100) { 50 } else { $Quality }
      $outPath = Join-Path $sizeDir ($base + $ext)

      # Skip if newer output exists
      if (Test-Path $outPath) {
        $outInfo = Get-Item $outPath
        if ($outInfo.LastWriteTimeUtc -ge $file.LastWriteTimeUtc) { continue }
      }

      $args = @(
        $file.FullName,
        '-colorspace','sRGB',
        '-auto-orient',
        '-resize',"${size}x${size}",
        '-strip',
        '-quality',"$q"
      )

      if ($fmt -ieq 'jpg' -or $fmt -ieq 'jpeg') {
        $args += @('-sampling-factor','4:2:0')
      }

      $args += @($outPath)

      Write-Host ("[" + (Get-Date -Format HH:mm:ss) + "] " + "magick " + ($args -join ' '))
      & magick @args
      if ($LASTEXITCODE -ne 0) {
        Write-Warning "Conversion failed for $($file.Name) at size $size as $fmt"
      }
    }
  }
}

Write-Host "\nDone. Outputs are under: $OutDir\<size>\<filename>.<ext>"