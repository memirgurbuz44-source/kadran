# Yoldaş Aktarım Yardımcısı

Bu klasör, Kadran AI Studio tarafından oluşturulan Yoldaş JSON kodunu Atölye sayfasındaki görünür metin editörüne otomatik aktarır.

## Chrome'a yükleme

1. Bu depoyu ZIP olarak indirip bilgisayarında çıkar.
2. Chrome'da `chrome://extensions` adresini aç.
3. Sağ üstten **Geliştirici modu** seçeneğini aç.
4. **Paketlenmemiş öğe yükle** seçeneğine bas.
5. Çıkardığın klasörün içindeki `yoldas-helper` klasörünü seç.
6. Kadran AI Studio sayfasını yenile.

## Kullanım

Kadran AI Studio'da görsel yükle ve **Tasarımı AI ile Oluştur** düğmesine bas. Yoldaş Atölyesi yeni sekmede açılır; eklenti tasarım JSON'unu editöre aktarmayı dener.

Editör sayfada bulunamazsa kod panoya kopyalanır; Atölye'de metin alanına Ctrl+V ile yapıştır.

## Sınırlar

Eklenti, Atölye'nin sayfasındaki hata mesajlarını otomatik olarak AI'a gönderip tasarımı kendi başına yeniden oluşturmaz. Bu işlem için Atölye'nin hata listesini okuyup Kadran AI Worker'a ileten ayrı bir düzeltme API'si gerekir. Şu an aktarım ve editöre doldurma kısmı uygulanmıştır.
