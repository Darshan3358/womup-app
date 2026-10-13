import os
import matplotlib.pyplot as plt
import matplotlib.patches as patches

# Ensure output directory exists
output_dir = 'docs/reporting2/diagrams'
os.makedirs(output_dir, exist_ok=True)

# Color Palette (Crisp, High-Contrast, Academic & Presentation-Grade)
NAVY = '#0F2942'
DEEP_BLUE = '#1E3A8A'
LIGHT_BLUE = '#EFF6FF'
BORDER_BLUE = '#93C5FD'
ACCENT_BLUE = '#2563EB'

EMERALD = '#065F46'
LIGHT_GREEN = '#ECFDF5'
BORDER_GREEN = '#A7F3D0'
ACCENT_GREEN = '#10B981'

AMBER = '#92400E'
LIGHT_AMBER = '#FFFBEB'
BORDER_AMBER = '#FDE68A'
ACCENT_AMBER = '#F59E0B'

PURPLE = '#5B21B6'
LIGHT_PURPLE = '#F5F3FF'
BORDER_PURPLE = '#DDD6FE'
ACCENT_PURPLE = '#8B5CF6'

RED = '#991B1B'
LIGHT_RED = '#FEF2F2'
BORDER_RED = '#FECACA'
ACCENT_RED = '#EF4444'

CYAN = '#0E7490'
LIGHT_CYAN = '#ECFEFF'
BORDER_CYAN = '#A5F3FC'
ACCENT_CYAN = '#06B6D4'

WHITE = '#FFFFFF'
SLATE_BG = '#F8FAFC'
BORDER_GRAY = '#CBD5E1'
DARK_TEXT = '#1E293B'
GRAY_TEXT = '#64748B'


