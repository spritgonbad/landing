const $ = (s) => document.querySelector(s);

function persianDateTime(){
  const now = new Date();
  const date = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {weekday:'long', year:'numeric', month:'long', day:'numeric'}).format(now);
  const time = new Intl.DateTimeFormat('fa-IR', {hour:'2-digit', minute:'2-digit'}).format(now);
  $('#liveDate').textContent = `${date} · ${time}`;
}
persianDateTime();
setInterval(persianDateTime, 30000);

function getIranNowParts(){
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone:'Asia/Tehran', weekday:'short', hour:'2-digit', minute:'2-digit', hour12:false
  }).formatToParts(now);
  const get = (t) => parts.find(p=>p.type===t)?.value;
  let hour = Number(get('hour')); if(hour === 24) hour = 0;
  return { weekday:get('weekday'), hour, minute:Number(get('minute')) };
}

function faNum(n){ return String(n).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]); }
function minutes(h,m){ return h*60+m; }
function pad2(n){ return String(n).padStart(2,'0'); }
function timeFa(h,m){ return faNum(`${pad2(h)}:${pad2(m)}`); }

function nextRegularOpening(dayIndex, currentMinutes){
  // Sat=6, Sun=0, Mon=1, Tue=2, Wed=3, Thu=4, Fri=5 in JS weekday convention
  const names = ['یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنجشنبه','جمعه','شنبه'];
  let day = dayIndex, delta = 0, openH = 9, openM = 0;
  if(day === 5){
    if(currentMinutes < 17) return {label:'امروز، حدود ساعت ۱۷:۰۰', uncertain:true};
    delta = 1; day = 6;
  } else if(currentMinutes < 9){
    return {label:`امروز، ساعت ${timeFa(9,0)}`, uncertain:false};
  } else if(currentMinutes < 15*60){
    return {label:'الان فروشگاه باز است', uncertain:false};
  } else if(currentMinutes < 17*60){
    return {label:`امروز، ساعت ${timeFa(17,0)}`, uncertain:false};
  } else if(currentMinutes < 23*60){
    return {label:'الان فروشگاه باز است', uncertain:false};
  } else {
    delta = 1; day = (day+1)%7;
  }
  if(day === 5) return {label:'جمعه، حدود عصر (ساعت قطعی نیست)', uncertain:true};
  return {label:`${names[day]}، ساعت ${timeFa(9,0)}`, uncertain:false};
}

function updateStoreStatus(){
  const {weekday,hour,minute} = getIranNowParts();
  const dayMap = {Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6};
  const day = dayMap[weekday];
  const t = minutes(hour,minute);
  let isOpen=false, title='', detail='', state='closed';

  if(day === 5){
    if(t >= 17*60 && t < 23*60){
      isOpen = true; state='open'; title='احتمالاً الان باز است'; detail='امروز جمعه است؛ چون ساعت باز بودن عصرها قطعی نیست، قبل از مراجعه تماس بگیرید.';
    } else if(t < 17*60){
      title='امروز جمعه است'; detail='ساعت باز بودن جمعه قطعی نیست؛ معمولاً عصرها باز می‌شود.';
    } else {
      title='امروز جمعه، ساعت کاری گذشته'; detail='برای مراجعه بعدی، شنبه ساعت ۹:۰۰ شروع به کار معمول فروشگاه است.';
    }
  } else if(t >= 9*60 && t < 15*60){
    isOpen=true; state='open'; title='الان فروشگاه باز است'; detail='تا ساعت ۱۵:۰۰ در بخش اول ساعت کاری هستیم.';
  } else if(t >= 17*60 && t < 23*60){
    isOpen=true; state='open'; title='الان فروشگاه باز است'; detail='تا ساعت ۲۳:۰۰ در بخش دوم ساعت کاری هستیم.';
  } else if(t < 9*60){
    title='الان فروشگاه بسته است'; detail=`نزدیک‌ترین زمان باز شدن: امروز ساعت ${timeFa(9,0)}`;
  } else if(t < 17*60){
    title='الان فروشگاه بسته است'; detail=`نزدیک‌ترین زمان باز شدن: امروز ساعت ${timeFa(17,0)}`;
  } else {
    const nextDay = (day+1)%7;
    if(nextDay === 5){
      title='الان فروشگاه بسته است'; detail='نزدیک‌ترین زمان احتمالی باز بودن: جمعه عصر (ساعت قطعی نیست).';
    } else {
      const names = ['یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنجشنبه','جمعه','شنبه'];
      title='الان فروشگاه بسته است'; detail=`نزدیک‌ترین زمان باز شدن: ${names[nextDay]} ساعت ${timeFa(9,0)}`;
    }
  }

  const nodes = [$('#storeStatusHero'), $('#storeStatusCard')].filter(Boolean);
  nodes.forEach(el=>{
    el.className = `store-status status-${state}`;
    const titleEl=el.querySelector('.status-title'), detailEl=el.querySelector('.status-detail');
    if(titleEl) titleEl.textContent=title;
    if(detailEl) detailEl.textContent=detail;
  });
}

