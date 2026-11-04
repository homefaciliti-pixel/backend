Add-Type -AssemblyName System.Drawing

$W = 1080
$H = 540
$outDir = Join-Path $PSScriptRoot "..\assets\banners"

function New-Bitmap($w, $h) {
    return New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
}

function Get-Graphics($bmp) {
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
    return $g
}

function Draw-RoundedRect($g, $brush, $x, $y, $w, $h, $r) {
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $path.AddArc($x, $y, $r*2, $r*2, 180, 90)
    $path.AddArc($x+$w-$r*2, $y, $r*2, $r*2, 270, 90)
    $path.AddArc($x+$w-$r*2, $y+$h-$r*2, $r*2, $r*2, 0, 90)
    $path.AddArc($x, $y+$h-$r*2, $r*2, $r*2, 90, 90)
    $path.CloseFigure()
    $g.FillPath($brush, $path)
    $path.Dispose()
}

function Draw-RoundedRectPen($g, $pen, $x, $y, $w, $h, $r) {
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $path.AddArc($x, $y, $r*2, $r*2, 180, 90)
    $path.AddArc($x+$w-$r*2, $y, $r*2, $r*2, 270, 90)
    $path.AddArc($x+$w-$r*2, $y+$h-$r*2, $r*2, $r*2, 0, 90)
    $path.AddArc($x, $y+$h-$r*2, $r*2, $r*2, 90, 90)
    $path.CloseFigure()
    $g.DrawPath($pen, $path)
    $path.Dispose()
}

function Draw-Circle($g, $brush, $cx, $cy, $r) {
    $g.FillEllipse($brush, $cx-$r, $cy-$r, $r*2, $r*2)
}

$sfC = New-Object System.Drawing.StringFormat
$sfC.Alignment = [System.Drawing.StringAlignment]::Center
$sfC.LineAlignment = [System.Drawing.StringAlignment]::Center
$sfL = New-Object System.Drawing.StringFormat
$sfL.Alignment = [System.Drawing.StringAlignment]::Near
$sfL.LineAlignment = [System.Drawing.StringAlignment]::Near

# ============================================================
# BANNER 1: AC Services   Blue theme
# ============================================================
$bmp = New-Bitmap $W $H
$g = Get-Graphics $bmp

# Background
$bg = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.Point(0,0)),
    (New-Object System.Drawing.Point($W,$H)),
    [System.Drawing.Color]::FromArgb(255,4,12,48),
    [System.Drawing.Color]::FromArgb(255,0,72,188))
$g.FillRectangle($bg, 0, 0, $W, $H)
$bg.Dispose()

# Subtle diagonal stripe overlay
$stripe = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.Point(500,0)),
    (New-Object System.Drawing.Point($W,$H)),
    [System.Drawing.Color]::FromArgb(25,0,140,255),
    [System.Drawing.Color]::FromArgb(70,0,200,255))
$g.FillRectangle($stripe, 500, 0, 580, $H)
$stripe.Dispose()

# Glow circles
$gc = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(25,0,180,255))
Draw-Circle $g $gc 930 80 200
Draw-Circle $g $gc 740 490 140
Draw-Circle $g $gc 180 420 90
$gc.Dispose()
$gc2 = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(35,0,220,255))
Draw-Circle $g $gc2 830 300 110
$gc2.Dispose()

# Left divider line
$divPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(60,0,180,255), 2)
$g.DrawLine($divPen, 500, 40, 500, 500)
$divPen.Dispose()

# === BADGE ===
$bb = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.Point(40,40)),
    (New-Object System.Drawing.Point(250,76)),
    [System.Drawing.Color]::FromArgb(255,0,190,255),
    [System.Drawing.Color]::FromArgb(255,0,80,210))
Draw-RoundedRect $g $bb 40 40 195 36 18
$bb.Dispose()
$bf = New-Object System.Drawing.Font("Arial", 13, [System.Drawing.FontStyle]::Bold)
$wb = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
$g.DrawString("SPECIAL OFFER", $bf, $wb, (New-Object System.Drawing.RectangleF(40,40,195,36)), $sfC)
$bf.Dispose()

