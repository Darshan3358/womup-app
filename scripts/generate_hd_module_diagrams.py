import os
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyBboxPatch

os.makedirs('docs/reporting2/diagrams', exist_ok=True)
artifact_dir = '/Users/thankiayushi/.gemini/antigravity-ide/brain/4097262a-32b7-4c53-9afb-0aa782a7ed95/diagrams'
os.makedirs(artifact_dir, exist_ok=True)

# Modern Tech Palette
NAVY = '#071B52'
DARK_BLUE = '#0F2B75'
INDIGO = '#4338CA'
PINK = '#FF3B98'
CYAN = '#0284C7'
EMERALD = '#059669'
AMBER = '#D97706'
ROSE = '#E11D48'
SLATE = '#475569'
LIGHT_GRAY = '#F8FAFC'
WHITE = '#FFFFFF'
BORDER_COLOR = '#CBD5E1'
DARK_TEXT = '#0F172A'

def draw_pill(ax, x, y, text, bg=NAVY, fg=WHITE, fs=9, pad=0.015):
    t = ax.text(x, y, text, ha='center', va='center', fontsize=fs, fontweight='bold', color=fg,
                bbox=dict(boxstyle=f"round,pad={pad},rounding_size=0.02", facecolor=bg, edgecolor='none'))

def draw_card(ax, x, y, w, h, bg=WHITE, border=BORDER_COLOR, title="", subtitle="",
              title_color=NAVY, sub_color=SLATE, title_size=11, sub_size=8.5, radius=0.025, lw=1.5):
    box = FancyBboxPatch((x, y), w, h,
                         boxstyle=f"round,pad={radius},rounding_size={radius}",
                         linewidth=lw, edgecolor=border, facecolor=bg)
    ax.add_patch(box)
    if title:
        ax.text(x + w/2, y + h - 0.05, title, ha='center', va='top', fontsize=title_size, fontweight='bold', color=title_color)
    if subtitle:
        ax.text(x + w/2, y + h - 0.12, subtitle, ha='center', va='top', fontsize=sub_size, color=sub_color, multialignment='center', linespacing=1.3)

def draw_step_box(ax, x, y, w, h, step_num, title, items, color=INDIGO, bg=WHITE):
    box = FancyBboxPatch((x, y), w, h,
                         boxstyle="round,pad=0.02,rounding_size=0.025",
                         linewidth=1.8, edgecolor=color, facecolor=bg)
    ax.add_patch(box)
    # Step badge
    draw_pill(ax, x + 0.03, y + h - 0.04, f"STEP {step_num}", bg=color, fg=WHITE, fs=8)
    ax.text(x + 0.07, y + h - 0.04, title, ha='left', va='center', fontsize=10.5, fontweight='bold', color=NAVY)
    
    text_content = "\n".join([f"• {item}" for item in items])
    ax.text(x + 0.025, y + h - 0.10, text_content, ha='left', va='top', fontsize=8, color=SLATE, linespacing=1.35)

def draw_arrow(ax, x1, y1, x2, y2, color=INDIGO, label="", lw=1.8):
    ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle="-|>", color=color, lw=lw, mutation_scale=16))
    if label:
        mx = (x1 + x2) / 2
        my = (y1 + y2) / 2
        ax.text(mx, my + 0.015, label, ha='center', va='bottom', fontsize=7.5, fontweight='bold', color=color,
                bbox=dict(boxstyle="round,pad=0.2", facecolor=WHITE, edgecolor=BORDER_COLOR, lw=0.8, alpha=0.95))

