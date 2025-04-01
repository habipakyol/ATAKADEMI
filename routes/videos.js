const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Video = require('../models/Video');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const fs = require('fs');

// Multer ayarları
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Token doğrulama middleware
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = jwt.verify(token, 'gizli-anahtar');
    const user = await User.findOne({ _id: decoded.userId });
    if (!user) {
      throw new Error();
    }
    req.user = user;
    next();
  } catch (error) {
    console.error('Token doğrulama hatası:', error);
    res.status(401).json({ message: 'Lütfen giriş yapın' });
  }
};

// Öğretmen için video ekleme
router.post('/', auth, upload.single('video'), async (req, res) => {
  try {
    console.log('Video ekleme isteği başladı');
    console.log('Kullanıcı:', req.user);
    console.log('Dosya:', req.file);
    console.log('Body:', req.body);

    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Bu işlem için yetkiniz yok' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Video yüklenemedi' });
    }

    const { title, description, subject } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Video başlığı gereklidir' });
    }

    const video = new Video({
      title: title.trim(),
      description: description ? description.trim() : '',
      subject: subject ? subject.trim() : '',
      videoPath: req.file.filename,
      teacher: req.user._id,
      assignedStudents: []
    });

    console.log('Oluşturulacak video:', video);
    const savedVideo = await video.save();
    console.log('Video kaydedildi:', savedVideo);
    
    // Video listesini kontrol et
    const allVideos = await Video.find();
    console.log('Tüm videolar:', allVideos);
    
    res.status(201).json(savedVideo);
  } catch (error) {
    console.error('Video ekleme hatası:', error);
    res.status(500).json({ message: error.message });
  }
});

// Öğretmen için video listesi
router.get('/', auth, async (req, res) => {
  try {
    console.log('Video listesi isteği başladı');
    console.log('Kullanıcı:', req.user);

    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Bu işlem için yetkiniz yok' });
    }

    const videos = await Video.find({ teacher: req.user._id })
      .populate('assignedStudents', 'username');
    
    console.log('Bulunan videolar:', videos);
    res.json(videos);
  } catch (error) {
    console.error('Video listesi hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Öğrenci için video listesi
router.get('/student', auth, async (req, res) => {
  try {
    console.log('Öğrenci video listesi isteği başladı');
    console.log('Kullanıcı:', req.user);

    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Bu işlem için yetkiniz yok' });
    }

    const videos = await Video.find({ assignedStudents: req.user._id })
      .populate('teacher', 'username');
    
    console.log('Bulunan videolar:', videos);
    res.json(videos);
  } catch (error) {
    console.error('Öğrenci video listesi hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Video silme
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Bu işlem için yetkiniz yok' });
    }
    const video = await Video.findOneAndDelete({
      _id: req.params.id,
      teacher: req.user.userId
    });
    if (!video) {
      return res.status(404).json({ message: 'Video bulunamadı' });
    }
    res.json({ message: 'Video başarıyla silindi' });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Video stream endpoint'i
router.get('/:id/stream', auth, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ message: 'Video bulunamadı' });
    }

    // Öğrenci kontrolü
    if (req.user.role === 'student') {
      const isAssigned = video.assignedStudents.some(student => 
        student.toString() === req.user._id.toString()
      );
      if (!isAssigned) {
        return res.status(403).json({ message: 'Bu videoya erişim yetkiniz yok' });
      }
    }

    const videoPath = path.join(__dirname, '../uploads', video.videoPath);
    
    // Video dosyasının varlığını kontrol et
    if (!fs.existsSync(videoPath)) {
      return res.status(404).json({ message: 'Video dosyası bulunamadı' });
    }

    // Video stream
    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize-1;
      const chunksize = (end-start) + 1;
      const file = fs.createReadStream(videoPath, {start, end});
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4',
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
      };
      res.writeHead(200, head);
      fs.createReadStream(videoPath).pipe(res);
    }
  } catch (error) {
    console.error('Video stream hatası:', error);
    res.status(500).json({ message: 'Video yüklenirken bir hata oluştu' });
  }
});

module.exports = router; 