# === TITLE ===
$tf = New-Object System.Drawing.Font("Arial", 78, [System.Drawing.FontStyle]::Bold)
$tg = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.Point(40,100)),
    (New-Object System.Drawing.Point(480,195)),
    [System.Drawing.Color]::FromArgb(255,0,230,255),
    [System.Drawing.Color]::White)
$g.DrawString("50% OFF", $tf, $tg, 40, 100)
$tf.Dispose()
$tg.Dispose()

$sf2 = New-Object System.Drawing.Font("Arial", 38, [System.Drawing.FontStyle]::Bold)
$g.DrawString("AC Services", $sf2, $wb, 40, 205)
$sf2.Dispose()

$df = New-Object System.Drawing.Font("Arial", 16, [System.Drawing.FontStyle]::Regular)
$gb = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(200,190,215,255))
$dr = New-Object System.Drawing.RectangleF(40, 262, 440, 80)
$g.DrawString("Filter cleaning, gas top-up and full diagnostic by certified technicians. Book today!", $df, $gb, $dr)
$df.Dispose()
$gb.Dispose()

# === CTA BUTTON ===
$cbr = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
Draw-RoundedRect $g $cbr 40 368 185 50 25
$cbr.Dispose()
$cbt = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255,0,72,188))
$cbf = New-Object System.Drawing.Font("Arial", 17, [System.Drawing.FontStyle]::Bold)
$g.DrawString("Book Now  ->", $cbf, $cbt, (New-Object System.Drawing.RectangleF(40,368,185,50)), $sfC)
$cbf.Dispose()
$cbt.Dispose()

# === RIGHT: AC UNIT ILLUSTRATION ===
# Unit body
$ub = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(230,238,248,255))
$g.FillRectangle($ub, 560, 120, 400, 210)
$ub.Dispose()

# Unit face panel
$uf = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(210,220,240,255))
$g.FillRectangle($uf, 575, 130, 370, 175)
$uf.Dispose()

# Grille horizontal lines
$gp = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(130,80,140,220), 2.5)
for ($i = 0; $i -lt 7; $i++) {
    $gy = 155 + $i * 18
    $g.DrawLine($gp, 580, $gy, 935, $gy)
}
$gp.Dispose()

# LED indicator
$ledb = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255,0,255,100))
Draw-Circle $g $ledb 905 148 10
$ledb.Dispose()

# Power button ring
$prp = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255,0,200,255), 3)
$g.DrawEllipse($prp, 860, 136, 24, 24)
$g.DrawLine($prp, 872, 129, 872, 148)
$prp.Dispose()

# Air vents at bottom of unit
$vb = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(160,80,120,220))
for ($i = 0; $i -lt 5; $i++) {
    $vx = 620 + $i * 60
    $g.FillRectangle($vb, $vx, 300, 40, 15)
}
$vb.Dispose()

# Cold air wave arcs below unit
$wp = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(180,0,200,255), 2)
for ($row = 0; $row -lt 3; $row++) {
    for ($col = 0; $col -lt 4; $col++) {
        $ax = 590 + $col * 90
        $ay = 350 + $row * 45
        $g.DrawArc($wp, $ax, $ay, 60, 30, 0, 180)
    }
}
$wp.Dispose()

# Snowflake cross shapes
$sp = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(160,0,200,255), 3)
$snowCenters = @( @(630,450), @(760,470), @(900,445), @(1010,460) )
foreach ($sc in $snowCenters) {
    $sx = $sc[0]; $sy = $sc[1]
    $g.DrawLine($sp, $sx-14, $sy, $sx+14, $sy)
    $g.DrawLine($sp, $sx, $sy-14, $sx, $sy+14)
    $g.DrawLine($sp, $sx-10, $sy-10, $sx+10, $sy+10)
    $g.DrawLine($sp, $sx+10, $sy-10, $sx-10, $sy+10)
}
$sp.Dispose()

