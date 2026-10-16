param([string]$Prefix, [string]$Out, [int]$Cols = 8)
Add-Type -AssemblyName System.Drawing
$files = Get-ChildItem "$Prefix*.png" | Sort-Object Name
if (-not $files) { throw "no frames for $Prefix" }
$first = [System.Drawing.Image]::FromFile($files[0].FullName)
$w = $first.Width; $h = $first.Height; $first.Dispose()
$rows = [math]::Ceiling($files.Count / $Cols)
$sheet = New-Object System.Drawing.Bitmap ($w * [math]::Min($Cols, $files.Count)), ($h * $rows)
$g = [System.Drawing.Graphics]::FromImage($sheet)
$i = 0
foreach ($f in $files) {
  $img = [System.Drawing.Image]::FromFile($f.FullName)
  $g.DrawImage($img, ($i % $Cols) * $w, [math]::Floor($i / $Cols) * $h, $w, $h)
  $img.Dispose(); $i++
}
$sheet.Save($Out, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $sheet.Dispose()
"strip $Out : $($files.Count) frames of ${w}x${h}"
