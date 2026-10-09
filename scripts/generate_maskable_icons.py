import os
from PIL import Image

def make_maskable(input_path, output_path, size):
    # Abrir la imagen original
    img = Image.open(input_path).convert("RGBA")
    
    # Redimensionar al 80% (dejando 20% de padding seguro)
    target_size = int(size * 0.8)
    img_resized = img.resize((target_size, target_size), Image.Resampling.LANCZOS)
    
    # Crear un nuevo lienzo del tamao final, transparente o del color de fondo (#F9F7F2)
    # Segun el manifest, el background_color es #F9F7F2. Lo usaremos para el maskable icon.
    # Wait, maskable icons usually prefer a solid background. Let's use #F9F7F2.
    new_img = Image.new("RGBA", (size, size), (249, 247, 242, 255))
    
    # Pegar la imagen redimensionada en el centro
    offset = (size - target_size) // 2
    
    # Usar alpha composite para pegar la imagen con transparencia
    new_img.alpha_composite(img_resized, (offset, offset))
    
    # Guardar la imagen final
    new_img.save(output_path, format="PNG")
    print(f"Generated {output_path}")

base_dir = r"c:\Users\Admin\Documents\GitHub\antidepresivos\appantidepresivos\antidepresivos\web_app\public\assets\icons"

make_maskable(
    os.path.join(base_dir, "icon-192.png"),
    os.path.join(base_dir, "icon-192-maskable.png"),
    192
)

make_maskable(
    os.path.join(base_dir, "icon-512.png"),
    os.path.join(base_dir, "icon-512-maskable.png"),
    512
)
