const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const mongoose = require('mongoose');

cloudinary.config({
  cloud_name: 'dp6ukil0g',
  api_key: '517499174754476',
  api_secret: '4oZap5OLHkJ76aIy7dxGT7Vn6XQ',
  secure: true
});

const MONGODB_URI = 'mongodb+srv://fanqie:fanqie123@cluster0.f8acy45.mongodb.net/wormup';

const PRODUCTS_MAP = [
  // 1. VEGETABLES
  { filename: 'potato.png', slug: 'potato', name: 'Potato' },
  { filename: 'onion.png', slug: 'onion', name: 'Onion' },
  { filename: 'tomato.png', slug: 'tomato', name: 'Tomato' },
  { filename: 'lady-fingers.png', slug: 'lady-fingers', name: 'Lady Fingers' },
  { filename: 'cabbage.png', slug: 'cabbage', name: 'Cabbage' },
  { filename: 'ginger.png', slug: 'ginger', name: 'Ginger' },
  { filename: 'guwar.png', slug: 'guwar', name: 'Guwar' },
  { filename: 'lemon.png', slug: 'lemon', name: 'Lemon' },
  { filename: 'bottle-gourd.png', slug: 'bottle-gourd', name: 'Bottle Gourd' },
  { filename: 'parwal.png', slug: 'parwal', name: 'Parwal' },
  { filename: 'beetroot.png', slug: 'beetroot', name: 'Beetroot' },

  // 2. FRUITS
  { filename: 'apple.png', slug: 'apple', name: 'Apple' },
  { filename: 'banana.png', slug: 'banana', name: 'Banana' },
  { filename: 'orange.png', slug: 'orange', name: 'Orange' },
  { filename: 'pineapple.png', slug: 'pineapple', name: 'Pineapple' },
  { filename: 'muskmelon.png', slug: 'muskmelon', name: 'Muskmelon' },
  { filename: 'papaya.png', slug: 'papaya', name: 'Papaya' },
  { filename: 'kiwi.png', slug: 'kiwi', name: 'Kiwi' },
  { filename: 'watermelon.png', slug: 'watermelon', name: 'Watermelon' },

  // 3. ATTA, RICE & DAL
  { filename: 'aashirvaad-atta.png', slug: 'aashirvaad-atta', name: 'Aashirvaad Atta' },
  { filename: 'basmati-rice.png', slug: 'basmati-rice', name: 'Basmati Rice' },
  { filename: 'tata-salt.png', slug: 'tata-salt', name: 'Tata Salt' },
  { filename: 'sunflower-oil.png', slug: 'sunflower-oil', name: 'Fortune Sunflower Oil' },

  // 4. DAIRY, BREAD & EGGS
  { filename: 'paneer.png', slug: 'paneer', name: 'Paneer' },
  { filename: 'curd.png', slug: 'curd-dahi', altSlug: 'curd', name: 'Curd (Dahi)' },
  { filename: 'amul-tata-milk.png', slug: 'amul-tata-milk', name: 'Amul TATA Milk' },
  { filename: 'bread.png', slug: 'bread', name: 'Bread' },
  { filename: 'amul-butter-milk.png', slug: 'amul-butter-milk', name: 'Amul Butter Milk' },

  // 5. BEAUTY & PERSONAL CARE
  { filename: 'shampoo.png', slug: 'shampoo', name: 'Dove Shampoo' },
  { filename: 'hair-oil.png', slug: 'hair-oil', name: 'Parachute Hair Oil' },
  { filename: 'conditioner.png', slug: 'conditioner', name: 'Hair Conditioner' },
  { filename: 'body-spray.png', slug: 'body-spray', name: 'Fogg Body Spray' },
  { filename: 'body-perfume.png', slug: 'body-perfume', name: 'Wild Stone Perfume' },
  { filename: 'hair-colour.png', slug: 'hair-colour', name: 'Garnier Hair Colour' }
];

async function main() {
  console.log('--- Connecting to MongoDB Atlas ---');
  await mongoose.connect(MONGODB_URI);
  console.log('MongoDB Connected successfully!');
  const productsCol = mongoose.connection.collection('products');

  const cloudinaryUrls = {};

  console.log(`\n--- Uploading ${PRODUCTS_MAP.length} images to Cloudinary ---`);
  for (const item of PRODUCTS_MAP) {
    const localPath = path.resolve(__dirname, '../assets/products', item.filename);
    if (!fs.existsSync(localPath)) {
      console.error(`File NOT FOUND: ${localPath}`);
      continue;
    }

    const publicId = item.filename.replace('.png', '');
    try {
      const uploadRes = await cloudinary.uploader.upload(localPath, {
        folder: 'womup/products',
        public_id: publicId,
        overwrite: true,
        resource_type: 'image'
      });

      const secureUrl = uploadRes.secure_url;
      cloudinaryUrls[item.filename] = secureUrl;
      console.log(`[UPLOADED] ${item.filename} -> ${secureUrl}`);

      // Update MongoDB product record
      const filter = {
        $or: [
          { slug: item.slug },
          ...(item.altSlug ? [{ slug: item.altSlug }] : []),
          { name: new RegExp(`^${item.name}$`, 'i') }
        ]
      };

      const updateRes = await productsCol.updateMany(filter, {
        $set: {
          imageUrl: secureUrl,
          images: [secureUrl],
          image: secureUrl,
          thumbnailUrl: secureUrl,
          updatedAt: new Date()
        }
      });

      console.log(`  -> MongoDB updated (${updateRes.modifiedCount} docs) for ${item.slug}`);
    } catch (err) {
      console.error(`[ERROR] Failed to upload ${item.filename}:`, err);
    }
  }

  // Write mapping to JSON file for easy import
  const outputPath = path.resolve(__dirname, '../src/utils/cloudinaryProductImages.json');
  fs.writeFileSync(outputPath, JSON.stringify(cloudinaryUrls, null, 2));
  console.log(`\nMapping written to: ${outputPath}`);

  console.log('\n--- Sample Verification from MongoDB Atlas ---');
  const sample = await productsCol.findOne({ slug: 'potato' });
  console.log('Potato in DB:', { name: sample.name, imageUrl: sample.imageUrl });

  await mongoose.disconnect();
  console.log('\nAll done successfully!');
}

main().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
