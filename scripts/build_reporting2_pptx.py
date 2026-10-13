import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE

os.makedirs('docs/reporting2', exist_ok=True)

prs = Presentation()
prs.slide_width = Inches(13.333)
prs.slide_height = Inches(7.5)

# Color Palette
NAVY = RGBColor(7, 27, 82)         # #071B52
DARK_BLUE = RGBColor(15, 43, 117)   # #0F2B75
INDIGO = RGBColor(67, 56, 202)      # #4338CA
PINK = RGBColor(255, 59, 152)       # #FF3B98
CYAN = RGBColor(14, 165, 233)       # #0EA5E9
EMERALD = RGBColor(16, 185, 129)    # #10B981
AMBER = RGBColor(245, 158, 11)      # #F59E0B
SLATE = RGBColor(100, 116, 139)     # #64748B
LIGHT_BG = RGBColor(248, 250, 252)  # #F8FAFC
CARD_BG = RGBColor(255, 255, 255)   # #FFFFFF
BORDER_CLR = RGBColor(226, 232, 240) # #E2E8F0
WHITE = RGBColor(255, 255, 255)
DARK_TEXT = RGBColor(15, 23, 42)

blank_layout = prs.slide_layouts[6]

def set_slide_background(slide, color):
    bg_shape = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(7.5))
    bg_shape.fill.solid()
    bg_shape.fill.fore_color.rgb = color
    bg_shape.line.fill.background()
    return bg_shape

def add_header(slide, title_text, category_tag="MINI PROJECT REPORTING 2", is_dark=False):
    # Category tag
    tag_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(11.7), Inches(0.35))
    tf_tag = tag_box.text_frame
    tf_tag.word_wrap = True
    p_tag = tf_tag.paragraphs[0]
    p_tag.text = category_tag.upper()
    p_tag.font.size = Pt(10)
    p_tag.font.bold = True
    p_tag.font.color.rgb = PINK if is_dark else INDIGO

    # Main Title
    title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.7), Inches(11.7), Inches(0.65))
    tf_title = title_box.text_frame
    tf_title.word_wrap = True
    p_title = tf_title.paragraphs[0]
    p_title.text = title_text
    p_title.font.size = Pt(22)
    p_title.font.bold = True
    p_title.font.color.rgb = WHITE if is_dark else NAVY

def add_card(slide, left, top, width, height, bg_color=CARD_BG, border_color=BORDER_CLR):
    card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(left), Inches(top), Inches(width), Inches(height))
    card.fill.solid()
    card.fill.fore_color.rgb = bg_color
    if border_color:
        card.line.color.rgb = border_color
        card.line.width = Pt(1.5)
    else:
        card.line.fill.background()
    return card

def add_bullet_point(tf, title, description="", title_color=NAVY, desc_color=SLATE, pt_size=12):
    p = tf.add_paragraph()
    p.font.size = Pt(pt_size)
    p.space_after = Pt(6)
    
    run_t = p.add_run()
    run_t.text = "• " + title + (" — " if description else "")
    run_t.font.bold = True
    run_t.font.color.rgb = title_color
    
    if description:
        run_d = p.add_run()
        run_d.text = description
        run_d.font.color.rgb = desc_color

def style_table(table, header_bg=NAVY, header_fg=WHITE):
    for r_idx, row in enumerate(table.rows):
        for c_idx, cell in enumerate(row.cells):
            cell.margin_left = Inches(0.12)
            cell.margin_right = Inches(0.12)
            cell.margin_top = Inches(0.08)
            cell.margin_bottom = Inches(0.08)
            if r_idx == 0:
                cell.fill.solid()
                cell.fill.fore_color.rgb = header_bg
                for p in cell.text_frame.paragraphs:
                    p.font.bold = True
                    p.font.color.rgb = header_fg
                    p.font.size = Pt(10.5)
            else:
                cell.fill.solid()
                cell.fill.fore_color.rgb = WHITE if r_idx % 2 == 1 else RGBColor(241, 245, 249)
                for p in cell.text_frame.paragraphs:
                    p.font.size = Pt(9.5)
                    p.font.color.rgb = DARK_TEXT

# ==============================================================================
# SLIDE 1: Title Slide (Dark Theme)
# ==============================================================================
slide1 = prs.slides.add_slide(blank_layout)
set_slide_background(slide1, NAVY)

# Title content
tb = slide1.shapes.add_textbox(Inches(1.0), Inches(1.8), Inches(11.333), Inches(3.8))
tf = tb.text_frame
tf.word_wrap = True

p_badge = tf.paragraphs[0]
p_badge.text = "ACADEMIC MINI PROJECT REPORTING 2"
p_badge.font.size = Pt(13)
p_badge.font.bold = True
p_badge.font.color.rgb = PINK
p_badge.space_after = Pt(14)

p_main = tf.add_paragraph()
p_main.text = "WORMUP: HYPERLOCAL QUICK COMMERCE,\nDARK STORE LOGISTICS & CLOUD PRINTING"
p_main.font.size = Pt(32)
p_main.font.bold = True
p_main.font.color.rgb = WHITE
p_main.space_after = Pt(14)

p_sub = tf.add_paragraph()
p_sub.text = "Phase 2 Detailed Design, System Architecture, Module Decomposition & Data Modeling"
p_sub.font.size = Pt(16)
p_sub.font.color.rgb = RGBColor(203, 213, 225)
p_sub.space_after = Pt(36)

p_meta = tf.add_paragraph()
p_meta.text = "Tech Stack: React 19 • React Native (Expo) • NestJS & Express • MongoDB Atlas Cluster • Socket.IO Telemetry"
p_meta.font.size = Pt(12)
p_meta.font.bold = True
p_meta.font.color.rgb = EMERALD

# Footer metadata card
add_card(slide1, 1.0, 5.8, 11.333, 1.1, bg_color=DARK_BLUE, border_color=INDIGO)
tb_foot = slide1.shapes.add_textbox(Inches(1.2), Inches(5.9), Inches(10.9), Inches(0.9))
tf_foot = tb_foot.text_frame
p_f1 = tf_foot.paragraphs[0]
p_f1.text = "Project Team: WormUp Development Team   |   Academic Session: 2026-2027"
p_f1.font.size = Pt(11)
p_f1.font.bold = True
p_f1.font.color.rgb = WHITE

p_f2 = tf_foot.add_paragraph()
p_f2.text = "Note: Live production demo will be presented directly on screen. Slides focus on architecture, algorithms, and schemas."
p_f2.font.size = Pt(10)
p_f2.font.color.rgb = RGBColor(148, 163, 184)

# ==============================================================================
# SLIDE 2: Executive Summary & Scope of Reporting 2
# ==============================================================================
slide2 = prs.slides.add_slide(blank_layout)
set_slide_background(slide2, LIGHT_BG)
add_header(slide2, "Executive Summary & Reporting 2 Scope")

