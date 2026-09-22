# WormUp — Delivery Partner / Rider Application

Welcome to the **WormUp Delivery Partner (Rider) Application**, the last-mile fulfillment mobile app designed for delivery riders operating in the WormUp quick-commerce & cloud printing ecosystem.

---

## 🛵 Architecture & Operational Highlights

* **Framework**: React Native with Expo (v57+ compatible), TypeScript.
* **Duty Status Engine**: Real-time `ONLINE` / `OFFLINE` toggle with location validation.
* **Continuous GPS Telemetry**: Real-time coordinates broadcasting every 3 seconds to backend Redis/WebSockets for customer live tracking and dark store dispatch routing.
* **5-Tab Navigation**:
  1. `Home`: Live status, active assignment badge, today's order metrics, test dispatch simulator.
  2. `Deliveries`: Full lifecycle order stepper (`GOING_TO_STORE` $\rightarrow$ `ARRIVED_AT_STORE` $\rightarrow$ `OUT_FOR_DELIVERY` $\rightarrow$ `ARRIVED_AT_CUSTOMER` $\rightarrow$ `DELIVERED`).
  3. `Earnings`: Daily operational settlement, base pay, tips, weekly/monthly totals, and verified bank account overview.
  4. `Help`: SOS Emergency hotline, direct dark store manager dispatch call, and priority issue reporting.
  5. `More`: Profile, KYC documents verification, vehicle registration, performance scorecards, shift history, and app preferences.
* **Strict Verification SOPs**:
  * Store package handover verification.
  * Customer 4-digit Delivery PIN entry before completing delivery.
  * Doorstep 3-attempt customer unavailable procedure with dark store return logging.
  * Emergency SOS hotline with instant operations team alert.

---

## 📂 Project Structure

```
Womup Rider/
├── App.tsx                    # Root provider, header, screen router & modal layer
├── app.json                   # Expo mobile configuration & permissions
├── index.ts                   # Entry point registerRootComponent
├── package.json               # Dependencies & scripts
├── tsconfig.json              # Strict TypeScript config
└── src/
    ├── components/
    │   ├── common/
    │   │   ├── Header.tsx     # Top bar with duty toggle & SOS button
    │   │   └── BottomNav.tsx  # 5-Tab bar
    │   └── modals/
    │       ├── NewDeliveryModal.tsx         # R10: 45s countdown accept/reject modal
    │       ├── RejectDeliveryModal.tsx      # R12: Mandatory rejection reason selector
    │       ├── DeliveryVerificationModal.tsx# R20: Customer OTP entry PIN
    │       ├── PickupVerificationModal.tsx  # R16: Dark store package handover
    │       ├── CustomerUnavailableModal.tsx # R27: 3-attempt wait & return SOP
    │       └── EmergencyModal.tsx           # R33/R78: SOS ambulance/police/hub hotline
    ├── context/
    │   └── RiderContext.tsx   # Global operational state management
    ├── screens/
    │   ├── home/
    │   │   └── R08_RiderDashboardScreen.tsx
    │   ├── delivery/
    │   │   └── R13_CurrentDeliveryScreen.tsx
    │   ├── earnings/
    │   │   └── R29_EarningsSettlementScreen.tsx
    │   ├── operations/
    │   │   ├── R30_PerformanceScreen.tsx
    │   │   ├── R31_DutyHistoryScreen.tsx
    │   │   └── R33_SupportScreen.tsx
    │   └── more/
    │       ├── R35_DocumentsScreen.tsx
    │       └── RiderMoreMenuScreen.tsx
    ├── services/
    │   ├── locationService.ts # GPS tracking & telemetry dispatcher
    │   └── riderApi.ts        # REST & simulated backend endpoints
    ├── theme/
    │   ├── colors.ts          # WormUp brand & status palette
    │   ├── typography.ts      # Scaled font styles
    │   └── index.ts
    └── types/
        └── rider.types.ts     # Complete TypeScript domain contracts
```

---

## 🚀 How to Run

From this directory (`Womup Rider`):

```bash
# Start Expo development server
npm start

# Run on Web browser
npm run web

# Run on Android Emulator / Device
npm run android

# Run on iOS Simulator
npm run ios
```