# ==============================================================================
# 1. USE CASE DIAGRAM
# ==============================================================================
def generate_use_case_diagram():
    fig, ax = plt.subplots(figsize=(15, 10), dpi=300)
    ax.set_xlim(0, 15)
    ax.set_ylim(0, 10)
    ax.axis('off')

    fig.patch.set_facecolor(SLATE_BG)
    ax.set_facecolor(SLATE_BG)

    # Title
    ax.text(7.5, 9.6, "USE CASE DIAGRAM — WomUp E-Commerce Platform",
            ha='center', va='center', fontsize=18, fontweight='bold', color=NAVY)
    ax.text(7.5, 9.25, "System Boundary, Operational Actors & Core Functional Use Cases",
            ha='center', va='center', fontsize=11, color=GRAY_TEXT)

    # System Boundary Box
    system_box = patches.FancyBboxPatch((2.7, 0.4), 9.6, 8.4, boxstyle="round,pad=0.2",
                                        facecolor=WHITE, edgecolor='#3B82F6', linewidth=2, linestyle='--')
    ax.add_patch(system_box)
    ax.text(7.5, 8.5, "System Boundary: WomUp Unified E-Commerce & Logistics Platform",
            ha='center', va='center', fontsize=12, fontweight='bold', color=DEEP_BLUE)

    # Draw Actor
    def draw_actor(x, y, name, color=NAVY):
        circle = patches.Circle((x, y + 0.35), 0.22, facecolor=WHITE, edgecolor=color, linewidth=2.2)
        ax.add_patch(circle)
        ax.plot([x, x], [y + 0.13, y - 0.3], color=color, linewidth=2.2)
        ax.plot([x - 0.25, x + 0.25], [y, y], color=color, linewidth=2.2)
        ax.plot([x, x - 0.2], [y - 0.3, y - 0.65], color=color, linewidth=2.2)
        ax.plot([x, x + 0.2], [y - 0.3, y - 0.65], color=color, linewidth=2.2)
        ax.text(x, y - 0.9, name, ha='center', va='top', fontsize=10.5, fontweight='bold', color=color)

    # Draw Use Case Oval
    def draw_use_case(x, y, w, h, text, bg_color=LIGHT_BLUE, border_color=BORDER_BLUE):
        oval = patches.Ellipse((x, y), w, h, facecolor=bg_color, edgecolor=border_color, linewidth=1.8)
        ax.add_patch(oval)
        ax.text(x, y, text, ha='center', va='center', fontsize=9.2, fontweight='bold', color=NAVY, multialignment='center')

    # Actors
    draw_actor(1.2, 6.8, "Customer\n(Buyer)", color=ACCENT_BLUE)
    draw_actor(1.2, 2.5, "Dark Store\nStaff (Packer)", color=ACCENT_AMBER)
    draw_actor(13.8, 6.8, "Delivery\nPartner (Rider)", color=ACCENT_GREEN)
    draw_actor(13.8, 2.5, "System\nAdmin", color=ACCENT_PURPLE)

    # Customer Use Cases (Upper Left)
    cust_cases = [
        (4.5, 7.7, 3.0, 0.75, "Select Area &\nAuto-Detect Location"),
        (4.5, 6.7, 3.0, 0.75, "Browse Products &\nWeight Variants"),
        (4.5, 5.7, 3.0, 0.75, "Add to Cart &\nPlace Order"),
        (4.5, 4.7, 3.0, 0.75, "Upload PDF &\nCloud Print Order"),
    ]
    for x, y, w, h, t in cust_cases:
        draw_use_case(x, y, w, h, t, bg_color=LIGHT_BLUE, border_color='#60A5FA')
        ax.plot([1.5, x - w/2], [6.8, y], color='#94A3B8', linewidth=1.3)

    # Dark Store Staff Use Cases (Lower Left)
    store_cases = [
        (4.5, 3.3, 3.0, 0.75, "Receive Order &\nOrder Alert Notification"),
        (4.5, 2.3, 3.0, 0.75, "View Pick-List by\nShelf Bin (A1-R1)"),
        (4.5, 1.3, 3.0, 0.75, "Scan Item Barcode &\nSeal Bag with QR Token"),
    ]
    for x, y, w, h, t in store_cases:
        draw_use_case(x, y, w, h, t, bg_color=LIGHT_AMBER, border_color='#FBBF24')
        ax.plot([1.5, x - w/2], [2.5, y], color='#94A3B8', linewidth=1.3)

    # Delivery Partner Use Cases (Upper Right)
    rider_cases = [
        (10.5, 7.7, 3.0, 0.75, "Accept Trip Alert &\nNavigate to Store"),
        (10.5, 6.7, 3.0, 0.75, "Scan Order Bag QR &\nVerify Custody"),
        (10.5, 5.7, 3.0, 0.75, "Deliver at Doorstep &\nVerify 4-Digit OTP"),
    ]
    for x, y, w, h, t in rider_cases:
        draw_use_case(x, y, w, h, t, bg_color=LIGHT_GREEN, border_color='#34D399')
        ax.plot([13.5, x + w/2], [6.8, y], color='#94A3B8', linewidth=1.3)

    # Admin Use Cases (Lower Right)
    admin_cases = [
        (10.5, 3.3, 3.0, 0.75, "Manage Dark Stores &\nGeofence Coverage"),
        (10.5, 2.3, 3.0, 0.75, "Area-Wise Dynamic\nPricing Management"),
        (10.5, 1.3, 3.0, 0.75, "Monitor Real-Time Orders\n& Stock Inventory"),
    ]
    for x, y, w, h, t in admin_cases:
        draw_use_case(x, y, w, h, t, bg_color=LIGHT_PURPLE, border_color='#A78BFA')
        ax.plot([13.5, x + w/2], [2.5, y], color='#94A3B8', linewidth=1.3)

    # Shared Central Use Case (Live GPS Tracking)
    draw_use_case(7.5, 4.5, 3.2, 0.85, "Live Order Tracking &\nSocket.IO Location Sync",
                  bg_color='#FEF3C7', border_color='#F59E0B')
    ax.plot([6.0, 4.5 + 1.5], [4.5, 5.7], color='#F59E0B', linewidth=1.3, linestyle='--')
    ax.text(5.5, 5.2, "<<includes>>", fontsize=8, color=AMBER, fontweight='bold')
    ax.plot([9.0, 10.5 - 1.5], [4.5, 5.7], color='#F59E0B', linewidth=1.3, linestyle='--')
    ax.text(8.6, 5.2, "<<updates>>", fontsize=8, color=AMBER, fontweight='bold')

    plt.tight_layout()
    out = os.path.join(output_dir, 'use_case_diagram.png')
    plt.savefig(out, dpi=300, bbox_inches='tight')
    plt.close()
    print("Saved Use Case Diagram:", out)


