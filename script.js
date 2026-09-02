// ============================================
// FIT CRUNCH — LANDING PAGE INTERACTIONS
// ============================================

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Mobile menu toggle ---------- */
  const menuToggle = document.getElementById('menuToggle');
  const mobileNav = document.getElementById('mobileNav');

  menuToggle.addEventListener('click', () => {
    mobileNav.classList.toggle('open');
  });

  /* ---------- Smooth scroll for [data-scroll-to] buttons ---------- */
  document.querySelectorAll('[data-scroll-to]').forEach((el) => {
    el.addEventListener('click', () => {
      const target = document.querySelector(el.getAttribute('data-scroll-to'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      mobileNav.classList.remove('open');
    });
  });

  /* ---------- Quantity stepper + live price ---------- */
  const BASE_PRICE = 1600;       // price for the 1st kg
  const DISCOUNT_PER_EXTRA = 100; // discount applied to each extra kg
  const MIN_QTY = 1;
  const MAX_QTY = 20;

  const qtyInput = document.getElementById('quantity');
  const qtyUpBtn = document.getElementById('qtyUp');
  const qtyDownBtn = document.getElementById('qtyDown');
  const priceInput = document.getElementById('price');

  function calcPrice(qty) {
    if (qty <= 1) return BASE_PRICE;
    const extraUnits = qty - 1;
    const extraUnitPrice = extraUnits * 100;
    return qty * BASE_PRICE - extraUnitPrice;
  }

  function updatePriceDisplay() {
    const qty = parseInt(qtyInput.value, 10) || MIN_QTY;
    const total = calcPrice(qty);
    priceInput.value = `${total.toLocaleString('ar-DZ')} دج`;
  }

  function changeQty(delta) {
    let qty = parseInt(qtyInput.value, 10) || MIN_QTY;
    qty = Math.min(MAX_QTY, Math.max(MIN_QTY, qty + delta));
    qtyInput.value = qty;
    updatePriceDisplay();
  }

  qtyUpBtn.addEventListener('click', () => changeQty(1));
  qtyDownBtn.addEventListener('click', () => changeQty(-1));
  updatePriceDisplay();

  /* ---------- Product image carousel ---------- */
  const track = document.getElementById('carouselTrack');
  const slides = Array.from(track.querySelectorAll('.carousel-slide'));
  const dotsContainer = document.getElementById('carouselDots');
  const prevBtn = document.getElementById('carouselPrev');
  const nextBtn = document.getElementById('carouselNext');
  let currentSlide = 0;

  // Build dots dynamically based on number of slides
  slides.forEach((_, index) => {
    const dot = document.createElement('button');
    dot.className = 'carousel-dot';
    dot.setAttribute('aria-label', `الانتقال إلى الصورة ${index + 1}`);
    dot.addEventListener('click', () => goToSlide(index));
    dotsContainer.appendChild(dot);
  });
  const dots = Array.from(dotsContainer.querySelectorAll('.carousel-dot'));

  function goToSlide(index) {
    slides[currentSlide].classList.remove('active');
    dots[currentSlide].classList.remove('active');
    currentSlide = (index + slides.length) % slides.length;
    slides[currentSlide].classList.add('active');
    dots[currentSlide].classList.add('active');
  }

  // Note: the design is RTL, so the "next" visual arrow (▶) moves backward
  // in slide order and the "prev" (◀ appears on the left) moves forward —
  // matching the arrow directions shown in the Figma reference.
  prevBtn.addEventListener('click', () => goToSlide(currentSlide + 1));
  nextBtn.addEventListener('click', () => goToSlide(currentSlide - 1));

  goToSlide(0); // initialize

  /* ---------- Order form submission ---------- */
  const orderForm = document.getElementById('orderForm');
  const formSuccess = document.getElementById('formSuccess');
  const phoneInput = document.getElementById('phone');

  orderForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!orderForm.checkValidity()) {
      orderForm.reportValidity();
      return;
    }

    // Basic Algerian mobile number check (05/06/07 + 8 digits)
    const phonePattern = /^0[5-7][0-9]{8}$/;
    if (!phonePattern.test(phoneInput.value.trim())) {
      phoneInput.setCustomValidity('الرجاء إدخال رقم هاتف جزائري صحيح (مثال: 0552476220)');
      orderForm.reportValidity();
      phoneInput.setCustomValidity('');
      return;
    }

    // Send the order to the Netlify serverless function (which forwards to Resend)
    const submitBtn = orderForm.querySelector('.btn-full');
    submitBtn.setAttribute('disabled', 'true');
    submitBtn.textContent = 'جاري الإرسال...';

    const payload = {
      fullName: document.getElementById('fullName').value.trim(),
      phone: phoneInput.value.trim(),
      wilaya: document.getElementById('wilaya').value.trim(),
      commune: document.getElementById('commune').value.trim(),
      quantity: qtyInput.value,
      price: priceInput.value,
    };

    try {
      const res = await fetch('/.netlify/functions/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Request failed');

      formSuccess.hidden = false;
      orderForm.reset();
      qtyInput.value = 2;
      updatePriceDisplay();
    } catch (err) {
      alert('حدث خطأ أثناء إرسال الطلب، الرجاء المحاولة مرة أخرى.');
      console.error(err);
    } finally {
      submitBtn.removeAttribute('disabled');
      submitBtn.textContent = 'اطلب الآن';
      setTimeout(() => { formSuccess.hidden = true; }, 4000);
    }
  });

});