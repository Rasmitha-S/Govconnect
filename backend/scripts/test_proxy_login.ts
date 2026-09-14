async function main() {
  const url = 'http://localhost:5173/api/auth/login';
  console.log('Posting login to:', url);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@govconnect.demo', password: 'Password@123' }),
    });
    console.log('Status:', res.status, res.statusText);
    const text = await res.text();
    console.log('Body:', text);
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

main();
