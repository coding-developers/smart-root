"""Gera os ícones PNG do PWA (rodar uma vez). Requer Pillow.
    python gerar_icones.py
Desenho: quadrado verde arredondado + gota d'água branca (igual ao favicon.svg).
"""
from PIL import Image, ImageDraw

VERDE = (22, 163, 74, 255)
BRANCO = (255, 255, 255, 255)


def gota(draw, cx, s):
    """Desenha uma gota d'água centrada horizontalmente em cx, escala s (lado da imagem)."""
    topo = s * 0.18
    base_y = s * 0.66
    raio = s * 0.20
    # corpo (círculo) na parte de baixo
    draw.ellipse([cx - raio, base_y - raio, cx + raio, base_y + raio], fill=BRANCO)
    # ponta (triângulo) no topo
    draw.polygon([(cx, topo), (cx - raio * 0.95, base_y), (cx + raio * 0.95, base_y)], fill=BRANCO)


def gerar(tamanho, caminho):
    img = Image.new("RGBA", (tamanho, tamanho), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    r = int(tamanho * 0.22)
    d.rounded_rectangle([0, 0, tamanho - 1, tamanho - 1], radius=r, fill=VERDE)
    gota(d, tamanho / 2, tamanho)
    img.save(caminho)
    print("gerado", caminho)


if __name__ == "__main__":
    gerar(192, "public/icon-192.png")
    gerar(512, "public/icon-512.png")