# ==============================================================================
# 2. ACTIVITY DIAGRAM (SWIMLANES) - ZERO INTERSECTION FLOW
# ==============================================================================
def generate_activity_diagram():
    fig, ax = plt.subplots(figsize=(15, 10), dpi=300)
    ax.set_xlim(0, 15)
    ax.set_ylim(0, 10)
    ax.axis('off')

    fig.patch.set_facecolor(SLATE_BG)
    ax.set_facecolor(SLATE_BG)

    # Title
    ax.text(7.5, 9.6, "ACTIVITY DIAGRAM — WomUp Order Fulfillment Flow",
            ha='center', va='center', fontsize=18, fontweight='bold', color=NAVY)
    ax.text(7.5, 9.25, "Sequential Execution Across Customer, System, Dark Store & Delivery Partner",
            ha='center', va='center', fontsize=11, color=GRAY_TEXT)

    # 4 Swimlanes
    lanes = [
        ("Customer (App)", 0.6, 3.3, '#EFF6FF', '#2563EB'),
        ("System / Backend Hub", 4.1, 3.3, '#F8FAFC', '#475569'),
        ("Dark Store Staff (Packer)", 7.6, 3.3, '#FFFBEB', '#D97706'),
        ("Delivery Partner (Rider)", 11.1, 3.3, '#ECFDF5', '#059669')
    ]

    for title, x, w, bg, border in lanes:
        lane_box = patches.Rectangle((x, 0.4), w, 8.4, facecolor=bg, edgecolor=BORDER_GRAY, linewidth=1.2)
        ax.add_patch(lane_box)
        header = patches.Rectangle((x, 8.3), w, 0.5, facecolor=border, edgecolor=border)
        ax.add_patch(header)
        ax.text(x + w/2, 8.55, title, ha='center', va='center', fontsize=11.5, fontweight='bold', color=WHITE)

    # Helper: Node Box
    def draw_node(x, y, w, h, step_no, text, bg=WHITE, border='#3B82F6'):
        box = patches.FancyBboxPatch((x - w/2, y - h/2), w, h, boxstyle="round,pad=0.12",
                                     facecolor=bg, edgecolor=border, linewidth=1.5)
        ax.add_patch(box)
        badge = patches.Circle((x - w/2 + 0.22, y), 0.16, facecolor=border, edgecolor=border)
        ax.add_patch(badge)
        ax.text(x - w/2 + 0.22, y, step_no, ha='center', va='center', fontsize=8, fontweight='bold', color=WHITE)
        ax.text(x + 0.12, y, text, ha='center', va='center', fontsize=8.8, fontweight='bold', color=NAVY, multialignment='center')

    # Helper: Arrow
    def draw_arrow(p1, p2, label=""):
        ax.annotate('', xy=p2, xytext=p1,
                    arrowprops=dict(arrowstyle="-|>", color='#1E293B', lw=1.6, shrinkA=0, shrinkB=0, mutation_scale=12))
        if label:
            mid_x = (p1[0] + p2[0]) / 2
            mid_y = (p1[1] + p2[1]) / 2
            ax.text(mid_x, mid_y + 0.14, label, ha='center', va='center', fontsize=7.8,
                    fontweight='bold', color='#334155', backgroundcolor=WHITE)

    # Start Node in Customer Lane
    start = patches.Circle((2.25, 8.0), 0.16, facecolor=NAVY, edgecolor=NAVY)
    ax.add_patch(start)

    # Step 1: Customer selects area (y=7.4)
    draw_node(2.25, 7.4, 2.7, 0.6, "1", "Select Area / GPS Location", bg=WHITE, border='#3B82F6')
    draw_arrow((2.25, 7.84), (2.25, 7.7))

    # Step 2: System fetches local catalog (y=7.4)
    draw_node(5.75, 7.4, 2.8, 0.6, "2", "Fetch Area Pricing & Stocks", bg=WHITE, border='#64748B')
    draw_arrow((3.6, 7.4), (4.35, 7.4), label="Detect Area")

    # Step 3: Customer chooses variant & checks out (y=6.1)
    draw_node(2.25, 6.1, 2.7, 0.6, "3", "Choose Variant & Place Order", bg=WHITE, border='#3B82F6')
    draw_arrow((4.35, 7.2), (3.6, 6.3), label="Show Catalog")

    # Step 4: System verifies stock & assigns store (y=6.1)
    draw_node(5.75, 6.1, 2.8, 0.6, "4", "Reserve Stock & Assign Store", bg=WHITE, border='#64748B')
    draw_arrow((3.6, 6.1), (4.35, 6.1), label="Submit Order")

    # Step 5: Dark Store receives notification & pick list (y=6.1)
    draw_node(9.25, 6.1, 2.8, 0.6, "5", "Notify Terminal & View Pick-List", bg=WHITE, border='#F59E0B')
    draw_arrow((7.15, 6.1), (7.85, 6.1), label="Send Order")

    # Step 6: Dark Store scans barcode & seals bag (y=4.8)
    draw_node(9.25, 4.8, 2.8, 0.6, "6", "Scan Barcodes & Seal Bag QR", bg=WHITE, border='#F59E0B')
    draw_arrow((9.25, 5.8), (9.25, 5.1), label="Items Picked")

    # Step 7: Delivery Partner accepts trip & scans bag QR (y=4.8)
    # Direct physical handover from Dark Store counter to Rider!
    draw_node(12.75, 4.8, 2.8, 0.6, "7", "Accept Trip & Scan Bag QR", bg=WHITE, border='#10B981')
    draw_arrow((10.65, 4.8), (11.35, 4.8), label="Handover Bag")

    # Step 8: Rider reaches doorstep & requests OTP (y=3.0)
    draw_node(12.75, 3.0, 2.8, 0.6, "8", "Deliver to Door & Request OTP", bg=WHITE, border='#10B981')
    draw_arrow((12.75, 4.5), (12.75, 3.3), label="Drive to Door")

    # Step 9: Customer provides OTP & receives order (y=3.0)
    draw_node(2.25, 3.0, 2.7, 0.6, "9", "Provide 4-Digit OTP & Receive", bg=WHITE, border='#3B82F6')
    draw_arrow((11.35, 3.0), (3.6, 3.0), label="Verify OTP")

    # End Node in Customer Lane (y=1.8)
    end_outer = patches.Circle((2.25, 1.8), 0.18, facecolor=WHITE, edgecolor=NAVY, linewidth=2)
    end_inner = patches.Circle((2.25, 1.8), 0.11, facecolor=NAVY, edgecolor=NAVY)
    ax.add_patch(end_outer)
    ax.add_patch(end_inner)
    draw_arrow((2.25, 2.7), (2.25, 2.0), label="Order Complete")

    plt.tight_layout()
    out = os.path.join(output_dir, 'activity_diagram.png')
    plt.savefig(out, dpi=300, bbox_inches='tight')
    plt.close()
    print("Saved Activity Diagram:", out)