updateStoreStatus();
setInterval(updateStoreStatus, 30000);

const menuToggle = $('.menu-toggle');
const nav = $('.nav');
menuToggle?.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(open));
});
nav?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));

// Approximate size model: chest takes priority, height/weight fills gaps.
const sizeBands = [
  {min:104,max:108, eu:'50', asia:'2XL'},
  {min:109,max:114, eu:'52', asia:'3XL'},
  {min:115,max:120, eu:'54', asia:'4XL'},
  {min:121,max:126, eu:'56', asia:'5XL'},
  {min:127,max:132, eu:'58', asia:'6XL'},
  {min:133,max:138, eu:'60', asia:'7XL'},
  {min:139,max:144, eu:'62', asia:'8XL'},
  {min:145,max:150, eu:'64', asia:'9XL'},
];

function estimateChest(height, weight){
  // Broad estimate; output is intentionally not presented as a medical/body-measurement claim.
  const bmiLike = weight / Math.pow(height/100,2);
  let chest = 92 + (bmiLike - 22) * 2.1 + (height - 175) * 0.08;
  return Math.round(Math.max(98, Math.min(150, chest)));
}

function bandForChest(chest){
  if(chest <= 103) return {eu:'48', asia:'XL'};
  return sizeBands.find(b => chest >= b.min && chest <= b.max) || sizeBands[sizeBands.length-1];
}

$('#sizeForm')?.addEventListener('submit', (e) => {
  e.preventDefault();
  const height = Number($('#height').value);
  const weight = Number($('#weight').value);
  const chestInput = Number($('#chest').value);
  if(!height || !weight) return;
  const estimated = !chestInput;
  const chest = chestInput || estimateChest(height, weight);
  const size = bandForChest(chest);
  const fitHint = chest >= 133 ? 'اگر مدل لباس جذب است، یک سایز بزرگ‌تر را هم بررسی کنید.' : 'برای فیت آزاد، با پشتیبانی فروشگاه درباره اندازه واقعی مدل چک کنید.';
  const msg = `سلام، از طریق سایت فروشگاه اسپریت نتیجه سایزیابی گرفتم.%0Aقد: ${height} سانتی‌متر%0Aوزن: ${weight} کیلوگرم%0Aدور سینه: ${chest} سانتی‌متر${estimated?' (تخمینی)':''}%0Aسایز پیشنهادی اروپا: ${size.eu}%0Aسایز پیشنهادی آسیا: ${size.asia}%0Aلطفاً موجودی و اندازه دقیق مدل مدنظر را بررسی کنید.`;
  $('#sizeResult').innerHTML = `
    <span class="result-kicker">نتیجه پیشنهادی بر اساس ورودی شما</span>
    <div class="result-main">${size.asia}</div>
    <div class="result-pair">
      <div class="result-box"><b>${size.eu}</b><span>سایز پیشنهادی اروپا</span></div>
      <div class="result-box"><b>${size.asia}</b><span>سایز پیشنهادی آسیا</span></div>
    </div>
    <p>${fitHint}</p>
    <small style="color:var(--muted)">دور سینه مبنا: ${chest} سانتی‌متر${estimated?' · تخمین زده شده':''}</small>
    <div class="result-actions"><a class="btn btn-whatsapp" href="https://wa.me/989119790805?text=${msg}" target="_blank" rel="noopener">ارسال نتیجه به واتساپ</a><a class="btn btn-outline" href="#contact">دیدن اطلاعات تماس</a></div>`;
});

