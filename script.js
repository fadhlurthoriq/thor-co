// ─── STATE ──────────────────────────────────────────────────────
let activeCat = 'all';
let activeFilter = 'all';
let cartCount = 0;
let cartItems = [];
let currentProduct = null;
let selectedSize = 'M';
let wishlist = new Set();

// ─── INIT ────────────────────────────────────────────────────────
function init() {
  renderNavPills();
  renderGrid();
}

function renderNavPills() {
  const container = document.getElementById('navbarCats');
  container.innerHTML = '';
  CATS.forEach(cat => {
    const count = cat.id === 'all' ? PRODUCTS.length : PRODUCTS.filter(p => p.cat === cat.id).length;
    const pill = document.createElement('button');
    pill.className = 'nav-pill' + (cat.id === activeCat ? ' active' : '');
    pill.innerHTML = `${cat.name}<span class="pill-count">${count}</span>`;
    pill.onclick = () => setCat(cat.id);
    container.appendChild(pill);
  });
}

function setCat(id) {
  activeCat = id;
  activeFilter = 'all';
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.toggle('active', c.textContent === 'Semua'));
  renderNavPills();
  renderGrid();
  const catObj = CATS.find(c => c.id === id);
  document.getElementById('currentCatLabel').textContent = catObj ? catObj.name : 'Semua';
  window.scrollTo({ top: 64, behavior: 'smooth' });
}

function setFilterSelect(el) {
  activeFilter = el.value;
  renderGrid();
}

function setFilter(el, val) {
  activeFilter = val;
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  renderGrid();
}

function getFiltered() {
  let prods = activeCat === 'all' ? [...PRODUCTS] : PRODUCTS.filter(p => p.cat === activeCat);
  if (activeFilter !== 'all') {
    prods = prods.filter(p => p.fit.toLowerCase().includes(activeFilter));
  }
  const sort = document.getElementById('sortSelect').value;
  if (sort === 'price_asc') prods.sort((a,b) => a.price - b.price);
  else if (sort === 'price_desc') prods.sort((a,b) => b.price - a.price);
  else if (sort === 'rating') prods.sort((a,b) => b.rating - a.rating);
  else if (sort === 'sold') prods.sort((a,b) => b.sold - a.sold);
  return prods;
}

function fmt(n) { return 'Rp ' + n.toLocaleString('id-ID'); }

function starsHtml(r) {
  const full = Math.floor(r);
  const half = r % 1 >= 0.5;
  let s = '';
  for (let i = 1; i <= 5; i++) {
    if (i <= full) s += '★';
    else if (i === full + 1 && half) s += '½';
    else s += '☆';
  }
  return s;
}

