Add-Type -AssemblyName System.Drawing

$imgDir = "C:\Users\HCnets\Desktop\苏区镇建模\server\public\images\archives"
$backupDir = Join-Path $imgDir "backup_originals"
if (-not (Test-Path $backupDir)) { mkdir $backupDir -Force | Out-Null }

$files = Get-ChildItem $imgDir -File | Where-Object { $_.Extension -match '\.(png|jpg|jpeg)$' -and $_.Length -gt 100KB }

$totalBefore = 0; $totalAfter = 0

foreach ($f in $files) {
    $sizeKB = [math]::Round($f.Length / 1KB)
    $totalBefore += $f.Length
    
    try {
        # Load image
        $img = [System.Drawing.Image]::FromFile($f.FullName)
        
        # Resize if larger than 1920
        $w = $img.Width; $h = $img.Height
        if ($w -gt 1920) { $h = [math]::Round($h * 1920 / $w); $w = 1920 }
        if ($h -gt 1080) { $w = [math]::Round($w * 1080 / $h); $h = 1080 }
        
        $bmp = New-Object System.Drawing.Bitmap($w, $h)
        $g = [System.Drawing.Graphics]::FromImage($bmp)
        $g.InterpolationMode = 'HighQualityBicubic'
        $g.DrawImage($img, 0, 0, $w, $h)
        $g.Dispose(); $img.Dispose()
        
        # If PNG → convert to JPEG
        $isPng = $f.Extension -eq '.png'
        $outFile = if ($isPng) {
            Join-Path $imgDir ($f.BaseName + '.jpg')
        } else {
            $f.FullName
        }
        
        # Backup original
        Copy-Item $f.FullName $backupDir -Force
        
        # Save as JPEG quality 80
        $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
        $params = New-Object System.Drawing.Imaging.EncoderParameters(1)
        $params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, 80)
        $bmp.Save($outFile, $codec, $params)
        $bmp.Dispose()
        
        # Remove original PNG
        if ($isPng) { Remove-Item $f.FullName -Force }
        
        $newSize = [math]::Round((Get-Item $outFile).Length / 1KB)
        $totalAfter += (Get-Item $outFile).Length
        $pct = [math]::Round((1 - $newSize / $sizeKB) * 100)
        Write-Host "OK  $($f.Name) → $([System.IO.Path]::GetFileName($outFile))  ${sizeKB}KB → ${newSize}KB (-${pct}%)"
    } catch {
        Write-Host "ERR $($f.Name): $_" -ForegroundColor Red
    }
}

$mbBefore = [math]::Round($totalBefore/1MB, 1)
$mbAfter = [math]::Round($totalAfter/1MB, 1)
Write-Host "`n=== 完成 ===  $mbBefore MB → $mbAfter MB" -ForegroundColor Green