$wb.Dispose()
$bmp.Save("$outDir\ac_services_banner.png", [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose()
Write-Host "ac_services_banner.png DONE"


# ============================================================
# BANNER 2: Refer & Earn   Purple/Gold theme
# ============================================================
$bmp = New-Bitmap $W $H
$g = Get-Graphics $bmp

$bg2 = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.Point(0,0)),
    (New-Object System.Drawing.Point($W,$H)),
    [System.Drawing.Color]::FromArgb(255,18,5,55),
    [System.Drawing.Color]::FromArgb(255,90,15,170))
$g.FillRectangle($bg2, 0, 0, $W, $H)
$bg2.Dispose()

$goldPanel = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.Point(520,0)),
    (New-Object System.Drawing.Point($W,0)),
    [System.Drawing.Color]::FromArgb(0,220,170,0),
    [System.Drawing.Color]::FromArgb(55,255,200,0))
$g.FillRectangle($goldPanel, 520, 0, 560, $H)
$goldPanel.Dispose()

$gc3 = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(28,255,195,0))
Draw-Circle $g $gc3 960 90 200
Draw-Circle $g $gc3 700 500 120
$gc3.Dispose()
$gc4 = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(38,180,70,255))
Draw-Circle $g $gc4 850 360 130
$gc4.Dispose()

# BADGE
$bb2 = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.Point(40,40)),
    (New-Object System.Drawing.Point(240,76)),
    [System.Drawing.Color]::FromArgb(255,255,185,0),
    [System.Drawing.Color]::FromArgb(255,255,95,0))
Draw-RoundedRect $g $bb2 40 40 200 36 18
$bb2.Dispose()
$bf2 = New-Object System.Drawing.Font("Arial", 13, [System.Drawing.FontStyle]::Bold)
$db = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255,50,20,0))
$g.DrawString("EARN REWARDS", $bf2, $db, (New-Object System.Drawing.RectangleF(40,40,200,36)), $sfC)
$bf2.Dispose()
$db.Dispose()

# TITLE
$wb2 = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
$tf2 = New-Object System.Drawing.Font("Arial", 68, [System.Drawing.FontStyle]::Bold)
$ga2 = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.Point(40,105)),
    (New-Object System.Drawing.Point(480,185)),
    [System.Drawing.Color]::FromArgb(255,255,215,0),
    [System.Drawing.Color]::FromArgb(255,255,110,0))
$g.DrawString("Refer ", $tf2, $ga2, 40, 105)
$tf2.Dispose()
$ga2.Dispose()
# Inline "&" in white then "Earn" in gold
$tf2b = New-Object System.Drawing.Font("Arial", 68, [System.Drawing.FontStyle]::Bold)
$g.DrawString("and Earn", $tf2b, $wb2, 40, 105)
$tf2b.Dispose()

# Use simpler approach - just one string
$tfBig = New-Object System.Drawing.Font("Arial", 68, [System.Drawing.FontStyle]::Bold)
$gaFull = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.Point(40,105)),
    (New-Object System.Drawing.Point(500,185)),
    [System.Drawing.Color]::FromArgb(255,255,225,0),
    [System.Drawing.Color]::White)
$g.DrawString("Refer and Earn", $tfBig, $gaFull, 40, 105)
$tfBig.Dispose()
$gaFull.Dispose()

$sf3 = New-Object System.Drawing.Font("Arial", 28, [System.Drawing.FontStyle]::Bold)
$g.DrawString("Invite Friends. Get Rewarded.", $sf3, $wb2, 40, 200)
$sf3.Dispose()

$df2 = New-Object System.Drawing.Font("Arial", 16)
$gb2 = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(200,220,200,255))
$g.DrawString("Share your referral code with friends and earn cashback on every booking!", $df2, $gb2, (New-Object System.Drawing.RectangleF(40,250,440,70)))
$df2.Dispose()
$gb2.Dispose()

# CTA
$cbr2 = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.Point(40,338)),
    (New-Object System.Drawing.Point(250,390)),
    [System.Drawing.Color]::FromArgb(255,255,200,0),
    [System.Drawing.Color]::FromArgb(255,255,95,0))