# ==============================================================================
# 1. MODULE 1: Customer Web/App & Dynamic Area Pricing
# ==============================================================================
def generate_module1_hd():
    fig, ax = plt.subplots(figsize=(12, 7.5), dpi=300)
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis('off')
    fig.patch.set_facecolor(LIGHT_GRAY)

    # Header Banner
    draw_card(ax, 0.03, 0.88, 0.94, 0.09, bg=NAVY, border=NAVY, title="MODULE 1: CUSTOMER WEB & MOBILE APPLICATION WORKFLOW",
              subtitle="Hyperlocal Geolocation Detection, Dynamic Multi-Variant Area Pricing & Real-Time Tracking Lifecycle",
              title_color=WHITE, sub_color='#93C5FD', title_size=13, sub_size=9)

    # Top Flow: 4 Main Sequential Steps
    step_w = 0.21
    gap = 0.033
    y_top = 0.49
    h_top = 0.35

    draw_step_box(ax, 0.03, y_top, step_w, h_top, "1", "Geo-Detection", [
        "User opens website / mobile app",
        "HTML5 Geolocation detects Lat/Lng",
        "Backend resolves nearest Store Hub",
        "Identifies Area ID (e.g., Tragad)",
        "Pre-caches session area token"
    ], color=CYAN)

    draw_step_box(ax, 0.03 + (step_w + gap), y_top, step_w, h_top, "2", "Dynamic Pricing", [
        "Queries /products?areaId={id}",
        "Matches MongoDB area_pricing",
        "Tragad Area: Tomato 250g = ₹7",
        "Fallback: If null, uses Base ₹11",
        "Calculates MRP & 53% Discount"
    ], color=PINK)

    draw_step_box(ax, 0.03 + 2*(step_w + gap), y_top, step_w, h_top, "3", "Variant & Cart", [
        "Switches units: 250g / 500g / 1kg / 2kg",
        "Live price re-calculation",
        "Atomic stock limit validation",
        "Redeems earned loyalty coins",
        "Persists cart in LocalStorage & DB"
    ], color=INDIGO)

    draw_step_box(ax, 0.03 + 3*(step_w + gap), y_top, step_w, h_top, "4", "Checkout & Tracking", [
        "Order committed (atomic session)",
        "Inventory decremented in hub",
        "Subscribes to Socket.IO room",
        "Live rider GPS countdown (9 min)",
        "Doorstep 4-digit OTP generated"
    ], color=EMERALD)

    # Connecting Arrows across top flow
    draw_arrow(ax, 0.03 + step_w, 0.66, 0.03 + step_w + gap, 0.66, color=CYAN, label="Area Resolved")
    draw_arrow(ax, 0.03 + 2*step_w + gap, 0.66, 0.03 + 2*step_w + 2*gap, 0.66, color=PINK, label="Catalog Loaded")
    draw_arrow(ax, 0.03 + 3*step_w + 2*gap, 0.66, 0.03 + 3*step_w + 3*gap, 0.66, color=INDIGO, label="Order Placed")

    # Bottom Row: 2 Explanatory Cards
    # Card 1: Area Pricing Fallback Logic
    draw_card(ax, 0.03, 0.05, 0.45, 0.40, bg=WHITE, border=INDIGO,
              title="A. Dynamic Area-Price Decision Architecture",
              subtitle="Algorithm ensures customers always see localized prices with 100% catalog fallback resiliency",
              title_color=INDIGO, sub_color=SLATE, title_size=11, sub_size=8)
    
    # Internal sub-boxes for Card 1
    draw_card(ax, 0.05, 0.07, 0.19, 0.23, bg='#EFF6FF', border='#93C5FD',
              title="Tragad Area (Override Set)",
              subtitle="Area ID: 6aac257b8f33...\n• 250 g: ₹7 (MRP ₹15) [53% Off]\n• 500 g: ₹10 (MRP ₹28) [64% Off]\n• 1 kg: ₹20 (MRP ₹50) [60% Off]\n• 2 kg: ₹40 (MRP ₹95) [58% Off]",
              title_color='#1E40AF', sub_color=NAVY, title_size=9, sub_size=7.5)
    
    draw_card(ax, 0.26, 0.07, 0.20, 0.23, bg='#F1F5F9', border='#CBD5E1',
              title="Unset Area (Default Base)",
              subtitle="Standard Platform Fallback:\n• 250 g: ₹11 (MRP ₹15) [26% Off]\n• 500 g: ₹11 (MRP ₹28) [60% Off]\n• 1 kg: ₹11 (MRP ₹50) [78% Off]\n• 2 kg: ₹11 (MRP ₹95) [88% Off]",
              title_color=NAVY, sub_color=SLATE, title_size=9, sub_size=7.5)

    # Card 2: Technical Specifications & Data Handshake
    draw_card(ax, 0.52, 0.05, 0.45, 0.40, bg=WHITE, border=EMERALD,
              title="B. Technical Stack & State Handshake",
              subtitle="Real-time WebSocket event pipeline & persistence specifications",
              title_color=EMERALD, sub_color=SLATE, title_size=11, sub_size=8)

    tech_notes = [
        "Frontend: React 19, TypeScript, Context API, Lucide Icons, Vite",
        "Backend Endpoint: GET /api/v1/products/:id?areaId={areaId}&storeId={storeId}",
        "Compound Index: { variantId: 1, areaId: 1 } on MongoDB area_pricing",
        "WebSocket Room: order_{orderNumber} receives status: PLACED -> PACKING -> DISPATCHED",
        "Geospatial Security: Validates delivery address within 3.5 km dark store boundary"
    ]
    ax.text(0.54, 0.27, "\n".join([f"✔  {n}" for n in tech_notes]), fontsize=8.5, color=DARK_TEXT, linespacing=1.6)

    plt.tight_layout()
    out1 = 'docs/reporting2/diagrams/module1_customer_flow.png'
    out2 = os.path.join(artifact_dir, 'module1_customer_flow.png')
    plt.savefig(out1, dpi=300, bbox_inches='tight')
    plt.savefig(out2, dpi=300, bbox_inches='tight')
    plt.close()
    print("Module 1 HD diagram saved!")

