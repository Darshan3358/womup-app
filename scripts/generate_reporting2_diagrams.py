import os
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyBboxPatch, ArrowStyle

os.makedirs('docs/reporting2/diagrams', exist_ok=True)

# Common styling constants
NAVY = '#071B52'
DARK_BLUE = '#0F2B75'
INDIGO = '#4338CA'
PINK = '#FF3B98'
CYAN = '#0EA5E9'
EMERALD = '#10B981'
AMBER = '#F59E0B'
SLATE_GRAY = '#64748B'
LIGHT_BG = '#F8FAFC'
WHITE = '#FFFFFF'
BORDER_GRAY = '#CBD5E1'

def draw_card(ax, x, y, w, h, bg=WHITE, border=BORDER_GRAY, title="", subtitle="", title_color=NAVY, sub_color=SLATE_GRAY, title_size=10, sub_size=8, radius=0.03):
    box = FancyBboxPatch((x, y), w, h,
                         boxstyle=f"round,pad={radius},rounding_size={radius}",
                         linewidth=1.5, edgecolor=border, facecolor=bg)
    ax.add_patch(box)
    if title:
        ax.text(x + w/2, y + h - 0.08, title, ha='center', va='top', fontsize=title_size, fontweight='bold', color=title_color)
    if subtitle:
        ax.text(x + w/2, y + h - 0.16, subtitle, ha='center', va='top', fontsize=sub_size, color=sub_color, multialignment='center')

def draw_arrow(ax, x1, y1, x2, y2, color=INDIGO, width=1.5, label=""):
    ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle="->", color=color, lw=width, mutation_scale=15))
    if label:
        mx = (x1 + x2) / 2
        my = (y1 + y2) / 2
        ax.text(mx, my + 0.02, label, ha='center', va='bottom', fontsize=7.5, fontweight='bold', color=color,
                bbox=dict(boxstyle="round,pad=0.2", facecolor=WHITE, edgecolor='none', alpha=0.85))