Draw-RoundedRect $g $cbr2 40 338 195 50 25
$cbr2.Dispose()
$cbt2 = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255,60,20,0))
$cbf2 = New-Object System.Drawing.Font("Arial", 17, [System.Drawing.FontStyle]::Bold)
$g.DrawString("Refer Now  ->", $cbf2, $cbt2, (New-Object System.Drawing.RectangleF(40,338,195,50)), $sfC)
$cbf2.Dispose()
$cbt2.Dispose()

# === RIGHT: COIN ILLUSTRATION ===
# Big coin
$coin1b = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255,255,195,0))
Draw-Circle $g $coin1b 850 220 135
$coin1b.Dispose()
$coin1r = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255,195,140,0), 9)
$g.DrawEllipse($coin1r, 720, 90, 260, 260)
$coin1r.Dispose()
# Inner ring
$coin1r2 = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(180,215,160,0), 4)
$g.DrawEllipse($coin1r2, 745, 115, 210, 210)
$coin1r2.Dispose()
# Rs symbol
$rsFont = New-Object System.Drawing.Font("Arial", 85, [System.Drawing.FontStyle]::Bold)
$rsBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(200,155,95,0))
$g.DrawString("Rs", $rsFont, $rsBrush, (New-Object System.Drawing.RectangleF(720,90,260,260)), $sfC)
$rsFont.Dispose()
$rsBrush.Dispose()

# Medium coin
$coin2b = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(230,255,200,0))
Draw-Circle $g $coin2b 660 390 65
$coin2b.Dispose()
$coin2r = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255,195,145,0), 5)
$g.DrawEllipse($coin2r, 598, 328, 124, 124)
$coin2r.Dispose()
$rs2Font = New-Object System.Drawing.Font("Arial", 38, [System.Drawing.FontStyle]::Bold)
$rs2Brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(180,155,95,0))
$g.DrawString("Rs", $rs2Font, $rs2Brush, (New-Object System.Drawing.RectangleF(598,328,124,124)), $sfC)
$rs2Font.Dispose()
$rs2Brush.Dispose()

# Small coin
$coin3b = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(210,255,195,0))
Draw-Circle $g $coin3b 1010 380 42
$coin3b.Dispose()
$coin3r = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255,195,140,0), 4)
$g.DrawEllipse($coin3r, 970, 340, 80, 80)
$coin3r.Dispose()

# Stars
$starPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(200,255,215,0), 3)
$starCenters = @( @(590,140), @(980,170), @(1030,390), @(710,490) )
foreach ($sc in $starCenters) {
    $sx = $sc[0]; $sy = $sc[1]
    for ($a = 0; $a -lt 5; $a++) {
        $angle1 = [Math]::PI * (-90 + $a * 144) / 180
        $angle2 = [Math]::PI * (-90 + $a * 144 + 72) / 180
        $x1 = $sx + 16 * [Math]::Cos($angle1)
        $y1 = $sy + 16 * [Math]::Sin($angle1)
        $x2 = $sx + 7 * [Math]::Cos(($angle1 + $angle2)/2)
        $y2 = $sy + 7 * [Math]::Sin(($angle1 + $angle2)/2)
        $x3 = $sx + 16 * [Math]::Cos($angle2)
        $y3 = $sy + 16 * [Math]::Sin($angle2)
        $g.DrawLine($starPen, $x1, $y1, $x2, $y2)
        $g.DrawLine($starPen, $x2, $y2, $x3, $y3)
    }
}
$starPen.Dispose()

# Gift box icon
$giftBody = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255,180,60,255))
$g.FillRectangle($giftBody, 960, 70, 80, 70)
$giftBody.Dispose()
$giftLid = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255,210,100,255))
$g.FillRectangle($giftLid, 955, 60, 90, 18)
$giftLid.Dispose()
$giftRibH = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255,255,220,0), 5)
$g.DrawLine($giftRibH, 956, 95, 1038, 95)
$giftRibV = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255,255,220,0), 5)
$g.DrawLine($giftRibV, 999, 60, 999, 140)
$giftRibH.Dispose()
$giftRibV.Dispose()