# ==============================================================================
# 2. MODULE 2: Dark Store Operations & Fulfillment State Machine
# ==============================================================================
def generate_module2_hd():
    fig, ax = plt.subplots(figsize=(12, 7.5), dpi=300)
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis('off')
    fig.patch.set_facecolor(LIGHT_GRAY)

    draw_card(ax, 0.03, 0.88, 0.94, 0.09, bg=NAVY, border=NAVY, title="MODULE 2: DARK STORE PICK, PACK & STOCK STATE MACHINE",
              subtitle="Sub-3-Minute Order Fulfillment Pipeline with Physical Shelf Bin Routing & Real-Time Shift Control",
              title_color=WHITE, sub_color='#FDE68A', title_size=13, sub_size=9)

    step_w = 0.21
    gap = 0.033
    y_top = 0.49
    h_top = 0.35

    draw_step_box(ax, 0.03, y_top, step_w, h_top, "1", "Auto Allocation", [
        "Customer order committed",
        "Geofence match to Store Hub",
        "Audio chime sounds at terminal",
        "State: PLACED",
        "Target Time: < 30 seconds"
    ], color=CYAN)

    draw_step_box(ax, 0.03 + (step_w + gap), y_top, step_w, h_top, "2", "Digital Pick-List", [
        "Pick list generated on app",
        "Sorted by Shelf Bin Tag (A1-R1)",
        "Optimal physical aisle routing",
        "Item count & quality check",
        "Target Time: < 90 seconds"
    ], color=AMBER)

    draw_step_box(ax, 0.03 + 2*(step_w + gap), y_top, step_w, h_top, "3", "Packing Station", [
        "Packer scans item barcodes",
        "Weight verification sensor",
        "Packed in tamper-evident eco-bag",
        "Bag QR token attached & sealed",
        "Target Time: < 60 seconds"
    ], color=PINK)

    draw_step_box(ax, 0.03 + 3*(step_w + gap), y_top, step_w, h_top, "4", "Rider Handover", [
        "Rider arrives at pickup bay",
        "Scans order bag QR token",
        "Digital custody transfer verified",
        "State: DISPATCHED",
        "Order departs for delivery"
    ], color=EMERALD)

    draw_arrow(ax, 0.03 + step_w, 0.66, 0.03 + step_w + gap, 0.66, color=CYAN, label="<30s")
    draw_arrow(ax, 0.03 + 2*step_w + gap, 0.66, 0.03 + 2*step_w + 2*gap, 0.66, color=AMBER, label="<90s")
    draw_arrow(ax, 0.03 + 3*step_w + 2*gap, 0.66, 0.03 + 3*step_w + 3*gap, 0.66, color=PINK, label="<60s")

    # Bottom Row: 2 Informative Panels
    draw_card(ax, 0.03, 0.05, 0.45, 0.40, bg=WHITE, border=AMBER,
              title="A. Shelf Location Bin Architecture (e.g. A1-R1)",
              subtitle="Structured warehouse bin numbering eliminates search delays and ensures sub-3 min SLA",
              title_color='#B45309', sub_color=SLATE, title_size=11, sub_size=8)

    bin_data = [
        "Zone Prefix (A / B / C): Represents temperature zone (A = Ambient, C = Cold)",
        "Aisle Number (1 - 8): Physical corridor where the storage rack is positioned",
        "Rack Level (R1 - R5): Vertical shelf level (R1 = Waist height for fast pick)",
        "Barcode Scanning: Handheld scanner confirms item SKU matches pick-list",
        "Zero-Error Guarantee: Prevents wrong variant dispatch (e.g., 500g vs 1kg)"
    ]
    ax.text(0.05, 0.27, "\n".join([f"📌  {b}" for b in bin_data]), fontsize=8.5, color=DARK_TEXT, linespacing=1.6)

    draw_card(ax, 0.52, 0.05, 0.45, 0.40, bg=WHITE, border=NAVY,
              title="B. Store Shift & Atomic Inventory Control",
              subtitle="Real-time multi-hub stock decrement & emergency rerouting logic",
              title_color=NAVY, sub_color=SLATE, title_size=11, sub_size=8)

    shift_data = [
        "On Duty / Off Duty Toggle: Store managers toggle shift state with one click",
        "Off-Shift Rerouting: If a dark store closes, orders cascade to nearest active hub",
        "Atomic Stock Decrement: $inc: { stock: -qty } inside MongoDB session transactions",
        "Negative Stock Prevention: Validates stock >= qty before order authorization",
        "Real-Time App Sync: Disables out-of-stock items on customer app via WebSockets"
    ]
    ax.text(0.54, 0.27, "\n".join([f"⚡  {s}" for s in shift_data]), fontsize=8.5, color=DARK_TEXT, linespacing=1.6)

    plt.tight_layout()
    out1 = 'docs/reporting2/diagrams/module2_darkstore_flow.png'
    out2 = os.path.join(artifact_dir, 'module2_darkstore_flow.png')
    plt.savefig(out1, dpi=300, bbox_inches='tight')
    plt.savefig(out2, dpi=300, bbox_inches='tight')
    plt.close()
    print("Module 2 HD diagram saved!")

