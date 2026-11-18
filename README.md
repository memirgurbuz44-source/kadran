# Kadran AI Studio

Tarayıcıda çalışan, GitHub Pages ile yayınlanabilen dijital kadran tasarım arayüzü.

## Özellikler
- PNG/JPG/WEBP referans görsel yükleme ve önizleme
- JSON editörü ve JSON değişiklikleriyle anlık SVG kadran güncelleme
- Hız ve devir göstergesi ayarları
- Tema ve vurgu rengi
- JSON kopyalama, içe aktarma ve indirme
- Mobil uyumlu arayüz

## Çalıştırma
`index.html` dosyasını tarayıcıda aç.

## GitHub Pages
1. Bu dosyaları GitHub deposunun ana dizinine yükle.
2. Repository → Settings → Pages bölümüne gir.
3. Build and deployment altında `Deploy from a branch` seç.
4. Branch olarak `main`, klasör olarak `/ (root)` seçip Save'e bas.

Resmî rehber: https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site

## AI entegrasyonu hakkında
Bu sürümdeki “Taslak oluştur” düğmesi prompt içindeki renk/stil ifadelerine göre yerel bir JSON taslağı üretir; gerçek görsel analizi yapan bir AI servisine bağlı değildir. Gerçek AI için API anahtarı tarayıcı koduna konmamalı; anahtarın sunucuda tutulduğu bir backend/proxy eklenmelidir.