# Card 1: Reporting 1 vs Reporting 2
add_card(slide2, 0.8, 1.5, 3.6, 5.2)
tb = slide2.shapes.add_textbox(Inches(1.0), Inches(1.7), Inches(3.2), Inches(4.8))
tf = tb.text_frame
tf.word_wrap = True
tf.paragraphs[0].text = "Reporting 1 Recap"
tf.paragraphs[0].font.size = Pt(16)
tf.paragraphs[0].font.bold = True
tf.paragraphs[0].font.color.rgb = NAVY
tf.paragraphs[0].space_after = Pt(10)
add_bullet_point(tf, "SRS Formulation", "Analyzed quick commerce challenges (inventory loss, pricing conflicts).")
add_bullet_point(tf, "Feasibility Study", "Evaluated 10-minute delivery economics & cloud printing demand.")
add_bullet_point(tf, "Scope Definition", "Multi-role ecosystem (Customer, Picker, Rider, Super Admin).")
add_bullet_point(tf, "Tech Stack Approval", "Selected NestJS, MongoDB, React, React Native Expo.")

# Card 2: Reporting 2 Deliverables
add_card(slide2, 4.7, 1.5, 3.8, 5.2)
tb = slide2.shapes.add_textbox(Inches(4.9), Inches(1.7), Inches(3.4), Inches(4.8))
tf = tb.text_frame
tf.word_wrap = True
tf.paragraphs[0].text = "Reporting 2 Deliverables"
tf.paragraphs[0].font.size = Pt(16)
tf.paragraphs[0].font.bold = True
tf.paragraphs[0].font.color.rgb = INDIGO
tf.paragraphs[0].space_after = Pt(10)
add_bullet_point(tf, "System Architecture", "Multi-tier micro-modular design with WebSockets & REST APIs.")
add_bullet_point(tf, "5 Functional Modules", "Detailed workflow diagrams for each independent enterprise module.")
add_bullet_point(tf, "Dynamic Area Pricing", "Multi-tier price override algorithm ({variantId, areaId}).")
add_bullet_point(tf, "Full Data Dictionary", "Complete normalized schema tables with types & constraints.")

# Card 3: Live Demo Structure
add_card(slide2, 8.8, 1.5, 3.7, 5.2)
tb = slide2.shapes.add_textbox(Inches(9.0), Inches(1.7), Inches(3.3), Inches(4.8))
tf = tb.text_frame
tf.word_wrap = True
tf.paragraphs[0].text = "Live Demo Execution"
tf.paragraphs[0].font.size = Pt(16)
tf.paragraphs[0].font.bold = True
tf.paragraphs[0].font.color.rgb = EMERALD
tf.paragraphs[0].space_after = Pt(10)
add_bullet_point(tf, "Customer Web Experience", "Geo-detection, area prices (Tragad ₹7), cart, live tracking.")
add_bullet_point(tf, "Store Picker Workflow", "Digital pick-lists, shelf bin scanning, shift toggle.")
add_bullet_point(tf, "Rider Telemetry", "Real-time GPS coordinate pinging & order dispatch.")
add_bullet_point(tf, "Admin Dynamic Overrides", "Instant price updates, rider & customer profile editing.")

# ==============================================================================
# SLIDE 3: System Architecture
# ==============================================================================
slide3 = prs.slides.add_slide(blank_layout)
set_slide_background(slide3, LIGHT_BG)
add_header(slide3, "High-Level Distributed System Architecture")

# Diagram Image on Left/Center
if os.path.exists('docs/reporting2/diagrams/system_architecture.png'):
    slide3.shapes.add_picture('docs/reporting2/diagrams/system_architecture.png', Inches(0.8), Inches(1.5), width=Inches(7.8))

# Explanatory card on right
add_card(slide3, 8.8, 1.5, 3.7, 5.2)
tb = slide3.shapes.add_textbox(Inches(9.0), Inches(1.7), Inches(3.3), Inches(4.8))
tf = tb.text_frame
tf.word_wrap = True
tf.paragraphs[0].text = "Architectural Highlights"
tf.paragraphs[0].font.size = Pt(15)
tf.paragraphs[0].font.bold = True
tf.paragraphs[0].font.color.rgb = NAVY
tf.paragraphs[0].space_after = Pt(10)
add_bullet_point(tf, "Presentation Tier", "Responsive React 19 PWA & cross-platform React Native Expo apps.")
add_bullet_point(tf, "Application Gateway", "NestJS controller layer with JWT guards & Socket.IO real-time channels.")
add_bullet_point(tf, "Dynamic Engines", "Specialized micro-engines for Area Pricing, Fleet Dispatch, and Print Quoting.")
add_bullet_point(tf, "Data Tier", "MongoDB Atlas cluster with 2dsphere geospatial indices and atomic operations.")
add_bullet_point(tf, "Media Cloud CDN", "Cloudinary integration for product images and encrypted document uploads.")

# ==============================================================================
# SLIDE 4: Data Flow Diagram (DFD Level 0 & Level 1)
# ==============================================================================
slide4 = prs.slides.add_slide(blank_layout)
set_slide_background(slide4, LIGHT_BG)
add_header(slide4, "Data Flow Diagram (DFD Level 1 Decomposition)")

if os.path.exists('docs/reporting2/diagrams/dfd_level1.png'):
    slide4.shapes.add_picture('docs/reporting2/diagrams/dfd_level1.png', Inches(0.8), Inches(1.5), width=Inches(7.8))

add_card(slide4, 8.8, 1.5, 3.7, 5.2)
tb = slide4.shapes.add_textbox(Inches(9.0), Inches(1.7), Inches(3.3), Inches(4.8))
tf = tb.text_frame
tf.word_wrap = True
tf.paragraphs[0].text = "DFD Level 1 Analysis"
tf.paragraphs[0].font.size = Pt(15)
tf.paragraphs[0].font.bold = True
tf.paragraphs[0].font.color.rgb = NAVY
tf.paragraphs[0].space_after = Pt(10)
add_bullet_point(tf, "Process 1.0 (Catalog)", "Consumes customer geolocation; queries MongoDB area_pricing to resolve localized rates.")
add_bullet_point(tf, "Process 2.0 (Orders)", "Validates cart, checks stock limits, redeems coins, and commits order.")
add_bullet_point(tf, "Process 3.0 (Fulfillment)", "Routes order to nearest dark store; generates digital pick-list with bin tags.")
add_bullet_point(tf, "Process 4.0 (Fleet)", "Pings idle riders; streams live telemetry over Socket.IO rooms.")
add_bullet_point(tf, "Admin Overseer", "Super admin modifies pricing and monitors real-time system metrics.")

# ==============================================================================
# SLIDE 5: Module Breakdown Overview
# ==============================================================================
slide5 = prs.slides.add_slide(blank_layout)
set_slide_background(slide5, LIGHT_BG)
add_header(slide5, "Functional Module Breakdown (5 Core Subsystems)")

modules_data = [
    ("Module 1: Customer Web/App", "• Geofenced live catalog\n• Multi-variant area pricing\n• Cart & loyalty coins redemption\n• Socket.IO live order countdown", CYAN),
    ("Module 2: Dark Store Hub", "• Multi-store inventory sync\n• Digital pick-and-pack route\n• Shelf bin tagging (A1-R1)\n• Shift control (On/Off Shift)", AMBER),
    ("Module 3: Delivery Fleet", "• Proximity dispatch algorithm\n• GPS telemetry & speed tracker\n• Doorstep delivery OTP/QR\n• Dynamic distance payout rates", PINK),
    ("Module 4: Cloud Printing", "• Multi-page PDF/Doc upload\n• B&W vs Color cost estimator\n• Binding & paper selection\n• 15-minute doorstep dispatch", INDIGO),
    ("Module 5: Admin Engine", "• Dynamic Area Price Overrides\n• Customer & Rider profile editor\n• Live fleet map & shift control\n• Financial settlement & audit", EMERALD),
]

