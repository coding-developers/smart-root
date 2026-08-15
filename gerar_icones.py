"""Gera os ícones PNG do PWA (rodar uma vez). Requer Pillow.
    python gerar_icones.py

Desenho: quadrado escuro arredondado + gota d'água em gradiente verde→ciano
com um brilho suave atrás — o mesmo tema "Neo Grid" do favicon.svg e do app.

Saem três arquivos:
  icon-192.png / icon-512.png      ícones normais (gota grande)
  icon-512-maskable.png            versão com folga nas bordas, para o Android
                                   recortar em círculo/squircle sem cortar a gota
"""
from PIL import Image, ImageDraw, ImageFilter

FUNDO = (5, 11, 20, 255)        # #050b14
VERDE = (34, 229, 165)          # #22e5a5
CIANO = (53, 208, 255)          # #35d0ff


def gradiente(tam):
    """Gradiente diagonal verde→ciano. Interpola um 2x2 ampliado — suave e sem numpy."""
    meio = tuple((a + b) // 2 for a, b in zip(VERDE, CIANO))
    g = Image.new("RGB", (2, 2))
    g.putpixel((0, 0), VERDE)
    g.putpixel((1, 0), meio)
    g.putpixel((0, 1), meio)
    g.putpixel((1, 1), CIANO)
    return g.resize((tam, tam), Image.BICUBIC)


def mascara_gota(tam, escala, centro_y):
    """Silhueta da gota em tons de cinza (255 = opaco), centrada horizontalmente."""
    m = Image.new("L", (tam, tam), 0)
    d = ImageDraw.Draw(m)
    cx = tam / 2
    raio = tam * 0.20 * escala
    base_y = centro_y + raio * 0.55
    topo = base_y - tam * 0.48 * escala
    d.ellipse([cx - raio, base_y - raio, cx + raio, base_y + raio], fill=255)
    d.polygon([(cx, topo), (cx - raio * 0.95, base_y), (cx + raio * 0.95, base_y)], fill=255)
    return m


def gerar(tamanho, caminho, escala=1.0, com_borda=True):
    img = Image.new("RGBA", (tamanho, tamanho), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    r = int(tamanho * 0.22)
    d.rounded_rectangle([0, 0, tamanho - 1, tamanho - 1], radius=r, fill=FUNDO)

    grad = gradiente(tamanho).convert("RGBA")
    gota = mascara_gota(tamanho, escala, tamanho * 0.52)

    # brilho: a própria silhueta borrada, bem apagada, atrás da gota
    brilho = gota.filter(ImageFilter.GaussianBlur(tamanho * 0.05)).point(lambda v: v // 3)
    img.paste(grad, (0, 0), brilho)

    # moldura fina em gradiente (só nos ícones normais; na maskable seria cortada)
    if com_borda:
        borda = Image.new("L", (tamanho, tamanho), 0)
        largura = max(2, int(tamanho * 0.012))
        ImageDraw.Draw(borda).rounded_rectangle(
            [largura // 2, largura // 2, tamanho - 1 - largura // 2, tamanho - 1 - largura // 2],
            radius=r, outline=140, width=largura)
        img.paste(grad, (0, 0), borda)

    img.paste(grad, (0, 0), gota)
    img.save(caminho)
    print("gerado", caminho)


if __name__ == "__main__":
    gerar(192, "public/icon-192.png")
    gerar(512, "public/icon-512.png")
    # Zona segura do maskable: o conteúdo precisa caber no círculo central de 80%.
    gerar(512, "public/icon-512-maskable.png", escala=0.72, com_borda=False)
