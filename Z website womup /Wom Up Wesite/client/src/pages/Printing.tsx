import React, { useState } from 'react';
import { UploadCloud, FileText, Image, CreditCard, BookOpen, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';

export const Printing: React.FC = () => {
  // File upload state
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string>('');
  const [pageCount, setPageCount] = useState<number>(10);
  const [colorMode, setColorMode] = useState<'BW' | 'COLOR'>('BW');
  const [doubleSided, setDoubleSided] = useState<boolean>(true);
  const [binding, setBinding] = useState<'NONE' | 'SPIRAL' | 'LAMINATION'>('NONE');
  const [copies, setCopies] = useState<number>(1);
  const [orderSuccess, setOrderSuccess] = useState<boolean>(false);

  // Price calculations
  const perPagePrice = colorMode === 'BW' ? 3 : 10;
  const pagesTotal = doubleSided ? Math.ceil(pageCount / 2) : pageCount;
  const printCost = pagesTotal * perPagePrice * copies;

  let bindingCost = 0;
  if (binding === 'SPIRAL') bindingCost = 30 * copies;
  if (binding === 'LAMINATION') bindingCost = 15 * pageCount * copies;

  const deliveryFee = 20;
  const totalCost = printCost + bindingCost + deliveryFee;

  const handleSimulateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileName(file.name);
      setFileSize((file.size / (1024 * 1024)).toFixed(2) + ' MB');
      setPageCount(Math.floor(6 + Math.random() * 15));
    }
  };

  const handlePlacePrintOrder = () => {
    setOrderSuccess(true);
  };

  return (
    <div className="printing-page-root" style={{ padding: '32px 0 80px' }}>
      <div className="container">
        {/* ==============================================================
            Printing Hero Banner
            ============================================================== */}
        <div
          style={{
            background: 'linear-gradient(135deg, #071B52 0%, #162A6E 50%, #7856F6 100%)',
            borderRadius: '28px',
            color: '#FFFFFF',
            padding: '54px 64px',
            marginBottom: '44px',
            display: 'grid',
            gridTemplateColumns: '1.2fr 0.8fr',
            alignItems: 'center',
            gap: '40px',
            boxShadow: '0 16px 40px rgba(7, 27, 82, 0.25)',
          }}
        >
          <div>
            <span style={{ background: '#FF3B98', color: '#fff', padding: '5px 14px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase' }}>
              ⚡ 15-Minute Doorstep Prints
            </span>
            <h1 style={{ fontSize: '2.8rem', fontWeight: 800, color: '#FFFFFF', margin: '14px 0 8px', lineHeight: 1.15 }}>
              Cloud Printing Hub
            </h1>
            <p style={{ fontSize: '1.15rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, marginBottom: '28px' }}>
              Print Anything. Anytime. Fast • Easy • Reliable.<br />
              High-speed laser printing from nearest dark store. Delivered in sealed waterproof tamper-proof packaging.
            </p>

            <div style={{ display: 'flex', gap: '24px' }}>
              <div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FF5BAA' }}>₹3 / page</div>
                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>Laser Black & White</div>
              </div>
              <div style={{ borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: '24px' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#13B978' }}>₹10 / page</div>
                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>Gloss Color Printing</div>
              </div>
              <div style={{ borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: '24px' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF' }}>15 Mins</div>
                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>Doorstep Delivery</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <img
              src="https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&auto=format&fit=crop&q=80"
              alt="Printer Setup"
              style={{ width: '100%', maxWidth: '380px', height: '260px', objectFit: 'cover', borderRadius: '18px', boxShadow: '0 12px 30px rgba(0,0,0,0.3)' }}
            />
          </div>
        </div>

        {/* ==============================================================
            Drag & Drop Upload Area + Configurator
            ============================================================== */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '36px', alignItems: 'start' }}>
          {/* Left: Upload & Config */}
          <div style={{ background: '#FFFFFF', borderRadius: '24px', border: '1px solid #E6EAF2', padding: '32px', boxShadow: '0 4px 20px rgba(7, 27, 82, 0.04)' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#071B52', marginBottom: '20px' }}>
              1. Upload Your Document
            </h2>

            {/* Drag & Drop File Box */}
            <label
              style={{
                display: 'block',
                border: '2px dashed #7856F6',
                borderRadius: '16px',
                padding: '36px 20px',
                textAlign: 'center',
                backgroundColor: '#F8F2FF',
                cursor: 'pointer',
                transition: 'background 0.2s ease',
                marginBottom: '28px',
              }}
            >
              <input
                type="file"
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                onChange={handleSimulateUpload}
                style={{ display: 'none' }}
              />
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: '#FFFFFF',
                  color: '#7856F6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 14px',
                  boxShadow: '0 4px 12px rgba(120, 86, 246, 0.2)',
                }}
              >
                <UploadCloud size={32} />
              </div>

              {fileName ? (
                <div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#071B52' }}>
                    {fileName} ({fileSize})
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#13B978', fontWeight: 600, marginTop: '4px' }}>
                    ✓ Analyzed: {pageCount} pages detected
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#071B52' }}>
                    Drag & Drop PDF or Photos Here
                  </div>
                  <p style={{ color: '#667085', fontSize: '0.85rem', marginTop: '4px' }}>
                    Supports PDF, Word (DOCX), JPG, PNG • Max size 50 MB
                  </p>
                  <span className="btn-secondary" style={{ display: 'inline-flex', marginTop: '14px', padding: '8px 20px', fontSize: '0.85rem' }}>
                    Browse Files
                  </span>
                </div>
              )}
            </label>

            {/* Print Specification Controls */}
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#071B52', marginBottom: '16px' }}>
              2. Print Specifications
            </h3>

            {/* Color Mode */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#14224A', marginBottom: '8px' }}>
                Color Mode
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div
                  onClick={() => setColorMode('BW')}
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    border: colorMode === 'BW' ? '2px solid #FF3B98' : '1px solid #E6EAF2',
                    background: colorMode === 'BW' ? '#FFF1F8' : '#FAFAFC',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontWeight: 700, color: '#071B52' }}>Black & White Laser</div>
                  <div style={{ fontSize: '0.8rem', color: '#667085' }}>₹3 / page • Ideal for assignments & documents</div>
                </div>

                <div
                  onClick={() => setColorMode('COLOR')}
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    border: colorMode === 'COLOR' ? '2px solid #FF3B98' : '1px solid #E6EAF2',
                    background: colorMode === 'COLOR' ? '#FFF1F8' : '#FAFAFC',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontWeight: 700, color: '#071B52' }}>High-Res Color</div>
                  <div style={{ fontSize: '0.8rem', color: '#667085' }}>₹10 / page • Ideal for charts, photos & resumes</div>
                </div>
              </div>
            </div>

            {/* Sides & Orientation */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#14224A', marginBottom: '6px' }}>
                  Print Sides
                </label>
                <select
                  value={doubleSided ? 'both' : 'single'}
                  onChange={(e) => setDoubleSided(e.target.value === 'both')}
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #E6EAF2', outline: 'none', background: '#FAFAFC' }}
                >
                  <option value="both">Double-Sided (Back to Back - Saves Paper)</option>
                  <option value="single">Single-Sided (1 page per sheet)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#14224A', marginBottom: '6px' }}>
                  Number of Copies
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button
                    className="stepper-btn"
                    style={{ background: '#7856F6', width: '36px', height: '36px', borderRadius: '8px' }}
                    onClick={() => setCopies(Math.max(1, copies - 1))}
                  >
                    -
                  </button>
                  <span style={{ fontSize: '1.1rem', fontWeight: 800, minWidth: '30px', textAlign: 'center' }}>{copies}</span>
                  <button
                    className="stepper-btn"
                    style={{ background: '#7856F6', width: '36px', height: '36px', borderRadius: '8px' }}
                    onClick={() => setCopies(copies + 1)}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Finishing & Binding Addons */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#14224A', marginBottom: '8px' }}>
                Finishing & Binding
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                {[
                  { id: 'NONE', title: 'Corner Stapled', fee: 'Free' },
                  { id: 'SPIRAL', title: 'Spiral Binding', fee: '+₹30' },
                  { id: 'LAMINATION', title: 'Plastic Lamination', fee: '+₹15/pg' },
                ].map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setBinding(item.id as any)}
                    style={{
                      padding: '12px',
                      borderRadius: '10px',
                      border: binding === item.id ? '2px solid #7856F6' : '1px solid #E6EAF2',
                      background: binding === item.id ? '#F8F2FF' : '#FAFAFC',
                      cursor: 'pointer',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#071B52' }}>{item.title}</div>
                    <div style={{ fontSize: '0.78rem', color: '#FF3B98', fontWeight: 700 }}>{item.fee}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Price Quotation & Order Card */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '24px',
              border: '1px solid #E6EAF2',
              padding: '28px',
              boxShadow: '0 4px 20px rgba(7, 27, 82, 0.05)',
              position: 'sticky',
              top: '96px',
            }}
          >
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#071B52', marginBottom: '18px' }}>
              Print Order Quote
            </h3>

            {orderSuccess ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#EEF9F3', color: '#13B978', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                  <CheckCircle2 size={36} />
                </div>
                <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#071B52', marginBottom: '6px' }}>
                  Print Job Dispatched!
                </h4>
                <p style={{ color: '#667085', fontSize: '0.88rem', marginBottom: '20px' }}>
                  Dark store high-speed laser printer is printing your order. Sealed packet arriving at your doorstep in 15 mins.
                </p>
                <div style={{ background: '#F8F2FF', padding: '12px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700, color: '#7856F6', marginBottom: '16px' }}>
                  Print Job ID: #PRINT-98421
                </div>
                <button className="btn-secondary" onClick={() => setOrderSuccess(false)}>
                  Print Another Document
                </button>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingBottom: '16px', borderBottom: '1px solid #E6EAF2' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: '#667085' }}>
                    <span>Document Pages</span>
                    <span>{pageCount} Pages</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: '#667085' }}>
                    <span>Mode</span>
                    <span>{colorMode === 'BW' ? 'Black & White' : 'Color Gloss'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: '#667085' }}>
                    <span>Print Sheets Cost</span>
                    <span>₹{printCost}</span>
                  </div>
                  {bindingCost > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: '#7856F6', fontWeight: 600 }}>
                      <span>Finishing ({binding})</span>
                      <span>+₹{bindingCost}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: '#667085' }}>
                    <span>Waterproof Pouch & Delivery</span>
                    <span>₹{deliveryFee}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.35rem', fontWeight: 800, color: '#071B52', margin: '18px 0' }}>
                  <span>Total Amount</span>
                  <span style={{ color: '#FF3B98' }}>₹{totalCost}</span>
                </div>

                <button
                  className="btn-primary"
                  style={{ width: '100%', padding: '14px', fontSize: '1rem' }}
                  onClick={handlePlacePrintOrder}
                >
                  <span>Order Print & Deliver (15 Mins)</span>
                  <ArrowRight size={18} />
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#F8F2FF', padding: '10px', borderRadius: '10px', marginTop: '16px' }}>
                  <ShieldCheck size={18} color="#13B978" />
                  <span style={{ fontSize: '0.78rem', color: '#14224A' }}>
                    100% Privacy & Data Security: files automatically deleted after printing.
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Popular Printing Services Cards */}
        <div style={{ marginTop: '54px' }}>
          <h2 className="section-h2" style={{ marginBottom: '22px' }}>Popular Print Services</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
            {[
              { title: 'A4 Document Print', price: 'From ₹3/pg', icon: FileText, desc: 'Assignments, legal stamp papers, and office contracts.' },
              { title: 'Color Photo Print', price: 'From ₹15/print', icon: Image, desc: '4x6 and 5x7 premium high-gloss photo paper memories.' },
              { title: 'PVC ID Card Print', price: '₹40 / card', icon: CreditCard, desc: 'Laminated smart ID cards with crisp barcodes.' },
              { title: 'Booklet & Spiral', price: 'From ₹50', icon: BookOpen, desc: 'Project reports with protective transparent poly covers.' },
            ].map((serv, i) => {
              const Icon = serv.icon;
              return (
                <div key={i} style={{ background: '#FFFFFF', border: '1px solid #E6EAF2', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(7,27,82,0.04)' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#F8F2FF', color: '#7856F6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                    <Icon size={22} />
                  </div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#071B52' }}>{serv.title}</h4>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#FF3B98', margin: '2px 0 8px' }}>{serv.price}</div>
                  <p style={{ fontSize: '0.82rem', color: '#667085' }}>{serv.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