# ==============================================================================
# 3. MODULE 3: Delivery Partner & Express Fleet Telemetry
# ==============================================================================
def generate_module3_hd():
    fig, ax = plt.subplots(figsize=(12, 7.5), dpi=300)
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis('off')
    fig.patch.set_facecolor(LIGHT_GRAY)

    draw_card(ax, 0.03, 0.88, 0.94, 0.09, bg=NAVY, border=NAVY, title="MODULE 3: DELIVERY PARTNER & EXPRESS FLEET TELEMETRY",
              subtitle="Automated Proximity Dispatch, 5-Second GPS Telemetry, Dynamic Payouts & Proof of Delivery",
              title_color=WHITE, sub_color='#A7F3D0', title_size=13, sub_size=9)

    step_w = 0.21
    gap = 0.033
    y_top = 0.49
    h_top = 0.35

    draw_step_box(ax, 0.03, y_top, step_w, h_top, "1", "Proximity Dispatch", [
        "Haversine distance filter (<1.5 km)",
        "Queries idle online riders",
        "Dispatches ping to rider app",
        "45-second acceptance window",
        "Auto-cascades if unanswered"
    ], color=CYAN)

    draw_step_box(ax, 0.03 + (step_w + gap), y_top, step_w, h_top, "2", "Pickup & Route", [
        "Rider navigates to Dark Store Hub",
        "Arrives at designated bay",
        "Scans order bag QR token",
        "Verifies bag seal integrity",
        "State: DISPATCHED, timer started"
    ], color=INDIGO)

    draw_step_box(ax, 0.03 + 2*(step_w + gap), y_top, step_w, h_top, "3", "GPS Telemetry", [
        "Continuous GPS pinging (5s)",
        "Transmits lat/lng over Socket.IO",
        "Live marker moves on user map",
        "Dynamic ETA recalculation",
        "Safe route navigation"
    ], color=PINK)

    draw_step_box(ax, 0.03 + 3*(step_w + gap), y_top, step_w, h_top, "4", "Doorstep POD", [
        "Rider arrives at doorstep",
        "Customer shares 4-digit OTP",
        "OTP verified on backend",
        "State: DELIVERED",
        "Payout credited to rider wallet"
    ], color=EMERALD)

    draw_arrow(ax, 0.03 + step_w, 0.66, 0.03 + step_w + gap, 0.66, color=CYAN, label="Accepted")
    draw_arrow(ax, 0.03 + 2*step_w + gap, 0.66, 0.03 + 2*step_w + 2*gap, 0.66, color=INDIGO, label="En Route")
    draw_arrow(ax, 0.03 + 3*step_w + 2*gap, 0.66, 0.03 + 3*step_w + 3*gap, 0.66, color=PINK, label="Doorstep")

    # Bottom Row: 2 Informative Panels
    draw_card(ax, 0.03, 0.05, 0.45, 0.40, bg=WHITE, border=INDIGO,
              title="A. Dynamic Payout Calculation Formula & Tariff Matrix",
              subtitle="Multi-slab compensation guarantees fair driver earnings while optimizing logistics cost",
              title_color=INDIGO, sub_color=SLATE, title_size=11, sub_size=8)

    formula_text = [
        "Base Pay: Fixed ₹35 per successful pickup from dark store",
        "Distance Pay: ₹12 per km calculated from dark store to doorstep",
        "Surge Multiplier: 1.0x to 1.5x applied during peak hours or heavy rain",
        "Mathematical Model: Payout = (₹35 + Dist_km × ₹12) × Surge",
        "Sample (2.4 km in Tragad with 1.2x surge): (₹35 + 2.4×₹12) × 1.2 = ₹76.56"
    ]
    ax.text(0.05, 0.27, "\n".join([f"💰  {f}" for f in formula_text]), fontsize=8.5, color=DARK_TEXT, linespacing=1.6)

    draw_card(ax, 0.52, 0.05, 0.45, 0.40, bg=WHITE, border=EMERALD,
              title="B. Fleet Safety & Real-Time Tracking Telemetry",
              subtitle="Socket.IO room architecture & proof-of-delivery security protocols",
              title_color=EMERALD, sub_color=SLATE, title_size=11, sub_size=8)

    telemetry_notes = [
        "Socket Room: order_{orderNumber} isolates location broadcasts per order",
        "Battery Optimization: Background location pauses when rider is off duty",
        "Tamper-Proof POD: 4-digit OTP generated securely; expires in 15 minutes",
        "Direct Cashless Settlement: Tips and earnings instantly added to rider wallet",
        "Admin Fleet Overview: Super admin monitors all riders live on Admin Portal"
    ]
    ax.text(0.54, 0.27, "\n".join([f"🛰️  {t}" for t in telemetry_notes]), fontsize=8.5, color=DARK_TEXT, linespacing=1.6)

    plt.tight_layout()
    out1 = 'docs/reporting2/diagrams/module3_rider_fleet_flow.png'
    out2 = os.path.join(artifact_dir, 'module3_rider_fleet_flow.png')
    plt.savefig(out1, dpi=300, bbox_inches='tight')
    plt.savefig(out2, dpi=300, bbox_inches='tight')
    plt.close()
    print("Module 3 HD diagram saved!")

