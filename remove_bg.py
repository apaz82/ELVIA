import sys
import os

try:
    from PIL import Image
except ImportError:
    print("Pillow not installed. Please run 'pip install pillow'.")
    sys.exit(1)

def remove_white_bg(input_path, output_path, tolerance=220):
    try:
        img = Image.open(input_path).convert("RGBA")
    except Exception as e:
        print(f"Failed to load {input_path}: {e}")
        return

    data = img.getdata()
    new_data = []
    
    # Process pixels: if mostly white (R,G,B > tolerance), make transparent
    for item in data:
        # item is (R, G, B, A)
        if item[0] > tolerance and item[1] > tolerance and item[2] > tolerance:
            # Fully transparent white
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)
            
    img.putdata(new_data)
    
    # Crop to bounding box (ignoring fully transparent pixels)
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
        
    img.save(output_path, "PNG")
    print(f"Saved processed logo to {output_path}")

artifact_dir = r"c:\Users\G15\.gemini\antigravity\brain\b663c46a-d96d-42d2-a4b9-196cbc87f5c1"
files_to_process = [
    ("media__1774483972054.jpg", "optima_logo_v3_clean_1.png"),
    ("media__1774483972065.jpg", "optima_logo_v3_clean_2.png"),
    ("media__1774483972093.jpg", "optima_logo_v3_clean_3.png")
]

for in_file, out_file in files_to_process:
    in_path = os.path.join(artifact_dir, in_file)
    out_path = os.path.join(artifact_dir, out_file)
    remove_white_bg(in_path, out_path)