# ==============================================================================
# DIAGRAM 1: High-Level System Architecture
# ==============================================================================
def create_system_architecture():
    fig, ax = plt.subplots(figsize=(10, 6.2), dpi=200)
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis('off')
    fig.patch.set_facecolor(LIGHT_BG)

    # Title
    ax.text(0.5, 0.96, "WORMUP: MULTI-TIER SYSTEM ARCHITECTURE", ha='center', va='top', fontsize=14, fontweight='bold', color=NAVY)
    ax.text(0.5, 0.91, "Distributed Hyperlocal Quick Commerce, Dark Store Logistics & Cloud Printing", ha='center', va='top', fontsize=9, color=SLATE_GRAY)

    # Layer 1: Client Presentation Layer
    draw_card(ax, 0.04, 0.68, 0.92, 0.19, bg='#EFF6FF', border='#93C5FD', title="CLIENT PRESENTATION LAYER", subtitle="", title_color='#1E40AF')
    draw_card(ax, 0.06, 0.70, 0.20, 0.13, bg=WHITE, border='#BFDBFE', title="Customer Web / PWA", subtitle="React 19 • TypeScript\nVite • Geolocation API", title_color=NAVY)
    draw_card(ax, 0.28, 0.70, 0.20, 0.13, bg=WHITE, border='#BFDBFE', title="Dark Store App", subtitle="React Native • Expo\nBarcode & Pick-Lists", title_color=NAVY)
    draw_card(ax, 0.50, 0.70, 0.20, 0.13, bg=WHITE, border='#BFDBFE', title="Rider Partner App", subtitle="React Native • Expo\nGPS Telemetry & Orders", title_color=NAVY)
    draw_card(ax, 0.72, 0.70, 0.22, 0.13, bg=WHITE, border='#BFDBFE', title="Central Admin Portal", subtitle="React 19 • Dashboard\nPricing & Fleet Hub", title_color=NAVY)

    # Layer 2: API Gateway & WebSocket Router
    draw_card(ax, 0.04, 0.40, 0.92, 0.21, bg='#FAF5FF', border='#D8B4FE', title="APPLICATION GATEWAY & REAL-TIME EVENT BUS", subtitle="", title_color='#6B21A8')
    draw_card(ax, 0.06, 0.42, 0.27, 0.15, bg=WHITE, border='#E9D5FF', title="NestJS / Express Gateway", subtitle="RESTful Controllers\nJWT Auth Guards • RBAC\nRate Limiting & DTO Validation", title_color=NAVY)
    draw_card(ax, 0.36, 0.42, 0.28, 0.15, bg=WHITE, border='#E9D5FF', title="Socket.IO Gateway", subtitle="Bidirectional WebSockets\nOrder Status Channels\nRealtime Rider Location Rooms", title_color=NAVY)
    draw_card(ax, 0.67, 0.42, 0.27, 0.15, bg=WHITE, border='#E9D5FF', title="Dynamic Logic Engines", subtitle="Area Price Override Engine\nFleet Payout Calculator\nCloud Printing Cost Estimator", title_color=NAVY)

    # Layer 3: Persistence & Cloud Services Layer
    draw_card(ax, 0.04, 0.12, 0.92, 0.21, bg='#F0FDF4', border='#86EFAC', title="DATA PERSISTENCE & CLOUD SERVICES LAYER", subtitle="", title_color='#166534')
    draw_card(ax, 0.06, 0.14, 0.42, 0.15, bg=WHITE, border='#BBF7D0', title="MongoDB Atlas Cluster (v7.0)", subtitle="Mongoose ODM • 2dsphere Geospatial Indices\nCollections: users, stores, products, area_pricing, orders, print_orders, delivery_partners", title_color=NAVY)
    draw_card(ax, 0.51, 0.14, 0.21, 0.15, bg=WHITE, border='#BBF7D0', title="Cloudinary CDN", subtitle="Secure PDF Documents\nProduct Catalogs\nMedia Optimization", title_color=NAVY)
    draw_card(ax, 0.74, 0.14, 0.20, 0.15, bg=WHITE, border='#BBF7D0', title="Third-Party Integrations", subtitle="SMS / WhatsApp OTP\nPayment Gateways\nMaps & Distance APIs", title_color=NAVY)

    # Inter-layer connection arrows
    draw_arrow(ax, 0.16, 0.70, 0.16, 0.57, color=INDIGO, label="HTTP / WS")
    draw_arrow(ax, 0.38, 0.70, 0.38, 0.57, color=INDIGO, label="Socket.IO")
    draw_arrow(ax, 0.60, 0.70, 0.50, 0.57, color=INDIGO, label="GPS Pings")
    draw_arrow(ax, 0.83, 0.70, 0.80, 0.57, color=INDIGO, label="Admin API")

    draw_arrow(ax, 0.20, 0.42, 0.20, 0.29, color=EMERALD, label="CRUD / Aggregations")
    draw_arrow(ax, 0.80, 0.42, 0.62, 0.29, color=EMERALD, label="Document Uploads")

    plt.tight_layout()
    plt.savefig('docs/reporting2/diagrams/system_architecture.png', dpi=200, bbox_inches='tight')
    plt.close()

