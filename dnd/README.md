# 🔍 Sisli Fener Konağı — Aile Dedektif Oyunu

Claude'un **Anlatıcı (DM)** olarak yönettiği, şiddetsiz bir **gizem-dedektiflik** oyunu.
Bir aile için tasarlandı (11–15 yaş). Oyuncular dedektif olur; fırtınalı bir gecede kıyı
konağından kaybolan **"Deniz Yıldızı" safirini** şafaktan önce bulmaya çalışır.

Tek bir `index.html` dosyası — sunucu yok. Tarayıcıdan doğrudan Claude API'sini çağırır.

## 🆓 Yerel ücretsiz mod (Claude planınla — API ücreti yok)

DM yanıtlarını, giriş yapmış olduğun **Claude Code aboneliğin** üzerinden ürettirebilirsin;
böylece ayrı bir Anthropic API anahtarına ve **API ücretine gerek kalmaz**.

**Gerekenler:** Node.js + Claude Code CLI (`claude`) kurulu ve giriş yapmış olmalı (`claude` çalışıyorsa tamam).

```bash
cd dnd
node server.js          # → http://127.0.0.1:8787/
```
Windows'ta `dnd/start-local.cmd` dosyasına çift tıklamak da yeterli.

Açılan sayfada **Anlatıcı kaynağı → "Yerel sunucu — Claude planım"** seçili olur (yerelde varsayılan).
Sunucu, her tur `claude` CLI'yi başsız (headless) çalıştırır; yanıt abonelik kapsamında üretilir.

> **Nasıl çalışır:** Tarayıcı `/api/dm`'e POST atar → sunucu `claude -p --output-format json --model …`
> komutunu çalıştırır (büyük sistem+bağlam metni stdin ile gönderilir) → dönen JSON tarayıcıya iletilir.
> API anahtarı kullanılmaz; kimlik doğrulama `claude`'un kayıtlı oturumundan gelir.

### Görseller ücretsiz mi?
Claude (ne API ne abonelik) **görsel üretmez**. Görselde üç ücretsiz/yarı-ücretsiz yol var:

| Ayar | Maliyet | Kurulum |
|---|---|---|
| **Atmosferik renk** (degrade) | bedava | yok — varsayılan |
| **Yerel sunucu → Stable Diffusion** | bedava (kendi bilgisayarın) | AUTOMATIC1111'i `--api` ile çalıştır, sonra `SD_URL=http://127.0.0.1:7860 node server.js` |
| **Yerel sunucu → Gemini** | ücretsiz kota dahilinde | `GEMINI_KEY=... node server.js` |

Ayarlarda **Görsel sahne kartı → "Yerel sunucu (SD / Gemini)"** seç; sunucu hangisi tanımlıysa onu kullanır,
yoksa otomatik degradeye düşer.

PowerShell'de ortam değişkeniyle başlatma:
```powershell
$env:SD_URL="http://127.0.0.1:7860"; node server.js
# veya
$env:GEMINI_KEY="AIza..."; node server.js
```

---

## Oynamak için (API anahtarıyla, çevrimiçi)

1. [Oyunu aç](https://berkefunda-dot.github.io/Xalinforfun/dnd/) (GitHub Pages açıkça) ya da
   `dnd/index.html` dosyasını tarayıcıda çift tıklayarak aç.
2. **Anthropic API anahtarını** gir — [console.anthropic.com](https://console.anthropic.com/settings/keys)
   üzerinden alınır. Anahtar **yalnızca senin tarayıcında** (`localStorage`) saklanır, hiçbir yere gönderilmez.
3. Bir veya birden çok **dedektif** oluştur (isim + uzmanlık), "Davete Gir" de.
4. Anlatıcı sahneyi kurar; seçeneklerden birini seç veya kendi eylemini yaz.
   Belirsiz işlerde **zar** atılır (d20 + beceri bonusu vs. zorluk/DC).

## Nasıl çalışır

- **`dm_system_prompt.md`** → `DM_SYSTEM` sabiti: Anlatıcının rolü, ton, gizli-çözüm kuralı,
  zar disiplini ve **katı JSON çıktı şeması**.
- **`seed_pilot_case.md`** → seed varlıklar (mekân/kişi/eşya) + `CASE_BIBLE_PRIVATE` (gizli çözüm).
- Her tur motor şu bağlamı sistem mesajına enjekte eder: karakter sayfaları, entity registry,
  hikâye özeti, gizli vaka dosyası, son turlar ve son zar sonucu. Claude **yalnızca JSON** döner
  (asistan yanıtı `{` ile prefill edilerek JSON'a zorlanır); motor bunu parse edip sahneyi,
  seçenekleri, zar isteğini ve durum değişikliklerini işler.
- **Zarı motor atar**, Claude değil — `roll_request` gelince oyun d20 atar ve sonucu
  `LAST_ROLL_RESULT` olarak geri verir; Anlatıcı sonucu (başarı/kısmi/başarısızlık) anlatır.
- **Çözüm:** Sahte safir + cam kesici + zaman tutarsızlığından en az ikisi birleştirilip
  doğru fail gerekçesiyle suçlanınca vaka çözülür ve final oynanır.

### Beceriler
`gozlem` · `cikarim` · `ikna` · `gizlilik` · `bilgi` — her dedektif uzmanlığına göre bonus alır.

## ⚠️ Gizli çözüm hakkında (önemli)

Bu tek-dosya / istemci-taraflı sürümde `CASE_BIBLE_PRIVATE` (failin kim olduğu) sayfa
kaynağında bulunur. Arayüzde **asla gösterilmez**, ama teknik olarak "sayfa kaynağını
görüntüle" diyen biri okuyabilir. Çocuklar için pratikte sorun değildir. Çözümü gerçekten
gizli tutmak isterseniz, vaka dosyasını sunucu tarafında tutan bir backend gerekir
(bkz. repo kökündeki notlar).

## Maliyet

Her tur bir Claude API çağrısıdır (~1–2K token). Sonnet 4.6 dengeli; Haiku 4.5 daha ucuz ve
hızlı; Opus 4.8 en yetenekli. Modeli ayarlardan seçebilirsiniz.

## Yeni vaka eklemek

`index.html` içindeki `SEED_LOCATIONS / SEED_NPCS / SEED_ITEMS` ve `CASE_BIBLE_PRIVATE`
bloklarını yeni bir vakayla değiştirmen yeterli. DM sistem prompt'u (`DM_SYSTEM`) tür
değişmedikçe aynı kalır.
