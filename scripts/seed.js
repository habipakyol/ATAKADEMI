const mongoose = require('mongoose');
const User = require('../models/User');
const Video = require('../models/Video');
const path = require('path');

// MongoDB bağlantısı
mongoose.connect('mongodb://localhost:27017/egitim-platformu', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  try {
    // Tüm koleksiyonları temizle
    await User.deleteMany({});
    await Video.deleteMany({});
    console.log('Veritabanı temizlendi');

    // Öğretmen oluştur
    const teacher = await User.create({
      username: 'habip',
      password: '1',
      role: 'teacher'
    });
    console.log('Öğretmen oluşturuldu:', teacher.username);

    // Öğrenci oluştur
    const student = await User.create({
      username: 'akyol',
      password: '1',
      role: 'student'
    });
    console.log('Öğrenci oluşturuldu:', student.username);

    // Örnek video oluştur
    const video = await Video.create({
      title: 'Örnek Video',
      description: 'Bu bir örnek videodur',
      subject: 'Matematik',
      videoPath: 'ornek-video.mp4',
      teacher: teacher._id,
      assignedStudents: [student._id]
    });
    console.log('Örnek video oluşturuldu:', video.title);

    console.log('Veritabanı başarıyla sıfırlandı ve yeniden oluşturuldu');
    process.exit(0);
  } catch (error) {
    console.error('Hata:', error);
    process.exit(1);
  }
}).catch(error => {
  console.error('MongoDB bağlantı hatası:', error);
  process.exit(1);
}); 