from PIL import Image
import os

mipmap_sizes = {
    "mdpi": 48,
    "hdpi": 72,
    "xhdpi": 96,
    "xxhdpi": 144,
    "xxxhdpi": 192
}

splash_sizes = {
    "mdpi": 150,
    "hdpi": 225,
    "xhdpi": 300,
    "xxhdpi": 450,
    "xxxhdpi": 600
}

base_path = "app/src/main/res"
src_img = "store_icon.png"

try:
    img = Image.open(src_img).convert("RGBA")
    
    # Generate mipmaps (icons)
    for density, size in mipmap_sizes.items():
        folder = os.path.join(base_path, f"mipmap-{density}")
        os.makedirs(folder, exist_ok=True)
        
        resized = img.resize((size, size), Image.Resampling.LANCZOS)
        
        # Save ic_launcher.png & ic_maskable.png
        resized.save(os.path.join(folder, "ic_launcher.png"))
        resized.save(os.path.join(folder, "ic_maskable.png"))
    
    # Generate drawables (splash)
    for density, size in splash_sizes.items():
        folder = os.path.join(base_path, f"drawable-{density}")
        os.makedirs(folder, exist_ok=True)
        
        # Splash is just the logo scaled appropriately.
        # Ensure aspect ratio is maintained
        ratio = min(size / img.width, size / img.height)
        new_w, new_h = int(img.width * ratio), int(img.height * ratio)
        resized_splash = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
        
        resized_splash.save(os.path.join(folder, "splash.png"))
        
    print("Icons and Splash generated successfully.")
except Exception as e:
    print("Error:", e)
