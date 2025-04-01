const express = require('express');
const router = express.Router();
const Class = require('../models/Class');
const User = require('../models/User');
const Video = require('../models/Video');
const jwt = require('jsonwebtoken');

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

// Sınıf oluşturma
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Sadece öğretmenler sınıf oluşturabilir' });
    }

    const { name, description } = req.body;
    console.log('Gelen veri:', { name, description, teacher: req.user._id });

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Sınıf adı gereklidir' });
    }

    // Aynı isimde sınıf var mı kontrol et
    const existingClass = await Class.findOne({ 
      name: name.trim(),
      teacher: req.user._id 
    });

    if (existingClass) {
      return res.status(400).json({ message: 'Bu isimde bir sınıf zaten mevcut' });
    }

    const newClass = new Class({
      name: name.trim(),
      description: description ? description.trim() : '',
      teacher: req.user._id,
      students: [],
      videos: []
    });

    const savedClass = await newClass.save();
    console.log('Oluşturulan sınıf:', savedClass);
    
    res.status(201).json(savedClass);
  } catch (error) {
    console.error('Sınıf oluşturma hatası:', error);
    res.status(400).json({ message: error.message });
  }
});

// Öğretmenin sınıflarını getirme
router.get('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Sadece öğretmenler sınıfları görebilir' });
    }

    const classes = await Class.find({ teacher: req.user._id })
      .populate('students', 'username')
      .populate('videos', 'title');
    
    res.json(classes);
  } catch (error) {
    console.error('Sınıf getirme hatası:', error);
    res.status(400).json({ message: error.message });
  }
});

// Sınıfa öğrenci ekleme
router.post('/:id/students', auth, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Sadece öğretmenler öğrenci ekleyebilir' });
    }

    const { studentId } = req.body;
    if (!studentId) {
      return res.status(400).json({ message: 'Öğrenci ID gereklidir' });
    }

    const classObj = await Class.findOne({ _id: req.params.id, teacher: req.user._id });
    if (!classObj) {
      return res.status(404).json({ message: 'Sınıf bulunamadı' });
    }

    const student = await User.findOne({ _id: studentId, role: 'student' });
    if (!student) {
      return res.status(404).json({ message: 'Öğrenci bulunamadı' });
    }

    if (classObj.students.includes(studentId)) {
      return res.status(400).json({ message: 'Bu öğrenci zaten sınıfta' });
    }

    // Öğrenciyi sınıfa ekle
    classObj.students.push(studentId);

    // Sınıftaki tüm videolara öğrenciyi ekle
    for (const videoId of classObj.videos) {
      await Video.findByIdAndUpdate(videoId, {
        $addToSet: { assignedStudents: studentId }
      });
    }

    await classObj.save();

    const updatedClass = await Class.findById(classObj._id)
      .populate('students', 'username')
      .populate('videos', 'title');

    res.json(updatedClass);
  } catch (error) {
    console.error('Öğrenci ekleme hatası:', error);
    res.status(400).json({ message: error.message });
  }
});

// Sınıftan öğrenci çıkarma
router.delete('/:classId/students/:studentId', auth, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Bu işlem için yetkiniz yok' });
    }

    const classObj = await Class.findById(req.params.classId);
    if (!classObj) {
      return res.status(404).json({ message: 'Sınıf bulunamadı' });
    }

    if (classObj.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Bu sınıfı yönetme yetkiniz yok' });
    }

    // Öğrenciyi sınıftan sil
    classObj.students = classObj.students.filter(
      studentId => studentId.toString() !== req.params.studentId
    );

    // Sınıftaki tüm videolardan öğrenciyi sil
    for (const videoId of classObj.videos) {
      await Video.findByIdAndUpdate(videoId, {
        $pull: { assignedStudents: req.params.studentId }
      });
    }

    await classObj.save();
    res.json({ message: 'Öğrenci sınıftan silindi' });
  } catch (error) {
    console.error('Öğrenci silme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Sınıfa video atama
router.post('/:id/videos', auth, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Sadece öğretmenler video atayabilir' });
    }

    const { videoId } = req.body;
    if (!videoId) {
      return res.status(400).json({ message: 'Video ID gereklidir' });
    }

    const classObj = await Class.findOne({ _id: req.params.id, teacher: req.user._id });
    if (!classObj) {
      return res.status(404).json({ message: 'Sınıf bulunamadı' });
    }

    const video = await Video.findOne({ _id: videoId, teacher: req.user._id });
    if (!video) {
      return res.status(404).json({ message: 'Video bulunamadı' });
    }

    // Video zaten sınıfa atanmış mı kontrol et
    if (!classObj.videos.includes(videoId)) {
      classObj.videos.push(videoId);
      await classObj.save();

      // Sınıftaki öğrencilere videoyu ata
      video.assignedStudents = classObj.students;
      await video.save();
    }

    const updatedClass = await Class.findById(classObj._id)
      .populate('students', 'username')
      .populate('videos', 'title');

    res.json(updatedClass);
  } catch (error) {
    console.error('Video atama hatası:', error);
    res.status(400).json({ message: error.message });
  }
});

// Sınıftan video çıkarma
router.delete('/:id/videos/:videoId', auth, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Sadece öğretmenler video çıkarabilir' });
    }

    const classObj = await Class.findOne({ _id: req.params.id, teacher: req.user._id });
    if (!classObj) {
      return res.status(404).json({ message: 'Sınıf bulunamadı' });
    }

    // Videoyu sınıftan çıkar
    classObj.videos = classObj.videos.filter(id => id.toString() !== req.params.videoId);
    await classObj.save();

    // Video'yu güncelle
    const video = await Video.findOne({ _id: req.params.videoId });
    if (video) {
      // Sınıftaki öğrencileri videodan çıkar
      video.assignedStudents = video.assignedStudents.filter(studentId => 
        !classObj.students.includes(studentId)
      );
      await video.save();
    }

    const updatedClass = await Class.findById(classObj._id)
      .populate('students', 'username')
      .populate('videos', 'title');

    res.json(updatedClass);
  } catch (error) {
    console.error('Video çıkarma hatası:', error);
    res.status(400).json({ message: error.message });
  }
});

// Öğrenci için sınıf listesi
router.get('/student', auth, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Bu işlem için yetkiniz yok' });
    }
    const classes = await Class.find({ students: req.user._id })
      .populate('teacher', 'username')
      .populate('videos', 'title description subject');
    res.json(classes);
  } catch (error) {
    console.error('Sınıf listesi hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router; 