# ==============================================================================
# 4. MODULE 4: Cloud Printing & Document Fulfillment Pipeline
# ==============================================================================
def generate_module4_hd():
    fig, ax = plt.subplots(figsize=(12, 7.5), dpi=300)
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis('off')
    fig.patch.set_facecolor(LIGHT_GRAY)

    draw_card(ax, 0.03, 0.88, 0.94, 0.09, bg=NAVY, border=NAVY, title="MODULE 4: CLOUD PRINTING & ON-DEMAND DOCUMENT PIPELINE",
              subtitle="Zero-Wait Multi-Page Document Upload, Automatic Page Detection, Laser Spooling & 15-Minute Delivery",
              title_color=WHITE, sub_color='#E9D5FF', title_size=13, sub_size=9)

    step_w = 0.21
    gap = 0.033
    y_top = 0.49
    h_top = 0.35

    draw_step_box(ax, 0.03, y_top, step_w, h_top, "1", "Secure Upload", [
        "PDF, DOCX, JPG multi-format upload",
        "Staged on Cloudinary secure CDN",
        "Server analyzes page count",
        "Temporary encrypted file URL",
        "File format integrity validation"
    ], color=CYAN)

    draw_step_box(ax, 0.03 + (step_w + gap), y_top, step_w, h_top, "2", "Print Config", [
        "Color: B&W (₹2) vs Color (₹10)",
        "Sides: Single vs Back-to-Back duplex",
        "Paper: 75 GSM vs 100 GSM Bond",
        "Finishing: Staple vs Spiral (₹35)",
        "Live cost estimation & preview"
    ], color=PINK)

    draw_step_box(ax, 0.03 + 2*(step_w + gap), y_top, step_w, h_top, "3", "Laser Spooling", [
        "Print job auto-spools to Hub",
        "Commercial laser printer executes",
        "Document compiled & bound",
        "Packed in privacy-sealed envelope",
        "State: PACKED (< 5 mins)"
    ], color=AMBER)

    draw_step_box(ax, 0.03 + 3*(step_w + gap), y_top, step_w, h_top, "4", "Fast Delivery", [
        "Express rider collects sealed packet",
        "Dispatched immediately to user",
        "Delivered in under 15 minutes",
        "Customer confirms receipt",
        "Cloud file auto-purged (24h)"
    ], color=EMERALD)

    draw_arrow(ax, 0.03 + step_w, 0.66, 0.03 + step_w + gap, 0.66, color=CYAN, label="Analyzed")
    draw_arrow(ax, 0.03 + 2*step_w + gap, 0.66, 0.03 + 2*step_w + 2*gap, 0.66, color=PINK, label="Spool Job")
    draw_arrow(ax, 0.03 + 3*step_w + 2*gap, 0.66, 0.03 + 3*step_w + 3*gap, 0.66, color=AMBER, label="Dispatched")

    # Bottom Row: 2 Informative Panels
    draw_card(ax, 0.03, 0.05, 0.45, 0.40, bg=WHITE, border='#7C3AED',
              title="A. Privacy & Data Protection Architecture",
              subtitle="Ensures strictly confidential handling of user legal, educational, and personal documents",
              title_color='#6D28D9', sub_color=SLATE, title_size=11, sub_size=8)

    privacy_notes = [
        "End-to-End Encryption: Files transferred over TLS 1.3 with AES-256 staging",
        "Automated Cloud Shredder: Cloudinary assets automatically deleted after 24 hours",
        "Sealed Physical Packaging: Documents sealed in opaque envelopes inside hub",
        "No Local Operator Storage: Laser printer memory purged after job completion",
        "Strict DPDP Compliance: Complies with Digital Personal Data Protection Act"
    ]
    ax.text(0.05, 0.27, "\n".join([f"🔒  {p}" for p in privacy_notes]), fontsize=8.5, color=DARK_TEXT, linespacing=1.6)

    draw_card(ax, 0.52, 0.05, 0.45, 0.40, bg=WHITE, border=NAVY,
              title="B. Algorithmic Print Cost Calculation Model",
              subtitle="Mathematical pricing engine supporting dynamic page counts and binding options",
              title_color=NAVY, sub_color=SLATE, title_size=11, sub_size=8)

    cost_notes = [
        "Base Page Rates: Monochrome = ₹2.00 / page, Color = ₹10.00 / page",
        "Duplex Discount: Double-sided printing applies 20% discount on page charges",
        "Finishing Tariffs: None = ₹0, Corner Staple = ₹5, Spiral Binding = ₹35",
        "Paper Quality: 75 GSM Standard (+₹0) vs 100 GSM Executive (+₹1.50/page)",
        "Formula: Total = (Pages × Rate × DuplexFactor) + BindingFee + DeliveryFee"
    ]
    ax.text(0.54, 0.27, "\n".join([f"🧮  {c}" for c in cost_notes]), fontsize=8.5, color=DARK_TEXT, linespacing=1.6)

    plt.tight_layout()
    out1 = 'docs/reporting2/diagrams/module4_cloud_printing_flow.png'
    out2 = os.path.join(artifact_dir, 'module4_cloud_printing_flow.png')
    plt.savefig(out1, dpi=300, bbox_inches='tight')
    plt.savefig(out2, dpi=300, bbox_inches='tight')
    plt.close()
    print("Module 4 HD diagram saved!")

