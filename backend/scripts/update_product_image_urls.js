const mongoose = require('mongoose');
const fs = require('fs');

const report = JSON.parse(fs.readFileSync('../scripts/image_verification_report.json', 'utf8'));

mongoose.connect('mongodb+srv://fanqie:fanqie123@cluster0.f8acy45.mongodb.net/wormup').then(async () => {
  const collection = mongoose.connection.collection('products');
  let updatedCount = 0;
  
  for (const item of report) {
    const slug = item.slug;
    const httpUrl = item.url;
    
    const res = await collection.updateOne(
      { slug: slug },
      {
        $set: {
          imageUrl: httpUrl,
          images: [httpUrl],
          image: httpUrl,
          thumbnailUrl: httpUrl,
          updatedAt: new Date()
        }
      }
    );
    if (res.matchedCount > 0) {
      updatedCount++;
      console.log(`Updated [${slug}] -> ${httpUrl.substring(0, 55)}...`);
    } else {
      console.warn(`WARNING: Could not match product with slug: [${slug}]`);
    }
  }
  
  console.log(`\nSuccessfully updated ${updatedCount} / ${report.length} products in MongoDB.`);
  process.exit(0);
}).catch(err => {
  console.error('MongoDB error:', err);
  process.exit(1);
});