# ==============================================================================
# DIAGRAM 2: DFD Level 1
# ==============================================================================
def create_dfd_level1():
    fig, ax = plt.subplots(figsize=(10, 6.2), dpi=200)
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis('off')
    fig.patch.set_facecolor(LIGHT_BG)

    ax.text(0.5, 0.96, "DATA FLOW DIAGRAM (DFD LEVEL 1)", ha='center', va='top', fontsize=14, fontweight='bold', color=NAVY)
    ax.text(0.5, 0.91, "Functional Entity Decomposition & Flow Channels", ha='center', va='top', fontsize=9, color=SLATE_GRAY)

    # External Entities (Left & Right)
    draw_card(ax, 0.03, 0.70, 0.18, 0.14, bg='#FEF2F2', border='#FCA5A5', title="Customer (User)", subtitle="Browses catalog\nPlaces orders & prints", title_color='#991B1B')
    draw_card(ax, 0.03, 0.20, 0.18, 0.14, bg='#FFFBEB', border='#FDE68A', title="Dark Store Picker", subtitle="Picks & packs items\nManages store shift", title_color='#92400E')
    draw_card(ax, 0.79, 0.70, 0.18, 0.14, bg='#F0FDF4', border='#86EFAC', title="Super Admin", subtitle="Overrides area prices\nMonitors fleet & audit", title_color='#166534')
    draw_card(ax, 0.79, 0.20, 0.18, 0.14, bg='#EFF6FF', border='#93C5FD', title="Delivery Rider", subtitle="Accepts dispatch\nDoorstep delivery & OTP", title_color='#1E40AF')

    # Core System Processes (Center Circle/Boxes)
    draw_card(ax, 0.32, 0.72, 0.36, 0.12, bg=WHITE, border=INDIGO, title="1.0 Catalog & Area Pricing Engine", subtitle="Resolves Area Price vs Default Price by GPS", title_color=NAVY)
    draw_card(ax, 0.32, 0.54, 0.36, 0.12, bg=WHITE, border=INDIGO, title="2.0 Order & Payment Processing", subtitle="Cart validation, Coins deduction, Order creation", title_color=NAVY)
    draw_card(ax, 0.32, 0.36, 0.36, 0.12, bg=WHITE, border=INDIGO, title="3.0 Store Fulfillment & Packing", subtitle="Pick-list generation, Inventory decrement", title_color=NAVY)
    draw_card(ax, 0.32, 0.18, 0.36, 0.12, bg=WHITE, border=INDIGO, title="4.0 Fleet Dispatch & Live Tracking", subtitle="Rider auto-assignment, Socket.IO live coords", title_color=NAVY)

    # Data Store Box (Bottom center)
    draw_card(ax, 0.30, 0.02, 0.40, 0.10, bg='#F8FAFC', border='#475569', title="D1: MongoDB Database", subtitle="users, stores, products, area_pricing, orders, delivery_partners", title_color='#1E293B', title_size=9, sub_size=7)

    # Connecting Arrows
    draw_arrow(ax, 0.21, 0.78, 0.32, 0.78, color='#991B1B', label="Location & Requests")
    draw_arrow(ax, 0.32, 0.73, 0.21, 0.73, color='#991B1B', label="Area Price Catalog")
    draw_arrow(ax, 0.21, 0.71, 0.32, 0.60, color='#991B1B', label="Order Checkout")

    draw_arrow(ax, 0.50, 0.54, 0.50, 0.48, color=INDIGO, label="Order Placed")
    draw_arrow(ax, 0.50, 0.36, 0.50, 0.30, color=INDIGO, label="Packed & Ready")

    draw_arrow(ax, 0.21, 0.27, 0.32, 0.42, color='#92400E', label="Pack Complete")
    draw_arrow(ax, 0.68, 0.24, 0.79, 0.24, color='#1E40AF', label="Dispatch Request")
    draw_arrow(ax, 0.79, 0.27, 0.68, 0.27, color='#1E40AF', label="GPS Telemetry")

    draw_arrow(ax, 0.79, 0.76, 0.68, 0.76, color='#166534', label="Price Overrides")

    plt.tight_layout()
    plt.savefig('docs/reporting2/diagrams/dfd_level1.png', dpi=200, bbox_inches='tight')
    plt.close()

