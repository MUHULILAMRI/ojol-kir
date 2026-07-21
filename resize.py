from PIL import Image
import os

sizes = {
    "mdpi": 48,
    "hdpi": 72,
    "xhdpi": 96,
    "xxhdpi": 144,
    "xxxhdpi": 192
}

base_path = "app/src/main/res"
src_img = "store_icon.png"

try:
    img = Image.open(src_img)
    for density, size in sizes.items():
        folder = os.path.join(base_path, f"mipmap-{density}")
        os.makedirs(folder, exist_ok=True)
        
        resized = img.resize((size, size), Image.Resampling.LANCZOS)
        
        # Save ic_launcher.png
        resized.save(os.path.join(folder, "ic_launcher.png"))
        
        # Save ic_maskable.png (TWA uses this too)
        resized.save(os.path.join(folder, "ic_maskable.png"))
        
    print("Icons generated successfully.")
except Exception as e:
    print("Error:", e)