for idx, (m_title, m_desc, m_color) in enumerate(modules_data):
    x = 0.8 + (idx * 2.38)
    add_card(slide5, x, 1.5, 2.22, 5.2, border_color=m_color)
    tb = slide5.shapes.add_textbox(Inches(x + 0.1), Inches(1.7), Inches(2.02), Inches(4.8))
    tf = tb.text_frame
    tf.word_wrap = True
    tf.paragraphs[0].text = m_title
    tf.paragraphs[0].font.size = Pt(13)
    tf.paragraphs[0].font.bold = True
    tf.paragraphs[0].font.color.rgb = NAVY
    tf.paragraphs[0].space_after = Pt(12)
    
    p = tf.add_paragraph()
    p.text = m_desc
    p.font.size = Pt(10.5)
    p.font.color.rgb = DARK_TEXT

# ==============================================================================
# SLIDE 6: Module 1 — Customer Web & Mobile Portal
# ==============================================================================
slide6 = prs.slides.add_slide(blank_layout)
set_slide_background(slide6, LIGHT_BG)
add_header(slide6, "Module 1: Customer Web & Mobile Portal")

if os.path.exists('docs/reporting2/diagrams/module1_customer_flow.png'):
    slide6.shapes.add_picture('docs/reporting2/diagrams/module1_customer_flow.png', Inches(0.8), Inches(1.5), width=Inches(7.8))

add_card(slide6, 8.8, 1.5, 3.7, 5.2)
tb = slide6.shapes.add_textbox(Inches(9.0), Inches(1.7), Inches(3.3), Inches(4.8))
tf = tb.text_frame
tf.word_wrap = True
tf.paragraphs[0].text = "Module 1 Engineering Details"
tf.paragraphs[0].font.size = Pt(15)
tf.paragraphs[0].font.bold = True
tf.paragraphs[0].font.color.rgb = NAVY
tf.paragraphs[0].space_after = Pt(10)
add_bullet_point(tf, "Tech Stack", "React 19, TypeScript, Lucide Icons, Geolocation API, Context API.")
add_bullet_point(tf, "Dynamic Price Lookup", "Queries /api/v1/products/:id?areaId=... to get live localized pricing.")
add_bullet_point(tf, "Multi-Variant Support", "Seamlessly toggles variants (250g, 500g, 1kg, 2kg) updating price & MRP.")
add_bullet_point(tf, "Coin Redemption", "Allows partial payment using earned shopping coins.")
add_bullet_point(tf, "Zero-Flicker Telemetry", "WebSocket updates rider location smoothly on live tracking modal.")

# ==============================================================================
# SLIDE 7: Module 2 — Dark Store Operations & Fulfillment
# ==============================================================================
slide7 = prs.slides.add_slide(blank_layout)
set_slide_background(slide7, LIGHT_BG)
add_header(slide7, "Module 2: Dark Store Operations & Fulfillment")

if os.path.exists('docs/reporting2/diagrams/module2_darkstore_flow.png'):
    slide7.shapes.add_picture('docs/reporting2/diagrams/module2_darkstore_flow.png', Inches(0.8), Inches(1.5), width=Inches(7.8))

add_card(slide7, 8.8, 1.5, 3.7, 5.2)
tb = slide7.shapes.add_textbox(Inches(9.0), Inches(1.7), Inches(3.3), Inches(4.8))
tf = tb.text_frame
tf.word_wrap = True
tf.paragraphs[0].text = "Module 2 Engineering Details"
tf.paragraphs[0].font.size = Pt(15)
tf.paragraphs[0].font.bold = True
tf.paragraphs[0].font.color.rgb = NAVY
tf.paragraphs[0].space_after = Pt(10)
add_bullet_point(tf, "Target SLA", "Sub-3-minute pick and pack time per customer order.")
add_bullet_point(tf, "Shelf Bin Tagging", "Items indexed with shelf locations (e.g. A1-R1) reducing picker search time by 60%.")
add_bullet_point(tf, "Packing Verification", "Barcodes scanned and sealed inside tamper-proof eco bags.")
add_bullet_point(tf, "Atomic Decrement", "Stock decrements atomically inside MongoDB transaction session.")
add_bullet_point(tf, "Shift Resiliency", "Manager shifts toggled between On/Off Duty; auto-reroutes orders if closed.")

# ==============================================================================
# SLIDE 8: Module 3 — Delivery Partner & Fleet Dispatch
# ==============================================================================
slide8 = prs.slides.add_slide(blank_layout)
set_slide_background(slide8, LIGHT_BG)
add_header(slide8, "Module 3: Delivery Partner & Fleet Dispatch")

if os.path.exists('docs/reporting2/diagrams/module3_rider_fleet_flow.png'):
    slide8.shapes.add_picture('docs/reporting2/diagrams/module3_rider_fleet_flow.png', Inches(0.8), Inches(1.5), width=Inches(7.8))

add_card(slide8, 8.8, 1.5, 3.7, 5.2)
tb = slide8.shapes.add_textbox(Inches(9.0), Inches(1.7), Inches(3.3), Inches(4.8))
tf = tb.text_frame
tf.word_wrap = True
tf.paragraphs[0].text = "Module 3 Engineering Details"
tf.paragraphs[0].font.size = Pt(15)
tf.paragraphs[0].font.bold = True
tf.paragraphs[0].font.color.rgb = NAVY
tf.paragraphs[0].space_after = Pt(10)
add_bullet_point(tf, "Haversine Dispatch", "Dispatches to nearest idle rider within 1.5 km of dark store.")
add_bullet_point(tf, "Realtime Telemetry", "GPS pings transmitted every 5 seconds over Socket.IO room channel.")
add_bullet_point(tf, "Dynamic Tariffs", "Payout = Base ₹35 + (₹12/km × Distance) × Surge Multiplier.")
add_bullet_point(tf, "Proof of Delivery", "Doorstep OTP verification unlocks payout and completes order cycle.")
add_bullet_point(tf, "Rider Wallet", "Earnings and tips instantly credited to in-app withdrawal wallet.")

# ==============================================================================
# SLIDE 9: Module 4 — Cloud Printing & Document Fulfillment
# ==============================================================================
slide9 = prs.slides.add_slide(blank_layout)
set_slide_background(slide9, LIGHT_BG)
add_header(slide9, "Module 4: Cloud Printing & On-Demand Document Pipeline")

if os.path.exists('docs/reporting2/diagrams/module4_cloud_printing_flow.png'):
    slide9.shapes.add_picture('docs/reporting2/diagrams/module4_cloud_printing_flow.png', Inches(0.8), Inches(1.5), width=Inches(7.8))