# ==============================================================================
# DIAGRAM 3: Module 1 Customer Flow & Area Pricing
# ==============================================================================
def create_module1_customer_flow():
    fig, ax = plt.subplots(figsize=(10, 5.8), dpi=200)
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis('off')
    fig.patch.set_facecolor(LIGHT_BG)

    ax.text(0.5, 0.96, "MODULE 1: CUSTOMER APP & AREA-PRICING LIFECYCLE", ha='center', va='top', fontsize=13, fontweight='bold', color=NAVY)
    ax.text(0.5, 0.91, "Hierarchical Price Fallback, Real-time Cart & Live Order Pipeline", ha='center', va='top', fontsize=9, color=SLATE_GRAY)

    draw_card(ax, 0.05, 0.60, 0.16, 0.22, bg=WHITE, border=CYAN, title="1. GPS Geo-detect", subtitle="Customer opens app\nDetects lat/lng\nResolves nearest\nDark Store & Area ID", title_color=NAVY)
    draw_card(ax, 0.26, 0.60, 0.19, 0.22, bg=WHITE, border=PINK, title="2. Dynamic Pricing", subtitle="Fetches variant prices:\nArea Price (Tragad ₹7)\nIF NULL -> Base ₹11\nDisplays MRP & % Off", title_color=NAVY)
    draw_card(ax, 0.50, 0.60, 0.18, 0.22, bg=WHITE, border=INDIGO, title="3. Cart & Coins", subtitle="Variant selection (250g)\nApplies promo coupons\nRedeems loyalty coins\nSlot / instant dispatch", title_color=NAVY)
    draw_card(ax, 0.73, 0.60, 0.22, 0.22, bg=WHITE, border=EMERALD, title="4. Order Placement", subtitle="Creates atomic Order doc\nDecrements variant stock\nBroadcasts WebSocket\nStarts 10-min countdown", title_color=NAVY)

    # Sub-workflow steps below
    draw_card(ax, 0.08, 0.15, 0.40, 0.32, bg='#EFF6FF', border='#93C5FD', title="Area-Specific Pricing Decision Engine", subtitle="", title_color='#1E40AF')
    draw_card(ax, 0.10, 0.23, 0.16, 0.16, bg=WHITE, border='#BFDBFE', title="Area Pricing Table", subtitle="Checks MongoDB\n{variantId, areaId}\nMatches Area Price", title_size=9, sub_size=7)
    draw_card(ax, 0.29, 0.23, 0.17, 0.16, bg=WHITE, border='#BFDBFE', title="Fallback Engine", subtitle="No override?\nServes Default Price\nEnsures Zero Missing", title_size=9, sub_size=7)

    draw_card(ax, 0.52, 0.15, 0.43, 0.32, bg='#F0FDF4', border='#86EFAC', title="Real-Time Telemetry & Tracking", subtitle="", title_color='#166534')
    draw_card(ax, 0.54, 0.23, 0.18, 0.16, bg=WHITE, border='#BBF7D0', title="Socket.IO Room", subtitle="Subscribed to:\norder_{orderNumber}\nLive state changes", title_size=9, sub_size=7)
    draw_card(ax, 0.75, 0.23, 0.18, 0.16, bg=WHITE, border='#BBF7D0', title="Rider Location", subtitle="Live GPS coordinates\nPulse ping every 5s\nAccurate ETA to door", title_size=9, sub_size=7)

    draw_arrow(ax, 0.21, 0.71, 0.26, 0.71, color=INDIGO)
    draw_arrow(ax, 0.45, 0.71, 0.50, 0.71, color=INDIGO)
    draw_arrow(ax, 0.68, 0.71, 0.73, 0.71, color=INDIGO)

    draw_arrow(ax, 0.26, 0.31, 0.29, 0.31, color='#1E40AF')
    draw_arrow(ax, 0.72, 0.31, 0.75, 0.31, color='#166534')

    plt.tight_layout()
    plt.savefig('docs/reporting2/diagrams/module1_customer_flow.png', dpi=200, bbox_inches='tight')
    plt.close()

