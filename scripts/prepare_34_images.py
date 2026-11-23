import os
import io
import urllib.request
from PIL import Image, ImageOps, ImageFilter

OUTPUT_DIRS = [
    os.path.abspath("assets/products"),
    os.path.abspath("backend/uploads/products")
]

for d in OUTPUT_DIRS:
    os.makedirs(d, exist_ok=True)

# Curated high-resolution Unsplash / authentic grocery packshot source images
PRODUCT_SOURCES = {
    # 1. Vegetables
    "potato.png": "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=1200&q=90",
    "onion.png": "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=1200&q=90",
    "tomato.png": "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=1200&q=90",
    "lady-fingers.png": "https://images.unsplash.com/photo-1425543103986-22abb7d7e8d2?w=1200&q=90",
    "cabbage.png": "https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=1200&q=90",
    "ginger.png": "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=1200&q=90",
    "guwar.png": "https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=1200&q=90",
    "lemon.png": "https://images.unsplash.com/photo-1533082831804-89bce518ee8b?w=1200&q=90",
    "bottle-gourd.png": "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=1200&q=90",
    "parwal.png": "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=1200&q=90",
    "beetroot.png": "https://images.unsplash.com/photo-1526470608268-f674ce90ebd4?w=1200&q=90",

    # 2. Fruits
    "apple.png": "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=1200&q=90",
    "banana.png": "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=1200&q=90",
    "orange.png": "https://images.unsplash.com/photo-1582979512210-99b6a53386f9?w=1200&q=90",
    "pineapple.png": "https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=1200&q=90",
    "muskmelon.png": "https://images.unsplash.com/photo-1571575173700-afb9492e8a50?w=1200&q=90",
    "papaya.png": "https://images.unsplash.com/photo-1517282009859-f000ec3b26fe?w=1200&q=90",
    "kiwi.png": "https://images.unsplash.com/photo-1585059895524-72359e06133a?w=1200&q=90",
    "watermelon.png": "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=1200&q=90",

    # 3. Atta, Rice & Dal
    "aashirvaad-atta.png": "local:assets/products/aashirvaad_atta.jpg",
    "basmati-rice.png": "local:assets/products/daawat_rice.jpg",
    "tata-salt.png": "local:assets/products/tata_salt.jpg",
    "sunflower-oil.png": "local:assets/products/fortune_oil.jpg",

    # 4. Dairy, Bread & Eggs
    "paneer.png": "local:assets/products/paneer_fresh.jpg",
    "curd.png": "https://images.unsplash.com/photo-1570797197190-8e003a00c846?w=1200&q=90",
    "amul-tata-milk.png": "local:assets/products/amul_milk.jpg",
    "bread.png": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1200&q=90",
    "amul-butter-milk.png": "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=1200&q=90",

    # 5. Beauty & Personal Care
    "shampoo.png": "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=1200&q=90",
    "hair-oil.png": "https://images.unsplash.com/photo-1608248597359-2782782e4e4d?w=1200&q=90",
    "conditioner.png": "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1200&q=90",
    "body-spray.png": "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=1200&q=90",
    "body-perfume.png": "https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=1200&q=90",
    "hair-colour.png": "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=1200&q=90",
}

def process_product_image(src, filename):
    print(f"Processing {filename}...")
    try:
        if src.startswith("local:"):
            local_path = src.replace("local:", "")
            img = Image.open(local_path).convert("RGBA")
        else:
            req = urllib.request.Request(src, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=15) as resp:
                data = resp.read()
            img = Image.open(io.BytesIO(data)).convert("RGBA")

        # Create target 1024x1024 white canvas
        canvas = Image.new("RGBA", (1024, 1024), (255, 255, 255, 255))

        # Scale product so it fills 75-85% (around 820px max dimension)
        target_size = 820
        ratio = min(target_size / img.width, target_size / img.height)
        new_w = int(img.width * ratio)
        new_h = int(img.height * ratio)
        resized = img.resize((new_w, new_h), Image.Resampling.LANCZOS)

        # Center product on canvas
        pos_x = (1024 - new_w) // 2
        pos_y = (1024 - new_h) // 2

        # Paste onto white canvas
        canvas.paste(resized, (pos_x, pos_y), resized if resized.mode == 'RGBA' else None)

        final_img = canvas.convert("RGB")
        for out_dir in OUTPUT_DIRS:
            save_path = os.path.join(out_dir, filename)
            final_img.save(save_path, "PNG", quality=95)
        print(f" Saved: {filename} (1024x1024)")
        return True
    except Exception as e:
        print(f"❌ Error processing {filename}: {e}")
        # Generate clean studio placeholder if download failed
        canvas = Image.new("RGB", (1024, 1024), (248, 249, 250))
        for out_dir in OUTPUT_DIRS:
            save_path = os.path.join(out_dir, filename)
            canvas.save(save_path, "PNG")
        return False

def main():
    print(f"Starting generation of {len(PRODUCT_SOURCES)} product images...")
    success_count = 0
    for filename, src in PRODUCT_SOURCES.items():
        if process_product_image(src, filename):
            success_count += 1
    print(f"\nCompleted: {success_count}/{len(PRODUCT_SOURCES)} product images generated successfully!")

if __name__ == "__main__":
    main()
