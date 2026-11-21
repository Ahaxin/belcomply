/* The published, visible rate tables are the calculator's data source. */
(() => {
  const form = document.querySelector('[data-fee-calculator]');
  if (!form) return;
  const zh = document.documentElement.lang === 'zh-CN';
  const t = (en, cn) => zh ? cn : en;
  const year = form.querySelector('[name="year"]');
  const scheme = form.querySelector('[name="scheme"]');
  const lines = form.querySelector('[data-fee-lines]');
  const total = form.querySelector('[data-fee-total]');
  const summary = form.querySelector('[data-fee-summary]');
  const add = form.querySelector('[data-add-material]');
  const example = form.querySelector('[data-load-example]');
  const reset = form.querySelector('[data-reset-fees]');
  const note = form.querySelector('[data-fee-note]');
  const money = new Intl.NumberFormat(zh ? 'zh-CN' : 'en-GB', {style:'currency',currency:'EUR'});
  let nextId = 0;

  function options() {
    return [...document.querySelectorAll('[data-fee-rate]')]
      .filter(row => row.dataset.scheme === scheme.value && row.dataset['year'+year.value] !== undefined)
      .map(row => ({id: row.dataset.feeRate, name: row.cells[0].textContent.trim(), rate: Number(row.dataset['year'+year.value]), unit: row.dataset.unit}));
  }

  function amount(kg, rate, unit) {
    return (unit === 't' ? kg / 1000 : kg) * rate;
  }

  function update() {
    const rates = new Map(options().map(r => [r.id,r]));
    let sum=0, weights=0, valid=true, entered=false;
    [...lines.children].forEach(line => {
      const selected = rates.get(line.querySelector('select').value);
      const input = line.querySelector('input');
      const rateCell = line.querySelector('[data-line-rate]');
      const cost = line.querySelector('[data-line-cost]');
      rateCell.textContent = selected ? `${selected.rate.toFixed(selected.unit === 'kg' ? 4 : 2)} EUR/${selected.unit}` : '—';
      const raw=input.value.trim(), kg=Number(raw);
      if (raw !== '') entered=true;
      if (input.validity.badInput || (raw !== '' && (!Number.isFinite(kg) || kg<0 || kg>1e9 || !selected))) {
        valid=false; cost.textContent='—'; return;
      }
      if (!selected || raw==='') {cost.textContent='—'; return;}
      const lineAmount=amount(kg,selected.rate,selected.unit);
      sum+=lineAmount; weights+=kg; cost.textContent=money.format(lineAmount);
    });
    total.textContent = valid && entered ? money.format(sum) : '—';
    summary.textContent = !valid ? t('Enter a valid weight (0 to 1 billion kg) for each selected material.','请输入有效重量（0至10亿公斤）。') : entered ? t(`${weights.toLocaleString('en-GB',{maximumFractionDigits:3})} kg × applicable rates; rounded at the total.`,`${weights.toLocaleString('zh-CN',{maximumFractionDigits:3})} 公斤，按各适用费率计算后汇总。`) : t('Enter the annual Belgian packaging weight to estimate.','请输入投放比利时市场的年度包装重量。');
    note.textContent = scheme.value==='valipac' ? t('Valipac publishes rates per tonne; entered kg are converted to tonnes. Its minimum financing contribution and other charges are excluded.','Valipac按吨计费，填写的公斤数将转换为吨。不含最低缴费及其他费用。') : t('Fost Plus rates are per kg, excluding VAT. Classification, minimum contributions, litter levy and other charges may change the actual invoice.','Fost Plus按公斤计费，不含增值税。材料分类、最低缴费、垃圾税及其他费用可能影响实际账单。');
    add.disabled=lines.children.length>=12;
    [...lines.querySelectorAll('[data-remove-material]')].forEach(button => button.disabled=lines.children.length===1);
  }

  function makeLine(id='', kg='') {
    const row=document.createElement('div');
    row.className='fee-calc__line';
    const key=`fee-line-${++nextId}`;
    const materialLabel=document.createElement('label');materialLabel.textContent=t('Material','材料');materialLabel.htmlFor=key+'-material';
    const select=document.createElement('select');select.id=materialLabel.htmlFor;
    options().forEach(o=>{const option=document.createElement('option');option.value=o.id;option.textContent=o.name;select.append(option)});
    if ([...select.options].some(o=>o.value===id)) select.value=id;
    const kgLabel=document.createElement('label');kgLabel.textContent=t('Annual weight (kg)','年度重量（公斤）');kgLabel.htmlFor=key+'-kg';
    const input=document.createElement('input');input.id=kgLabel.htmlFor;input.type='number';input.min='0';input.max='1000000000';input.step='any';input.inputMode='decimal';input.placeholder='0';input.value=kg;
    const fields=document.createElement('div');fields.className='fee-calc__fields';
    const materialField=document.createElement('div');materialField.className='field';materialField.append(materialLabel,select);
    const kgField=document.createElement('div');kgField.className='field';kgField.append(kgLabel,input);fields.append(materialField,kgField);
    const result=document.createElement('div');result.className='fee-calc__line-result';
    const rate=document.createElement('span');rate.dataset.lineRate='';
    const cost=document.createElement('strong');cost.dataset.lineCost='';cost.textContent='—';result.append(rate,cost);
    const remove=document.createElement('button');remove.type='button';remove.className='fee-calc__remove';remove.dataset.removeMaterial='';remove.textContent=t('Remove','删除');remove.setAttribute('aria-label',t('Remove this material','删除此材料'));
    remove.addEventListener('click',()=>{row.remove();update();add.focus()});
    row.append(fields,result,remove);lines.append(row);select.addEventListener('change',update);input.addEventListener('input',update);return select;
  }
  function refreshMaterials() {
    const available=options();
    [...lines.children].forEach(line=>{
      const select=line.querySelector('select');const old=select.value;
      select.replaceChildren();
      available.forEach(o=>{const opt=document.createElement('option');opt.value=o.id;opt.textContent=o.name;select.append(opt)});
      if (available.some(o=>o.id===old)) select.value=old;
      else line.querySelector('input').value='';
    });
    update();
  }
  year.addEventListener('change',refreshMaterials);
  scheme.addEventListener('change',()=>{lines.replaceChildren();makeLine();update()});
  add.addEventListener('click',()=>{if(lines.children.length<12){makeLine().focus();update()}});
  example.addEventListener('click',()=>{scheme.value='fost';year.value='2027';lines.replaceChildren();makeLine('paper','1000');makeLine('pe-film','100');update()});
  reset.addEventListener('click',()=>{lines.replaceChildren();makeLine();update()});
  form.addEventListener('submit',event=>event.preventDefault());
  makeLine();update();form.hidden=false;
  document.querySelector('[data-calculator-fallback]')?.setAttribute('hidden','');
})();