add_card(slide9, 8.8, 1.5, 3.7, 5.2)
tb = slide9.shapes.add_textbox(Inches(9.0), Inches(1.7), Inches(3.3), Inches(4.8))
tf = tb.text_frame
tf.word_wrap = True
tf.paragraphs[0].text = "Module 4 Engineering Details"
tf.paragraphs[0].font.size = Pt(15)
tf.paragraphs[0].font.bold = True
tf.paragraphs[0].font.color.rgb = NAVY
tf.paragraphs[0].space_after = Pt(10)
add_bullet_point(tf, "File Ingestion", "Uploads PDF, DOCX, and high-res images via Cloudinary encrypted storage.")
add_bullet_point(tf, "Auto Page Counting", "Backend calculates total page count instantly upon file upload.")
add_bullet_point(tf, "Custom Print Specs", "Black & White (₹2), Color (₹10), Double-sided discount, Spiral binding (₹35).")
add_bullet_point(tf, "Dark Store Printing", "Automated spooling to high-speed laser printers stationed inside dark stores.")
add_bullet_point(tf, "Security & Privacy", "Temporary signed URLs; files auto-purged from cloud after 24 hours.")

# ==============================================================================
# SLIDE 10: Module 5 — Admin Control Portal & Pricing Engine
# ==============================================================================
slide10 = prs.slides.add_slide(blank_layout)
set_slide_background(slide10, LIGHT_BG)
add_header(slide10, "Module 5: Admin Control Portal & Pricing Engine")

if os.path.exists('docs/reporting2/diagrams/module5_admin_pricing_engine.png'):
    slide10.shapes.add_picture('docs/reporting2/diagrams/module5_admin_pricing_engine.png', Inches(0.8), Inches(1.5), width=Inches(7.8))

add_card(slide10, 8.8, 1.5, 3.7, 5.2)
tb = slide10.shapes.add_textbox(Inches(9.0), Inches(1.7), Inches(3.3), Inches(4.8))
tf = tb.text_frame
tf.word_wrap = True
tf.paragraphs[0].text = "Module 5 Engineering Details"
tf.paragraphs[0].font.size = Pt(15)
tf.paragraphs[0].font.bold = True
tf.paragraphs[0].font.color.rgb = NAVY
tf.paragraphs[0].space_after = Pt(10)
add_bullet_point(tf, "Area Pricing Matrix", "Admin sets customized pricing for specific areas without altering global catalog.")
add_bullet_point(tf, "Compound Index", "Indexed by { variantId, areaId } for O(1) instantaneous resolution.")
add_bullet_point(tf, "Customer Management", "Directly edit customer name, phone, email, address, and block/unblock status.")
add_bullet_point(tf, "Rider Management", "Edit full details, vehicle type/no, hub assignment, duty shift, and status.")
add_bullet_point(tf, "Financial Ledger", "Audit logs and wallet reconciliations for stores and riders.")

# ==============================================================================
# SLIDE 11: Database Architecture & ER Diagram
# ==============================================================================
slide11 = prs.slides.add_slide(blank_layout)
set_slide_background(slide11, LIGHT_BG)
add_header(slide11, "Database Architecture & Entity Relationship (ER) Model")

if os.path.exists('docs/reporting2/diagrams/er_diagram.png'):
    slide11.shapes.add_picture('docs/reporting2/diagrams/er_diagram.png', Inches(0.8), Inches(1.5), width=Inches(7.8))

add_card(slide11, 8.8, 1.5, 3.7, 5.2)
tb = slide11.shapes.add_textbox(Inches(9.0), Inches(1.7), Inches(3.3), Inches(4.8))
tf = tb.text_frame
tf.word_wrap = True
tf.paragraphs[0].text = "ER Model Highlights"
tf.paragraphs[0].font.size = Pt(15)
tf.paragraphs[0].font.bold = True
tf.paragraphs[0].font.color.rgb = NAVY
tf.paragraphs[0].space_after = Pt(10)
add_bullet_point(tf, "NoSQL Schema Design", "Leverages MongoDB Atlas for high write throughput and dynamic variant attributes.")
add_bullet_point(tf, "1 : N Product Variants", "One product has multiple weight variants (250g, 500g, 1kg, 2kg).")
add_bullet_point(tf, "Variant : Area Pricing", "Area pricing overrides link variant ID to area ID for localized tariffs.")
add_bullet_point(tf, "Geospatial Indexing", "Stores and Delivery Partners indexed with 2dsphere GeoJSON points.")
add_bullet_point(tf, "Referential Integrity", "ObjectIds with Mongoose population for orders, items, and users.")

# ==============================================================================
# SLIDE 12: Data Dictionary — Users & Stores
# ==============================================================================
slide12 = prs.slides.add_slide(blank_layout)
set_slide_background(slide12, LIGHT_BG)
add_header(slide12, "Data Dictionary: Users & Stores Collections")

# Table 1: Users
add_card(slide12, 0.8, 1.5, 5.7, 5.2)
tb = slide12.shapes.add_textbox(Inches(1.0), Inches(1.6), Inches(5.3), Inches(0.4))
tb.text_frame.paragraphs[0].text = "Collection 1: users (Customers & Staff)"
tb.text_frame.paragraphs[0].font.bold = True
tb.text_frame.paragraphs[0].font.size = Pt(13)
tb.text_frame.paragraphs[0].font.color.rgb = NAVY

table1_shape = slide12.shapes.add_table(6, 4, Inches(1.0), Inches(2.1), Inches(5.3), Inches(4.3))
t1 = table1_shape.table
t1.columns[0].width = Inches(1.2)
t1.columns[1].width = Inches(0.9)
t1.columns[2].width = Inches(1.1)
t1.columns[3].width = Inches(2.1)

headers = ["Field Name", "Type", "Constraints", "Description"]
for i, h in enumerate(headers):
    t1.cell(0, i).text = h

user_rows = [
    ("_id", "ObjectId", "PK, Required", "Unique identifier of the user document"),
    ("name", "String", "Required, Indexed", "Customer / partner full legal name"),
    ("phone", "String", "Unique, Required", "E.164 mobile number (+91...)"),
    ("role", "String", "Enum (4 roles)", "CUSTOMER, STORE_STAFF, RIDER, ADMIN"),
    ("walletBalance", "Number", "Default: 0, Min: 0", "In-app balance for fast refunds & pay"),
]
for r_idx, row in enumerate(user_rows):
    for c_idx, val in enumerate(row):
        t1.cell(r_idx + 1, c_idx).text = val
style_table(t1)

# Table 2: Stores
add_card(slide12, 6.8, 1.5, 5.7, 5.2)
tb = slide12.shapes.add_textbox(Inches(7.0), Inches(1.6), Inches(5.3), Inches(0.4))
tb.text_frame.paragraphs[0].text = "Collection 2: stores (Dark Store Hubs)"
tb.text_frame.paragraphs[0].font.bold = True
tb.text_frame.paragraphs[0].font.size = Pt(13)
tb.text_frame.paragraphs[0].font.color.rgb = NAVY

table2_shape = slide12.shapes.add_table(6, 4, Inches(7.0), Inches(2.1), Inches(5.3), Inches(4.3))
t2 = table2_shape.table
t2.columns[0].width = Inches(1.2)
t2.columns[1].width = Inches(0.9)
t2.columns[2].width = Inches(1.1)
t2.columns[3].width = Inches(2.1)

for i, h in enumerate(headers):
    t2.cell(0, i).text = h

