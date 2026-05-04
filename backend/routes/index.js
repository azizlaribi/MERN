// routes/index.js (Update this)
const express = require('express');
const router = express.Router();

const userRoutes = require('../user/user.routes');
const authRoutes = require('../auth/auth.routes');
const triproutes = require('../trip/Triproutes');
const messageRoutes = require('../messenger/messageroutes'); 

router.use('/users', userRoutes);
router.use('/auth', authRoutes);
router.use('/trips', triproutes);
router.use('/messages', messageRoutes); 

module.exports = router;