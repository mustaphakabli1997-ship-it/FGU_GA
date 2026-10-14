(function () {
  var form = document.getElementById('pform');
  if (!form) return;
  var data; try { data = JSON.parse(document.getElementById('pjson').textContent); } catch (e) { return; }
  var idInput = document.getElementById('variantId'),
      btn = document.getElementById('addBtn'),
      price = document.getElementById('pprice'),
      soldOut = btn.getAttribute('data-sold'), addText = btn.getAttribute('data-add');
  function current() {
    var vals = [];
    form.querySelectorAll('fieldset.opt').forEach(function (fs) {
      var c = fs.querySelector('input:checked'); vals.push(c ? c.value : null);
    });
    return vals;
  }
  function update() {
    var vals = current();
    var v = data.filter(function (x) { return x.opts.every(function (o, i) { return o === vals[i]; }); })[0];
    if (!v) { btn.disabled = true; btn.textContent = soldOut; return; }
    idInput.value = v.id;
    if (price) price.textContent = v.price;
    btn.disabled = !v.available;
    btn.textContent = v.available ? addText : soldOut;
    if (history.replaceState) history.replaceState(null, '', location.pathname + '?variant=' + v.id);
  }
  form.addEventListener('change', update);
  update();
})();
