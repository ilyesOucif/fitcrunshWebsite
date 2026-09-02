exports.handler = async (event) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  let data;
  try {
    data = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { fullName, phone, wilaya, commune, quantity, price } = data;

  // Basic server-side validation (never trust the client)
  if (!fullName || !phone || !wilaya || !commune || !quantity || !price) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) };
  }

  const phonePattern = /^0[5-7][0-9]{8}$/;
  if (!phonePattern.test(phone)) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid phone number' }) };
  }

  const qty = parseInt(quantity, 10);
  if (isNaN(qty) || qty < 1 || qty > 20) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid quantity' }) };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Fit Crunch Orders <onboarding@resend.dev>',
        to: ['anotherm501@gmail.com'], // <-- 👈 PASTE YOUR EMAIL HERE
        subject: `طلب جديد من ${fullName}`,
        html: `
          <h2>طلب جديد</h2>
          <p><strong>الاسم:</strong> ${fullName}</p>
          <p><strong>الهاتف:</strong> ${phone}</p>
          <p><strong>الولاية:</strong> ${wilaya}</p>
          <p><strong>البلدية:</strong> ${commune}</p>
          <p><strong>الكمية:</strong> ${qty}</p>
          <p><strong>السعر:</strong> ${price}</p>
        `,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Resend error:', errText);
      return { statusCode: 502, body: JSON.stringify({ error: 'Email service failed' }) };
    }

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error('Server error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};