# ==============================================================================
# DIAGRAM 4: Module 2 Dark Store Flow
# ==============================================================================
def create_module2_darkstore_flow():
    fig, ax = plt.subplots(figsize=(10, 5.8), dpi=200)
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis('off')
    fig.patch.set_facecolor(LIGHT_BG)

    ax.text(0.5, 0.96, "MODULE 2: DARK STORE PICK, PACK & FULFILLMENT STATE MACHINE", ha='center', va='top', fontsize=13, fontweight='bold', color=NAVY)
    ax.text(0.5, 0.91, "Sub-3 Minute Fulfillment Pipeline with Bin Location Optimization", ha='center', va='top', fontsize=9, color=SLATE_GRAY)

    draw_card(ax, 0.05, 0.50, 0.18, 0.32, bg=WHITE, border=INDIGO, title="1. Auto Allocation", subtitle="Order assigned to\nDark Store by Geo-fence\nAudio alert triggered\nDigital token created\nState: PLACED", title_color=NAVY)
    draw_card(ax, 0.28, 0.50, 0.18, 0.32, bg=WHITE, border=AMBER, title="2. Picker Route", subtitle="Pick list generated\nSorted by Shelf Tag\n(e.g., A1-R1 -> B2-R3)\nPicker gathers items\nState: PICKING", title_color=NAVY)
    draw_card(ax, 0.51, 0.50, 0.18, 0.32, bg=WHITE, border=PINK, title="3. Packing Station", subtitle="Packer scans barcode\nWeight verification\nEco-bag sealed\nBag barcode tagged\nState: PACKED", title_color=NAVY)
    draw_card(ax, 0.74, 0.50, 0.21, 0.32, bg=WHITE, border=EMERALD, title="4. Rider Handover", subtitle="Rider arrives at bay\nScans order bag QR\nDigital verification\nDispatched from hub\nState: DISPATCHED", title_color=NAVY)

    draw_arrow(ax, 0.23, 0.66, 0.28, 0.66, color=INDIGO, label="<30 sec")
    draw_arrow(ax, 0.46, 0.66, 0.51, 0.66, color=AMBER, label="<90 sec")
    draw_arrow(ax, 0.69, 0.66, 0.74, 0.66, color=PINK, label="<60 sec")

    # Bottom Callout: Realtime Inventory Sync
    draw_card(ax, 0.05, 0.12, 0.90, 0.28, bg='#FFFBEB', border='#FDE68A', title="Dark Store Shift & Stock Synchronization Architecture", subtitle="", title_color='#92400E')
    draw_card(ax, 0.08, 0.15, 0.26, 0.18, bg=WHITE, border='#FEF3C7', title="Shift Control", subtitle="Manager sets On/Off Shift\nOff-shift stores route orders\nto backup nearby hub", title_size=9, sub_size=7.5)
    draw_card(ax, 0.37, 0.15, 0.26, 0.18, bg=WHITE, border='#FEF3C7', title="Variant Stock Sync", subtitle="Atomic stock decrements\nPrevents overselling\nOut-of-stock badge in app", title_size=9, sub_size=7.5)
    draw_card(ax, 0.66, 0.15, 0.26, 0.18, bg=WHITE, border='#FEF3C7', title="Audit Ledger", subtitle="Every item movement\nlogged with timestamp\nand staff partner ID", title_size=9, sub_size=7.5)

    plt.tight_layout()
    plt.savefig('docs/reporting2/diagrams/module2_darkstore_flow.png', dpi=200, bbox_inches='tight')
    plt.close()

# ==============================================================================
# DIAGRAM 5: Module 3 Rider Fleet Flow
# ==============================================================================
def create_module3_rider_fleet_flow():
    fig, ax = plt.subplots(figsize=(10, 5.8), dpi=200)
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis('off')
    fig.patch.set_facecolor(LIGHT_BG)

    ax.text(0.5, 0.96, "MODULE 3: EXPRESS RIDER DISPATCH & TELEMETRY WORKFLOW", ha='center', va='top', fontsize=13, fontweight='bold', color=NAVY)
    ax.text(0.5, 0.91, "Automated Proximity Dispatch, Dynamic Payout Calculation & Proof of Delivery", ha='center', va='top', fontsize=9, color=SLATE_GRAY)

    draw_card(ax, 0.05, 0.52, 0.18, 0.30, bg=WHITE, border=CYAN, title="1. Auto Allocation", subtitle="Haversine distance filter\nIdentifies idle online riders\nwithin 1.5 km of store\nSends push ping (45s)", title_color=NAVY)
    draw_card(ax, 0.28, 0.52, 0.18, 0.30, bg=WHITE, border=INDIGO, title="2. Store Pickup", subtitle="Rider navigates to hub\nInspects sealed bag\nConfirms pickup\nTrip timer started", title_color=NAVY)
    draw_card(ax, 0.51, 0.52, 0.18, 0.30, bg=WHITE, border=PINK, title="3. En-Route GPS", subtitle="Continuous GPS telemetry\nCoordinates sent to socket\nDynamic customer ETA\nSafety speed monitoring", title_color=NAVY)
    draw_card(ax, 0.74, 0.52, 0.21, 0.30, bg=WHITE, border=EMERALD, title="4. Doorstep POD", subtitle="Customer verifies order\nDelivery OTP authentication\nInstant payment & tip\nEarnings credited to wallet", title_color=NAVY)

    draw_arrow(ax, 0.23, 0.67, 0.28, 0.67, color=CYAN)
    draw_arrow(ax, 0.46, 0.67, 0.51, 0.67, color=INDIGO)
    draw_arrow(ax, 0.69, 0.67, 0.74, 0.67, color=PINK)

    # Dynamic Payout Formula Box
    draw_card(ax, 0.05, 0.10, 0.90, 0.34, bg='#EFF6FF', border='#93C5FD', title="Dynamic Rider Payout Calculation Formula & Tariff Matrix", subtitle="", title_color='#1E40AF')
    draw_card(ax, 0.08, 0.13, 0.26, 0.22, bg=WHITE, border='#BFDBFE', title="Base Pay (₹35)", subtitle="Fixed compensation per\nsuccessful pickup\nand handling at dark store", title_size=9, sub_size=7.5)
    draw_card(ax, 0.37, 0.13, 0.26, 0.22, bg=WHITE, border='#BFDBFE', title="Distance Pay (₹12/km)", subtitle="Calculated from Dark Store\nto customer doorstep\nusing road route mapping", title_size=9, sub_size=7.5)
    draw_card(ax, 0.66, 0.13, 0.26, 0.22, bg=WHITE, border='#BFDBFE', title="Surge Multiplier (1.0x - 1.5x)", subtitle="Peak hours, monsoon,\nor high traffic surcharges\nconfigured by Super Admin", title_size=9, sub_size=7.5)

    plt.tight_layout()
    plt.savefig('docs/reporting2/diagrams/module3_rider_fleet_flow.png', dpi=200, bbox_inches='tight')
    plt.close()