store_rows = [
    ("_id", "ObjectId", "PK, Required", "Unique identifier of the store hub"),
    ("code", "String", "Unique, Indexed", "Hub operational code (e.g. STO-01)"),
    ("name", "String", "Required", "Dark store name (e.g. Tragad Hub)"),
    ("geoCoordinates", "Object", "2dsphere Point", "[longitude, latitude] for geospatial lookup"),
    ("isOnShift", "Boolean", "Default: true", "Active shift status for order fulfillment"),
]
for r_idx, row in enumerate(store_rows):
    for c_idx, val in enumerate(row):
        t2.cell(r_idx + 1, c_idx).text = val
style_table(t2)

# ==============================================================================
# SLIDE 13: Data Dictionary — Products & Product Variants
# ==============================================================================
slide13 = prs.slides.add_slide(blank_layout)
set_slide_background(slide13, LIGHT_BG)
add_header(slide13, "Data Dictionary: Products & Product Variants")

# Table 3: Products
add_card(slide13, 0.8, 1.5, 5.7, 5.2)
tb = slide13.shapes.add_textbox(Inches(1.0), Inches(1.6), Inches(5.3), Inches(0.4))
tb.text_frame.paragraphs[0].text = "Collection 3: products (Catalog Master)"
tb.text_frame.paragraphs[0].font.bold = True
tb.text_frame.paragraphs[0].font.size = Pt(13)
tb.text_frame.paragraphs[0].font.color.rgb = NAVY

table3_shape = slide13.shapes.add_table(6, 4, Inches(1.0), Inches(2.1), Inches(5.3), Inches(4.3))
t3 = table3_shape.table
t3.columns[0].width = Inches(1.2)
t3.columns[1].width = Inches(0.9)
t3.columns[2].width = Inches(1.1)
t3.columns[3].width = Inches(2.1)

for i, h in enumerate(headers):
    t3.cell(0, i).text = h

product_rows = [
    ("_id", "ObjectId", "PK, Required", "Unique master product identifier"),
    ("name", "String", "Required, Indexed", "Product display name (e.g. Fresh Tomato)"),
    ("slug", "String", "Unique, Indexed", "URL slug for web SEO / routing"),
    ("categoryId", "ObjectId", "FK -> categories", "Product categorization link"),
    ("basePrice", "Number", "Min: 0, Required", "Global default fallback price (₹11)"),
]
for r_idx, row in enumerate(product_rows):
    for c_idx, val in enumerate(row):
        t3.cell(r_idx + 1, c_idx).text = val
style_table(t3)

# Table 4: Product Variants
add_card(slide13, 6.8, 1.5, 5.7, 5.2)
tb = slide13.shapes.add_textbox(Inches(7.0), Inches(1.6), Inches(5.3), Inches(0.4))
tb.text_frame.paragraphs[0].text = "Collection 4: product_variants (Weight Variants)"
tb.text_frame.paragraphs[0].font.bold = True
tb.text_frame.paragraphs[0].font.size = Pt(13)
tb.text_frame.paragraphs[0].font.color.rgb = NAVY

table4_shape = slide13.shapes.add_table(6, 4, Inches(7.0), Inches(2.1), Inches(5.3), Inches(4.3))
t4 = table4_shape.table
t4.columns[0].width = Inches(1.2)
t4.columns[1].width = Inches(0.9)
t4.columns[2].width = Inches(1.1)
t4.columns[3].width = Inches(2.1)

for i, h in enumerate(headers):
    t4.cell(0, i).text = h

variant_rows = [
    ("_id", "ObjectId", "PK, Required", "Unique variant identifier"),
    ("productId", "ObjectId", "FK -> products", "Parent product identifier"),
    ("label", "String", "Required", "Packaging quantity (250 g, 500 g, 1 kg)"),
    ("price", "Number", "Required", "Default base selling price for variant"),
    ("mrp", "Number", "Required", "Maximum retail price for discount calculation"),
]
for r_idx, row in enumerate(variant_rows):
    for c_idx, val in enumerate(row):
        t4.cell(r_idx + 1, c_idx).text = val
style_table(t4)

# ==============================================================================
# SLIDE 14: Data Dictionary — Dynamic Area Pricing
# ==============================================================================
slide14 = prs.slides.add_slide(blank_layout)
set_slide_background(slide14, LIGHT_BG)
add_header(slide14, "Data Dictionary: Dynamic Area Pricing Overrides")

# Main Table 5: area_pricing
add_card(slide14, 0.8, 1.5, 7.8, 5.2)
tb = slide14.shapes.add_textbox(Inches(1.0), Inches(1.6), Inches(7.4), Inches(0.4))
tb.text_frame.paragraphs[0].text = "Collection 5: area_pricing (Area Specific Price Overrides)"
tb.text_frame.paragraphs[0].font.bold = True
tb.text_frame.paragraphs[0].font.size = Pt(13)
tb.text_frame.paragraphs[0].font.color.rgb = NAVY

table5_shape = slide14.shapes.add_table(7, 4, Inches(1.0), Inches(2.1), Inches(7.4), Inches(4.3))
t5 = table5_shape.table
t5.columns[0].width = Inches(1.5)
t5.columns[1].width = Inches(1.1)
t5.columns[2].width = Inches(1.6)
t5.columns[3].width = Inches(3.2)

for i, h in enumerate(headers):
    t5.cell(0, i).text = h

area_price_rows = [
    ("_id", "ObjectId", "PK, Required", "Unique area override record ID"),
    ("variantId", "ObjectId / Str", "Indexed, Compound", "Specific variant ID being overridden"),
    ("areaId", "ObjectId / Str", "Indexed, Compound", "Target geographical delivery area ID"),
    ("price", "Number", "Required, Min: 0", "Localized selling price (e.g. Tomato 250g = ₹7)"),
    ("mrp", "Number", "Optional", "Localized MRP for discount calculation (₹15)"),
    ("isAvailable", "Boolean", "Default: true", "Availability flag for this specific area"),
]
for r_idx, row in enumerate(area_price_rows):
    for c_idx, val in enumerate(row):
        t5.cell(r_idx + 1, c_idx).text = val
style_table(t5)

# Side explanation card
add_card(slide14, 8.8, 1.5, 3.7, 5.2)
tb = slide14.shapes.add_textbox(Inches(9.0), Inches(1.7), Inches(3.3), Inches(4.8))
tf = tb.text_frame
tf.word_wrap = True
tf.paragraphs[0].text = "Indexing & Query Optimization"
tf.paragraphs[0].font.size = Pt(15)
tf.paragraphs[0].font.bold = True
tf.paragraphs[0].font.color.rgb = NAVY
tf.paragraphs[0].space_after = Pt(10)
add_bullet_point(tf, "Compound Unique Index", "{ variantId: 1, areaId: 1 } ensures instantaneous query response under 2ms.")
add_bullet_point(tf, "Type Resilience", "Matches both MongoDB BSON ObjectId and hex string representations.")
add_bullet_point(tf, "Business Advantage", "Enables hyper-local price discrimination based on area purchasing power and supply chain costs.")
add_bullet_point(tf, "Zero Data Redundancy", "Only overrides are stored; products without overrides fall back to base catalog.")

