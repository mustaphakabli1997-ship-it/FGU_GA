const S = window.SALON, $ = id => document.getElementById(id);
const state = { sel: new Set(), date: "", time: "", step: 1 };
const all = window.SERVICES.flatMap(c => c.items);
const chosen = () => all.filter(s => state.sel.has(s.id));
const totals = () => chosen().reduce((t, s) => ({ p: t.p + s.price, d: t.d + s.duration }), { p: 0, d: 0 });
const fmtDur = m => (m >= 60 ? Math.floor(m / 60) + "h" : "") + (m % 60 ? (m % 60) + "min" : "");
const BK = "melina_bookings";
const booked = () => { try { return JSON.parse(localStorage.getItem(BK)) || []; } catch { return []; } };

$("tagline").textContent = S.tagline;
$("addr").textContent = S.address;

// Services
$("services").innerHTML = window.SERVICES.map(c => `<h3>${c.cat}</h3>` + c.items.map(s => `
  <label class="svc" data-id="${s.id}"><input type="checkbox">
    <span class="n">${s.name}<small>${fmtDur(s.duration)}</small></span><b>${s.price} ${S.currency}</b></label>`).join("")).join("");
$("services").addEventListener("change", e => {
  const el = e.target.closest(".svc"), id = el.dataset.id;
  e.target.checked ? state.sel.add(id) : state.sel.delete(id);
  el.classList.toggle("sel", e.target.checked);
  render();
});

// Date & slots
const d = new Date(); d.setDate(d.getDate() + 0);
const iso = x => x.toISOString().slice(0, 10);
$("date").min = iso(d);
$("date").addEventListener("change", e => { state.date = e.target.value; state.time = ""; drawSlots(); render(); });

function drawSlots() {
  const box = $("slots"), msg = $("slotMsg"); box.innerHTML = ""; msg.textContent = "";
  if (!state.date) return;
  const day = new Date(state.date + "T00:00");
  if (S.hours.closedDays.includes(day.getDay())) { msg.textContent = "Le salon est fermé ce jour-là."; return; }
  const need = totals().d, taken = booked().filter(b => b.date === state.date);
  const now = new Date(), isToday = state.date === iso(now);
  for (let m = S.hours.open * 60; m + need <= S.hours.close * 60; m += S.hours.slotMinutes) {
    const t = String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");
    const busy = taken.some(b => m < b.end && m + need > b.start);
    const past = isToday && m <= now.getHours() * 60 + now.getMinutes();
    const btn = document.createElement("button");
    btn.textContent = t; btn.disabled = busy || past;
    btn.onclick = () => { state.time = t; [...box.children].forEach(c => c.classList.toggle("sel", c === btn)); render(); };
    if (t === state.time) btn.classList.add("sel");
    box.append(btn);
  }
  if (!box.children.length) msg.textContent = "Aucun créneau disponible ce jour-là.";
}

// Navigation
const valid = () => state.step === 1 ? state.sel.size > 0
  : state.step === 2 ? !!(state.date && state.time)
  : $("name").value.trim().length > 1 && $("phone").value.replace(/\D/g, "").length >= 9;
function render() {
  const t = totals();
  $("total").textContent = `${t.p} ${S.currency}`;
  $("dur").textContent = t.d ? ` · ${fmtDur(t.d)}` : "";
  [1, 2, 3].forEach(n => { $("s" + n).hidden = state.step !== n; $("steps").children[n - 1].classList.toggle("on", n <= state.step); });
  $("back").hidden = state.step === 1;
  $("next").textContent = state.step === 3 ? "Réserver" : "Continuer";
  $("next").disabled = !valid();
}
["name", "phone"].forEach(id => $(id).addEventListener("input", render));
$("back").onclick = () => { state.step--; render(); };
$("next").onclick = () => {
  if (state.step === 1) { state.step = 2; drawSlots(); }
  else if (state.step === 2) { state.step = 3; $("recap").innerHTML = recap(); }
  else return submit();
  render(); scrollTo(0, 0);
};
const recap = () => chosen().map(s => `${s.name} — ${s.price} ${S.currency}`).join("<br>") +
  `<br><b>${state.date} à ${state.time}</b> · Total ${totals().p} ${S.currency}`;

function submit() {
  const [h, m] = state.time.split(":").map(Number), start = h * 60 + m;
  const b = { date: state.date, start, end: start + totals().d, name: $("name").value.trim(), phone: $("phone").value.trim() };
  localStorage.setItem(BK, JSON.stringify([...booked(), b]));
  const msg = `Bonjour ${S.name}, je souhaite réserver :\n` + chosen().map(s => `• ${s.name} (${s.price} ${S.currency})`).join("\n") +
    `\n📅 ${state.date} à ${state.time}\n💰 Total : ${totals().p} ${S.currency}\n👤 ${b.name} — ${b.phone}` +
    ($("note").value.trim() ? `\n📝 ${$("note").value.trim()}` : "");
  $("wa").href = `https://wa.me/${S.whatsapp}?text=${encodeURIComponent(msg)}`;
  $("s3").hidden = true; $("steps").hidden = true; $("bar").hidden = true; $("done").hidden = false;
}
render();