# ==============================================================================
# 3. CLASS DIAGRAM - CLEAN TOPOLOGICAL LAYOUT (ZERO CROSSINGS)
# ==============================================================================
def generate_class_diagram():
    fig, ax = plt.subplots(figsize=(15, 10), dpi=300)
    ax.set_xlim(0, 15)
    ax.set_ylim(0, 10)
    ax.axis('off')

    fig.patch.set_facecolor(SLATE_BG)
    ax.set_facecolor(SLATE_BG)

    # Title
    ax.text(7.5, 9.6, "CLASS DIAGRAM — WomUp System Object Model",
            ha='center', va='center', fontsize=18, fontweight='bold', color=NAVY)
    ax.text(7.5, 9.25, "UML Entity Classes, Attributes, Methods & Domain Associations",
            ha='center', va='center', fontsize=11, color=GRAY_TEXT)

    # Helper: UML Class Box
    def draw_uml_class(x, y, w, h, class_name, attributes, methods, header_color=NAVY):
        box = patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.08",
                                     facecolor=WHITE, edgecolor=BORDER_GRAY, linewidth=1.5)
        ax.add_patch(box)
        header_h = 0.45
        header = patches.Rectangle((x, y + h - header_h), w, header_h,
                                   facecolor=header_color, edgecolor=header_color)
        ax.add_patch(header)
        ax.text(x + w/2, y + h - header_h/2, class_name,
                ha='center', va='center', fontsize=11, fontweight='bold', color=WHITE)

        # Attributes
        attr_text = "\n".join([f"+ {a}" for a in attributes])
        ax.text(x + 0.15, y + h - header_h - 0.12, attr_text,
                ha='left', va='top', fontsize=8.2, color=DARK_TEXT, family='monospace', linespacing=1.3)

        # Separator
        sep_y = y + len(methods) * 0.22 + 0.15
        ax.plot([x, x + w], [sep_y, sep_y], color='#E2E8F0', linewidth=1)

        # Methods
        meth_text = "\n".join([f"+ {m}()" for m in methods])
        ax.text(x + 0.15, sep_y - 0.1, meth_text,
                ha='left', va='top', fontsize=8.2, color=GRAY_TEXT, family='monospace', linespacing=1.3)

    # 1. Left Column: User (Top-Left) & Customer (Middle-Left)
    draw_uml_class(0.6, 6.2, 3.0, 2.5, "User",
                   ["id: String", "name: String", "phone: String", "email: String", "role: String"],
                   ["login", "updateProfile", "verifyOTP"],
                   header_color='#2563EB')

    draw_uml_class(0.6, 2.2, 3.0, 2.6, "Customer",
                   ["defaultAddress: Address", "savedAddresses: List", "preferredAreaId: String"],
                   ["selectArea", "addToCart", "checkoutOrder"],
                   header_color='#3B82F6')

    # Customer extends User
    ax.annotate('', xy=(2.1, 6.2), xytext=(2.1, 4.8),
                arrowprops=dict(arrowstyle="-|>", color='#1E293B', lw=1.6, mutation_scale=12))
    ax.text(2.2, 5.5, "extends", fontsize=8.5, color=GRAY_TEXT, fontweight='bold')

    # 2. Middle-Left Column: Order (Top) & OrderItem (Bottom)
    draw_uml_class(4.3, 5.5, 3.2, 3.2, "Order",
                   ["id: String", "customerId: String", "storeId: String", "riderId: String", "totalAmount: Number", "status: String", "deliveryOTP: String"],
                   ["calculateTotal", "assignStore", "verifyDeliveryOTP"],
                   header_color='#DC2626')

    draw_uml_class(4.3, 1.8, 3.2, 2.4, "OrderItem",
                   ["id: String", "orderId: String", "variantId: String", "quantity: Number", "unitPrice: Number"],
                   ["calculateSubtotal"],
                   header_color='#EA580C')

    # Customer places Order (clean horizontal direct line!)
    ax.plot([3.6, 4.3], [3.5, 6.5], color='#1E293B', lw=1.6)
    ax.text(3.6, 5.1, "places (1..*)", fontsize=8.5, color=DARK_TEXT, fontweight='bold')

    # Order contains OrderItem (clean vertical line)
    ax.plot([5.9, 5.9], [5.5, 4.2], color='#1E293B', lw=1.6)
    ax.text(6.0, 4.8, "1 : N", fontsize=8.5, color=DARK_TEXT, fontweight='bold')

    # 3. Middle-Right Column: Product (Top), ProductVariant (Middle), AreaPricing (Bottom)
    draw_uml_class(8.2, 6.5, 3.1, 2.2, "Product",
                   ["id: String", "title: String", "category: String", "brand: String", "imageUrl: String"],
                   ["getVariants", "checkAvailability"],
                   header_color='#059669')

    draw_uml_class(8.2, 3.6, 3.1, 2.3, "ProductVariant",
                   ["id: String", "productId: String", "weightLabel: String", "basePrice: Number", "stock: Number"],
                   ["getPriceForArea", "decrementStock"],
                   header_color='#10B981')

    draw_uml_class(8.2, 0.8, 3.1, 2.2, "AreaPricing",
                   ["id: String", "variantId: String", "areaId: String", "overridePrice: Number", "isActive: Boolean"],
                   ["resolvePrice", "applyDiscount"],
                   header_color='#D97706')

    # Product -> ProductVariant (vertical line)
    ax.plot([9.75, 9.75], [6.5, 5.9], color='#1E293B', lw=1.6)
    ax.text(9.85, 6.2, "1..*", fontsize=8.5, color=DARK_TEXT, fontweight='bold')

    # ProductVariant -> AreaPricing (vertical line)
    ax.plot([9.75, 9.75], [3.6, 3.0], color='#1E293B', lw=1.6)
    ax.text(9.85, 3.3, "1..*", fontsize=8.5, color=DARK_TEXT, fontweight='bold')

    # OrderItem -> ProductVariant (clean horizontal line!)
    ax.plot([7.5, 8.2], [3.0, 4.5], color='#1E293B', lw=1.6)
    ax.text(7.55, 3.9, "references (1)", fontsize=8.5, color=DARK_TEXT, fontweight='bold')

    # 4. Far-Right Column: DarkStore (Top) & DeliveryPartner (Bottom)
    draw_uml_class(12.0, 5.8, 2.6, 2.8, "DarkStore",
                   ["id: String", "name: String", "lat: Number", "lng: Number", "radiusKm: Number", "isOnline: Boolean"],
                   ["getInventory", "routeToShelf", "markBagSealed"],
                   header_color='#7C3AED')

    draw_uml_class(12.0, 1.8, 2.6, 3.0, "DeliveryPartner",
                   ["id: String", "vehicleType: String", "liveLocation: LatLng", "isAvailable: Boolean", "walletBalance: Number"],
                   ["acceptTrip", "updateGPS", "creditPayout"],
                   header_color='#0284C7')

    # DarkStore fulfills Order (routed along the top above Product - ZERO INTERSECTION!)
    ax.plot([12.0, 12.0, 5.9, 5.9], [7.2, 9.0, 9.0, 8.7], color='#7C3AED', lw=1.5, linestyle='--')
    ax.text(8.95, 9.15, "fulfills (1)", fontsize=8.5, color=PURPLE, fontweight='bold', ha='center')

    # DeliveryPartner delivers Order (routed along bottom below OrderItem - ZERO INTERSECTION!)
    ax.plot([12.0, 12.0, 5.9, 5.9], [3.3, 0.4, 0.4, 1.8], color='#0284C7', lw=1.5, linestyle='--')
    ax.text(8.95, 0.2, "delivers (1)", fontsize=8.5, color=DEEP_BLUE, fontweight='bold', ha='center')

    plt.tight_layout()
    out = os.path.join(output_dir, 'class_diagram.png')
    plt.savefig(out, dpi=300, bbox_inches='tight')
    plt.close()
    print("Saved Class Diagram:", out)