# ==============================================================================
# SLIDE 15: Data Dictionary — Orders & Print Orders
# ==============================================================================
slide15 = prs.slides.add_slide(blank_layout)
set_slide_background(slide15, LIGHT_BG)
add_header(slide15, "Data Dictionary: Orders & Cloud Print Orders")

# Table 6: Orders
add_card(slide15, 0.8, 1.5, 5.7, 5.2)
tb = slide15.shapes.add_textbox(Inches(1.0), Inches(1.6), Inches(5.3), Inches(0.4))
tb.text_frame.paragraphs[0].text = "Collection 6: orders (Grocery & Essentials)"
tb.text_frame.paragraphs[0].font.bold = True
tb.text_frame.paragraphs[0].font.size = Pt(13)
tb.text_frame.paragraphs[0].font.color.rgb = NAVY

table6_shape = slide15.shapes.add_table(6, 4, Inches(1.0), Inches(2.1), Inches(5.3), Inches(4.3))
t6 = table6_shape.table
t6.columns[0].width = Inches(1.2)
t6.columns[1].width = Inches(0.9)
t6.columns[2].width = Inches(1.1)
t6.columns[3].width = Inches(2.1)

for i, h in enumerate(headers):
    t6.cell(0, i).text = h

order_rows = [
    ("_id", "ObjectId", "PK, Required", "Unique order identifier"),
    ("orderNumber", "String", "Unique, Indexed", "Human readable tracking ID (e.g. WUP-8492)"),
    ("userId", "ObjectId", "FK -> users", "Customer placing the order"),
    ("storeId", "ObjectId", "FK -> stores", "Assigned fulfilling dark store"),
    ("status", "String", "Enum (6 states)", "PLACED, PACKING, PACKED, DISPATCHED, DELIVERED"),
]
for r_idx, row in enumerate(order_rows):
    for c_idx, val in enumerate(row):
        t6.cell(r_idx + 1, c_idx).text = val
style_table(t6)

# Table 7: Print Orders
add_card(slide15, 6.8, 1.5, 5.7, 5.2)
tb = slide15.shapes.add_textbox(Inches(7.0), Inches(1.6), Inches(5.3), Inches(0.4))
tb.text_frame.paragraphs[0].text = "Collection 7: print_orders (Cloud Printing)"
tb.text_frame.paragraphs[0].font.bold = True
tb.text_frame.paragraphs[0].font.size = Pt(13)
tb.text_frame.paragraphs[0].font.color.rgb = NAVY

table7_shape = slide15.shapes.add_table(6, 4, Inches(7.0), Inches(2.1), Inches(5.3), Inches(4.3))
t7 = table7_shape.table
t7.columns[0].width = Inches(1.2)
t7.columns[1].width = Inches(0.9)
t7.columns[2].width = Inches(1.1)
t7.columns[3].width = Inches(2.1)

for i, h in enumerate(headers):
    t7.cell(0, i).text = h

print_rows = [
    ("_id", "ObjectId", "PK, Required", "Unique print order identifier"),
    ("fileUrl", "String", "Required", "Encrypted Cloudinary document link"),
    ("pageCount", "Number", "Min: 1", "Total detected pages to print"),
    ("colorType", "String", "B&W | Color", "Monochrome (₹2) or Full Color (₹10)"),
    ("bindingType", "String", "None | Spiral | Hard", "Post-processing binding selection"),
]
for r_idx, row in enumerate(print_rows):
    for c_idx, val in enumerate(row):
        t7.cell(r_idx + 1, c_idx).text = val
style_table(t7)

# ==============================================================================
# SLIDE 16: Data Dictionary — Delivery Fleet & Payout Rates
# ==============================================================================
slide16 = prs.slides.add_slide(blank_layout)
set_slide_background(slide16, LIGHT_BG)
add_header(slide16, "Data Dictionary: Delivery Partners & Payout Rates")

# Table 8: Delivery Partners
add_card(slide16, 0.8, 1.5, 5.7, 5.2)
tb = slide16.shapes.add_textbox(Inches(1.0), Inches(1.6), Inches(5.3), Inches(0.4))
tb.text_frame.paragraphs[0].text = "Collection 8: delivery_partners (Riders)"
tb.text_frame.paragraphs[0].font.bold = True
tb.text_frame.paragraphs[0].font.size = Pt(13)
tb.text_frame.paragraphs[0].font.color.rgb = NAVY

table8_shape = slide16.shapes.add_table(6, 4, Inches(1.0), Inches(2.1), Inches(5.3), Inches(4.3))
t8 = table8_shape.table
t8.columns[0].width = Inches(1.2)
t8.columns[1].width = Inches(0.9)
t8.columns[2].width = Inches(1.1)
t8.columns[3].width = Inches(2.1)

for i, h in enumerate(headers):
    t8.cell(0, i).text = h

rider_rows = [
    ("_id", "ObjectId", "PK, Required", "Unique delivery partner identifier"),
    ("partnerCode", "String", "Unique, Indexed", "Rider badge code (e.g. RDR-6190)"),
    ("vehicleType", "String", "BIKE | EV | SCOOTER", "Mode of express transportation"),
    ("isOnline", "Boolean", "Indexed", "Real-time duty shift status"),
    ("rating", "Number", "Range: 1.0 - 5.0", "Rolling average customer satisfaction rating"),
]
for r_idx, row in enumerate(rider_rows):
    for c_idx, val in enumerate(row):
        t8.cell(r_idx + 1, c_idx).text = val
style_table(t8)

# Table 9: Payout Rates
add_card(slide16, 6.8, 1.5, 5.7, 5.2)
tb = slide16.shapes.add_textbox(Inches(7.0), Inches(1.6), Inches(5.3), Inches(0.4))
tb.text_frame.paragraphs[0].text = "Collection 9: rider_payout_rates (Tariffs)"
tb.text_frame.paragraphs[0].font.bold = True
tb.text_frame.paragraphs[0].font.size = Pt(13)
tb.text_frame.paragraphs[0].font.color.rgb = NAVY

table9_shape = slide16.shapes.add_table(6, 4, Inches(7.0), Inches(2.1), Inches(5.3), Inches(4.3))
t9 = table9_shape.table
t9.columns[0].width = Inches(1.2)
t9.columns[1].width = Inches(0.9)
t9.columns[2].width = Inches(1.1)
t9.columns[3].width = Inches(2.1)

for i, h in enumerate(headers):
    t9.cell(0, i).text = h

payout_rows = [
    ("_id", "ObjectId", "PK, Required", "Unique tariff structure identifier"),
    ("scope", "String", "GLOBAL | CITY | AREA", "Granularity level of payout tariff"),
    ("basePay", "Number", "Min: 0", "Guaranteed compensation per pickup (₹35)"),
    ("perKmRate", "Number", "Min: 0", "Distance compensation per kilometer (₹12)"),
    ("surgeMultiplier", "Number", "Default: 1.0", "Weather/traffic demand pricing multiplier"),
]
for r_idx, row in enumerate(payout_rows):
    for c_idx, val in enumerate(row):
        t9.cell(r_idx + 1, c_idx).text = val
style_table(t9)

# ==============================================================================
# SLIDE 17: Core Business Logic & Algorithms
# ==============================================================================
slide17 = prs.slides.add_slide(blank_layout)
set_slide_background(slide17, LIGHT_BG)
add_header(slide17, "Core Business Logic & Algorithms")

