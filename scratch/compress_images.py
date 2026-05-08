import os
import sys
try:
    from PIL import Image
except ImportError:
    print("Pillow is not installed.")
    sys.exit(1)

public_dir = r"c:\Users\G15\Documents\Claude-Antigravity projects\APP-HR-CVS\frontend\public"
landing_dir = os.path.join(public_dir, "landing")

def compress_image(src_path, dest_ext=".webp", max_width=1200, quality=80):
    try:
        img = Image.open(src_path)
        orig_w, orig_h = img.size
        print(f"Loaded {os.path.basename(src_path)}: {orig_w}x{orig_h}")
        
        # Resize if width exceeds max_width
        if orig_w > max_width:
            ratio = max_width / float(orig_w)
            new_h = int(orig_h * ratio)
            img = img.resize((max_width, new_h), Image.Resampling.LANCZOS)
            print(f"Resized to {max_width}x{new_h}")
            
        base_name, _ = os.path.splitext(src_path)
        dest_path = base_name + dest_ext
        
        # Save as webp or png optimized
        if dest_ext == ".webp":
            img.save(dest_path, "WEBP", quality=quality)
        elif dest_ext == ".png":
            img.save(dest_path, "PNG", optimize=True)
            
        print(f"Saved {os.path.basename(dest_path)}: Size before {os.path.getsize(src_path)} bytes, after {os.path.getsize(dest_path)} bytes\n")
    except Exception as e:
        print(f"Error processing {src_path}: {e}")

# Process landing slides
slides = ["slide-autoconocimiento.jpg", "slide-herramientas.jpg", "slide-seguimiento.jpg", "slide-proyecto.jpg"]
for slide in slides:
    full_path = os.path.join(landing_dir, slide)
    if os.path.exists(full_path):
        compress_image(full_path, dest_ext=".webp", max_width=1200, quality=80)

# Process Avatar Optima
avatar_path = os.path.join(public_dir, "Avatar Optima.png")
if os.path.exists(avatar_path):
    compress_image(avatar_path, dest_ext=".webp", max_width=800, quality=80)
