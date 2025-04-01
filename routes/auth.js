const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Geçersiz kullanıcı adı veya şifre' });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      'gizli-anahtar',
      { expiresIn: '24h' }
    );

    res.json({ token, role: user.role });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Öğrenci ekleme (sadece öğretmenler)
router.post('/add-student', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = new User({
      username,
      password,
      role: 'student'
    });
    await user.save();
    res.status(201).json({ message: 'Öğrenci başarıyla eklendi' });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router; 