# ==============================================================================
# DIAGRAM 6: Module 4 Cloud Printing Flow
# ==============================================================================
def create_module4_cloud_printing_flow():
    fig, ax = plt.subplots(figsize=(10, 5.8), dpi=200)
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis('off')
    fig.patch.set_facecolor(LIGHT_BG)

    ax.text(0.5, 0.96, "MODULE 4: CLOUD PRINTING & ON-DEMAND DOCUMENT PIPELINE", ha='center', va='top', fontsize=13, fontweight='bold', color=NAVY)
    ax.text(0.5, 0.91, "Zero-Wait Document Printing with 15-Minute Doorstep Delivery", ha='center', va='top', fontsize=9, color=SLATE_GRAY)

    draw_card(ax, 0.05, 0.50, 0.18, 0.32, bg=WHITE, border=INDIGO, title="1. Document Upload", subtitle="PDF, DOCX, JPG upload\nCloudinary encrypted CDN\nAuto page-count detector\nFile validation", title_color=NAVY)
    draw_card(ax, 0.28, 0.50, 0.18, 0.32, bg=WHITE, border=PINK, title="2. Print Options", subtitle="Color: B&W (₹2) vs Color (₹10)\nSides: Single vs Double\nBinding: Spiral / Soft cover\nPaper: 75 GSM vs 100 GSM", title_color=NAVY)
    draw_card(ax, 0.51, 0.50, 0.18, 0.32, bg=WHITE, border=AMBER, title="3. Store Routing", subtitle="Order routed to hub\nHigh-speed laser printer\nEncrypted auto-spool\nDocument printed & bound", title_color=NAVY)
    draw_card(ax, 0.74, 0.50, 0.21, 0.32, bg=WHITE, border=EMERALD, title="4. Sealed Dispatch", subtitle="Placed in tamper-proof bag\nConfidentiality sealed\nHanded over to rider\nDelivered in <15 mins", title_color=NAVY)

    draw_arrow(ax, 0.23, 0.66, 0.28, 0.66, color=INDIGO)
    draw_arrow(ax, 0.46, 0.66, 0.51, 0.66, color=PINK)
    draw_arrow(ax, 0.69, 0.66, 0.74, 0.66, color=AMBER)

    # Privacy & Cost Table Box
    draw_card(ax, 0.05, 0.10, 0.90, 0.32, bg='#FAF5FF', border='#D8B4FE', title="Document Privacy & Dynamic Pricing Matrix", subtitle="", title_color='#6B21A8')
    draw_card(ax, 0.08, 0.13, 0.40, 0.20, bg=WHITE, border='#E9D5FF', title="Confidentiality Guarantee", subtitle="Documents stored with temporary encrypted URLs\nAuto-shredded / deleted from CDN after 24 hours\nStrict GDPR and DPDP compliance", title_size=9, sub_size=7.5)
    draw_card(ax, 0.52, 0.13, 0.40, 0.20, bg=WHITE, border='#E9D5FF', title="Algorithmic Price Calculation", subtitle="Total = (Pages × Color Rate × Side Factor) + Binding Fee\ne.g., 20 Pages B&W Back-to-Back + Spiral = ₹20 + ₹35 = ₹55", title_size=9, sub_size=7.5)

    plt.tight_layout()
    plt.savefig('docs/reporting2/diagrams/module4_cloud_printing_flow.png', dpi=200, bbox_inches='tight')
    plt.close()

