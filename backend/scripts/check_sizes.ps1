Add-Type -AssemblyName System.Drawing
$files = @("ac_services_banner.png", "refer_earn_banner.png", "amc_services_banner.png")
foreach ($f in $files) {
    $path = "assets\banners\$f"
    $bmp = [System.Drawing.Bitmap]::FromFile($path)
    $w = $bmp.Width
    $h = $bmp.Height
    $bmp.Dispose()
    Write-Host "$f : $w x $h px"
}
