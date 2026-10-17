const http = require('http');

async function main() {
  const payload = JSON.stringify({
    items: [
      {
        productId: "6aa11866c6c3e5984e2ef5ec", // Fresh Potato
        variantId: "6aa11866c6c3e5984e2ef61b", // 5 kg
        name: "Fresh Potato (5 kg)",
        quantity: 1,
        unitPrice: 152,
        totalPrice: 152,
        quantityLabel: "5 kg"
      }
    ],
    deliveryAddress: {
      label: "Home",
      street: "B-201, Green City",
      area: "Chandlodiya",
      city: "Ahmedabad",
      pincode: "382481",
      location: {
        type: "Point",
        coordinates: [72.5463, 23.0784]
      }
    },
    paymentMethod: "COD",
    totalAmount: 152,
    storeId: "6aac257b8f337240651ef43b" // Chandlodiya Dark Store
  });

  const req = http.request({
    hostname: 'localhost',
    port: 5050,
    path: '/api/v1/orders',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
      // Use user token or mock auth if needed, or pass dummy user
      'Authorization': 'Bearer test'
    }
  }, (res) => {
    let data = '';
    res.on('data', (c) => data += c);
    res.on('end', () => {
      console.log('Status:', res.statusCode);
      console.log('Response:', data);
    });
  });

  req.on('error', (e) => console.error(e));
  req.write(payload);
  req.end();
}

main();