const reviewNames = ['آقای قوجق','آقای سیدی','آقای علیزاده','آقای حسینی','آقای مختومی','آقای آتابای','آقای اونق','آقای غراوی','آقای ریگی','آقای کسلکه','آقای پرتویی','آقای نظری'];
const reviewCities = ['گنبد کاووس','مینودشت','کلاله','گرگان','آزادشهر','گنبد کاووس','بندر ترکمن','گنبد کاووس','رامیان','گالیکش','علی‌آباد کتول','گنبد کاووس'];
const reviewTexts = [
  'تنوع سایزهای بزرگ واقعاً خوب بود و برای اولین‌بار بدون دردسر سایز مناسب پیدا کردم.',
  'برخورد خیلی محترمانه بود؛ مدل و سایز را در واتساپ فرستادم و سریع راهنمایی شدم.',
  'کیفیت دوخت و تنوع مدل‌ها برای سایز بزرگ برای من نقطه قوت فروشگاه بود.',
  'قبل از خرید درباره اندازه‌ها دقیق توضیح دادند و انتخابم مطمئن‌تر شد.',
  'پیدا کردن لباس 5XL و 6XL همیشه سخت بود؛ اینجا گزینه‌های بیشتری دیدم.',
  'هم حضوری خرید کردم هم بعداً برای استعلام مدل جدید از دایرکت استفاده کردم؛ راحت بود.',
  'برای سایز بزرگ، تنوع مدل و برخورد فروشنده خیلی بهتر از چیزی بود که انتظار داشتم.',
  'قیمت و موجودی را سریع در واتساپ جواب دادند و ارسال هم هماهنگ شد.',
  'راهنمای سایز کمک کرد انتخاب دقیق‌تری داشته باشم و وقت تلف نشد.',
  'مدل‌های روزمره خوبی برای سایزهای بالا داشتند و انتخاب محدود نبود.',
  'پوشاک سایز بزرگ را منظم و با حوصله معرفی کردند؛ تجربه خرید خوبی بود.',
  'برای من مهم بود مدل لباس هم شیک باشد، نه فقط سایز بزرگ؛ اسپریت این بخش را خوب پوشش می‌دهد.'
];
$('#reviewsGrid').innerHTML = reviewNames.map((name,i)=>`<article class="review"><div class="review-head"><div><div class="review-name">${name}</div><div class="review-city">${reviewCities[i]}</div></div><div class="stars">★★★★★</div></div><p>${reviewTexts[i]}</p></article>`).join('');

async function loadNotice(){
  const banner = $('#noticeBanner');
  if (!banner) return;
  banner.hidden = true;
  try{
    const res = await fetch('etela.xml', {cache:'no-store'});
    if(!res.ok) throw new Error('notice');
    const text = await res.text();
    const xml = new DOMParser().parseFromString(text, 'application/xml');
    if (xml.querySelector('parsererror')) throw new Error('xml');
    const notices = [...xml.querySelectorAll('notice')].filter(n => (n.getAttribute('active') || 'true').toLowerCase() !== 'false');
    if (!notices.length) return;
    // Latest notice = last active notice in etela.xml.
    const latest = notices[notices.length - 1];
    const title = latest.querySelector('title')?.textContent?.trim();
    const body = latest.querySelector('body')?.textContent?.trim();
    const date = latest.querySelector('date')?.textContent?.trim();
    if (!title && !body) return;
    $('#noticeBannerTitle').textContent = title || 'اطلاعیه فروشگاه';
    $('#noticeBannerBody').textContent = body || '';
    $('#noticeBannerDate').textContent = date ? `تاریخ اطلاعیه: ${date}` : '';
    banner.hidden = false;
  }catch{
    // در صورت نبود فایل/خطای XML، هیچ بخش اطلاعیه‌ای نمایش داده نمی‌شود.
    banner.hidden = true;
  }
}
loadNotice();
