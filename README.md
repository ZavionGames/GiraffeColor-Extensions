# Giraffe Color

Giraffe Color, web sayfasında gördüğün bir pikselin rengini alıp projelerinde kullanabileceğin bir Chrome eklentisidir. Kalemle renk seçebilir, kodunu kopyalayabilir ve adlandırdığın renkleri proje kategorilerinde saklayabilirsin.

**Sürüm 1.3.2** · Masaüstü Chrome 99 ve üzeri · Manifest V3 · Derleme veya bağımlılık kurulumu gerekmez.

## Kurulum ve güncelleme

1. ZIP paketini bir klasöre çıkar. Kaynak klasörü zaten bilgisayarındaysa doğrudan onu kullan.
2. Chrome adres çubuğunda `chrome://extensions` sayfasını aç ve **Geliştirici modu** seçeneğini etkinleştir.
3. **Paketlenmemiş öğe yükle** düğmesine bas ve `manifest.json` dosyasını içeren klasörü seç.
4. Sık kullanacaksan Chrome’un uzantılar menüsünden Giraffe Color’ı araç çubuğuna sabitle.

Güncellemek için aynı klasördeki dosyaları güncelle ve uzantılar sayfasında Giraffe Color kartındaki **Yeniden yükle** düğmesine bas.

Panelin sağ üstündeki **Gizlilik politikası** bağlantısı, paketle gelen politikayı yeni sekmede açar.

## İlk rengini seç

Bir web sayfasında eklentiyi aç ve **Tek renk seç** düğmesine bas. Panel kapanır ve sekmenin görünür alanı seçim anındaki görüntüde sabitlenir. Fareyi hareket ettirdiğinde 27 piksellik kalem, 54 piksellik dairesel büyütecin merkezini gösterir. Büyüteçteki 9 × 9 ızgaranın ortasındaki pikseli almak için tıkla. Seçimden vazgeçmek için **Esc** tuşuna bas.

Eklentiyi tekrar aç. **Renk kodu** menüsünden HEX, RGB veya HSL seçip **Kopyala** düğmesine bas. **Geçmiş** sekmesi son 24 farklı seçimi tutar. Aynı rengi tekrar seçersen listenin başına gelir.

## Seri seçim ve geçmiş

**Seri seç** ile görünür sayfada art arda en fazla 24 farklı renge tıkla. Alttaki renk kutuları seçtiklerini gösterir. **Geri al** son rengi çıkarır. **Bitti** veya **Enter** seriyi kaydeder. **Esc** tamamlanmamış seriyi iptal eder.

Paneli tekrar açınca renkleri **Geçmiş** sekmesinde görürsün. **Seriyi favorilere ekle** ile son serideki renklere ayrı ayrı ad verip hepsini aynı kategoriye kaydedebilirsin. Seride zaten favori olan bir renk varsa seçtiğin kategoriye taşınır. **Geçmişi temizle**, geçmişi ve son seri listesini temizler. Favorilerin kendi kategorilerinde saklanır.

## Bir proje paleti oluştur

1. Seçili rengin üzerindeki **kalbe** tıkla. Örneğin mercan rengine “Ana renk” adını ver.
2. Kategori listesinden **+ Yeni kategori** seçip proje adını yaz ve **Kaydet** düğmesine bas.
3. **Favoriler** sekmesinde kategoriyi seç. Bir rengin adını veya kategorisini değiştirmek için önce o rengi seç, ardından kalbe tıkla. **Kaldır** seçeneği rengi favorilerden siler.
4. **CSS kopyala** düğmesi seçili kategorideki renkleri tek bir blok halinde panoya alır. Aşağıdaki örneği bir stil dosyasına doğrudan yapıştırabilirsin.

```css
:root {
  --ana-renk: #FF805E;
}

.siparis-dugmesi {
  background-color: var(--ana-renk);
}
```

Kopyalanan blok yalnızca `:root` bölümüdür. Adı olmayan renklerde HEX değeri değişken adına eklenir. Bir kategoride iki ad aynı değişken adına dönüşürse ikincisine sayısal ek verilir. Her HEX değeri tek bir favori kaydıdır. Kategorisini değiştirirsen kayıt yeni kategoriye taşınır. 1.0 sürümünden gelen favoriler **Genel** kategorisinde açılır.

## Araçlar

| Araç | Kullanım |
|---|---|
| Sayfa renkleri | **Görünür alanı tara** düğmesi, ana belgedeki görünür alana denk gelen öğelerin opak CSS yazı, arka plan ve kenarlık renklerini sayar. En sık karşılaşılan 24 renge kadar gösterir. Sıralama kullanım sayısına dayanır. Büyük belgelerde ilk 20.000 öğe incelenir. Fotoğraftaki belirli bir piksel için kalemi kullan. |
| Açık ve koyu tonlar | Ortada seçili renk, iki yanında üçer açık ve koyu ton görünür. Bir tona tıklayınca etkin renk değişir. O tonu kopyalayabilir veya favorilere ekleyebilirsin. |
| Kontrast kontrolü | **Yazı** ve **Zemin** düğmeleriyle iki rengi sırayla seç. Kalemle her seçimden sonra paneli tekrar aç. Araç örnek metni, kontrast oranını ve normal metin için AA sonucunu gösterir. Eklenti uygunluk kararını yuvarlanmamış oran üzerinden 4,5:1 eşiğiyle verir. |

## Yerel veriler ve izinler

Renk geçmişi, kategoriler, favoriler, kod biçimi ve kontrast çifti eklentinin yerel depolamasında saklanır. Kalem, sekmenin görünür alanından alınan geçici görüntüyü bellekte işler. Arka plan çalışanına seçilen HEX değeri ve seçimin amacı iletilir. Panel tekrar açıldığında bekleyen seçim işlenir ve geçici kayıt silinir.

| Manifest izni | Eklentideki kullanım |
|---|---|
| `activeTab` | Kullanıcının açtığı etkin sekmenin görünür alanını yakalamak ve o sekmede seçim veya tarama başlatmak. |
| `scripting` | Kalemi veya CSS renk tarayıcısını kullanım anında sayfada çalıştırmak. |
| `storage` | Panel kapalıyken tamamlanan seçimi sonraki açılışa taşımak. |

Özel kalemin açılamadığı bir sayfada panel, aynı düğmeye tekrar basarak Chrome’un standart damlalığını açmayı önerir. Sayfa taraması engellenirse normal bir web sayfasında yeniden dene. Seri seçim de sayfa üzerinde özel kalemin çalışmasını gerektirir.

## Kaynak dosyaları

| Dosya | Görev |
|---|---|
| `manifest.json` | Sürüm, izinler ve eklentinin giriş noktaları. |
| `popup.html`, `popup.css`, `popup.js` | Panel, geçmiş, favoriler, kod dönüşümleri, kontrast hesabı ve CSS çıktısı. |
| `pencil.js` | Sabit görüntü üzerinde kalem, büyüteç ve piksel örnekleme. |
| `scan.js` | Görünür alandaki öğelerin CSS renklerini sayma ve sıralama. |
| `background.js` | Seçilen rengi panel açılana kadar saklayan servis çalışanı. |
| `icon.png` | Araç çubuğu ve panel simgesi. |