# Algorithm 1: Dynamic Area Pricing
add_card(slide17, 0.8, 1.5, 3.7, 5.2)
tb = slide17.shapes.add_textbox(Inches(1.0), Inches(1.7), Inches(3.3), Inches(4.8))
tf = tb.text_frame
tf.word_wrap = True
tf.paragraphs[0].text = "Algorithm 1: Area Pricing Fallback"
tf.paragraphs[0].font.size = Pt(15)
tf.paragraphs[0].font.bold = True
tf.paragraphs[0].font.color.rgb = NAVY
tf.paragraphs[0].space_after = Pt(10)
add_bullet_point(tf, "Step 1: Geolocation", "Extract customer coordinates; resolve target Area ID and Store ID.")
add_bullet_point(tf, "Step 2: Area Query", "Lookup area_pricing for matching { variantId, areaId }.")
add_bullet_point(tf, "Step 3: Override Decision", "If found -> display localized price (₹7) & calculate discount %.")
add_bullet_point(tf, "Step 4: Default Fallback", "If not found -> display catalog default price (₹11).")

# Algorithm 2: Dynamic Rider Payout
add_card(slide17, 4.8, 1.5, 3.7, 5.2)
tb = slide17.shapes.add_textbox(Inches(5.0), Inches(1.7), Inches(3.3), Inches(4.8))
tf = tb.text_frame
tf.word_wrap = True
tf.paragraphs[0].text = "Algorithm 2: Dynamic Payout"
tf.paragraphs[0].font.size = Pt(15)
tf.paragraphs[0].font.bold = True
tf.paragraphs[0].font.color.rgb = INDIGO
tf.paragraphs[0].space_after = Pt(10)
add_bullet_point(tf, "Step 1: Distance Resolution", "Compute road distance D between store hub and customer doorstep.")
add_bullet_point(tf, "Step 2: Rate Hierarchy", "Fetch tariff with precedence: Area Rate -> City Rate -> Global Rate.")
add_bullet_point(tf, "Step 3: Formula Execution", "Payout = (BasePay + D × PerKmRate) × SurgeMultiplier.")
add_bullet_point(tf, "Step 4: Wallet Credit", "Atomically credit rider wallet upon verified delivery OTP.")

# Algorithm 3: 10-Minute SLA Dispatch
add_card(slide17, 8.8, 1.5, 3.7, 5.2)
tb = slide17.shapes.add_textbox(Inches(9.0), Inches(1.7), Inches(3.3), Inches(4.8))
tf = tb.text_frame
tf.word_wrap = True
tf.paragraphs[0].text = "Algorithm 3: Proximity Dispatch"
tf.paragraphs[0].font.size = Pt(15)
tf.paragraphs[0].font.bold = True
tf.paragraphs[0].font.color.rgb = EMERALD
tf.paragraphs[0].space_after = Pt(10)
add_bullet_point(tf, "Step 1: Geo-Filtering", "MongoDB $nearSphere query selects online riders within 1.5 km.")
add_bullet_point(tf, "Step 2: Load Balancing", "Riders scored by rating, current queue, and proximity.")
add_bullet_point(tf, "Step 3: Timeout Ping", "Dispatches ping with 45-second acceptance countdown.")
add_bullet_point(tf, "Step 4: Auto-Escalation", "If rejected or expired, immediately cascades to next best candidate.")

# ==============================================================================
# SLIDE 18: Security, Validation & Transaction Integrity
# ==============================================================================
slide18 = prs.slides.add_slide(blank_layout)
set_slide_background(slide18, LIGHT_BG)
add_header(slide18, "Security Architecture & Transaction Integrity")

sec_data = [
    ("Stateless JWT Authentication", "Tokens signed using HS256 secret key; refresh token rotation prevents replay attacks. Strict 15-minute access token lifespan.", CYAN),
    ("Role-Based Access Control (RBAC)", "NestJS guards enforce strict permissions: CUSTOMER, STORE_STAFF, RIDER, and ADMIN roles across all API controller routes.", INDIGO),
    ("Geofencing Validation", "Prevents unauthorized orders placed outside delivery perimeter; protects 10-minute delivery promise and logistics safety.", AMBER),
    ("Atomic Database Transactions", "Stock decrement, payment confirmation, and loyalty coin deductions execute inside MongoDB session transactions to prevent race conditions.", EMERALD),
    ("Input Validation & Sanitization", "DTO validation via class-validator and Zod prevents NoSQL injection, XSS attacks, and malformed payload exploits.", PINK),
    ("Document Privacy Shredder", "Uploaded print documents are protected by encrypted signed URLs; auto-deleted from Cloudinary within 24 hours of fulfillment.", DARK_BLUE),
]

for idx, (s_title, s_desc, s_color) in enumerate(sec_data):
    row = idx // 3
    col = idx % 3
    x = 0.8 + (col * 3.96)
    y = 1.5 + (row * 2.65)
    add_card(slide18, x, y, 3.8, 2.45, border_color=s_color)
    tb = slide18.shapes.add_textbox(Inches(x + 0.15), Inches(y + 0.15), Inches(3.5), Inches(2.15))
    tf = tb.text_frame
    tf.word_wrap = True
    tf.paragraphs[0].text = s_title
    tf.paragraphs[0].font.size = Pt(13)
    tf.paragraphs[0].font.bold = True
    tf.paragraphs[0].font.color.rgb = NAVY
    tf.paragraphs[0].space_after = Pt(8)
    
    p = tf.add_paragraph()
    p.text = s_desc
    p.font.size = Pt(10)
    p.font.color.rgb = DARK_TEXT

# ==============================================================================
# SLIDE 19: Technology Stack & Implementation Mapping
# ==============================================================================
slide19 = prs.slides.add_slide(blank_layout)
set_slide_background(slide19, LIGHT_BG)
add_header(slide19, "Technology Stack & Framework Mapping")

tech_categories = [
    ("Frontend Web & Admin", [
        ("React 19", "Modern component lifecycle, Hooks & concurrent rendering"),
        ("TypeScript", "Strict type-safety across models, props & API services"),
        ("Vite", "Ultra-fast HMR and optimized production bundle builds"),
        ("Lucide React", "Lightweight vector icon set with consistent design system"),
    ], INDIGO),
    ("Mobile Applications", [
        ("React Native", "Native performance on iOS and Android devices"),
        ("Expo Framework", "Fast iteration, native sensor access & unified builds"),
        ("React Navigation", "Stack and tab navigation with native transition animations"),
        ("Expo Location", "Background and foreground GPS coordinate tracking"),
    ], CYAN),
    ("Backend & Database", [
        ("NestJS & Node.js", "Enterprise modular architecture with dependency injection"),
        ("MongoDB Atlas", "Distributed NoSQL database with geospatial indexing"),
        ("Socket.IO", "Low-latency bidirectional WebSocket communication"),
        ("Cloudinary CDN", "Automated asset optimization and secure document storage"),
    ], EMERALD),
]

