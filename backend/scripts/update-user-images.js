const mongoose = require('mongoose');
const uri = 'mongodb+srv://fanqie:fanqie123@cluster0.f8acy45.mongodb.net/wormup';

const IMAGES = {
  orange: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSemEkrgiWvWbBgAQBbj7XP9t__p_pIi1gtYcJBGnfBIw&s=10',
  papaya: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRGuJjb7u8uabHvxk0eIiIkoyp4E3gkGFsZSRoEcvN1tg&s=10',
  'body spray': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSDNbDwSqIYE72Lb3bZbQLkyyYl8H0xm5JkLWZi3Ib-Yw&s=10',
  'body spree': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSDNbDwSqIYE72Lb3bZbQLkyyYl8H0xm5JkLWZi3Ib-Yw&s=10',
  bread: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT_sb7YZyRR7eojX8jeilrU5YfTr-dKKT1kvte4lhwIZA&s=10',
  lemon: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQrSXgNBDCMgIzNDgg5epfPEVMFOu0Xz0CaLqsq-Ew_Yw&s=10',
  tomato: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTIJ0j-rSi_Kpm_qq75j6_i_yvhhncVtR-nUCoK1Syaag&s=10',
  guvar: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRXuO4H4AQ0PC7-By3QNDrCwz5TPJ35S30XrCDmYkVXEw&s=10',
  guwar: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRXuO4H4AQ0PC7-By3QNDrCwz5TPJ35S30XrCDmYkVXEw&s=10',
  cabbage: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSM3YifPXa7H-gnrkgxzRWvqAdmmLywqDsoOatSBhI6Ww&s=10',
  curd: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTUOrvWNbMVx9pE7z6mW3u1rCX3VyBWjO_WyvZ_273mkQ&s=10',
  dahi: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTUOrvWNbMVx9pE7z6mW3u1rCX3VyBWjO_WyvZ_273mkQ&s=10',
  ginger: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSFoHSxcpqrCsOa1XXNzdv8StIP-D-MK_ct6ut-c4iHHw&s=10'
};

async function run() {
  await mongoose.connect(uri);
  const col = mongoose.connection.collection('products');
  const prods = await col.find({}).toArray();
  for (const [key, url] of Object.entries(IMAGES)) {
    const reg = new RegExp(key.replace(/ /g, '.*'), 'i');
    const matched = prods.filter(p => reg.test(p.name));
    for (const m of matched) {
      await col.updateOne(
        { _id: m._id },
        {
          $set: {
            imageUrl: url,
            image: url,
            images: [url],
            thumbnailUrl: url,
            updatedAt: new Date()
          }
        }
      );
      console.log('Updated in DB:', m.name, '->', url);
    }
  }
  await mongoose.disconnect();
  console.log('All product images updated in MongoDB Atlas successfully.');
}
run().catch(console.error);
