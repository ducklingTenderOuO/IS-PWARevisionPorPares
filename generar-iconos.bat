@echo off
echo Generando iconos PWA...
mkdir icons 2>nul

set sizes=72 96 128 144 152 192 384 512

for %%s in (%sizes%) do (
    echo Generando icon-%%s.png
    magick convert icono-base.png -resize %%sx%%s icons/icon-%%s.png
)

echo ✅ Iconos generados
dir icons