# ==============================================================================
# 5. MODULE 5: Central Admin Portal & Pricing Override Engine
# ==============================================================================
def generate_module5_hd():
    fig, ax = plt.subplots(figsize=(12, 7.5), dpi=300)
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis('off')
    fig.patch.set_facecolor(LIGHT_GRAY)

    draw_card(ax, 0.03, 0.88, 0.94, 0.09, bg=NAVY, border=NAVY, title="MODULE 5: CENTRAL ADMIN PORTAL & DYNAMIC PRICING ENGINE",
              subtitle="Super Admin Fleet Management, Real-Time Customer/Rider Control & Area-Specific Pricing Overrides",
              title_color=WHITE, sub_color='#FBCFE8', title_size=13, sub_size=9)

    step_w = 0.21
    gap = 0.033
    y_top = 0.49
    h_top = 0.35

    draw_step_box(ax, 0.03, y_top, step_w, h_top, "1", "Admin Portal Action", [
        "Admin navigates to Area Pricing Hub",
        "Selects Product (e.g. Tomato)",
        "Selects Variant (e.g. 250 g)",
        "Selects Target Area (e.g. Tragad)",
        "Sets Override Price: ₹7 (MRP ₹15)"
    ], color=CYAN)

    draw_step_box(ax, 0.03 + (step_w + gap), y_top, step_w, h_top, "2", "MongoDB Indexing", [
        "Writes to area_pricing collection",
        "Compound Index: { variantId, areaId }",
        "Sub-2ms indexed query lookup",
        "Atomically updates or upserts",
        "Zero code change / zero downtime"
    ], color=INDIGO)

    draw_step_box(ax, 0.03 + 2*(step_w + gap), y_top, step_w, h_top, "3", "Pricing Decision", [
        "Customer requests variant price",
        "Decision Tree evaluates target area",
        "IF area record found -> uses Area Price",
        "ELSE -> falls back to Catalog Base",
        "Ensures 100% price availability"
    ], color=PINK)

    draw_step_box(ax, 0.03 + 3*(step_w + gap), y_top, step_w, h_top, "4", "Customer View", [
        "Tragad Customer: Tomato 250g @ ₹7",
        "Thaltej Customer: Tomato 250g @ ₹12",
        "Default Customer: Tomato 250g @ ₹11",
        "Reflects live across product card,",
        "quick view modal & checkout"
    ], color=EMERALD)

    draw_arrow(ax, 0.03 + step_w, 0.66, 0.03 + step_w + gap, 0.66, color=CYAN, label="Upsert DB")
    draw_arrow(ax, 0.03 + 2*step_w + gap, 0.66, 0.03 + 2*step_w + 2*gap, 0.66, color=INDIGO, label="Query Index")
    draw_arrow(ax, 0.03 + 3*step_w + 2*gap, 0.66, 0.03 + 3*step_w + 3*gap, 0.66, color=PINK, label="Render UI")

    # Bottom Row: 2 Informative Panels
    draw_card(ax, 0.03, 0.05, 0.45, 0.40, bg=WHITE, border=PINK,
              title="A. Mathematical Decision Engine: Area vs Default Price",
              subtitle="Hierarchical fallback logic guarantees continuous purchasing without pricing deadlocks",
              title_color='#BE185D', sub_color=SLATE, title_size=11, sub_size=8)

    math_text = [
        "Rule 1: If Area Price exists for Customer's GPS Area -> Display Area Price",
        "Rule 2: If No Area Price is set -> Fall back to Master Catalog Default Price",
        "Formula: P_display = (Record_area != null) ? P_area : P_default",
        "Discount Calculation: Discount% = ((MRP - P_display) / MRP) × 100",
        "Example (Tomato 250g): Tragad = ₹7 (53% Off) | Default = ₹11 (26% Off)"
    ]
    ax.text(0.05, 0.27, "\n".join([f"📈  {m}" for m in math_text]), fontsize=8.5, color=DARK_TEXT, linespacing=1.6)

    draw_card(ax, 0.52, 0.05, 0.45, 0.40, bg=WHITE, border=NAVY,
              title="B. Fleet & Customer Profile Management Hub",
              subtitle="Integrated operational management controls built directly into Admin Console",
              title_color=NAVY, sub_color=SLATE, title_size=11, sub_size=8)

    admin_features = [
        "Customer Profile Editor: Edit Name, Phone, Email, Address, and Block/Unblock",
        "Rider Fleet Controller: Edit Vehicle Type/No, Hub, City, Shift Duty, and Approval",
        "Dark Store Supervisor: Monitor live queues and shift states across all 15 hubs",
        "Loyalty Coins Manager: Credit and debit customer shopping coins with audit notes",
        "Live Telemetry Map: Real-time GPS coordinate mapping of all on-duty delivery riders"
    ]
    ax.text(0.54, 0.27, "\n".join([f"🛠️  {a}" for a in admin_features]), fontsize=8.5, color=DARK_TEXT, linespacing=1.6)

    plt.tight_layout()
    out1 = 'docs/reporting2/diagrams/module5_admin_pricing_engine.png'
    out2 = os.path.join(artifact_dir, 'module5_admin_pricing_engine.png')
    plt.savefig(out1, dpi=300, bbox_inches='tight')
    plt.savefig(out2, dpi=300, bbox_inches='tight')
    plt.close()
    print("Module 5 HD diagram saved!")

