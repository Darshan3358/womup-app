const BASE = 'http://localhost:5001';

async function testEndpoint(name, url, method = 'GET', body = null) {
  try {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`${BASE}${url}`, opts);
    const data = await res.json();
    console.log(`✅ [${res.status}] ${name} -> ${url}`);
    if (data.data) {
      if (Array.isArray(data.data)) {
        console.log(`   Items: ${data.data.length}`);
      } else if (typeof data.data === 'object') {
        console.log(`   Keys: ${Object.keys(data.data).join(', ')}`);
      }
    } else if (data.kpis) {
      console.log(`   KPIs: ${Object.keys(data.kpis).join(', ')}`);
    } else {
      console.log(`   Response:`, Object.keys(data).slice(0, 5));
    }
  } catch (err) {
    console.error(`❌ [FAILED] ${name}:`, err.message);
  }
}

async function runTests() {
  console.log('\n--- TESTING WOMUP ADMIN MANAGEMENT BACKEND ENDPOINTS ---\n');
  await testEndpoint('Health Check', '/api/health');
  await testEndpoint('Dashboard Stats & KPIs', '/api/admin/dashboard/stats');
  await testEndpoint('Customers List', '/api/admin/users');
  await testEndpoint('Catalog Categories', '/api/admin/catalog/categories');
  await testEndpoint('Catalog Products', '/api/admin/catalog/products');
  await testEndpoint('Areas & Zones', '/api/admin/areas');
  await testEndpoint('Area Pricing', '/api/admin/areas/pricing');
  await testEndpoint('Dark Stores', '/api/admin/stores');
  await testEndpoint('Store Inventory', '/api/admin/stores/inventory');
  await testEndpoint('Orders List', '/api/admin/orders');
  await testEndpoint('Print Orders', '/api/admin/print-orders');
  await testEndpoint('Marketing Coupons', '/api/admin/marketing/coupons');
  await testEndpoint('Marketing Banners', '/api/admin/marketing/banners');
  await testEndpoint('Shopping Coin Ledger', '/api/admin/finance/coins/transactions');
  await testEndpoint('Wallet Ledger', '/api/admin/finance/wallet/transactions');
  await testEndpoint('Security OTP Logs', '/api/admin/security/otp');
  await testEndpoint('Security Active Sessions', '/api/admin/security/sessions');
  await testEndpoint('Security Carts', '/api/admin/security/carts');
  console.log('\n--- ALL ADMIN MANAGEMENT ENDPOINTS TESTED ---\n');
}

runTests();