# ==============================================================================
# DIAGRAM 7: Module 5 Admin Pricing Engine
# ==============================================================================
def create_module5_admin_pricing_engine():
    fig, ax = plt.subplots(figsize=(10, 5.8), dpi=200)
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis('off')
    fig.patch.set_facecolor(LIGHT_BG)

    ax.text(0.5, 0.96, "MODULE 5: DYNAMIC AREA-PRICING OVERRIDE ENGINE", ha='center', va='top', fontsize=13, fontweight='bold', color=NAVY)
    ax.text(0.5, 0.91, "Multi-Tier Pricing Decision Architecture (Admin Control vs Catalog Fallback)", ha='center', va='top', fontsize=9, color=SLATE_GRAY)

    draw_card(ax, 0.05, 0.50, 0.26, 0.32, bg=WHITE, border=INDIGO, title="1. Admin Price Override", subtitle="Admin Portal specifies:\n• Product ID (e.g. Tomato)\n• Variant ID (e.g. 250 g)\n• Target Area (e.g. Tragad)\n• Override Price (₹7)\n• Override MRP (₹15)", title_color=NAVY)
    draw_card(ax, 0.38, 0.50, 0.26, 0.32, bg='#EFF6FF', border='#3B82F6', title="2. MongoDB Compound Index", subtitle="Indexed collection:\narea_pricing\nIndex: { variantId, areaId }\nSub-millisecond resolution\nHigh write/read throughput", title_color='#1E40AF')
    draw_card(ax, 0.71, 0.50, 0.24, 0.32, bg='#F0FDF4', border=EMERALD, title="3. Customer Viewpoint", subtitle="Customer in Tragad:\nTomato 250g -> ₹7 (53% Off)\nCustomer in Thaltej:\nTomato 250g -> ₹12 (20% Off)\nCustomer without Area:\nTomato 250g -> ₹11 (Base)", title_color='#166534')

    draw_arrow(ax, 0.31, 0.66, 0.38, 0.66, color=INDIGO, label="Saves to DB")
    draw_arrow(ax, 0.64, 0.66, 0.71, 0.66, color='#3B82F6', label="Queries by Area")

    # Bottom comparison card
    draw_card(ax, 0.05, 0.10, 0.90, 0.32, bg='#FFF0F7', border='#FBCFE8', title="Business Rules: Default Price vs Area Price", subtitle="", title_color='#9D174D')
    draw_card(ax, 0.08, 0.13, 0.40, 0.20, bg=WHITE, border='#F472B6', title="Default Catalog Base Price", subtitle="Platform-wide fallback price defined in master catalog\nGuarantees that products are always purchasable\neven when no localized marketing override exists", title_size=9, sub_size=7.5)
    draw_card(ax, 0.52, 0.13, 0.40, 0.20, bg=WHITE, border='#F472B6', title="Localized Area Price Override", subtitle="Enables micro-market pricing according to local demand,\ncompetition, fresh farm supply, and transport costs\nAdmin can change prices instantly without touching code", title_size=9, sub_size=7.5)

    plt.tight_layout()
    plt.savefig('docs/reporting2/diagrams/module5_admin_pricing_engine.png', dpi=200, bbox_inches='tight')
    plt.close()

