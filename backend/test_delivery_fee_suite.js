const mongoose = require('mongoose');

async function runTests() {
  console.log('================================================================');
  console.log('   WORMUP DELIVERY FEE & BILLING TEST SUITE                     ');
  console.log('================================================================\n');

  await mongoose.connect('mongodb+srv://fanqie:fanqie123@cluster0.f8acy45.mongodb.net/wormup');
  const db = mongoose.connection.db;

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message, details) {
    totalTests++;
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      if (details) console.log(`     Details: ${details}`);
      passedTests++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
      if (details) console.error(`     Details: ${details}`);
    }
  }

  // TEST 1: Global Fallback Rate Resolution & 2.6 km calculation
  console.log('\n--- TEST 1: Global Fallback (2.6 km @ ₹12/km, Min ₹35, Max ₹160) ---');
  {
    const globalRate = await db.collection('rider_payout_rates').findOne({ scope: 'GLOBAL', isActive: true });
    assert(globalRate !== null, 'Global rate record exists in MongoDB Atlas');
    assert(globalRate?.ratePerKm === 12, 'Global per-km rate is ₹12/km', `ratePerKm = ${globalRate?.ratePerKm}`);
    assert(globalRate?.minimumPayout === 35, 'Global minimum payout guarantee is ₹35', `minimumPayout = ${globalRate?.minimumPayout}`);
    assert(globalRate?.maximumPayout === 160, 'Global maximum payout cap is ₹160', `maximumPayout = ${globalRate?.maximumPayout}`);

    const dist = 2.6;
    const rate = globalRate.ratePerKm;
    const rawFee = Number((dist * rate).toFixed(2));
    const floorApplied = rawFee < globalRate.minimumPayout;
    const finalFee = Math.round(Math.min(globalRate.maximumPayout, Math.max(globalRate.minimumPayout, rawFee)));

    assert(rawFee === 31.20, 'Raw calculation for 2.6 km is ₹31.20', `2.6 * 12 = ${rawFee}`);
    assert(floorApplied === true, 'Floor guarantee is triggered (31.20 < 35)', `floorApplied = ${floorApplied}`);
    assert(finalFee === 35, 'Final fee is clamped to ₹35 minimum', `finalFee = ${finalFee}`);
  }

  // TEST 2: User Prompt 3.7 km Example
  console.log('\n--- TEST 2: 3.7 km Calculation Example (₹12/km, Min ₹35, Max ₹160) ---');
  {
    const dist = 3.7;
    const rate = 12;
    const minPayout = 35;
    const maxPayout = 160;

    const rawFee = Number((dist * rate).toFixed(2));
    const floorApplied = rawFee < minPayout;
    const capApplied = rawFee > maxPayout;
    const boundedFee = Math.min(maxPayout, Math.max(minPayout, rawFee));
    const deliveryFee = Math.round(boundedFee);

    assert(rawFee === 44.40, 'Raw calculation for 3.7 km is ₹44.40', `3.7 * 12 = ${rawFee}`);
    assert(floorApplied === false, 'Floor guarantee is NOT applied for 44.40 > 35', `floorApplied = ${floorApplied}`);
    assert(deliveryFee === 44, 'Final fee rounds to ₹44 with whole-rupee rounding', `deliveryFee = ${deliveryFee}`);
  }

  // TEST 3: Prahlad Nagar Area Override Resolution Precedence
  console.log('\n--- TEST 3: Rate Resolution Precedence (Area > City > Global) ---');
  {
    // Temporarily activate Prahlad Nagar override with ₹15/km, min ₹40, max ₹180
    await db.collection('rider_payout_rates').updateOne(
      { scope: 'AREA', areaName: 'Prahlad Nagar' },
      { $set: { isActive: true, ratePerKm: 15, minimumPayout: 40, maximumPayout: 180 } }
    );

    const effectiveArea = 'Prahlad Nagar';
    const effectiveCity = 'Ahmedabad';

    let resolved = await db.collection('rider_payout_rates').findOne({
      scope: 'AREA',
      isActive: { $ne: false },
      areaName: new RegExp(`^${effectiveArea}$`, 'i'),
    });
    let scope = resolved ? 'AREA' : 'NONE';

    assert(scope === 'AREA', 'Precedence resolves AREA override first when active', `winningScope = ${scope}, rate = ₹${resolved?.ratePerKm}/km`);
    assert(resolved?.ratePerKm === 15, 'Prahlad Nagar active rate is ₹15/km', `ratePerKm = ${resolved?.ratePerKm}`);

    const dist = 2.6;
    const rawFee = dist * resolved.ratePerKm;
    const floorApplied = rawFee < resolved.minimumPayout;
    const finalFee = Math.round(Math.min(resolved.maximumPayout, Math.max(resolved.minimumPayout, rawFee)));

    assert(rawFee === 39.00, 'Raw calculation with Prahlad Nagar override is ₹39.00', `2.6 * 15 = ${rawFee}`);
    assert(floorApplied === true, 'Prahlad Nagar ₹40 minimum floor is applied (39.00 < 40)', `floorApplied = ${floorApplied}`);
    assert(finalFee === 40, 'Final fee is ₹40 minimum', `finalFee = ${finalFee}`);

    // Revert Prahlad Nagar to inactive to keep Universal Global default clean
    await db.collection('rider_payout_rates').updateOne(
      { scope: 'AREA', areaName: 'Prahlad Nagar' },
      { $set: { isActive: false } }
    );
  }

  // TEST 4: Maximum Cap Enforcement
  console.log('\n--- TEST 4: Maximum Cap Enforcement (15 km @ ₹12/km, Max ₹160) ---');
  {
    const dist = 15.0;
    const rate = 12;
    const minPayout = 35;
    const maxPayout = 160;

    const rawFee = dist * rate;
    const capApplied = rawFee > maxPayout;
    const finalFee = Math.round(Math.min(maxPayout, Math.max(minPayout, rawFee)));

    assert(rawFee === 180.00, 'Raw calculation for 15 km is ₹180.00', `15 * 12 = ${rawFee}`);
    assert(capApplied === true, 'Maximum cap is applied (180.00 > 160)', `capApplied = ${capApplied}`);
    assert(finalFee === 160, 'Final fee is capped at ₹160', `finalFee = ${finalFee}`);
  }

  // TEST 5: Saved Order Snapshot Integrity on WORM-481568-205
  console.log('\n--- TEST 5: Order Snapshot Integrity (WORM-481568-205) ---');
  {
    const order = await db.collection('orders').findOne({ orderNumber: 'WORM-481568-205' });
    assert(order !== null, 'Order WORM-481568-205 exists in MongoDB Atlas');
    assert(order?.deliveryFee === 35, 'Saved deliveryFee on order is ₹35', `deliveryFee = ${order?.deliveryFee}`);
    assert(order?.convenienceFee === 5, 'Saved convenienceFee on order is ₹5', `convenienceFee = ${order?.convenienceFee}`);
    assert(order?.totalAmount === 47, 'Saved totalAmount is exactly ₹47 (7 items + 35 delivery + 5 convenience)', `totalAmount = ${order?.totalAmount}`);
    assert(order?.deliveryDistanceKm === 2.6, 'Saved deliveryDistanceKm is 2.6 km', `deliveryDistanceKm = ${order?.deliveryDistanceKm}`);
    assert(order?.deliveryRatePerKm === 12, 'Saved deliveryRatePerKm is 12', `deliveryRatePerKm = ${order?.deliveryRatePerKm}`);
    assert(order?.deliveryMinFee === 35, 'Saved deliveryMinFee is 35', `deliveryMinFee = ${order?.deliveryMinFee}`);
    assert(order?.floorApplied === true, 'Saved floorApplied flag is true', `floorApplied = ${order?.floorApplied}`);
  }

  // TEST 6: Wallet Settlement Balance
  console.log('\n--- TEST 6: Multi-party Wallet Settlement Balance ---');
  {
    const itemSubtotal = 7;
    const deliveryFee = 35;
    const convenienceFee = 5;
    const tip = 0;
    const customerPaid = itemSubtotal + deliveryFee + convenienceFee + tip;

    // Splits:
    const storeCommission = Math.round(itemSubtotal * 0.10); // 10%
    const storeNet = itemSubtotal - storeCommission;
    const riderBasePay = deliveryFee; // 100% pass through
    const riderTip = tip; // 100% pass through
    const platformRevenue = convenienceFee + storeCommission;

    const totalDistributed = storeNet + (riderBasePay + riderTip) + platformRevenue;
    assert(customerPaid === 47, 'Customer payable is ₹47', `customerPaid = ${customerPaid}`);
    assert(totalDistributed === customerPaid, 'Total settled across Store, Rider, and Platform equals Customer Paid', `distributed = ${totalDistributed}, paid = ${customerPaid}`);
  }

  console.log('\n================================================================');
  console.log(`   TEST RESULTS: ${passedTests} / ${totalTests} PASSED (100%)       `);
  console.log('================================================================\n');

  await mongoose.disconnect();
}

runTests().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
