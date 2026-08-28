# Compress large images using .NET
Add-Type -AssemblyName System.Drawing

$imagesDir = "server/public/images/archives"
$largeFiles = @(
    @{Name="zhangziyu-martyr-monument_2.jpeg"; MaxSize=1200},
    @{Name="zijin-old-suqu-martyrs-memorial_1.jpeg"; MaxSize=1200},
    @{Name="red-2nd-4th-division-trial.png"; MaxSize=1600}
)

foreach ($img in $largeFiles) {
    $path = Join-Path $imagesDir $img.Name
    if (-not (Test-Path $path)) {
        Write-Host "⚠ 文件不存在: $($img.Name)" -ForegroundColor Yellow
        continue
    }
    
    $origSize = (Get-Item $path).Length
    Write-Host "压缩: $($img.Name) ($([math]::Round($origSize/1MB,1)) MB)" -ForegroundColor Cyan
    
    try {
        $bmp = [System.Drawing.Image]::FromFile($path)
        $w = $bmp.Width
        $h = $bmp.Height
        
        # Calculate new size - Math.Min only takes 2 args
        $ratioW = $img.MaxSize / $w
        $ratioH = $img.MaxSize / $h
        $ratio = [Math]::Min($ratioW, $ratioH)
        if ($ratio -gt 1.0) { $ratio = 1.0 }
        $newW = [int]($w * $ratio)
        $newH = [int]($h * $ratio)
        
        Write-Host "  原始: ${w}x${h} -> 目标: ${newW}x${newH} (比例 $([math]::Round($ratio,3)))"
        
        $resized = New-Object System.Drawing.Bitmap($newW, $newH)
        $graphics = [System.Drawing.Graphics]::FromImage($resized)
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.DrawImage($bmp, 0, 0, $newW, $newH)
        $graphics.Dispose()
        
        # Save as JPEG quality 85
        $encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
        $encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]85)
        $jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.FormatDescription -eq "JPEG" }
        
        $tempPath = $path + ".temp"
        $resized.Save($tempPath, $jpegCodec, $encoderParams)
        $resized.Dispose()
        $bmp.Dispose()
        
        # Replace original
        Move-Item $tempPath $path -Force
        
        $newSize = (Get-Item $path).Length
        $saved = [math]::Round(($origSize - $newSize) / 1MB, 1)
        Write-Host "  ✅ 完成: $([math]::Round($origSize/1MB,1))MB -> $([math]::Round($newSize/1MB,1))MB (节省 ${saved}MB)" -ForegroundColor Green
    }
    catch {
        Write-Host "  ❌ 失败: $_" -ForegroundColor Red
    }
}

Write-Host "`n压缩完成!" -ForegroundColor Green