# ==============================================================================
# 4. RE-GENERATE CLEAN ER DIAGRAM (ZERO CROSSINGS)
# ==============================================================================
def generate_clean_er_diagram():
    fig, ax = plt.subplots(figsize=(15, 10), dpi=300)
    ax.set_xlim(0, 15)
    ax.set_ylim(0, 10)
    ax.axis('off')

    fig.patch.set_facecolor(SLATE_BG)
    ax.set_facecolor(SLATE_BG)

    # Title
    ax.text(7.5, 9.6, "ENTITY RELATIONSHIP (ER) DIAGRAM — WomUp Database",
            ha='center', va='center', fontsize=18, fontweight='bold', color=NAVY)
    ax.text(7.5, 9.25, "Entities, Primary Keys [PK], Foreign Keys [FK] & Cardinality Mapping",
            ha='center', va='center', fontsize=11, color=GRAY_TEXT)

    # Helper: Entity Box
    def draw_entity(x, y, w, h, table_name, pk, fks, attrs, header_color=NAVY):
        box = patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.08",
                                     facecolor=WHITE, edgecolor=BORDER_GRAY, linewidth=1.5)
        ax.add_patch(box)
        header_h = 0.45
        header = patches.Rectangle((x, y + h - header_h), w, header_h,
                                   facecolor=header_color, edgecolor=header_color)
        ax.add_patch(header)
        ax.text(x + w/2, y + h - header_h/2, table_name,
                ha='center', va='center', fontsize=11, fontweight='bold', color=WHITE)

        lines = [f"[PK]  {pk}"]
        for fk in fks:
            lines.append(f"[FK]  {fk}")
        for attr in attrs:
            lines.append(f" -    {attr}")

        ax.text(x + 0.15, y + h - header_h - 0.12, "\n".join(lines),
                ha='left', va='top', fontsize=8.2, color=DARK_TEXT, family='monospace', linespacing=1.35)

    # 1. Left Column: USERS & ADDRESSES
    draw_entity(0.6, 5.8, 3.1, 2.7, "USERS",
                "user_id", [], ["name", "email", "phone", "role", "created_at"],
                header_color='#2563EB')

    draw_entity(0.6, 2.0, 3.1, 2.7, "ADDRESSES",
                "address_id", ["user_id"], ["street", "city", "pincode", "is_default"],
                header_color='#3B82F6')

    # USERS -> ADDRESSES (vertical 1:N)
    ax.plot([2.15, 2.15], [5.8, 4.7], color='#1E293B', lw=1.6)
    ax.text(2.25, 5.2, "1 : N", fontsize=8.5, color=DARK_TEXT, fontweight='bold')

    # 2. Middle-Left Column: ORDERS & ORDER_ITEMS
    draw_entity(4.3, 5.2, 3.3, 3.4, "ORDERS",
                "order_id", ["user_id", "store_id", "rider_id"],
                ["status", "total_amount", "delivery_fee", "delivery_otp", "created_at"],
                header_color='#DC2626')

    draw_entity(4.3, 1.8, 3.3, 2.8, "ORDER_ITEMS",
                "item_id", ["order_id", "variant_id"],
                ["quantity", "unit_price", "total_price"],
                header_color='#EA580C')

    # USERS -> ORDERS (horizontal 1:N)
    ax.plot([3.7, 4.3], [7.0, 7.0], color='#1E293B', lw=1.6)
    ax.text(3.8, 7.15, "1 : N", fontsize=8.5, color=DARK_TEXT, fontweight='bold')

    # ORDERS -> ORDER_ITEMS (vertical 1:N)
    ax.plot([5.95, 5.95], [5.2, 4.6], color='#1E293B', lw=1.6)
    ax.text(6.05, 4.9, "1 : N", fontsize=8.5, color=DARK_TEXT, fontweight='bold')

    # 3. Middle-Right Column: PRODUCTS, PRODUCT_VARIANTS & AREA_PRICING
    draw_entity(8.2, 6.0, 3.1, 2.6, "PRODUCTS",
                "product_id", [], ["title", "category", "brand", "is_active"],
                header_color='#059669')

    draw_entity(8.2, 2.8, 3.1, 2.6, "PRODUCT_VARIANTS",
                "variant_id", ["product_id"], ["weight_label", "price", "mrp", "stock"],
                header_color='#10B981')

    draw_entity(8.2, 0.5, 3.1, 1.8, "AREA_PRICING",
                "pricing_id", ["variant_id", "area_id"], ["override_price", "is_active"],
                header_color='#D97706')

    # PRODUCTS -> PRODUCT_VARIANTS (vertical 1:N)
    ax.plot([9.75, 9.75], [6.0, 5.4], color='#1E293B', lw=1.6)
    ax.text(9.85, 5.7, "1 : N", fontsize=8.5, color=DARK_TEXT, fontweight='bold')

    # PRODUCT_VARIANTS -> AREA_PRICING (vertical 1:N)
    ax.plot([9.75, 9.75], [2.8, 2.3], color='#1E293B', lw=1.6)
    ax.text(9.85, 2.5, "1 : N", fontsize=8.5, color=DARK_TEXT, fontweight='bold')

    # ORDER_ITEMS -> PRODUCT_VARIANTS (horizontal 1:N)
    ax.plot([7.6, 8.2], [3.5, 3.5], color='#1E293B', lw=1.6)
    ax.text(7.65, 3.65, "1 : N", fontsize=8.5, color=DARK_TEXT, fontweight='bold')

    # 4. Far Right Column: DARK_STORES & DELIVERY_RIDERS
    draw_entity(12.1, 5.6, 2.5, 2.8, "DARK_STORES",
                "store_id", ["area_id"], ["name", "latitude", "longitude", "radius_km"],
                header_color='#7C3AED')

    draw_entity(12.1, 1.8, 2.5, 2.8, "DELIVERY_RIDERS",
                "rider_id", [], ["name", "phone", "vehicle_type", "wallet_balance"],
                header_color='#0284C7')

    # DARK_STORES -> ORDERS (top overhead route - ZERO CROSSINGS!)
    ax.plot([12.1, 12.1, 5.95, 5.95], [7.0, 9.0, 9.0, 8.6], color='#7C3AED', lw=1.5, linestyle='--')
    ax.text(9.0, 9.15, "fulfills (1 : N)", fontsize=8.5, color=PURPLE, fontweight='bold', ha='center')

    # DELIVERY_RIDERS -> ORDERS (bottom route - ZERO CROSSINGS!)
    ax.plot([12.1, 12.1, 5.95, 5.95], [3.2, 0.4, 0.4, 1.8], color='#0284C7', lw=1.5, linestyle='--')
    ax.text(9.0, 0.2, "delivers (1 : N)", fontsize=8.5, color=DEEP_BLUE, fontweight='bold', ha='center')

    plt.tight_layout()
    out = os.path.join(output_dir, 'er_diagram_clean.png')
    plt.savefig(out, dpi=300, bbox_inches='tight')
    plt.close()
    print("Saved Clean ER Diagram:", out)


if __name__ == '__main__':
    generate_use_case_diagram()
    generate_activity_diagram()
    generate_class_diagram()
    generate_clean_er_diagram()
    print("ALL 4 MCA DIAGRAMS GENERATED WITH ZERO CROSSINGS!")
