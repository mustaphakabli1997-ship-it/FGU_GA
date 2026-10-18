/* Boutique Sekhri — admin panel (Arabic UI). */
(function () {
  'use strict';

  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const nf = new Intl.NumberFormat('fr-FR');
  const dzd = (n) => `<span class="ltr">${nf.format(n).replace(/ /g, ' ')} دج</span>`;
  const when = (iso) => new Date(iso).toLocaleString('fr-DZ', { dateStyle: 'short', timeStyle: 'short' });

  const ART_LABELS = {
    tshirt: 'تيشيرت', polo: 'بولو', hoodie: 'هودي', sweat: 'سويت', knit: 'تريكو', jacket: 'جاكيت',
    jogger: 'جوغر', pants: 'سروال', shorts: 'شورت', ensemble: 'طقم كامل', cap: 'قبعة', bag: 'حقيبة', socks: 'جوارب',
  };
  const PRESET_COLORS = [
    ['Noir mat', '#17181a'], ['Anthracite', '#383a40'], ['Argent', '#b9bcc2'], ['Orange néon', '#ff4d00'],
    ['Bleu nuit', '#17243f'], ['Kaki', '#4b5443'], ['Blanc cassé', '#e9e6df'], ['Bordeaux', '#5a1a26'],
  ];
  const ORDER_STATUS = { new: 'جديد', confirmed: 'مؤكد', shipped: 'تم الشحن', delivered: 'تم التسليم', cancelled: 'ملغى' };
  const ORDER_BADGE = { new: 'orange', confirmed: 'warn', shipped: 'warn', delivered: 'ok', cancelled: 'bad' };
  const CAMPAIGN_STATUS = { queued: 'في الانتظار', running: 'جارٍ الإرسال', done: 'تم', interrupted: 'توقف' };

  const state = { meta: null, products: [], subs: [], orders: [], campaigns: [], previews: [], tab: 'products' };
  let pollTimer = null;

  // ------------------------------------------------------------------- api
  async function api(url, { method = 'GET', json, form } = {}) {
    const res = await fetch(url, {
      method,
      credentials: 'same-origin',
      headers: json ? { 'content-type': 'application/json' } : undefined,
      body: json ? JSON.stringify(json) : form,
    });
    if (res.status === 401 && !url.endsWith('/login')) { showLogin(); throw new Error('انتهت الجلسة، سجّل الدخول من جديد'); }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'حدث خطأ');
    return data;
  }

  function toast(message, isError) {
    const el = document.createElement('div');
    el.className = `toast${isError ? ' err' : ''}`;
    el.textContent = message;
    $('#toasts').append(el);
    setTimeout(() => el.remove(), 3600);
  }
  const guard = (fn) => async (...args) => {
    try { return await fn(...args); } catch (err) { toast(err.message, true); }
  };

  // ------------------------------------------------------------------ data
  async function loadAll() {
    const [meta, products, subs, orders, campaigns, previews] = await Promise.all([
      api('/api/admin/meta'), api('/api/admin/products'), api('/api/admin/subscribers'),
      api('/api/admin/orders'), api('/api/admin/campaigns'), api('/api/admin/outbox'),
    ]);
    Object.assign(state, { meta, products, subs, orders, campaigns, previews });
    renderCounts();
    renderPanel();
    schedulePoll();
  }

  const activeSubs = () => state.subs.filter((s) => !s.unsubscribedAt);
  const catName = (id) => (state.meta.categories.find((c) => c.id === id) || {}).ar || id;

  function renderCounts() {
    $('#count-subs').textContent = activeSubs().length;
    const fresh = state.orders.filter((o) => o.status === 'new').length;
    $('#count-orders').textContent = fresh;
    $('#count-orders').hidden = !fresh;
    $('#live-dot').hidden = !state.campaigns.some((c) => c.status === 'running' || c.status === 'queued');
  }

  function schedulePoll() {
    const busy = state.campaigns.some((c) => c.status === 'running' || c.status === 'queued');
    if (!busy) { clearInterval(pollTimer); pollTimer = null; return; }
    if (pollTimer) return;
    pollTimer = setInterval(async () => {
      try {
        state.campaigns = await api('/api/admin/campaigns');
        renderCounts();
        if (state.tab === 'emails') renderPanel();
        schedulePoll();
      } catch { /* session expired: login screen handles it */ }
    }, 1500);
  }

  // ----------------------------------------------------------------- views
  function viewProducts() {
    const rows = state.products.map((p) => {
      const thumb = p.images[0]
        ? `<img src="${esc(p.images[0])}" alt="">`
        : `<span style="position:absolute;inset:0;background:${esc((p.colors[0] || {}).hex || '#17181a')};opacity:.9"></span><img class="mark" style="position:relative" src="/assets/logo-mark.svg" alt="">`;
      return `<tr>
        <td><div class="name-cell"><div class="thumb" style="position:relative">${thumb}</div><div><b>${esc(p.name)}</b><span class="muted small">${esc(p.slug)}</span></div></div></td>
        <td class="hide-sm">${esc(catName(p.category))}</td>
        <td class="price">${dzd(p.price)}${p.oldPrice ? `<s>${dzd(p.oldPrice)}</s>` : ''}</td>
        <td>${p.published ? '<span class="badge ok">منشور</span>' : '<span class="badge">مخفي</span>'} ${p.soldOut ? '<span class="badge bad">نفد</span>' : ''} ${p.featured ? '<span class="badge orange">مميز</span>' : ''}</td>
        <td><div class="row-actions">
          <button class="btn ghost sm" data-edit="${p.id}">تعديل</button>
          <button class="btn ghost sm" data-notify="${p.id}" title="إرسال إيميل عن هذا المنتج لكل المشتركين">📧 إرسال</button>
          <button class="btn danger sm" data-delete="${p.id}">حذف</button>
        </div></td></tr>`;
    }).join('');

    return `<div class="page-title"><div><h2>المنتجات</h2><p>${state.products.length} منتج في المتجر</p></div>
      <button class="btn primary" data-new>＋ منتج جديد</button></div>
      <div class="card table-wrap">${state.products.length
    ? `<table><thead><tr><th>المنتج</th><th class="hide-sm">الفئة</th><th>السعر</th><th>الحالة</th><th></th></tr></thead><tbody>${rows}</tbody></table>`
    : '<div class="empty">لا توجد منتجات بعد. اضغط «منتج جديد» لإضافة أول منتج.</div>'}</div>`;
  }

  function viewSubscribers() {
    const active = activeSubs().length;
    const rows = state.subs.map((s) => `<tr>
      <td><span class="ltr">${esc(s.email)}</span></td>
      <td class="hide-sm">${s.lang === 'ar' ? 'العربية' : 'Français'}</td>
      <td class="hide-sm">${esc({ popup: 'النافذة المنبثقة', footer: 'أسفل الصفحة', home: 'الصفحة الرئيسية', checkout: 'صفحة الطلب' }[s.source] || s.source)}</td>
      <td>${when(s.createdAt)}</td>
      <td>${s.unsubscribedAt ? '<span class="badge bad">ألغى الاشتراك</span>' : '<span class="badge ok">نشط</span>'}</td>
      <td><div class="row-actions"><button class="btn danger sm" data-del-sub="${s.id}">حذف</button></div></td></tr>`).join('');
    return `<div class="page-title"><div><h2>المشتركون في النشرة</h2><p>كل منتج جديد تضيفه يُرسل إلى المشتركين النشطين</p></div>
      <a class="btn ghost" href="/api/admin/subscribers.csv">⬇ تصدير CSV</a></div>
      <div class="stats"><div class="card stat"><b>${active}</b><span>مشترك نشط</span></div><div class="card stat"><b>${state.subs.length - active}</b><span>ألغوا الاشتراك</span></div></div>
      <div class="card table-wrap">${state.subs.length
    ? `<table><thead><tr><th>الإيميل</th><th class="hide-sm">اللغة</th><th class="hide-sm">المصدر</th><th>تاريخ الاشتراك</th><th>الحالة</th><th></th></tr></thead><tbody>${rows}</tbody></table>`
    : '<div class="empty">لا يوجد مشتركون بعد. سيظهر هنا كل من يترك إيميله في المتجر.</div>'}</div>`;
  }

  function viewOrders() {
    const cards = state.orders.map((o) => {
      const c = o.customer;
      return `<article class="card order">
        <div class="order-head"><h3>طلب <span class="ltr">${esc(o.ref)}</span></h3>
          <div class="actions-row"><span class="badge ${ORDER_BADGE[o.status]}">${ORDER_STATUS[o.status]}</span><span class="muted small">${when(o.createdAt)}</span>
          <select class="select-sm" data-order="${o.id}" aria-label="تغيير الحالة">${state.meta.orderStatuses.map((s) => `<option value="${s}" ${o.status === s ? 'selected' : ''}>${ORDER_STATUS[s]}</option>`).join('')}</select></div></div>
        <div class="order-grid">
          <dl><dt>الاسم</dt><dd>${esc(c.name)}</dd>
            <dt>الهاتف</dt><dd><a class="ltr" href="tel:${esc(c.phone)}">${esc(c.phone)}</a></dd>
            <dt>الولاية</dt><dd>${esc(c.wilaya)}</dd>
            <dt>العنوان</dt><dd>${esc(c.address)}</dd>
            <dt>التوصيل</dt><dd>${c.delivery === 'desk' ? 'نقطة استلام' : 'إلى المنزل'}</dd>
            ${c.email ? `<dt>الإيميل</dt><dd><span class="ltr">${esc(c.email)}</span></dd>` : ''}
            ${c.note ? `<dt>ملاحظة</dt><dd>${esc(c.note)}</dd>` : ''}</dl>
          <div><ul>${o.items.map((i) => `<li><span>${i.qty} × ${esc(i.name)} <span class="muted small">${esc([i.size, i.color].filter(Boolean).join(' · '))}</span></span>${dzd(i.price * i.qty)}</li>`).join('')}</ul>
            <div class="muted small" style="display:flex;justify-content:space-between;padding-top:8px"><span>التوصيل</span>${o.shipping ? dzd(o.shipping) : 'مجاني'}</div>
            <div class="total"><span>المبلغ عند الاستلام</span><b>${dzd(o.total)}</b></div></div>
        </div></article>`;
    }).join('');
    return `<div class="page-title"><div><h2>الطلبات</h2><p>الدفع عند الاستلام — اتصل بالزبون لتأكيد الطلب</p></div></div>
      <div class="orders">${cards || '<div class="card empty">لا توجد طلبات بعد.</div>'}</div>`;
  }

  function viewEmails() {
    const m = state.meta.mail;
    const notice = m.mode === 'smtp'
      ? `<div class="notice ok"><b>✅ الإرسال الحقيقي مفعّل</b><span>الإيميلات تُرسل عبر <code>${esc(m.host)}</code> من العنوان <code>${esc(m.from)}</code>.</span></div>`
      : `<div class="notice warn"><b>⚠️ وضع المعاينة — الإيميلات لا تُرسل فعلياً بعد</b>
          <span>لم يتم ضبط خادم البريد (SMTP). حالياً تُحفظ كل رسالة كملف للمعاينة فقط. لتفعيل الإرسال الحقيقي إلى زبائنك أضف <code>SMTP_HOST</code> و<code>SMTP_USER</code> و<code>SMTP_PASS</code> في ملف <code>.env</code> ثم أعد تشغيل السيرفر (التفاصيل في ملف README).</span></div>`;

    const campaigns = state.campaigns.map((c) => {
      const pct = c.total ? Math.round(((c.sent + c.failed) / c.total) * 100) : 100;
      return `<tr><td><b>${esc(c.productName)}</b><div class="muted small">${when(c.createdAt)}</div></td>
        <td><span class="badge ${c.status === 'done' ? 'ok' : c.status === 'interrupted' ? 'bad' : 'warn'}">${CAMPAIGN_STATUS[c.status]}</span></td>
        <td><div class="progress" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><i style="width:${pct}%"></i></div></td>
        <td>${c.sent}/${c.total}${c.failed ? ` <span class="badge bad">${c.failed} فشل</span>` : ''}${c.mode === 'preview' ? ' <span class="badge">معاينة</span>' : ''}${c.lastError ? `<div class="small muted ltr">${esc(c.lastError)}</div>` : ''}</td></tr>`;
    }).join('');

    const previews = m.mode === 'preview' && state.previews.length
      ? `<div class="card block"><h3>آخر الإيميلات المحفوظة (معاينة)</h3><p class="muted small">اضغط على ملف لرؤية الإيميل كما سيصل للزبون، بالشعار.</p>
          <ul class="preview-list">${state.previews.slice(0, 12).map((f) => `<li><a href="/api/admin/outbox/${encodeURIComponent(f)}" target="_blank" rel="noopener">${esc(f.replace(/^\d{4}-\d{2}-\d{2}T[\d-]+Z-[0-9a-f]{4}-/, '').replace('.html', ''))}</a></li>`).join('')}</ul></div>`
      : '';

    return `<div class="page-title"><div><h2>الإيميلات</h2><p>إشعار تلقائي للمشتركين عند كل منتج جديد</p></div></div>
      ${notice}
      <div class="grid-2">
        <div class="card block"><h3>إرسال رسالة تجريبية</h3><p class="muted small">تأكد أن الإيميل يصل ويظهر الشعار بشكل صحيح.</p>
          <form class="inline-form" id="test-mail"><input type="email" name="email" placeholder="your@email.com" required><button class="btn primary" type="submit">إرسال</button></form></div>
        ${previews || `<div class="card block"><h3>كيف يعمل؟</h3><p class="muted">عند إضافة منتج جديد مع تفعيل خيار «أرسل إيميل للمشتركين»، يصل لكل مشترك نشط إيميل بشعار Boutique Sekhri وصورة المنتج وسعره ورابط مباشر له.</p></div>`}
      </div>
      <h3 style="margin:28px 0 12px">سجل الحملات</h3>
      <div class="card table-wrap">${state.campaigns.length
    ? `<table><thead><tr><th>المنتج</th><th>الحالة</th><th>التقدم</th><th>أُرسل</th></tr></thead><tbody>${campaigns}</tbody></table>`
    : '<div class="empty">لم يُرسل أي إيميل بعد.</div>'}</div>`;
  }

  function renderPanel() {
    const views = { products: viewProducts, subscribers: viewSubscribers, orders: viewOrders, emails: viewEmails };
    $('#panel').innerHTML = views[state.tab]();
    $$('#tabs button').forEach((b) => b.classList.toggle('on', b.dataset.tab === state.tab));
  }

  // --------------------------------------------------------- product form
  function openProductForm(product) {
    const p = product || { name: '', category: state.meta.categories[0].id, price: '', oldPrice: '', description: '', sizes: ['S', 'M', 'L', 'XL', 'XXL'], colors: [], images: [], art: '', featured: false, soldOut: false, published: true };
    const subs = activeSubs().length;
    let keep = [...p.images];
    let files = [];
    const colors = p.colors.map((c) => ({ ...c }));

    const modal = $('#modal');
    const card = $('#modal-card');
    card.innerHTML = `<div class="modal-head"><h3>${product ? 'تعديل المنتج' : 'منتج جديد'}</h3><button class="x" type="button" data-close aria-label="إغلاق">×</button></div>
    <form class="form" id="product-form" novalidate>
      <label class="field"><span>اسم المنتج</span><input name="name" required maxlength="120" value="${esc(p.name)}" placeholder="مثال: Ensemble Apex"></label>
      <div class="form-row">
        <label class="field"><span>الفئة</span><select name="category">${state.meta.categories.map((c) => `<option value="${c.id}" ${p.category === c.id ? 'selected' : ''}>${esc(c.ar)}</option>`).join('')}</select></label>
        <label class="field"><span>الشكل المرسوم <small>(عندما لا توجد صورة)</small></span><select name="art"><option value="">تلقائي حسب الفئة</option>${state.meta.artKinds.map((k) => `<option value="${k}" ${p.art === k && product ? 'selected' : ''}>${ART_LABELS[k] || k}</option>`).join('')}</select></label>
      </div>
      <div class="form-row">
        <label class="field"><span>السعر (دج)</span><input name="price" type="number" min="1" step="1" required value="${esc(p.price)}" dir="ltr"></label>
        <label class="field"><span>السعر القديم <small>(اختياري — لإظهار التخفيض)</small></span><input name="oldPrice" type="number" min="1" step="1" value="${esc(p.oldPrice ?? '')}" dir="ltr"></label>
      </div>
      <label class="field"><span>الوصف</span><textarea name="description" maxlength="2000" placeholder="وصف قصير: القصة، الخامة، الاستعمال…">${esc(p.description)}</textarea></label>

      <div class="field"><span class="label">المقاسات المتوفرة</span>
        <div class="chips">${state.meta.sizes.map((s) => `<label class="chip"><input type="checkbox" name="size" value="${s}" ${p.sizes.includes(s) ? 'checked' : ''}><span>${s}</span></label>`).join('')}</div></div>

      <div class="field"><span class="label">الألوان</span>
        <div class="color-rows" id="color-rows"></div>
        <div class="presets" id="presets">${PRESET_COLORS.map(([n, h]) => `<button type="button" data-preset="${h}" data-name="${esc(n)}"><i style="background:${h}"></i>${esc(n)}</button>`).join('')}
          <button type="button" data-add-color>＋ لون آخر</button></div></div>

      <div class="field"><span class="label">الصور <small>(JPG / PNG / WebP — حتى 8 ميغا للصورة)</small></span>
        <div class="images" id="images"></div>
        <input type="file" id="file-input" accept="image/jpeg,image/png,image/webp" multiple></div>

      <div class="toggles">
        <label class="toggle"><input type="checkbox" name="published" ${p.published ? 'checked' : ''}> منشور في المتجر</label>
        <label class="toggle"><input type="checkbox" name="featured" ${p.featured ? 'checked' : ''}> مميز (يظهر في «الأكثر طلباً» على الصفحة الرئيسية)</label>
        <label class="toggle"><input type="checkbox" name="soldOut" ${p.soldOut ? 'checked' : ''}> نفد المخزون</label>
      </div>

      <label class="notify-box"><input type="checkbox" name="notify" ${product ? '' : 'checked'}>
        <div><b>📧 أرسل إيميل بالشعار لكل المشتركين بعد الحفظ</b>
        <span>${subs ? `سيصل الإيميل إلى ${subs} مشترك نشط، يتضمن شعار Boutique Sekhri وصورة المنتج وسعره ورابطاً مباشراً.` : 'لا يوجد مشتركون بعد، لكن عند وجودهم سيصلهم الإيميل تلقائياً.'}</span></div></label>
      <p class="error" id="form-error" hidden></p>
    </form>
    <div class="modal-foot"><button class="btn ghost" type="button" data-close>إلغاء</button><button class="btn primary" type="submit" form="product-form" id="save-btn">${product ? 'حفظ التعديلات' : 'نشر المنتج'}</button></div>`;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';

    const renderColors = () => {
      $('#color-rows', card).innerHTML = colors.map((c, i) => `<div class="color-row">
        <input type="color" value="${esc(c.hex)}" data-ci="${i}" data-k="hex" aria-label="اللون">
        <input type="text" value="${esc(c.name)}" data-ci="${i}" data-k="name" maxlength="30" placeholder="اسم اللون" aria-label="اسم اللون">
        <button class="x" type="button" data-rm-color="${i}" aria-label="حذف">×</button></div>`).join('');
    };
    const renderImages = () => {
      $('#images', card).innerHTML = [
        ...keep.map((u, i) => `<div class="img-item"><img src="${esc(u)}" alt=""><button type="button" data-rm-keep="${i}" aria-label="حذف">×</button></div>`),
        ...files.map((f, i) => `<div class="img-item"><img src="${URL.createObjectURL(f)}" alt=""><button type="button" data-rm-file="${i}" aria-label="حذف">×</button></div>`),
      ].join('') || '<span class="muted small">بدون صور: سيُستعمل الشكل المرسوم حسب الفئة واللون.</span>';
    };
    renderColors();
    renderImages();

    const close = () => { modal.hidden = true; document.body.style.overflow = ''; card.innerHTML = ''; };
    card.onclick = (e) => {
      const t = e.target;
      if (t.closest('[data-close]')) return close();
      const preset = t.closest('[data-preset]');
      if (preset) { colors.push({ name: preset.dataset.name, hex: preset.dataset.preset }); renderColors(); }
      if (t.closest('[data-add-color]')) { colors.push({ name: '', hex: '#17181a' }); renderColors(); }
      const rc = t.closest('[data-rm-color]');
      if (rc) { colors.splice(Number(rc.dataset.rmColor), 1); renderColors(); }
      const rk = t.closest('[data-rm-keep]');
      if (rk) { keep.splice(Number(rk.dataset.rmKeep), 1); renderImages(); }
      const rf = t.closest('[data-rm-file]');
      if (rf) { files.splice(Number(rf.dataset.rmFile), 1); renderImages(); }
    };
    card.oninput = (e) => {
      const el = e.target;
      if (el.dataset.ci !== undefined) colors[Number(el.dataset.ci)][el.dataset.k] = el.value;
    };
    $('#file-input', card).onchange = (e) => {
      files = files.concat([...e.target.files]).slice(0, 8 - keep.length);
      e.target.value = '';
      renderImages();
    };
    modal.onclick = (e) => { if (e.target === modal) close(); };

    $('#product-form', card).onsubmit = guard(async (e) => {
      e.preventDefault();
      const f = e.target;
      const err = $('#form-error', card);
      err.hidden = true;
      const cleanColors = colors.filter((c) => c.name.trim());
      if (colors.length !== cleanColors.length) { err.textContent = 'أعطِ اسماً لكل لون أو احذف اللون الفارغ.'; err.hidden = false; return; }
      if (!f.name.value.trim() || !f.price.value) { err.textContent = 'الاسم والسعر مطلوبان.'; err.hidden = false; return; }

      const fd = new FormData();
      fd.set('name', f.name.value);
      fd.set('category', f.category.value);
      fd.set('art', f.art.value);
      fd.set('price', f.price.value);
      fd.set('oldPrice', f.oldPrice.value);
      fd.set('description', f.description.value);
      fd.set('sizes', JSON.stringify($$('input[name=size]:checked', f).map((i) => i.value)));
      fd.set('colors', JSON.stringify(cleanColors));
      fd.set('published', f.published.checked);
      fd.set('featured', f.featured.checked);
      fd.set('soldOut', f.soldOut.checked);
      fd.set('notify', f.notify.checked);
      fd.set('keepImages', JSON.stringify(keep));
      files.forEach((file) => fd.append('images', file));

      const btn = $('#save-btn', card);
      btn.disabled = true;
      try {
        const res = await api(product ? `/api/admin/products/${product.id}` : '/api/admin/products', { method: product ? 'PUT' : 'POST', form: fd });
        close();
        await loadAll();
        const c = res.campaign;
        toast(c && c.total ? `تم الحفظ ✅ — جارٍ إرسال الإيميل إلى ${c.total} مشترك` : 'تم الحفظ ✅');
      } catch (ex) {
        err.textContent = ex.message;
        err.hidden = false;
        btn.disabled = false;
      }
    });
    $('input[name=name]', card).focus();
  }

  // --------------------------------------------------------------- events
  function bind() {
    $('#tabs').addEventListener('click', (e) => {
      const b = e.target.closest('[data-tab]');
      if (!b) return;
      state.tab = b.dataset.tab;
      renderPanel();
      guard(loadAll)(); // pick up anything that arrived while this tab was open
    });

    $('#panel').addEventListener('click', guard(async (e) => {
      const t = e.target;
      if (t.closest('[data-new]')) return openProductForm(null);
      const edit = t.closest('[data-edit]');
      if (edit) return openProductForm(state.products.find((p) => p.id === edit.dataset.edit));
      const del = t.closest('[data-delete]');
      if (del) {
        const p = state.products.find((x) => x.id === del.dataset.delete);
        if (!confirm(`حذف «${p.name}» نهائياً؟`)) return;
        await api(`/api/admin/products/${p.id}`, { method: 'DELETE' });
        toast('تم الحذف');
        return loadAll();
      }
      const notify = t.closest('[data-notify]');
      if (notify) {
        const p = state.products.find((x) => x.id === notify.dataset.notify);
        const n = activeSubs().length;
        if (!n) return toast('لا يوجد مشتركون نشطون بعد', true);
        if (!confirm(`إرسال إيميل عن «${p.name}» إلى ${n} مشترك؟`)) return;
        await api(`/api/admin/products/${p.id}/notify`, { method: 'POST', json: {} });
        toast('بدأ الإرسال');
        state.tab = 'emails';
        return loadAll();
      }
      const delSub = t.closest('[data-del-sub]');
      if (delSub) {
        if (!confirm('حذف هذا المشترك نهائياً؟')) return;
        await api(`/api/admin/subscribers/${delSub.dataset.delSub}`, { method: 'DELETE' });
        return loadAll();
      }
    }));

    $('#panel').addEventListener('change', guard(async (e) => {
      const sel = e.target.closest('[data-order]');
      if (!sel) return;
      await api(`/api/admin/orders/${sel.dataset.order}`, { method: 'PATCH', json: { status: sel.value } });
      toast('تم تحديث حالة الطلب');
      state.orders = await api('/api/admin/orders');
      renderCounts();
      renderPanel();
    }));

    $('#panel').addEventListener('submit', guard(async (e) => {
      if (e.target.id !== 'test-mail') return;
      e.preventDefault();
      const btn = $('button', e.target);
      btn.disabled = true;
      try {
        const res = await api('/api/admin/mail/test', { method: 'POST', json: { email: e.target.email.value } });
        toast(res.mode === 'smtp' ? 'تم الإرسال — تحقق من بريدك' : 'وضع المعاينة: تم حفظ الرسالة للمعاينة');
        state.previews = await api('/api/admin/outbox');
        renderPanel();
      } finally { btn.disabled = false; }
    }));

    $('#logout').addEventListener('click', guard(async () => {
      await api('/api/admin/logout', { method: 'POST', json: {} });
      showLogin();
    }));

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !$('#modal').hidden) $('#modal-card [data-close]')?.click();
    });
  }

  // ---------------------------------------------------------------- login
  function showLogin() {
    clearInterval(pollTimer);
    pollTimer = null;
    $('#app').hidden = true;
    $('#modal').hidden = true;
    $('#login').hidden = false;
    $('#login-form').password.focus();
  }

  async function showApp() {
    $('#login').hidden = true;
    $('#app').hidden = false;
    await loadAll();
  }

  $('#login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const err = $('#login-error');
    err.hidden = true;
    try {
      await api('/api/admin/login', { method: 'POST', json: { password: e.target.password.value } });
      e.target.password.value = '';
      await showApp();
    } catch (ex) {
      err.textContent = ex.message === 'Mot de passe incorrect' ? 'كلمة السر غير صحيحة' : ex.message;
      err.hidden = false;
    }
  });

  // new orders show up on the badge without reloading the page
  setInterval(async () => {
    if ($('#app').hidden) return;
    try {
      state.orders = await api('/api/admin/orders');
      renderCounts();
      if (state.tab === 'orders') renderPanel();
    } catch { /* ignore */ }
  }, 30000);

  bind();
  api('/api/admin/session').then(({ authenticated }) => (authenticated ? showApp() : showLogin())).catch(showLogin);
})();
