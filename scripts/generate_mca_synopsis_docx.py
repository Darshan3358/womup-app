import os
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('w:top', top), ('w:bottom', bottom), ('w:left', left), ('w:right', right)]:
        node = OxmlElement(m)
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def set_cell_background(cell, color_hex):
    shading_xml = f'<w:shd {nsdecls("w")} w:fill="{color_hex}"/>'
    cell._tc.get_or_add_tcPr().append(parse_xml(shading_xml))

def set_table_borders(table, color="D1D5DB", sz="4", val="single"):
    tblPr = table._tbl.tblPr
    borders_xml = f'''
    <w:tblBorders {nsdecls("w")}>
        <w:top w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>
        <w:bottom w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>
        <w:left w:val="none"/>
        <w:right w:val="none"/>
        <w:insideH w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>
        <w:insideV w:val="none"/>
    </w:tblBorders>
    '''
    tblPr.append(parse_xml(borders_xml))

def create_simple_mca_synopsis():
    doc = Document()

    # 1 inch margins all around
    for section in doc.sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)

    # Colors
    NAVY = RGBColor(7, 27, 82)        # Primary Title & Headings
    DARK_TEXT = RGBColor(31, 41, 55)  # Body text
    MUTED_TEXT = RGBColor(75, 85, 99) # Sub-notes
    BLACK = RGBColor(17, 24, 39)

    # Helper: Heading 1
    def add_h1(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(16)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.name = 'Calibri'
        run.font.size = Pt(15)
        run.font.bold = True
        run.font.color.rgb = NAVY
        return p

    # Helper: Heading 2
    def add_h2(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(10)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.name = 'Calibri'
        run.font.size = Pt(12)
        run.font.bold = True
        run.font.color.rgb = NAVY
        return p

    # Helper: Body Text
    def add_body(text, space_after=6):
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.line_spacing = 1.15
        run = p.add_run(text)
        run.font.name = 'Calibri'
        run.font.size = Pt(11)
        run.font.color.rgb = DARK_TEXT
        return p

    # Helper: Bullet Item
    def add_bullet(bold_label, text):
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.line_spacing = 1.15
        r_b = p.add_run(bold_label + ": ")
        r_b.font.name = 'Calibri'
        r_b.font.size = Pt(11)
        r_b.font.bold = True
        r_b.font.color.rgb = BLACK
        r_t = p.add_run(text)
        r_t.font.name = 'Calibri'
        r_t.font.size = Pt(11)
        r_t.font.color.rgb = DARK_TEXT
        return p

    # ---------------------------------------------------------
    # 1. TITLE PAGE
    # ---------------------------------------------------------
    title_p = doc.add_paragraph()
    title_p.paragraph_format.space_before = Pt(40)
    title_p.paragraph_format.space_after = Pt(12)
    title_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    
    r_sub = title_p.add_run("PROJECT SYNOPSIS\n")
    r_sub.font.name = 'Calibri'
    r_sub.font.size = Pt(13)
    r_sub.font.bold = True
    r_sub.font.color.rgb = MUTED_TEXT

    r_title = title_p.add_run("WOMUP — FAST GROCERY DELIVERY & DARK STORE PLATFORM\n")
    r_title.font.name = 'Calibri'
    r_title.font.size = Pt(21)
    r_title.font.bold = True
    r_title.font.color.rgb = NAVY

    r_tag = title_p.add_run("Online 10–15 Minute Grocery Ordering and Document Printing System")
    r_tag.font.name = 'Calibri'
    r_tag.font.size = Pt(12)
    r_tag.font.italic = True
    r_tag.font.color.rgb = DARK_TEXT

    # Degree note
    deg_p = doc.add_paragraph()
    deg_p.paragraph_format.space_before = Pt(36)
    deg_p.paragraph_format.space_after = Pt(36)
    deg_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_deg = deg_p.add_run(
        "Submitted for the degree of\n"
        "MASTER OF COMPUTER APPLICATIONS (MCA)\n"
        "Department of Computer Applications"
    )
    r_deg.font.name = 'Calibri'
    r_deg.font.size = Pt(11.5)
    r_deg.font.bold = True
    r_deg.font.color.rgb = DARK_TEXT

    # Two column table for Student & Guide details
    table_meta = doc.add_table(rows=1, cols=2)
    table_meta.alignment = WD_TABLE_ALIGNMENT.CENTER
    table_meta.autofit = False
    table_meta.columns[0].width = Inches(3.2)
    table_meta.columns[1].width = Inches(3.2)
    
    cell_left = table_meta.cell(0, 0)
    cell_right = table_meta.cell(0, 1)

    p_sub = cell_left.paragraphs[0]
    p_sub.paragraph_format.line_spacing = 1.2
    r1 = p_sub.add_run("SUBMITTED BY:\n")
    r1.font.name = 'Calibri'
    r1.font.size = Pt(11)
    r1.font.bold = True
    r1.font.color.rgb = NAVY
    r2 = p_sub.add_run("Student Name: Ayushi Thanki\nEnrollment / Roll No: [Your Roll No]\nCourse: MCA Final Year\nSemester: Semester 4")
    r2.font.name = 'Calibri'
    r2.font.size = Pt(10.5)
    r2.font.color.rgb = DARK_TEXT

    p_guide = cell_right.paragraphs[0]
    p_guide.paragraph_format.line_spacing = 1.2
    r3 = p_guide.add_run("INTERNAL GUIDE:\n")
    r3.font.name = 'Calibri'
    r3.font.size = Pt(11)
    r3.font.bold = True
    r3.font.color.rgb = NAVY
    r4 = p_guide.add_run("Guide Name: [Internal Guide Name]\nDesignation: Assistant Professor\nDepartment of Computer Applications")
    r4.font.name = 'Calibri'
    r4.font.size = Pt(10.5)
    r4.font.color.rgb = DARK_TEXT

    # College & Date
    coll_p = doc.add_paragraph()
    coll_p.paragraph_format.space_before = Pt(45)
    coll_p.paragraph_format.space_after = Pt(0)
    coll_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_coll = coll_p.add_run(
        "COLLEGE / UNIVERSITY: [Your College / University Name]\n"
        "ACADEMIC YEAR: 2024 – 2026\n"
        "SUBMISSION DATE: October 2026"
    )
    r_coll.font.name = 'Calibri'
    r_coll.font.size = Pt(11)
    r_coll.font.bold = True
    r_coll.font.color.rgb = NAVY

    doc.add_page_break()

    # ---------------------------------------------------------
    # 2. INTRODUCTION
    # ---------------------------------------------------------
    add_h1("1. INTRODUCTION")
    add_body(
        "WomUp is an online delivery platform designed to deliver daily groceries, fresh fruits, vegetables, dairy, and emergency document printouts in 10 to 15 minutes. Instead of shipping products from large warehouses outside the city, WomUp uses small neighborhood stores called 'Dark Stores' located within 2 to 3 kilometers of customers."
    )
    add_bullet(
        "Domain & Project Area",
        "E-Commerce, Web Development, and Local Delivery Management."
    )
    add_bullet(
        "Why This Project Matters",
        "People often need daily items like milk, vegetables, or important printed papers right away. Traditional shopping apps take hours or days to deliver. WomUp solves this problem by using nearby local stores so customers receive their orders quickly and accurately."
    )

    # ---------------------------------------------------------
    # 3. PROBLEM STATEMENT
    # ---------------------------------------------------------
    add_h1("2. PROBLEM STATEMENT")
    add_body(
        "Most current grocery delivery apps take several hours or the next day to deliver because they ship from large warehouses far outside the city. In addition, workers pack items by hand without barcode scanners, which causes wrong or missing items in the order. Current apps also charge the same fixed price across the entire city, with no special prices for local neighborhoods. Lastly, urgent services like document printing are completely missing from grocery apps."
    )

    # ---------------------------------------------------------
    # 4. OBJECTIVES
    # ---------------------------------------------------------
    add_h1("3. OBJECTIVES")
    add_body("The main goals of this project are:")
    add_bullet(
        "Fast 10 to 15 Minute Delivery",
        "Deliver daily groceries and essentials to customers in under 15 minutes."
    )
    add_bullet(
        "Quick 3-Minute Store Packing",
        "Help dark store staff pack items in less than 3 minutes using digital item lists."
    )
    add_bullet(
        "Zero Packing Mistakes",
        "Use barcode scanners so staff scan every product before packing, preventing wrong items."
    )
    add_bullet(
        "Area-Based Pricing",
        "Allow the admin to set special prices and discounts for different areas (for example, Chandlodiya or Bopal)."
    )
    add_bullet(
        "15-Minute Document Printing",
        "Allow customers to upload PDF documents and receive printed copies at their doorstep."
    )
    add_bullet(
        "Safe Delivery with OTP",
        "Confirm every delivery with a 4-digit OTP at the door, and automatically calculate delivery pay for the rider."
    )

    # ---------------------------------------------------------
    # 5. SCOPE
    # ---------------------------------------------------------
    add_h1("4. SCOPE OF THE PROJECT")
    add_h2("4.1 What the System Includes (In-Scope)")
    add_bullet("Customer Website", "Customers can choose their area, view products with local prices, select size variants (like 250g, 500g, 1kg), and place orders.")
    add_bullet("Dark Store Packing App", "Store staff receive orders on screen, see shelf numbers, scan barcodes, and pack sealed bags with QR codes.")
    add_bullet("Delivery Rider App", "Nearby riders accept trips, see live delivery status, confirm delivery using OTP, and check their earnings.")
    add_bullet("Admin Portal", "Admin can add products, manage store inventory, and change area prices from one screen.")

    add_h2("4.2 What is Excluded in Current Version (Out-of-Scope)")
    add_bullet("Inter-City Shipping", "The project is built only for local areas within 3 to 4 km of each store, not for delivery to other cities.")
    add_bullet("External Couriers", "Deliveries are handled by registered local riders, not third-party courier companies like FedEx or BlueDart.")

    # ---------------------------------------------------------
    # 6. METHODOLOGY
    # ---------------------------------------------------------
    add_h1("5. METHODOLOGY")
    add_body(
        "The project is developed using the Agile model. Work is completed step-by-step in five simple phases:"
    )

    # Simple Methodology Table
    table_meth = doc.add_table(rows=6, cols=2)
    table_meth.alignment = WD_TABLE_ALIGNMENT.CENTER
    table_meth.autofit = False
    table_meth.columns[0].width = Inches(2.0)
    table_meth.columns[1].width = Inches(4.5)
    set_table_borders(table_meth)

    meth_data = [
        ("Phase", "Work Done"),
        ("1. Requirement Analysis", "Studied how quick-commerce works, customer ordering needs, dark store packing steps, and delivery timings."),
        ("2. System Design", "Created database structure, table connections (ER diagram), and designed user-friendly screens for web and mobile."),
        ("3. Development", "Built customer website with React, backend server with Node.js / NestJS, and connected MongoDB database."),
        ("4. Testing", "Tested user login, product ordering, barcode scanning, live tracking updates, and OTP delivery verification."),
        ("5. Deployment", "Hosted website and server locally and on cloud for testing and presentation.")
    ]

    for row_idx, (col0, col1) in enumerate(meth_data):
        row = table_meth.rows[row_idx]
        cell0, cell1 = row.cells[0], row.cells[1]
        set_cell_margins(cell0)
        set_cell_margins(cell1)
        
        p0 = cell0.paragraphs[0]
        p1 = cell1.paragraphs[0]
        p0.paragraph_format.line_spacing = 1.15
        p1.paragraph_format.line_spacing = 1.15

        if row_idx == 0:
            set_cell_background(cell0, "071B52")
            set_cell_background(cell1, "071B52")
            r0 = p0.add_run(col0)
            r1 = p1.add_run(col1)
            r0.font.bold = True
            r1.font.bold = True
            r0.font.color.rgb = RGBColor(255, 255, 255)
            r1.font.color.rgb = RGBColor(255, 255, 255)
        else:
            if row_idx % 2 == 1:
                set_cell_background(cell0, "F8FAFC")
                set_cell_background(cell1, "F8FAFC")
            r0 = p0.add_run(col0)
            r1 = p1.add_run(col1)
            r0.font.bold = True
            r0.font.color.rgb = NAVY
            r1.font.color.rgb = DARK_TEXT

    doc.add_page_break()

    # ---------------------------------------------------------
    # 7. HARDWARE & SOFTWARE REQUIREMENTS
    # ---------------------------------------------------------
    add_h1("6. HARDWARE & SOFTWARE REQUIREMENTS")

    add_h2("6.1 Hardware Requirements")
    add_bullet("Computer / Laptop", "Intel Core i3 / i5 or AMD processor, 8 GB RAM, 256 GB SSD storage.")
    add_bullet("Dark Store Scanner", "Standard USB or wireless barcode scanner for scanning items.")
    add_bullet("Mobile Phones", "Android or iOS smartphone with internet and GPS for customer and rider apps.")

    add_h2("6.2 Software Requirements")
    add_bullet("Operating System", "Windows 10 / 11, macOS, or Linux.")
    add_bullet("Frontend", "React, TypeScript, HTML5, CSS.")
    add_bullet("Backend", "Node.js with NestJS / Express.js.")
    add_bullet("Database", "MongoDB (Atlas cloud database).")
    add_bullet("Live Updates", "Socket.IO for real-time tracking.")
    add_bullet("Tools & Code Editor", "Visual Studio Code, Postman, MongoDB Compass, Git.")

    # ---------------------------------------------------------
    # 8. MODULES
    # ---------------------------------------------------------
    add_h1("7. SYSTEM MODULES")
    add_body("The project is divided into 5 simple modules:")

    add_bullet(
        "Module 1: Customer Web Portal",
        "Allows customers to browse products, select size options (250g, 500g, 1kg), view local prices, add items to cart, and place orders."
    )
    add_bullet(
        "Module 2: Dark Store Packing System",
        "Gives store workers an order list showing shelf locations, lets them scan barcodes to verify each product, and seals the order in a bag."
    )
    add_bullet(
        "Module 3: Delivery Partner & Tracking System",
        "Finds the closest rider within 1.5 km, shows live delivery status, verifies delivery with a 4-digit OTP, and calculates the rider's pay based on kilometers."
    )
    add_bullet(
        "Module 4: Central Admin Portal",
        "Allows the admin to add new products, check store stock, manage riders, and set special prices for specific areas."
    )
    add_bullet(
        "Module 5: 15-Minute Document Printing",
        "Allows customers to upload PDF documents and receive printed, sealed copies at their home in 15 minutes."
    )

    # ---------------------------------------------------------
    # 9. EXPECTED OUTCOME
    # ---------------------------------------------------------
    add_h1("8. EXPECTED OUTCOME")
    add_body(
        "The project will deliver a complete, working quick-commerce system that makes local delivery fast and simple."
    )
    add_bullet(
        "For Customers",
        "Get groceries and urgent printouts delivered to their doorstep in 10 to 15 minutes with local area discounts."
    )
    add_bullet(
        "For Store Staff",
        "Fast packing in under 3 minutes with zero packing mistakes using barcode scanners."
    )
    add_bullet(
        "For Delivery Riders",
        "Easy order assignment and clear earnings based on distance traveled."
    )
    add_bullet(
        "For Administrators",
        "Full control over multiple stores, inventory, and area-based pricing from a single dashboard."
    )

    # ---------------------------------------------------------
    # 10. REFERENCES
    # ---------------------------------------------------------
    add_h1("9. REFERENCES")
    refs = [
        "React Official Documentation — https://react.dev/",
        "Node.js and Express Documentation — https://nodejs.org/ and https://expressjs.com/",
        "NestJS Documentation — https://docs.nestjs.com/",
        "MongoDB Atlas & Geospatial Manual — https://www.mongodb.com/docs/",
        "Socket.IO Real-Time Engine Documentation — https://socket.io/docs/v4/",
        "W3C HTML5 Geolocation API Guide — https://www.w3.org/TR/geolocation-API/"
    ]
    for r in refs:
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.line_spacing = 1.15
        r_run = p.add_run(r)
        r_run.font.name = 'Calibri'
        r_run.font.size = Pt(10)
        r_run.font.color.rgb = DARK_TEXT

    # Save Word document
    output_path = "/Users/thankiayushi/Desktop/WORM UP APP/WomUp_MCA_Project_Synopsis.docx"
    doc.save(output_path)
    print(f"Simple MCA Synopsis created successfully at: {output_path}")

if __name__ == "__main__":
    create_simple_mca_synopsis()