for idx, (cat_title, items, border_c) in enumerate(tech_categories):
    x = 0.8 + (idx * 3.96)
    add_card(slide19, x, 1.5, 3.8, 5.2, border_color=border_c)
    tb = slide19.shapes.add_textbox(Inches(x + 0.15), Inches(1.7), Inches(3.5), Inches(4.8))
    tf = tb.text_frame
    tf.word_wrap = True
    tf.paragraphs[0].text = cat_title
    tf.paragraphs[0].font.size = Pt(15)
    tf.paragraphs[0].font.bold = True
    tf.paragraphs[0].font.color.rgb = NAVY
    tf.paragraphs[0].space_after = Pt(12)
    
    for item_title, item_desc in items:
        add_bullet_point(tf, item_title, item_desc, title_color=NAVY, desc_color=DARK_TEXT, pt_size=11)

# ==============================================================================
# SLIDE 20: Project Work Completed vs Reporting 2 Milestones
# ==============================================================================
slide20 = prs.slides.add_slide(blank_layout)
set_slide_background(slide20, LIGHT_BG)
add_header(slide20, "Work Completed vs Reporting 2 Milestones")

milestones = [
    ("Milestone 1: SRS & System Architecture Formulation", "100%", EMERALD, "Complete multi-tier architectural specification and API contracts."),
    ("Milestone 2: Database Schema & Entity Normalization", "100%", EMERALD, "Designed and deployed 9 core collections on MongoDB Atlas cluster."),
    ("Milestone 3: Customer Web Catalog & Geofencing", "100%", EMERALD, "Live catalog with variant switching and automatic area resolution."),
    ("Milestone 4: Dynamic Area Pricing Override Engine", "100%", EMERALD, "Admin override portal linked to MongoDB compound indices."),
    ("Milestone 5: Dark Store Picking, Packing & Shift State", "100%", EMERALD, "Digital pick-lists, bin locations (A1-R1), and shift toggles."),
    ("Milestone 6: Rider Fleet Telemetry & Order Dispatch", "100%", EMERALD, "Real-time GPS tracking and dynamic distance payout tariffs."),
    ("Milestone 7: Cloud Printing & Document Fulfillment", "100%", EMERALD, "Encrypted uploads, auto page count, and 15-minute print dispatch."),
    ("Milestone 8: Central Admin Portal & User Management", "100%", EMERALD, "Customer and rider editing, pricing controls, and revenue audit."),
]

for idx, (m_title, m_pct, m_color, m_desc) in enumerate(milestones):
    row = idx // 2
    col = idx % 2
    x = 0.8 + (col * 5.95)
    y = 1.5 + (row * 1.32)
    add_card(slide20, x, y, 5.75, 1.18, border_color=BORDER_CLR)
    
    tb = slide20.shapes.add_textbox(Inches(x + 0.15), Inches(y + 0.1), Inches(4.5), Inches(0.98))
    tf = tb.text_frame
    tf.word_wrap = True
    p1 = tf.paragraphs[0]
    p1.text = m_title
    p1.font.size = Pt(11.5)
    p1.font.bold = True
    p1.font.color.rgb = NAVY
    
    p2 = tf.add_paragraph()
    p2.text = m_desc
    p2.font.size = Pt(9.5)
    p2.font.color.rgb = SLATE
    
    # Badge
    badge = slide20.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(x + 4.75), Inches(y + 0.35), Inches(0.85), Inches(0.42))
    badge.fill.solid()
    badge.fill.fore_color.rgb = RGBColor(240, 253, 244)
    badge.line.color.rgb = EMERALD
    badge.line.width = Pt(1)
    tf_b = badge.text_frame
    p_b = tf_b.paragraphs[0]
    p_b.alignment = PP_ALIGN.CENTER
    p_b.text = m_pct
    p_b.font.size = Pt(11)
    p_b.font.bold = True
    p_b.font.color.rgb = EMERALD

# ==============================================================================
# SLIDE 21: Next Steps & Roadmap for Reporting 3
# ==============================================================================
slide21 = prs.slides.add_slide(blank_layout)
set_slide_background(slide21, LIGHT_BG)
add_header(slide21, "Roadmap to Reporting 3 & Final Submission")

phases = [
    ("Phase 1: Payment Gateway Webhooks", "Production integration with Razorpay & Cashfree; automated refund processing on order cancellations.", INDIGO),
    ("Phase 2: ML Demand Forecasting", "Predictive demand model for dark store stock replenishment to prevent stockouts of perishable items.", CYAN),
    ("Phase 3: Multi-Order Rider Batching", "Algorithmic routing to bundle multiple orders headed in the same delivery corridor.", AMBER),
    ("Phase 4: Concurrency & Stress Testing", "Load testing with Apache JMeter / Artillery to validate 1000+ simultaneous WebSocket orders.", PINK),
    ("Phase 5: Cloud Deployment & Hardening", "Containerization using Docker; orchestration on Kubernetes/AWS ECS with CI/CD pipeline.", EMERALD),
]

for idx, (p_title, p_desc, p_color) in enumerate(phases):
    y = 1.5 + (idx * 1.05)
    add_card(slide21, 0.8, y, 11.733, 0.92, border_color=p_color)
    
    tb = slide21.shapes.add_textbox(Inches(1.0), Inches(y + 0.12), Inches(11.3), Inches(0.7))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    run_t = p.add_run()
    run_t.text = f"{p_title} — "
    run_t.font.bold = True
    run_t.font.size = Pt(12.5)
    run_t.font.color.rgb = NAVY
    
    run_d = p.add_run()
    run_d.text = p_desc
    run_d.font.size = Pt(11)
    run_d.font.color.rgb = DARK_TEXT

# ==============================================================================
# SLIDE 22: Conclusion & Q&A Slide (Dark Theme)
# ==============================================================================
slide22 = prs.slides.add_slide(blank_layout)
set_slide_background(slide22, NAVY)

tb = slide22.shapes.add_textbox(Inches(1.0), Inches(2.0), Inches(11.333), Inches(3.5))
tf = tb.text_frame
tf.word_wrap = True

p_badge = tf.paragraphs[0]
p_badge.text = "REPORTING 2 PRESENTATION COMPLETE"
p_badge.font.size = Pt(13)
p_badge.font.bold = True
p_badge.font.color.rgb = PINK
p_badge.space_after = Pt(16)

p_main = tf.add_paragraph()
p_main.text = "Thank You! Ready for Demonstration & Committee Q&A"
p_main.font.size = Pt(30)
p_main.font.bold = True
p_main.font.color.rgb = WHITE
p_main.space_after = Pt(16)

p_sub = tf.add_paragraph()
p_sub.text = "All project modules, real-time WebSockets, area pricing engines, and dark store portals are active.\nSwitching to live application demonstration on screen."
p_sub.font.size = Pt(15)
p_sub.font.color.rgb = RGBColor(203, 213, 225)
p_sub.space_after = Pt(30)

p_meta = tf.add_paragraph()
p_meta.text = "WormUp — Modern Hyperlocal Quick Commerce & Dark Store Infrastructure"
p_meta.font.size = Pt(12)
p_meta.font.bold = True
p_meta.font.color.rgb = EMERALD

# Save Presentation
output_path = 'WormUp_Mini_Project_Reporting_2.pptx'
prs.save(output_path)
print(f"Presentation saved successfully to {output_path} ({len(prs.slides)} slides)!")