$wb2.Dispose()
$bmp.Save("$outDir\refer_earn_banner.png", [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose()
Write-Host "refer_earn_banner.png DONE"


# ============================================================
# BANNER 3: Annual Maintenance Contract   Orange/Amber theme
# ============================================================
$bmp = New-Bitmap $W $H
$g = Get-Graphics $bmp

$bg3 = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.Point(0,0)),
    (New-Object System.Drawing.Point($W,$H)),
    [System.Drawing.Color]::FromArgb(255,28,8,4),
    [System.Drawing.Color]::FromArgb(255,170,55,0))
$g.FillRectangle($bg3, 0, 0, $W, $H)
$bg3.Dispose()

$rp3 = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.Point(490,0)),
    (New-Object System.Drawing.Point($W,0)),
    [System.Drawing.Color]::FromArgb(0,255,130,0),
    [System.Drawing.Color]::FromArgb(65,255,160,0))
$g.FillRectangle($rp3, 490, 0, 590, $H)
$rp3.Dispose()

$gc5 = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(28,255,150,0))
Draw-Circle $g $gc5 920 55 210
Draw-Circle $g $gc5 670 495 135
$gc5.Dispose()
$gc6 = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(38,255,75,0))
Draw-Circle $g $gc6 800 310 105
$gc6.Dispose()

# COMING SOON badge
$bb3 = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.Point(40,40)),
    (New-Object System.Drawing.Point(230,76)),
    [System.Drawing.Color]::FromArgb(255,255,120,0),
    [System.Drawing.Color]::FromArgb(255,255,55,0))
Draw-RoundedRect $g $bb3 40 40 190 36 18
$bb3.Dispose()
$bf3 = New-Object System.Drawing.Font("Arial", 13, [System.Drawing.FontStyle]::Bold)
$wb3 = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
$g.DrawString("COMING SOON", $bf3, $wb3, (New-Object System.Drawing.RectangleF(40,40,190,36)), $sfC)
$bf3.Dispose()

# TITLE
$tf3 = New-Object System.Drawing.Font("Arial", 50, [System.Drawing.FontStyle]::Bold)
$ga3 = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.Point(40,100)),
    (New-Object System.Drawing.Point(480,180)),
    [System.Drawing.Color]::FromArgb(255,255,220,100),
    [System.Drawing.Color]::White)
$g.DrawString("Annual Maintenance", $tf3, $ga3, 40, 100)
$tf3.Dispose()
$tf3b = New-Object System.Drawing.Font("Arial", 50, [System.Drawing.FontStyle]::Bold)
$g.DrawString("Contract  (AMC)", $tf3b, $ga3, 40, 162)
$tf3b.Dispose()
$ga3.Dispose()

$df3 = New-Object System.Drawing.Font("Arial", 16)
$gb3 = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(210,255,230,200))
$g.DrawString("Comprehensive home care plan with scheduled service visits, priority support and warranty coverage.", $df3, $gb3, (New-Object System.Drawing.RectangleF(40,238,440,75)))
$df3.Dispose()
$gb3.Dispose()

# Feature pills row
$features = @("Repairs Covered", "Scheduled Visits", "Priority Support")
$pillX = 40
foreach ($feat in $features) {
    $pillBr = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(55,255,160,0))
    Draw-RoundedRect $g $pillBr $pillX 340 185 36 18
    $pillBr.Dispose()
    $pillPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(120,255,160,0), 1.5)
    Draw-RoundedRectPen $g $pillPen $pillX 340 185 36 18
    $pillPen.Dispose()
    $pillF = New-Object System.Drawing.Font("Arial", 12, [System.Drawing.FontStyle]::Bold)
    $g.DrawString($feat, $pillF, $wb3, (New-Object System.Drawing.RectangleF($pillX,340,185,36)), $sfC)
    $pillF.Dispose()
    $pillX += 198
}

# CTA
$cbr3 = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.Point(40,408)),
    (New-Object System.Drawing.Point(255,460)),
    [System.Drawing.Color]::FromArgb(255,255,155,0),
    [System.Drawing.Color]::FromArgb(255,255,75,0))
