# Eğitim Platformu - Canlıya Taşıma Kılavuzu

Bu kılavuz, Eğitim Platformu projesinin canlı ortama taşınması için gerekli adımları ve maliyetleri içermektedir.

## İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [Gereksinimler](#gereksinimler)
3. [Hosting Seçenekleri](#hosting-seçenekleri)
4. [MongoDB Kurulumu](#mongodb-kurulumu)
5. [Backend Deployment](#backend-deployment)
6. [Frontend Deployment](#frontend-deployment)
7. [Dosya Yükleme Çözümü](#dosya-yükleme-çözümü)
8. [Domain ve SSL](#domain-ve-ssl)
9. [Maliyet Analizi](#maliyet-analizi)
10. [Sorun Giderme](#sorun-giderme)

## Genel Bakış

Eğitim Platformu, öğretmenlerin video yükleyip öğrencilere atayabildiği, öğrencilerin de bu videoları izleyebildiği bir web uygulamasıdır. Proje şu bileşenlerden oluşmaktadır:

- **Frontend**: React.js ile geliştirilmiş kullanıcı arayüzü
- **Backend**: Node.js ve Express.js ile geliştirilmiş API
- **Veritabanı**: MongoDB
- **Dosya Depolama**: Video dosyaları için depolama çözümü

## Gereksinimler

Projeyi canlıya taşımak için aşağıdaki gereksinimlere ihtiyacınız olacaktır:

- Node.js (v14 veya üzeri)
- MongoDB
- Git
- Bir domain adı
- Bir hosting hizmeti

## Hosting Seçenekleri

### 1. Backend Hosting

#### A. Heroku (Önerilen Başlangıç Seçeneği)
- **Avantajlar**: Kolay kurulum, ücretsiz başlangıç planı, MongoDB entegrasyonu
- **Dezavantajlar**: Ücretsiz planda uyku modu, sınırlı kaynaklar
- **Maliyet**: 
  - Ücretsiz plan: $0/ay (sınırlı kaynaklar)
  - Hobby plan: $7/ay (uyku modu yok)
  - Standard plan: $25/ay (daha fazla kaynak)

#### B. DigitalOcean
- **Avantajlar**: Tam kontrol, iyi performans, makul fiyatlar
- **Dezavantajlar**: Daha fazla yapılandırma gerektirir
- **Maliyet**: 
  - Basic Droplet: $5/ay (1GB RAM, 1 CPU)
  - Standard Droplet: $10/ay (2GB RAM, 1 CPU)

#### C. AWS (Amazon Web Services)
- **Avantajlar**: Yüksek ölçeklenebilirlik, güvenilirlik
- **Dezavantajlar**: Karmaşık yapılandırma, maliyet tahmininde zorluk
- **Maliyet**: 
  - EC2 t2.micro: $8-15/ay (ücretsiz kullanım sonrası)
  - EC2 t2.small: $17-30/ay

### 2. Frontend Hosting

#### A. Netlify (Önerilen)
- **Avantajlar**: Kolay kurulum, ücretsiz plan, otomatik dağıtım
- **Dezavantajlar**: Ücretsiz planda sınırlı bant genişliği
- **Maliyet**: 
  - Ücretsiz plan: $0/ay (100GB bant genişliği/ay)
  - Pro plan: $19/ay (1TB bant genişliği/ay)

#### B. Vercel
- **Avantajlar**: React uygulamaları için optimize edilmiş, kolay kurulum
- **Dezavantajlar**: Ücretsiz planda sınırlı bant genişliği
- **Maliyet**: 
  - Ücretsiz plan: $0/ay (100GB bant genişliği/ay)
  - Pro plan: $20/ay (1TB bant genişliği/ay)

## MongoDB Kurulumu

### 1. MongoDB Atlas (Önerilen)

MongoDB Atlas, bulut tabanlı bir MongoDB hizmetidir ve ücretsiz bir başlangıç planı sunar.

#### Kurulum Adımları:

1. [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) hesabı oluşturun
2. Yeni bir cluster oluşturun (ücretsiz M0 planı ile başlayabilirsiniz)
3. Veritabanı kullanıcısı oluşturun
4. IP adresinizi whitelist'e ekleyin
5. Bağlantı URL'sini alın

#### Maliyet:
- Ücretsiz plan (M0): $0/ay (512MB depolama)
- Shared plan (M2): $12/ay (2GB depolama)
- Shared plan (M5): $57/ay (5GB depolama)

### 2. Kendi Sunucunuzda MongoDB

Eğer kendi sunucunuzda MongoDB çalıştırmak isterseniz:

1. Sunucunuza MongoDB'yi yükleyin
2. Güvenlik ayarlarını yapılandırın
3. Veritabanı ve kullanıcı oluşturun

## Backend Deployment

### Heroku ile Deployment (Önerilen)

1. [Heroku](https://www.heroku.com/) hesabı oluşturun
2. Heroku CLI'ı yükleyin
3. Projenizi Heroku'ya bağlayın:

```bash
# Heroku CLI'ı yükleyin
npm install -g heroku

# Heroku'ya giriş yapın
heroku login

# Yeni bir Heroku uygulaması oluşturun
heroku create egitim-platformu

# MongoDB eklentisini ekleyin
heroku addons:create mongolab

# Çevre değişkenlerini ayarlayın
heroku config:set JWT_SECRET=gizli-anahtariniz
heroku config:set NODE_ENV=production

# Projeyi Heroku'ya gönderin
git push heroku main
```

### DigitalOcean ile Deployment

1. [DigitalOcean](https://www.digitalocean.com/) hesabı oluşturun
2. Yeni bir Droplet oluşturun (Ubuntu 20.04 önerilir)
3. Sunucunuza SSH ile bağlanın
4. Node.js, MongoDB ve PM2'yi yükleyin:

```bash
# Node.js kurulumu
curl -sL https://deb.nodesource.com/setup_14.x | sudo -E bash -
sudo apt-get install -y nodejs

# MongoDB kurulumu
wget -qO - https://www.mongodb.org/static/pgp/server-4.4.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/4.4 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-4.4.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod

# PM2 kurulumu
sudo npm install -g pm2

# Projeyi klonlayın
git clone https://github.com/kullanici/egitim-platformu.git
cd egitim-platformu

# Bağımlılıkları yükleyin
npm install

# Çevre değişkenlerini ayarlayın
echo "JWT_SECRET=gizli-anahtariniz" > .env
echo "NODE_ENV=production" >> .env

# Uygulamayı PM2 ile başlatın
pm2 start server.js --name "egitim-platformu"
pm2 startup
pm2 save
```

## Frontend Deployment

### Netlify ile Deployment (Önerilen)

1. [Netlify](https://www.netlify.com/) hesabı oluşturun
2. GitHub reponuzu Netlify'a bağlayın
3. Build ayarlarını yapılandırın:
   - Build command: `npm run build`
   - Publish directory: `build`
4. Çevre değişkenlerini ayarlayın:
   - `REACT_APP_API_URL`: Backend API URL'si

### Vercel ile Deployment

1. [Vercel](https://vercel.com/) hesabı oluşturun
2. GitHub reponuzu Vercel'e bağlayın
3. Build ayarlarını yapılandırın:
   - Build command: `npm run build`
   - Output directory: `build`
4. Çevre değişkenlerini ayarlayın:
   - `REACT_APP_API_URL`: Backend API URL'si

## Dosya Yükleme Çözümü

Video dosyaları için bir depolama çözümü gereklidir. İşte önerilen seçenekler:

### 1. AWS S3 (Önerilen)

AWS S3, dosya depolama için güvenilir ve ölçeklenebilir bir çözümdür.

#### Kurulum Adımları:

1. [AWS](https://aws.amazon.com/) hesabı oluşturun
2. S3 bucket oluşturun
3. IAM kullanıcısı oluşturun ve S3 erişimi için izinler verin
4. AWS SDK'yı projenize ekleyin:

```bash
npm install aws-sdk multer-s3
```

5. Backend kodunuzu güncelleyin:

```javascript
const AWS = require('aws-sdk');
const multerS3 = require('multer-s3');

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_BUCKET_NAME,
    acl: 'public-read',
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      cb(null, Date.now().toString() + path.extname(file.originalname));
    }
  })
});
```

#### Maliyet:
- İlk 50TB/ay: $0.023/GB
- Sonraki 450TB/ay: $0.022/GB
- Örnek: 100GB video = ~$2.30/ay

### 2. Google Cloud Storage

Google Cloud Storage, AWS S3'e alternatif bir çözümdür.

#### Kurulum Adımları:

1. [Google Cloud](https://cloud.google.com/) hesabı oluşturun
2. Cloud Storage bucket oluşturun
3. Servis hesabı oluşturun ve JSON anahtarı indirin
4. Google Cloud SDK'yı projenize ekleyin:

```bash
npm install @google-cloud/storage multer-google-storage
```

#### Maliyet:
- Standart depolama: $0.020/GB/ay
- Örnek: 100GB video = ~$2.00/ay

### 3. Kendi Sunucunuzda Depolama

Eğer kendi sunucunuzda dosyaları depolamak isterseniz:

1. Sunucunuzda yeterli disk alanı olduğundan emin olun
2. Dosya yükleme limitlerini ayarlayın
3. Düzenli yedekleme planı oluşturun

#### Maliyet:
- Sunucu maliyetine dahildir (ek maliyet yok)

## Domain ve SSL

### Domain Kaydı

1. Bir domain sağlayıcısından (örn. GoDaddy, Namecheap) domain satın alın
2. DNS ayarlarını yapılandırın:
   - Backend için A kaydı veya CNAME
   - Frontend için A kaydı veya CNAME

#### Maliyet:
- .com domain: $10-15/yıl
- .net domain: $12-18/yıl
- .org domain: $10-15/yıl

### SSL Sertifikası

1. Let's Encrypt ücretsiz SSL sertifikası alın
2. Sertifikayı sunucunuza yükleyin
3. Nginx veya Apache yapılandırmasını güncelleyin

#### Maliyet:
- Let's Encrypt: $0/yıl
- Ticari SSL: $10-50/yıl

## Maliyet Analizi

### Minimum Maliyet (Başlangıç)

- **Backend Hosting**: Heroku Hobby ($7/ay)
- **Frontend Hosting**: Netlify Ücretsiz ($0/ay)
- **MongoDB**: MongoDB Atlas Ücretsiz ($0/ay)
- **Dosya Depolama**: AWS S3 (~$5/ay, 200GB)
- **Domain**: $10-15/yıl
- **SSL**: Let's Encrypt ($0/yıl)

**Toplam**: ~$12-15/ay + domain maliyeti

### Orta Ölçekli Maliyet

- **Backend Hosting**: DigitalOcean Standard ($10/ay)
- **Frontend Hosting**: Netlify Pro ($19/ay)
- **MongoDB**: MongoDB Atlas M2 ($12/ay)
- **Dosya Depolama**: AWS S3 (~$10/ay, 400GB)
- **Domain**: $10-15/yıl
- **SSL**: Let's Encrypt ($0/yıl)

**Toplam**: ~$51-54/ay + domain maliyeti

### Yüksek Ölçekli Maliyet

- **Backend Hosting**: AWS EC2 t2.small ($17-30/ay)
- **Frontend Hosting**: Netlify Pro ($19/ay)
- **MongoDB**: MongoDB Atlas M5 ($57/ay)
- **Dosya Depolama**: AWS S3 (~$25/ay, 1TB)
- **Domain**: $10-15/yıl
- **SSL**: Ticari SSL ($50/yıl)

**Toplam**: ~$118-141/ay + domain maliyeti

## Sorun Giderme

### Yaygın Sorunlar ve Çözümleri

1. **CORS Hataları**
   - Backend'de CORS ayarlarını kontrol edin
   - Frontend'de API URL'sini doğru ayarladığınızdan emin olun

2. **MongoDB Bağlantı Hataları**
   - MongoDB Atlas'ta IP whitelist'i kontrol edin
   - Bağlantı URL'sini doğru ayarladığınızdan emin olun

3. **Dosya Yükleme Hataları**
   - Dosya boyutu limitlerini kontrol edin
   - Depolama servisi kimlik bilgilerini doğrulayın

4. **SSL Sertifika Hataları**
   - Sertifikanın geçerlilik süresini kontrol edin
   - Nginx/Apache yapılandırmasını kontrol edin

### Yardımcı Kaynaklar

- [Heroku Dev Center](https://devcenter.heroku.com/)
- [MongoDB Atlas Dokümantasyonu](https://docs.atlas.mongodb.com/)
- [AWS S3 Dokümantasyonu](https://docs.aws.amazon.com/s3/)
- [Netlify Dokümantasyonu](https://docs.netlify.com/)

## Sonuç

Bu kılavuz, Eğitim Platformu projenizi canlı ortama taşımak için gerekli adımları ve maliyetleri içermektedir. Başlangıç için minimum maliyetle başlayabilir ve projeniz büyüdükçe ölçeklendirebilirsiniz.

Herhangi bir sorunla karşılaşırsanız, yukarıdaki sorun giderme bölümüne bakabilir veya ilgili hizmet sağlayıcıların destek ekipleriyle iletişime geçebilirsiniz. 