# ==============================================================================
# DIAGRAM 8: ER Diagram
# ==============================================================================
def create_er_diagram():
    fig, ax = plt.subplots(figsize=(10, 6.2), dpi=200)
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis('off')
    fig.patch.set_facecolor(LIGHT_BG)

    ax.text(0.5, 0.96, "ENTITY RELATIONSHIP (ER) DIAGRAM", ha='center', va='top', fontsize=14, fontweight='bold', color=NAVY)
    ax.text(0.5, 0.91, "Logical Schema Entities, Composite Keys & Relational Mappings", ha='center', va='top', fontsize=9, color=SLATE_GRAY)

    # Entities
    draw_card(ax, 0.03, 0.66, 0.18, 0.20, bg='#FEF2F2', border='#FCA5A5', title="USERS", subtitle="PK: _id\nphone, email\nrole, walletBalance\nshoppingCoins", title_color='#991B1B')
    draw_card(ax, 0.26, 0.66, 0.20, 0.20, bg='#EFF6FF', border='#93C5FD', title="ORDERS", subtitle="PK: _id\nFK: userId, storeId\nFK: riderId\ntotalAmount, status", title_color='#1E40AF')
    draw_card(ax, 0.52, 0.66, 0.20, 0.20, bg='#FDF4FF', border='#F0ABFC', title="STORES (Hubs)", subtitle="PK: _id\ncode, name\ngeoCoordinates [lng, lat]\ncity, isOnShift", title_color='#86198F')
    draw_card(ax, 0.77, 0.66, 0.20, 0.20, bg='#F0FDF4', border='#86EFAC', title="RIDERS", subtitle="PK: _id\nFK: userId, hubId\npartnerCode, vehicle\nisOnline, status", title_color='#166534')

    draw_card(ax, 0.03, 0.32, 0.18, 0.22, bg='#FFFBEB', border='#FDE68A', title="ADDRESSES", subtitle="PK: _id\nFK: userId\nstreet, city, pincode\nisDefault", title_color='#92400E')
    draw_card(ax, 0.26, 0.32, 0.20, 0.22, bg='#FAF5FF', border='#D8B4FE', title="PRODUCTS", subtitle="PK: _id\nname, slug, category\nbasePrice, mrp\nstock, isActive", title_color='#6B21A8')
    draw_card(ax, 0.52, 0.32, 0.20, 0.22, bg='#F0FDFA', border='#5EEAD4', title="VARIANTS", subtitle="PK: _id\nFK: productId\nlabel, weight\nprice, mrp, stock", title_color='#115E59')
    draw_card(ax, 0.77, 0.32, 0.20, 0.22, bg='#FFF0F7', border='#FBCFE8', title="AREA_PRICING", subtitle="PK: _id\nFK: variantId, areaId\nFK: storeId, productId\nprice, mrp, stock", title_color='#9D174D')

    draw_card(ax, 0.26, 0.04, 0.20, 0.20, bg='#EFF6FF', border='#93C5FD', title="PRINT_ORDERS", subtitle="PK: _id\nFK: userId, storeId\ndocUrl, pages, color\nbinding, totalAmount", title_color='#1E40AF')
    draw_card(ax, 0.52, 0.04, 0.20, 0.20, bg='#FFF7ED', border='#FED7AA', title="PAYOUT_RATES", subtitle="PK: _id\nscope, cityId, areaId\nbasePay, perKmRate\nsurgeMultiplier", title_color='#9A3412')

    # Connecting relationship lines
    draw_arrow(ax, 0.12, 0.66, 0.12, 0.54, color=SLATE_GRAY, label="1 : N")
    draw_arrow(ax, 0.21, 0.76, 0.26, 0.76, color=SLATE_GRAY, label="1 : N")
    draw_arrow(ax, 0.46, 0.76, 0.52, 0.76, color=SLATE_GRAY, label="N : 1")
    draw_arrow(ax, 0.72, 0.76, 0.77, 0.76, color=SLATE_GRAY, label="N : 1")

    draw_arrow(ax, 0.46, 0.43, 0.52, 0.43, color=SLATE_GRAY, label="1 : N")
    draw_arrow(ax, 0.72, 0.43, 0.77, 0.43, color=SLATE_GRAY, label="1 : N")

    draw_arrow(ax, 0.21, 0.68, 0.28, 0.24, color=SLATE_GRAY, label="1 : N")
    draw_arrow(ax, 0.87, 0.66, 0.70, 0.24, color=SLATE_GRAY, label="N : 1")

    plt.tight_layout()
    plt.savefig('docs/reporting2/diagrams/er_diagram.png', dpi=200, bbox_inches='tight')
    plt.close()

if __name__ == '__main__':
    print("Generating diagrams...")
    create_system_architecture()
    create_dfd_level1()
    create_module1_customer_flow()
    create_module2_darkstore_flow()
    create_module3_rider_fleet_flow()
    create_module4_cloud_printing_flow()
    create_module5_admin_pricing_engine()
    create_er_diagram()
    print("All diagrams generated successfully!")