function renderGrid() {
  const grid = document.getElementById('productsGrid');
  const prods = getFiltered();
  document.getElementById('productCountLabel').textContent = prods.length + ' produk';
  document.getElementById('filterCount').textContent = prods.length + ' produk';

  if (prods.length === 0) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><p>Tidak ada produk ditemukan.</p></div>`;
    return;
  }

  grid.innerHTML = '';
  prods.forEach((p, i) => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.style.animationDelay = (i * 0.04) + 's';
    card.innerHTML = `
      <div class="card-img-wrap">
        <img src="${p.img}" alt="${p.name}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
        <div class="card-img-placeholder" style="display:none">👕</div>
        <div class="card-badge">${p.fit}</div>
        <div class="card-wishlist" onclick="event.stopPropagation();toggleWishlist('${p.id}',this)" title="Tambah wishlist">♡</div>
      </div>
      <div class="card-body">
        <div class="card-brand">${p.brand}</div>
        <div class="card-name">${p.name}</div>
        <div class="card-stats">
          <div class="card-price">${fmt(p.price)}</div>
          <div class="card-rating"><span class="stars">${starsHtml(p.rating)}</span><span class="rating-val">${p.rating}</span></div>
        </div>
        <div class="card-sold">${p.sold.toLocaleString('id-ID')} terjual</div>
        <button class="card-btn" onclick="event.stopPropagation();openDetail('${p.id}')">Beli Sekarang</button>
      </div>
    `;
    card.onclick = () => openDetail(p.id);
    grid.appendChild(card);
  });
}

// ─── DETAIL ──────────────────────────────────────────────────────
function openDetail(id) {
  const p = PRODUCTS.find(x => x.id === id);
  if (!p) return;
  currentProduct = p;
  selectedSize = p.sizes.includes('M') ? 'M' : p.sizes[0];

  const cat = CATS.find(c => c.id === p.cat);
  document.getElementById('detailBreadcrumb').innerHTML = `<span>${cat?.name || ''}</span> › ${p.name}`;

  // Left panel
  const left = document.getElementById('detailLeft');
  left.innerHTML = `
    <div class="detail-img-main" id="mainImgWrap">
      <div class="img-spinner-wrap" id="imgSpinner"><div class="img-spinner"></div></div>
      <img id="mainImg" src="${p.img}" alt="${p.name}" onerror="this.style.display='none';document.getElementById('imgPlaceholder').style.display='flex'">
      <div class="detail-img-placeholder" id="imgPlaceholder" style="display:none">👕</div>
    </div>
    
  `;

  // Right panel
  const right = document.getElementById('detailRight');
  const inWishlist = wishlist.has(p.id);

  right.innerHTML = `
    <div class="detail-header">
      <div class="detail-cat-pill">${cat?.name || ''}</div>
      <div class="detail-name">${p.name}</div>
      <div class="detail-brand-row">
        <span>${p.brand}</span>
        <div class="detail-brand-dot"></div>
        <span>Buatan ${p.origin}</span>
      </div>
    </div>

    <div class="detail-stats-row">
      <div class="stat-cell">
        <div class="stat-label">Rating</div>
        <div class="stat-value">${p.rating}</div>
        <div class="stat-sub">${starsHtml(p.rating)}</div>
      </div>
      <div class="stat-cell">
        <div class="stat-label">Terjual</div>
        <div class="stat-value">${p.sold >= 1000 ? (p.sold/1000).toFixed(1)+'rb' : p.sold}</div>
        <div class="stat-sub">pembeli puas</div>
      </div>
      <div class="stat-cell">
        <div class="stat-label">Ukuran</div>
        <div class="stat-value">${p.sizes.length}</div>
        <div class="stat-sub">pilihan</div>
      </div>
    </div>

    <div class="detail-price-box">
      <div class="price-label">Harga</div>
      <div class="price-main">${fmt(p.price)}</div>
      <div class="price-stock"><div class="stock-dot"></div>Stok tersedia</div>
    </div>

    <div class="detail-section">
      <div class="section-title">Ukuran</div>
      <div class="size-grid" id="sizeGrid">
        ${p.sizes.map(s => `<button class="size-btn${s===selectedSize?' active':''}" onclick="selectSize('${s}',this)">${s}</button>`).join('')}
      </div>
    </div>

    <div class="detail-section">
      <div class="section-title">Warna — <span style="font-weight:400;color:var(--text-secondary)">${p.colors.length} pilihan</span></div>
      <div class="color-row" id="colorRow">
        ${p.colors.map((c, i) => `<div class="color-swatch${i===0?' active':''}" style="background:${c}" title="${c}" onclick="selectColor(this,'${p.img}')"></div>`).join('')}
      </div>
    </div>

    <div class="detail-section">
      <div class="section-title">Atribut Produk</div>
      <div class="traits-grid">
        ${p.traits.map(t => `
          <div class="trait-card">
            <div class="trait-type">${t.type}</div>
            <div class="trait-value">${t.value}</div>
            <div class="trait-rarity">${t.rarity}</div>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="detail-actions">
      <button class="btn-buy" onclick="addToCart()">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M2 2h1.5l2 8h7l1.5-6H4.5"/><circle cx="7" cy="13.5" r="1"/><circle cx="12" cy="13.5" r="1"/></svg>
        Tambah ke Keranjang
      </button>
      <button class="btn-wishlist" id="wishlistBtn" onclick="toggleWishlistDetail()">
        ${inWishlist ? '♥ Di Wishlist' : '♡ Tambah ke Wishlist'}
      </button>
    </div>

    <div class="accordion-item open">
      <div class="accordion-header" onclick="toggleAccordion(this)">
        <span class="accordion-title">Deskripsi Produk</span>
        <span class="accordion-arrow">⌄</span>
      </div>
      <div class="accordion-body">
        <p class="detail-desc">${p.desc}</p>
        <ul class="detail-features" style="margin-top:12px">
          ${p.features.map(f => `<li><div class="feature-check">✓</div>${f}</li>`).join('')}
        </ul>
      </div>
    </div>

    <div class="accordion-item">
      <div class="accordion-header" onclick="toggleAccordion(this)">
        <span class="accordion-title">Spesifikasi</span>
        <span class="accordion-arrow">⌄</span>
      </div>
      <div class="accordion-body">
        <table class="specs-table">
          <tr><td>Material</td><td>${p.material}</td></tr>
          <tr><td>Fit</td><td>${p.fit}</td></tr>
          <tr><td>Kategori</td><td>${cat?.name}</td></tr>
          <tr><td>Asal</td><td>${p.origin}</td></tr>
          <tr><td>Ukuran Tersedia</td><td>${p.sizes.join(', ')}</td></tr>
        </table>
      </div>
    </div>

    <div class="accordion-item">
      <div class="accordion-header" onclick="toggleAccordion(this)">
        <span class="accordion-title">Panduan Ukuran</span>
        <span class="accordion-arrow">⌄</span>
      </div>
      <div class="accordion-body">
        <table class="specs-table">
          <tr><td>XS</td><td>Lingkar dada 80–84 cm</td></tr>
          <tr><td>S</td><td>Lingkar dada 84–88 cm</td></tr>
          <tr><td>M</td><td>Lingkar dada 88–92 cm</td></tr>
          <tr><td>L</td><td>Lingkar dada 92–96 cm</td></tr>
          <tr><td>XL</td><td>Lingkar dada 96–100 cm</td></tr>
          <tr><td>XXL</td><td>Lingkar dada 100–104 cm</td></tr>
        </table>
      </div>
    </div>

    <div class="accordion-item">
      <div class="accordion-header" onclick="toggleAccordion(this)">
        <span class="accordion-title">Pengiriman & Pengembalian</span>
        <span class="accordion-arrow">⌄</span>
      </div>
      <div class="accordion-body">
        <table class="specs-table">
          <tr><td>Pengiriman</td><td>JNE, J&T, SiCepat tersedia</td></tr>
          <tr><td>Estimasi</td><td>2–4 hari kerja</td></tr>
          <tr><td>Gratis Ongkir</td><td>Minimal pembelian Rp 300.000</td></tr>
          <tr><td>Retur</td><td>30 hari jika ada cacat produksi</td></tr>
        </table>
      </div>
    </div>
  `;
  

  document.getElementById('wishlistIcon').innerHTML = wishlist.has(p.id) ? '♥' : '♡';
  document.getElementById('detailOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';

}

function closeDetail() {
  document.getElementById('detailOverlay').classList.remove('open');
  document.body.style.overflow = '';
  currentProduct = null;
}

function showImgLoading() {
  const spinner = document.getElementById('imgSpinner');
  if (!spinner) return;
  spinner.classList.add('show');
  setTimeout(() => spinner.classList.remove('show'), 650);
}

function selectSize(size, el) {
  selectedSize = size;
  document.querySelectorAll('#sizeGrid .size-btn').forEach(b => b.classList.toggle('active', b.textContent === size));
  showImgLoading();
}

function selectColor(el, imgBase) {
  document.querySelectorAll('#colorRow .color-swatch').forEach(s => s.classList.remove('active'));
  el.classList.add('active');
  showImgLoading();
}

function switchThumb(el, imgSrc, color) {
  document.querySelectorAll('.thumb').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
}

function toggleWishlist(id, iconEl) {
  if (wishlist.has(id)) {
    wishlist.delete(id);
    iconEl.innerHTML = '♡';
    toast('Dihapus dari wishlist');
  } else {
    wishlist.add(id);
    iconEl.innerHTML = '♥';
    iconEl.style.color = '#e74c3c';
    toast('Ditambahkan ke wishlist ♥');
  }
}

function toggleWishlistDetail() {
  if (!currentProduct) return;
  const id = currentProduct.id;
  const btn = document.getElementById('wishlistBtn');
  const icon = document.getElementById('wishlistIcon');
  if (wishlist.has(id)) {
    wishlist.delete(id);
    btn.innerHTML = '♡ Tambah ke Wishlist';
    icon.innerHTML = '♡';
    toast('Dihapus dari wishlist');
  } else {
    wishlist.add(id);
    btn.innerHTML = '♥ Di Wishlist';
    icon.innerHTML = '♥';
    toast('Ditambahkan ke wishlist ♥');
  }
}

function addToCart() {
  if (!currentProduct) return;
  const existing = cartItems.find(i => i.product.id === currentProduct.id && i.size === selectedSize);
  if (existing) {
    existing.qty++;
  } else {
    cartItems.push({ product: currentProduct, size: selectedSize, color: currentProduct.colors[0], qty: 1 });
  }
  cartCount = cartItems.reduce((s, i) => s + i.qty, 0);
  document.getElementById('cartCount').textContent = cartCount;
  toast(`✓ ${currentProduct.name} (${selectedSize}) ditambahkan!`);
}

function openCart() {
  renderCartDrawer();
  document.getElementById('cartDrawer').classList.add('open');
  document.getElementById('cartBackdrop').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  document.getElementById('cartDrawer').classList.remove('open');
  document.getElementById('cartBackdrop').classList.remove('open');
  document.body.style.overflow = '';
}

function renderCartDrawer() {
  const body = document.getElementById('cartBody');
  const footer = document.getElementById('cartFooter');
  const countEl = document.getElementById('cartItemCount');
  const totalItems = cartItems.reduce((s, i) => s + i.qty, 0);
  countEl.textContent = totalItems + ' item';

  if (cartItems.length === 0) {
    body.innerHTML = `<div class="cart-empty"><div class="cart-empty-icon">🛍️</div><p>Keranjang kamu masih kosong</p></div>`;
    footer.style.display = 'none';
    return;
  }

  body.innerHTML = cartItems.map((item, idx) => `
    <div class="cart-item">
      <div class="cart-item-img">
        <img src="${item.product.img}" alt="${item.product.name}" onerror="this.style.display='none';this.parentElement.innerHTML='<div class=cart-item-img-placeholder>👕</div>'">
      </div>
      <div class="cart-item-info">
        <div class="cart-item-brand">${item.product.brand}</div>
        <div class="cart-item-name">${item.product.name}</div>
        <div class="cart-item-meta">
          <span class="cart-item-tag">${item.size}</span>
          <div class="cart-item-color" style="background:${item.color}"></div>
        </div>
        <div class="cart-item-bottom">
          <div class="cart-item-price">${fmt(item.product.price * item.qty)}</div>
          <div style="display:flex;align-items:center;gap:6px">
            <div class="qty-control">
              <button class="qty-btn" onclick="updateQty(${idx},-1)">−</button>
              <div class="qty-num">${item.qty}</div>
              <button class="qty-btn" onclick="updateQty(${idx},1)">+</button>
            </div>
            <button class="cart-item-remove" onclick="removeItem(${idx})">Hapus</button>
          </div>
        </div>
      </div>
    </div>
  `).join('');

  const subtotal = cartItems.reduce((s, i) => s + i.product.price * i.qty, 0);
  const shipping = subtotal >= 300000 ? 'Gratis' : fmt(25000);
  const total = subtotal + (subtotal >= 300000 ? 0 : 25000);
  document.getElementById('cartSubtotal').textContent = fmt(subtotal);
  document.getElementById('cartShipping').textContent = shipping;
  document.getElementById('cartTotal').textContent = fmt(total);
  footer.style.display = 'block';
}

function updateQty(idx, delta) {
  cartItems[idx].qty += delta;
  if (cartItems[idx].qty <= 0) cartItems.splice(idx, 1);
  cartCount = cartItems.reduce((s, i) => s + i.qty, 0);
  document.getElementById('cartCount').textContent = cartCount;
  renderCartDrawer();
}

function removeItem(idx) {
  cartItems.splice(idx, 1);
  cartCount = cartItems.reduce((s, i) => s + i.qty, 0);
  document.getElementById('cartCount').textContent = cartCount;
  renderCartDrawer();
}

function checkout() {
  const orderId = 'TH-' + Date.now().toString().slice(-6);
  document.getElementById('payOrderId').textContent = orderId;
  document.getElementById('paySuccess').classList.add('open');
}

function closePaySuccess() {
  document.getElementById('paySuccess').classList.remove('open');
  cartItems = [];
  cartCount = 0;
  document.getElementById('cartCount').textContent = 0;
  closeCart();
}

function toggleAccordion(header) {
  const item = header.parentElement;
  item.classList.toggle('open');
}

// ─── TOAST ────────────────────────────────────────────────────────
let toastTimer;
function toast(msg) {
  const el = document.getElementById('toastEl');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}

// ─── KEYBOARD ESC ────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeDetail();
});

// ─── START ────────────────────────────────────────────────────────
init();