# portfol.io

Modern MERN tabanli bir yatirim platformu prototipi.

## Ozellikler
- Giris yap / kaydol
- Ana sayfada populer yatirim urunleri
- Tum yatirim urunleri listesi ve 30 gunluk mini grafik butonu
- Doviz, altin, gumus, kripto piyasalari
- Bakiye yukleme
- Al / sat islemleri
- Portfoy, kar-zarar (PnL) ozeti
- Uyelik tipleri: free, bronze, silver, gold
- AI chatbot (free dahil)
- Bronze/Silver/Gold uzmanlar ile canli mesajlasma (Socket.IO)
- Uzman paneli altyapisi (expert role + tier bazli oda)
- Uzman paneli: ayri giris ve kullanici konusma kuyrugu
- Islem gecmisi ve filtreleme (tip, sembol, tarih araligi)
- WebSocket ile canli piyasa veri akisi

## Veri Kaynaklari
- CoinGecko API: https://api.coingecko.com/api/v3
- ExchangeRate API: https://api.exchangerate-api.com/v4/latest

Piyasa verileri server tarafinda cache'lenir (60 sn). API kesintisinde fallback verilerle sistem calismaya devam eder.

Bu endpointler `.env` uzerinden degistirilebilir:
- `COINGECKO_BASE_URL`
- `EXCHANGE_RATE_BASE_URL`
- `MARKET_UPDATE_INTERVAL_MS`

## Kurulum
1. MongoDB calistir.
2. Ornek ortam degiskenlerini kopyala:
   - `server/.env.example` -> `server/.env`
   - `client/.env.example` -> `client/.env`
3. Bagimliliklari yukle:

```bash
npm install
npm install --prefix server
npm install --prefix client
```

## Calistirma
```bash
npm run dev
```

- Client: http://localhost:5173
- Server: http://localhost:5000

## Demo Uzman Hesaplari
- bronze@portfol.io / expert123
- silver@portfol.io / expert123
- gold@portfol.io / expert123

Bu hesaplar server acilisinda otomatik seed edilir.