# ==============================================================================
# 6. SYSTEM ARCHITECTURE & ER DIAGRAM (HD REFRESH)
# ==============================================================================
def generate_system_arch_hd():
    fig, ax = plt.subplots(figsize=(12, 7.5), dpi=300)
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis('off')
    fig.patch.set_facecolor(LIGHT_GRAY)

    draw_card(ax, 0.03, 0.90, 0.94, 0.08, bg=NAVY, border=NAVY, title="WORMUP: MULTI-TIER SYSTEM ARCHITECTURE",
              subtitle="Distributed Micro-Modular Architecture with Low-Latency WebSockets & Geospatial Database",
              title_color=WHITE, sub_color='#93C5FD', title_size=13, sub_size=9)

    # Layer 1
    draw_card(ax, 0.03, 0.67, 0.94, 0.20, bg='#EFF6FF', border='#93C5FD', title="TIER 1: PRESENTATION LAYER (CLIENT APPLICATIONS)", title_color='#1E40AF', title_size=10.5)
    draw_card(ax, 0.05, 0.69, 0.21, 0.14, bg=WHITE, border='#BFDBFE', title="Customer Web / PWA", subtitle="React 19 • TypeScript\nVite • Geolocation API\nMulti-Variant Switcher", title_size=9.5, sub_size=7.5)
    draw_card(ax, 0.28, 0.69, 0.21, 0.14, bg=WHITE, border='#BFDBFE', title="Dark Store App", subtitle="React Native • Expo\nDigital Pick-Lists\nBarcode Shelf Bin Tags", title_size=9.5, sub_size=7.5)
    draw_card(ax, 0.51, 0.69, 0.21, 0.14, bg=WHITE, border='#BFDBFE', title="Delivery Partner App", subtitle="React Native • Expo\n5s GPS Telemetry\nDoorstep OTP Verification", title_size=9.5, sub_size=7.5)
    draw_card(ax, 0.74, 0.69, 0.21, 0.14, bg=WHITE, border='#BFDBFE', title="Admin Control Portal", subtitle="React 19 • Dashboard\nArea Pricing Engine\nCustomer & Rider Editor", title_size=9.5, sub_size=7.5)

    # Layer 2
    draw_card(ax, 0.03, 0.38, 0.94, 0.22, bg='#FAF5FF', border='#D8B4FE', title="TIER 2: APPLICATION GATEWAY & REAL-TIME EVENT BUS", title_color='#6B21A8', title_size=10.5)
    draw_card(ax, 0.05, 0.40, 0.28, 0.16, bg=WHITE, border='#E9D5FF', title="NestJS / Express REST Gateway", subtitle="Stateless JWT Auth Guards\nRole-Based Access Control (RBAC)\nDTO Validation & Rate Limiter", title_size=9.5, sub_size=7.5)
    draw_card(ax, 0.36, 0.40, 0.28, 0.16, bg=WHITE, border='#E9D5FF', title="Socket.IO Real-Time Gateway", subtitle="Order Lifecycle Channels\nLive Rider GPS Telemetry Rooms\nInstant Store Dispatch Broadcasts", title_size=9.5, sub_size=7.5)
    draw_card(ax, 0.67, 0.40, 0.28, 0.16, bg=WHITE, border='#E9D5FF', title="Core Logic Micro-Engines", subtitle="Dynamic Area Pricing Engine\nProximity Dispatch Calculator\nCloud Printing Cost Estimator", title_size=9.5, sub_size=7.5)

    # Layer 3
    draw_card(ax, 0.03, 0.08, 0.94, 0.23, bg='#F0FDF4', border='#86EFAC', title="TIER 3: PERSISTENCE & CLOUD SERVICES LAYER", title_color='#166534', title_size=10.5)
    draw_card(ax, 0.05, 0.10, 0.44, 0.17, bg=WHITE, border='#BBF7D0', title="MongoDB Atlas Cluster (v7.0)", subtitle="Mongoose ODM • 2dsphere Geospatial Indexing\nCollections: users, stores, products, product_variants,\narea_pricing, orders, print_orders, delivery_partners", title_size=9.5, sub_size=7.5)
    draw_card(ax, 0.52, 0.10, 0.22, 0.17, bg=WHITE, border='#BBF7D0', title="Cloudinary CDN", subtitle="Encrypted Documents\nCatalog Media CDN\nAuto-shredded after 24h", title_size=9.5, sub_size=7.5)
    draw_card(ax, 0.76, 0.10, 0.19, 0.17, bg=WHITE, border='#BBF7D0', title="Third-Party APIs", subtitle="SMS OTP Gateways\nMaps Distance API\nPayment Webhooks", title_size=9.5, sub_size=7.5)

    # Vertical Inter-layer flow
    draw_arrow(ax, 0.15, 0.69, 0.15, 0.56, color=INDIGO, label="HTTP / REST")
    draw_arrow(ax, 0.38, 0.69, 0.38, 0.56, color=INDIGO, label="Socket.IO")
    draw_arrow(ax, 0.61, 0.69, 0.50, 0.56, color=INDIGO, label="GPS Telemetry")
    draw_arrow(ax, 0.84, 0.69, 0.80, 0.56, color=INDIGO, label="Admin APIs")

    draw_arrow(ax, 0.19, 0.40, 0.19, 0.27, color=EMERALD, label="CRUD / Mongoose")
    draw_arrow(ax, 0.81, 0.40, 0.63, 0.27, color=EMERALD, label="PDF Upload")

    plt.tight_layout()
    out1 = 'docs/reporting2/diagrams/system_architecture.png'
    out2 = os.path.join(artifact_dir, 'system_architecture.png')
    plt.savefig(out1, dpi=300, bbox_inches='tight')
    plt.savefig(out2, dpi=300, bbox_inches='tight')
    plt.close()
    print("System Architecture HD diagram saved!")