Draw-RoundedRect $g $cbr3 40 408 205 50 25
$cbr3.Dispose()
$cbf3 = New-Object System.Drawing.Font("Arial", 17, [System.Drawing.FontStyle]::Bold)
$cbt3 = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
$g.DrawString("Notify Me  ->", $cbf3, $cbt3, (New-Object System.Drawing.RectangleF(40,408,205,50)), $sfC)
$cbf3.Dispose()
$cbt3.Dispose()

# === RIGHT: HOUSE ILLUSTRATION ===
# House body
$hb = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(240,255,245,225))
$g.FillRectangle($hb, 580, 280, 440, 210)
$hb.Dispose()
$hp = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(180,255,140,0), 2)
$g.DrawRectangle($hp, 580, 280, 440, 210)
$hp.Dispose()

# Roof
$rb = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255,255,115,0))
$roofPts = @(
    (New-Object System.Drawing.Point(800,110)),
    (New-Object System.Drawing.Point(545,295)),
    (New-Object System.Drawing.Point(1055,295))
)
$g.FillPolygon($rb, $roofPts)
$rb.Dispose()
$rp4 = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(200,200,80,0), 2)
$roofPts2 = @(
    (New-Object System.Drawing.Point(800,110)),
    (New-Object System.Drawing.Point(545,295)),
    (New-Object System.Drawing.Point(1055,295))
)
$g.DrawPolygon($rp4, $roofPts2)
$rp4.Dispose()

# Door
$db2 = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255,170,90,15))
$g.FillRectangle($db2, 755, 370, 90, 120)
$db2.Dispose()

# Door arc top
$db3 = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255,190,110,20))
$g.FillEllipse($db3, 755, 360, 90, 40)
$db3.Dispose()

# Door knob
$dk = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255,255,170,0))
Draw-Circle $g $dk 835 420 7
$dk.Dispose()

# Windows
$wb4 = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(170,80,160,255))
$g.FillRectangle($wb4, 600, 305, 110, 90)
$g.FillRectangle($wb4, 890, 305, 110, 90)
$wb4.Dispose()
# Window cross
$wcp = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(200,255,245,225), 2)
$g.DrawLine($wcp, 655, 305, 655, 395)
$g.DrawLine($wcp, 600, 350, 710, 350)
$g.DrawLine($wcp, 945, 305, 945, 395)
$g.DrawLine($wcp, 890, 350, 1000, 350)
$wcp.Dispose()

# Shield badge center of house
$shb = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.Point(750,155)),
    (New-Object System.Drawing.Point(850,260)),
    [System.Drawing.Color]::FromArgb(220,255,160,0),
    [System.Drawing.Color]::FromArgb(180,255,80,0))
$shPts = @(
    (New-Object System.Drawing.Point(800,155)),
    (New-Object System.Drawing.Point(855,180)),
    (New-Object System.Drawing.Point(855,235)),
    (New-Object System.Drawing.Point(800,265)),
    (New-Object System.Drawing.Point(745,235)),
    (New-Object System.Drawing.Point(745,180))
)
$g.FillPolygon($shb, $shPts)
$shb.Dispose()
$shPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(220,255,200,80), 2.5)
$g.DrawPolygon($shPen, $shPts)
$shPen.Dispose()

# Checkmark on shield
$chPen = New-Object System.Drawing.Pen([System.Drawing.Color]::White, 5)
$chPen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
$chPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
$chPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
$g.DrawLines($chPen, @(
    (New-Object System.Drawing.Point(775,210)),
    (New-Object System.Drawing.Point(793,228)),
    (New-Object System.Drawing.Point(825,193))
))
$chPen.Dispose()

# Tool icons around house
$toolPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(160,255,200,100), 3)
# Wrench shape left
$g.DrawEllipse($toolPen, 535, 345, 30, 30)
$g.DrawLine($toolPen, 555, 368, 575, 400)
# Gear shape top-right
$g.DrawEllipse($toolPen, 1010, 140, 35, 35)
$g.DrawEllipse($toolPen, 1020, 150, 15, 15)
$toolPen.Dispose()

$wb3.Dispose()
$bmp.Save("$outDir\amc_services_banner.png", [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose()
Write-Host "amc_services_banner.png DONE"

Write-Host ""
Write-Host "All 3 banners generated at 1080x540px!"
