#!/usr/bin/env python3
"""
Genera iconos PWA para RevisionAR usando solo la librería estándar (Pillow).
Crea un ícono limpio con fondo oscuro y emoji de libro.
"""
import os, math

def create_icon(size, output_path):
    try:
        from PIL import Image, ImageDraw, ImageFont
    except ImportError:
        print("Pillow no disponible, creando placeholder SVG-like PNG mínimo")
        create_minimal_png(size, output_path)
        return

    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Fondo con esquinas redondeadas
    radius = int(size * 0.22)
    draw.rounded_rectangle([0, 0, size, size], radius=radius, fill=(26, 26, 46, 255))

    # Acento terracota
    cx, cy = size // 2, size // 2
    r = int(size * 0.28)
    draw.ellipse([cx-r, cy-r-int(size*0.04), cx+r, cy+r-int(size*0.04)],
                 fill=(200, 82, 42, 40))

    # Texto "R" centrado
    font_size = int(size * 0.42)
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf", font_size)
    except:
        font = ImageFont.load_default()

    text = "R"
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    tx = (size - tw) // 2 - bbox[0]
    ty = (size - th) // 2 - bbox[1] - int(size * 0.02)
    draw.text((tx, ty), text, fill=(255, 255, 255, 255), font=font)

    # Línea decorativa
    lw = int(size * 0.35)
    ly = int(size * 0.72)
    draw.rectangle([cx - lw//2, ly, cx + lw//2, ly + max(2, size//48)],
                   fill=(200, 82, 42, 200))

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    img.save(output_path, 'PNG')
    print(f"  ✓ icon-{size}.png")


def create_minimal_png(size, output_path):
    """PNG válido mínimo (pixel sólido escalado) como fallback."""
    import struct, zlib
    def chunk(name, data):
        c = name + data
        return struct.pack('>I', len(data)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)

    def make_png(w, h, r, g, b):
        raw = b''
        for _ in range(h):
            row = b'\x00' + bytes([r, g, b, 255] * w)
            raw += row
        compressed = zlib.compress(raw)
        ihdr = struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0)
        return (b'\x89PNG\r\n\x1a\n'
                + chunk(b'IHDR', ihdr)
                + chunk(b'IDAT', compressed)
                + chunk(b'IEND', b''))

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'wb') as f:
        f.write(make_png(size, size, 26, 26, 46))
    print(f"  ✓ icon-{size}.png (placeholder)")


if __name__ == '__main__':
    sizes = [72, 96, 128, 144, 152, 192, 384, 512]
    base  = os.path.join(os.path.dirname(__file__), 'icons')
    print("Generando iconos PWA para RevisionAR…")
    for s in sizes:
        create_icon(s, os.path.join(base, f'icon-{s}.png'))
    print(f"\n✅ {len(sizes)} iconos generados en /icons/")
