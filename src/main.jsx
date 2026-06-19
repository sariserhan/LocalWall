import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowLeft,
  Bookmark,
  Check,
  ChevronDown,
  ImagePlus,
  Layers3,
  MapPin,
  Menu,
  MessageSquare,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import './styles.css';

const seedCards = [
  { id: 1, name: 'Northside Bicycle Co.', category: 'Repairs', line: 'Repairs · tune ups · all bikes welcome', area: 'Northside', price: '$25 tune ups', theme: 'paper', image: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=500&q=80', x: 4, y: 7, r: -3, w: 230 },
  { id: 2, name: 'Little Collins Bakery', category: 'Food', line: 'Artisan bread, pastries & coffee', area: 'Williamsburg', theme: 'dark', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=500&q=80', x: 25, y: 6, r: 2, w: 220 },
  { id: 3, name: 'Green Thumb', category: 'Home', line: 'Plant sitting · watering · repotting', area: 'Greenpoint', price: '$25 / visit', theme: 'cream', image: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=500&q=80', x: 47, y: 6, r: 4, w: 218 },
  { id: 4, name: 'Paws & Parks', category: 'Pets', line: 'Dog walking & pet sitting', area: 'Williamsburg', price: '$20 / 30 min', theme: 'pink', image: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=500&q=80', x: 68, y: 8, r: -1, w: 210 },
  { id: 5, name: 'Spin City', category: 'Shops', line: 'Vinyl records · buy · sell · trade', area: 'Bedford-Stuyvesant', theme: 'paper', image: 'https://images.unsplash.com/photo-1461360228754-6e81c478b882?auto=format&fit=crop&w=500&q=80', x: 6, y: 38, r: -7, w: 220 },
  { id: 6, name: 'Blue Clay', category: 'Classes', line: 'Handmade pottery & workshops', area: 'Williamsburg', theme: 'cyan', image: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=500&q=80', x: 29, y: 36, r: 3, w: 220 },
  { id: 7, name: 'Neat Fit Tailoring', category: 'Services', line: 'Hem · alter · repair · custom fitting', area: 'Williamsburg', theme: 'paper', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=500&q=80', x: 51, y: 39, r: -2, w: 222 },
  { id: 8, name: 'Brush & Roll', category: 'Home', line: 'Interior · exterior · free estimates', area: 'Williamsburg', theme: 'cream', image: 'https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?auto=format&fit=crop&w=500&q=80', x: 73, y: 38, r: 4, w: 218 },
  { id: 9, name: 'Math Tutor', category: 'Classes', line: 'Grades 6–12 · homework · test prep', area: 'Williamsburg', price: '$40 / hr', theme: 'yellow', x: 8, y: 72, r: -4, w: 195 },
  { id: 10, name: 'Lofty Cleaning', category: 'Services', line: 'Apartments · offices · move in/out', area: 'Brooklyn', theme: 'paper', image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=500&q=80', x: 31, y: 70, r: 1, w: 210 },
  { id: 11, name: 'Taco Loco', category: 'Food', line: 'Mexican street food · catering · events', area: 'Williamsburg', theme: 'pink', image: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=500&q=80', x: 53, y: 69, r: -2, w: 225 },
  { id: 12, name: 'Piano Lessons', category: 'Classes', line: 'Beginners welcome · all ages', area: 'Williamsburg', price: '$35 / 30 min', theme: 'paper', image: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?auto=format&fit=crop&w=500&q=80', x: 76, y: 71, r: 3, w: 215 },
  { id: 13, name: 'BK Photo Co.', category: 'Services', line: 'Portraits · events · film', area: 'Williamsburg', theme: 'paper', image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=500&q=80', x: 16, y: 99, r: 1, w: 205 },
  { id: 14, name: 'Rooftop Yoga', category: 'Classes', line: 'Vinyasa · all levels · Sundays 10am', area: 'Williamsburg', price: '$15 drop in', theme: 'cream', image: 'https://images.unsplash.com/photo-1545389336-cf090694435e?auto=format&fit=crop&w=500&q=80', x: 39, y: 99, r: -1, w: 220 },
  { id: 15, name: 'Electric Ally', category: 'Services', line: 'Repairs · lighting · outlets · upgrades', area: 'Brooklyn', theme: 'paper', image: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=500&q=80', x: 63, y: 100, r: 2, w: 215 },
  { id: 16, name: 'Handy Jay', category: 'Home', line: 'Shelves · furniture · fixtures · more', area: 'Williamsburg', price: '$50 / hr', theme: 'yellow', x: 83, y: 99, r: -3, w: 195 },
];

const categories = ['All', 'Services', 'Food', 'Home', 'Classes', 'Pets', 'Repairs', 'Shops'];

function Card({ card, active, onOpen, onFront, z }) {
  return (
    <article
      className={`wall-card theme-${card.theme} ${active ? 'is-active' : ''}`}
      style={{ '--x': `${card.x}%`, '--y': `${card.positionLocked ? card.y : card.y * 9}px`, '--r': `${card.r}deg`, '--w': `${card.w}px`, zIndex: z }}
      onPointerDown={() => onFront(card.id)}
      onClick={() => onOpen(card)}
      tabIndex="0"
      role="button"
      onKeyDown={(event) => event.key === 'Enter' && onOpen(card)}
      aria-label={`Open advertisement for ${card.name}`}
    >
      <span className="card-tape" aria-hidden="true" />
      <div className="card-copy">
        <p className="card-category">{card.category}</p>
        <h2>{card.name}</h2>
        <p className="card-line">{card.line}</p>
      </div>
      {card.image && <img src={card.image} alt="" draggable="false" />}
      <footer>
        <span>{card.area}</span>
        {card.price && <strong>{card.price}</strong>}
      </footer>
    </article>
  );
}

function DetailPanel({ card, onClose }) {
  if (!card) return null;
  return (
    <aside className="detail-sheet" aria-label={`${card.name} details`}>
      <div className="sheet-pin" />
      <button className="icon-btn sheet-close" onClick={onClose} aria-label="Close details"><X /></button>
      <p className="sheet-category">{card.category} · {card.area}</p>
      <h2>{card.name}</h2>
      <div className="rule" />
      <p className="sheet-service">{card.line}</p>
      {card.image && <img className="sheet-image" src={card.image} alt={`${card.name} service`} />}
      <div className="note-copy">
        Friendly local help, made with care. Message us for availability, questions, and a quick quote.
      </div>
      {card.price && <div className="sheet-price">Starting at <strong>{card.price}</strong></div>}
      <button className="primary wide"><MessageSquare /> Contact {card.name.split(' ').slice(0, 2).join(' ')}</button>
      <button className="secondary wide"><Bookmark /> Save card</button>
      <div className="sheet-meta"><span>POSTED THIS WEEK</span><span>CARD #{String(card.id).padStart(4, '0')}</span></div>
    </aside>
  );
}

function Composer({ onClose, onReady }) {
  const [form, setForm] = useState({ name: '', category: 'Services', line: '', area: 'Williamsburg', price: '', theme: 'yellow' });
  const [previews, setPreviews] = useState([]);
  const [step, setStep] = useState(1);
  const onImages = (event) => {
    const files = [...event.target.files].slice(0, 2);
    previews.forEach((url) => URL.revokeObjectURL(url));
    setPreviews(files.map((file) => URL.createObjectURL(file)));
  };
  const update = (key) => (event) => setForm((value) => ({ ...value, [key]: event.target.value }));
  const submit = (event) => {
    event.preventDefault();
    if (step === 1) return setStep(2);
    onReady({ ...form, image: previews[0] || '', image2: previews[1] || '' });
  };
  return (
    <div className="composer-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="composer" onSubmit={submit}>
        <header>
          <button type="button" className="icon-btn" onClick={step === 2 ? () => setStep(1) : onClose} aria-label={step === 2 ? 'Back' : 'Close'}>{step === 2 ? <ArrowLeft /> : <X />}</button>
          <div><span>POST A CARD</span><small>STEP {step} OF 2</small></div>
          <span className="step-count">0{step}</span>
        </header>
        {step === 1 ? (
          <div className="composer-body">
            <label>Business or service<input required autoFocus value={form.name} onChange={update('name')} placeholder="What should the wall call you?" /></label>
            <div className="form-grid">
              <label>Category<select value={form.category} onChange={update('category')}>{categories.slice(1).map((cat) => <option key={cat}>{cat}</option>)}</select></label>
              <label>Neighborhood<input required value={form.area} onChange={update('area')} /></label>
            </div>
            <label>What do you offer?<textarea required maxLength="90" value={form.line} onChange={update('line')} placeholder="Keep it short. Walls are busy." /></label>
            <label>Price <span>(optional)</span><input value={form.price} onChange={update('price')} placeholder="$25 / visit" /></label>
          </div>
        ) : (
          <div className="composer-body design-step">
            <label className="upload-zone">
              <input type="file" accept="image/*" multiple onChange={onImages} />
              {previews.length ? <div className="preview-row">{previews.map((src) => <img src={src} key={src} alt="Upload preview" />)}</div> : <><ImagePlus /><strong>Add 1 or 2 pictures</strong><span>JPG, PNG or WEBP</span></>}
            </label>
            <fieldset><legend>Paper</legend><div className="swatches">{['yellow','paper','pink','cyan','dark'].map((theme) => <button type="button" key={theme} className={`swatch ${theme} ${form.theme === theme ? 'selected' : ''}`} onClick={() => setForm((v) => ({...v, theme}))} aria-label={`${theme} paper`}>{form.theme === theme && <Check />}</button>)}</div></fieldset>
            <div className={`mini-preview theme-${form.theme}`}><span>{form.category}</span><strong>{form.name || 'Your business'}</strong><p>{form.line || 'Your offer goes here.'}</p></div>
          </div>
        )}
        <footer><span>You’ll choose its spot next.</span><button className="primary" type="submit">{step === 1 ? 'Design card' : 'Choose a spot'} <Sparkles /></button></footer>
      </form>
    </div>
  );
}

function PlacementMode({ card, position, dragging, onDragStart, onMove, onDragEnd, onCancel, onRandom, onConfirm }) {
  return (
    <div className="placement-mode" onPointerMove={onMove} onPointerUp={onDragEnd} onPointerCancel={onDragEnd}>
      <div className="placement-banner">
        <div><strong>Choose your one spot</strong><span>Drag the card anywhere on the wall. Once posted, it stays put.</span></div>
        <button className="placement-random" onClick={onRandom}><Sparkles /> Find me a spot</button>
        <button className="primary" onClick={onConfirm}><Check /> Stick it here</button>
        <button className="icon-btn" onClick={onCancel} aria-label="Cancel placement"><X /></button>
      </div>
      <article
        className={`wall-card placement-card theme-${card.theme} ${dragging ? 'is-dragging' : ''}`}
        style={{ left: `${position.x}%`, top: `${position.y}px`, width: '220px' }}
        onPointerDown={onDragStart}
      >
        <span className="card-tape" aria-hidden="true" />
        <div className="card-copy"><p className="card-category">{card.category}</p><h2>{card.name}</h2><p className="card-line">{card.line}</p></div>
        {card.image && <img src={card.image} alt="" draggable="false" />}
        <footer><span>{card.area}</span>{card.price && <strong>{card.price}</strong>}</footer>
        <div className="drag-label">DRAG ME</div>
      </article>
    </div>
  );
}

function App() {
  const [cards, setCards] = useState(seedCards);
  const [selected, setSelected] = useState(null);
  const [composer, setComposer] = useState(false);
  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [fresh, setFresh] = useState(false);
  const [layers, setLayers] = useState(seedCards.map((c) => c.id));
  const [mobileMenu, setMobileMenu] = useState(false);
  const [pendingCard, setPendingCard] = useState(null);
  const [placement, setPlacement] = useState({ x: 40, y: 170 });
  const [dragging, setDragging] = useState(false);
  const wallRef = useRef(null);

  useEffect(() => {
    const stored = localStorage.getItem('wall-custom-cards');
    if (stored) {
      try {
        const custom = JSON.parse(stored);
        setCards((current) => [...current, ...custom]);
        setLayers((current) => [...current, ...custom.map((c) => c.id)]);
      } catch { /* Ignore stale demo data. */ }
    }
  }, []);

  const visible = useMemo(() => {
    let result = cards.filter((card) => (category === 'All' || card.category === category) && `${card.name} ${card.line} ${card.area}`.toLowerCase().includes(query.toLowerCase()));
    if (fresh) result = [...result].reverse();
    return result;
  }, [cards, category, query, fresh]);

  const front = (id) => setLayers((current) => [...current.filter((item) => item !== id), id]);
  const beginPlacement = (form) => {
    setComposer(false);
    setSelected(null);
    setPendingCard(form);
    setPlacement({ x: window.innerWidth < 780 ? 23 : 40, y: Math.max(90, window.scrollY + 120) });
  };

  const movePlacement = (event) => {
    if (!dragging || !wallRef.current) return;
    const rect = wallRef.current.getBoundingClientRect();
    const cardWidth = window.innerWidth < 780 ? 182 : 220;
    const maxLeft = Math.max(12, rect.width - cardWidth - 12);
    const left = Math.min(maxLeft, Math.max(12, event.clientX - rect.left - cardWidth / 2));
    const top = Math.min(rect.height - 250, Math.max(28, event.clientY - rect.top - 90));
    setPlacement({ x: (left / rect.width) * 100, y: top });
  };

  const post = () => {
    const form = pendingCard;
    if (!form) return;
    const id = Date.now();
    const card = { ...form, id, x: placement.x, y: placement.y, r: -3 + Math.random() * 6, w: 220, fresh: true, positionLocked: true };
    setCards((current) => [...current, card]);
    setLayers((current) => [...current, id]);
    setPendingCard(null);
    setSelected(card);
    setFresh(true);
    const stored = JSON.parse(localStorage.getItem('wall-custom-cards') || '[]').filter((c) => !c.image?.startsWith('blob:'));
    localStorage.setItem('wall-custom-cards', JSON.stringify([...stored, { ...card, image: '' }]));
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => { setCategory('All'); setQuery(''); setFresh(false); }}>WALL<span>LOCAL ADS, STUCK HERE</span></button>
        <button className="location"><MapPin /> Williamsburg, Brooklyn <ChevronDown /></button>
        <nav className={mobileMenu ? 'open' : ''}>
          <div className="search"><Search /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search the wall" aria-label="Search advertisements" /></div>
          <label className="filter-select">Browse<select value={category} onChange={(e) => setCategory(e.target.value)}>{categories.map((cat) => <option key={cat}>{cat}</option>)}</select><ChevronDown /></label>
          <button className={fresh ? 'nav-active' : ''} onClick={() => setFresh((value) => !value)}>Fresh <span className="fresh-dot" /></button>
        </nav>
        <button className="primary post-button" onClick={() => setComposer(true)}><Plus /> Post your card</button>
        <button className="icon-btn mobile-menu" onClick={() => setMobileMenu((value) => !value)} aria-label="Open menu"><Menu /></button>
      </header>
      <section className={`wall ${pendingCard ? 'is-placing' : ''}`} ref={wallRef} aria-label="Community advertisement wall">
        <div className="wall-grain" />
        {visible.map((card) => <Card key={card.id} card={card} active={selected?.id === card.id} onOpen={setSelected} onFront={front} z={layers.indexOf(card.id) + 1} />)}
        {!visible.length && <div className="empty-note"><strong>Nothing stuck here yet.</strong><span>Try another corner of the wall.</span><button onClick={() => { setCategory('All'); setQuery(''); }}>Reset filters</button></div>}
        <div className="wall-tools">
          <button aria-label="Show newest cards" onClick={() => setFresh(true)}><Layers3 /></button>
          <button aria-label="Reset wall" onClick={() => { setCategory('All'); setQuery(''); setFresh(false); }}><RotateCcw /></button>
        </div>
        <div className="wall-count">{visible.length} CARDS · WILLIAMSBURG</div>
        {pendingCard && <PlacementMode card={pendingCard} position={placement} dragging={dragging} onDragStart={(event) => { event.currentTarget.setPointerCapture(event.pointerId); setDragging(true); }} onMove={movePlacement} onDragEnd={() => setDragging(false)} onCancel={() => { setPendingCard(null); setDragging(false); }} onRandom={() => setPlacement({ x: 8 + Math.random() * (window.innerWidth < 780 ? 35 : 68), y: Math.max(60, window.scrollY + 60 + Math.random() * 450) })} onConfirm={post} />}
      </section>
      {selected && <DetailPanel card={selected} onClose={() => setSelected(null)} />}
      {composer && <Composer onClose={() => setComposer(false)} onReady={beginPlacement} />}
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
