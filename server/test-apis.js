import https from 'https';

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function test() {
  try {
    const cg = await fetchUrl('https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=30');
    console.log('CoinGecko:', cg.substring(0, 100) + '...');
    
    const frank = await fetchUrl('https://api.frankfurter.app/2023-01-01..?to=TRY');
    console.log('Frankfurter:', frank.substring(0, 100) + '...');
  } catch (err) {
    console.error(err);
  }
}

test();