# ==============================================================================
# 7. ER DIAGRAM (HD REFRESH)
# ==============================================================================
def generate_er_diagram_hd():
    fig, ax = plt.subplots(figsize=(12, 7.5), dpi=300)
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis('off')
    fig.patch.set_facecolor(LIGHT_GRAY)

    draw_card(ax, 0.03, 0.90, 0.94, 0.08, bg=NAVY, border=NAVY, title="WORMUP: ENTITY RELATIONSHIP (ER) MODEL",
              subtitle="Relational Schema Mapping across 9 Normalized MongoDB Atlas Collections with Primary/Foreign Keys",
              title_color=WHITE, sub_color='#CBD5E1', title_size=13, sub_size=9)

    # Row 1: Users, Orders, Stores, Riders
    draw_card(ax, 0.03, 0.62, 0.20, 0.24, bg='#FEF2F2', border='#FCA5A5', title="USERS",
              subtitle="PK: _id (ObjectId)\n• name (String)\n• phone (String, Unique)\n• email (String)\n• role (Enum)\n• walletBalance (Number)\n• shoppingCoins (Number)",
              title_color='#991B1B', sub_color=NAVY, title_size=10, sub_size=7.5)

    draw_card(ax, 0.27, 0.62, 0.21, 0.24, bg='#EFF6FF', border='#93C5FD', title="ORDERS",
              subtitle="PK: _id (ObjectId)\nFK: userId -> users\nFK: storeId -> stores\nFK: riderId -> riders\n• orderNumber (Unique)\n• totalAmount (Number)\n• status (Enum)",
              title_color='#1E40AF', sub_color=NAVY, title_size=10, sub_size=7.5)

    draw_card(ax, 0.52, 0.62, 0.21, 0.24, bg='#FDF4FF', border='#F0ABFC', title="STORES (Hubs)",
              subtitle="PK: _id (ObjectId)\n• code (String, Unique)\n• name (String)\n• geoCoordinates (Point)\n• cityName (String)\n• areaName (String)\n• isOnShift (Boolean)",
              title_color='#86198F', sub_color=NAVY, title_size=10, sub_size=7.5)

    draw_card(ax, 0.77, 0.62, 0.20, 0.24, bg='#F0FDF4', border='#86EFAC', title="RIDERS",
              subtitle="PK: _id (ObjectId)\nFK: userId -> users\nFK: hubId -> stores\n• partnerCode (Unique)\n• vehicleType (Enum)\n• isOnline (Boolean)\n• rating (Number)",
              title_color='#166534', sub_color=NAVY, title_size=10, sub_size=7.5)

    # Row 2: Addresses, Products, Variants, Area Pricing
    draw_card(ax, 0.03, 0.32, 0.20, 0.24, bg='#FFFBEB', border='#FDE68A', title="ADDRESSES",
              subtitle="PK: _id (ObjectId)\nFK: userId -> users\n• label (String)\n• street (String)\n• cityName (String)\n• areaName (String)\n• pincode (String)",
              title_color='#92400E', sub_color=NAVY, title_size=10, sub_size=7.5)

    draw_card(ax, 0.27, 0.32, 0.21, 0.24, bg='#FAF5FF', border='#D8B4FE', title="PRODUCTS",
              subtitle="PK: _id (ObjectId)\n• name (String)\n• slug (String, Unique)\nFK: categoryId -> cat\n• basePrice (Number)\n• mrp (Number)\n• shelfLocation (String)",
              title_color='#6B21A8', sub_color=NAVY, title_size=10, sub_size=7.5)

    draw_card(ax, 0.52, 0.32, 0.21, 0.24, bg='#F0FDFA', border='#5EEAD4', title="VARIANTS",
              subtitle="PK: _id (ObjectId)\nFK: productId -> prod\n• label (250g, 1kg)\n• price (Number)\n• mrp (Number)\n• stock (Number)\n• barcode (String)",
              title_color='#115E59', sub_color=NAVY, title_size=10, sub_size=7.5)

    draw_card(ax, 0.77, 0.32, 0.20, 0.24, bg='#FFF0F7', border='#FBCFE8', title="AREA_PRICING",
              subtitle="PK: _id (ObjectId)\nCompound: {variantId, areaId}\nFK: variantId -> var\nFK: areaId -> area\n• price (Override ₹7)\n• mrp (Override ₹15)",
              title_color='#9D174D', sub_color=NAVY, title_size=10, sub_size=7.5)

    # Row 3: Print Orders, Payout Rates
    draw_card(ax, 0.27, 0.04, 0.21, 0.22, bg='#EFF6FF', border='#93C5FD', title="PRINT_ORDERS",
              subtitle="PK: _id (ObjectId)\nFK: userId -> users\nFK: storeId -> stores\n• fileUrl (String)\n• pageCount (Number)\n• colorType (B&W/Color)\n• totalAmount (Number)",
              title_color='#1E40AF', sub_color=NAVY, title_size=10, sub_size=7.5)

    draw_card(ax, 0.52, 0.04, 0.21, 0.22, bg='#FFF7ED', border='#FED7AA', title="PAYOUT_RATES",
              subtitle="PK: _id (ObjectId)\n• scope (Global/City/Area)\n• basePay (₹35)\n• perKmRate (₹12)\n• surgeMultiplier (1.2x)\n• isActive (Boolean)",
              title_color='#9A3412', sub_color=NAVY, title_size=10, sub_size=7.5)

    # Cardinality relationship arrows
    draw_arrow(ax, 0.13, 0.62, 0.13, 0.56, color=SLATE, label="1 : N")
    draw_arrow(ax, 0.23, 0.74, 0.27, 0.74, color=SLATE, label="1 : N")
    draw_arrow(ax, 0.48, 0.74, 0.52, 0.74, color=SLATE, label="N : 1")
    draw_arrow(ax, 0.73, 0.74, 0.77, 0.74, color=SLATE, label="N : 1")

    draw_arrow(ax, 0.48, 0.44, 0.52, 0.44, color=SLATE, label="1 : N")
    draw_arrow(ax, 0.73, 0.44, 0.77, 0.44, color=SLATE, label="1 : N")

    draw_arrow(ax, 0.23, 0.65, 0.29, 0.26, color=SLATE, label="1 : N")
    draw_arrow(ax, 0.87, 0.62, 0.73, 0.26, color=SLATE, label="N : 1")

    plt.tight_layout()
    out1 = 'docs/reporting2/diagrams/er_diagram.png'
    out2 = os.path.join(artifact_dir, 'er_diagram.png')
    plt.savefig(out1, dpi=300, bbox_inches='tight')
    plt.savefig(out2, dpi=300, bbox_inches='tight')
    plt.close()
    print("ER Diagram HD saved!")

if __name__ == '__main__':
    print("Generating ultra-detailed HD diagrams...")
    generate_module1_hd()
    generate_module2_hd()
    generate_module3_hd()
    generate_module4_hd()
    generate_module5_hd()
    generate_system_arch_hd()
    generate_er_diagram_hd()
    print("All HD Diagrams generated successfully at 300 DPI!")
