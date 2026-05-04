const express=require('express')
const  User=require('./User');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Trip = require('../trip/Trip');

const router=express.Router();
const { adminAuthorization,authentication,checkTokenExists } = require('../middlewares/authMiddleware');

// ── Multer setup for profile photo uploads ──
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `user-${req.user.userId}-${Date.now()}${ext}`);
    }
});
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter: (_req, file, cb) => {
        if (/^image\/(jpeg|png|gif|webp)$/.test(file.mimetype)) cb(null, true);
        else cb(new Error('Only image files are allowed'));
    }
});


router.get('/all',[adminAuthorization,checkTokenExists],async (req,res)=>{
    try {
        const  users = await User.find({role:'user'})
        res.send(users)
    }catch (e){
        res.send(e)
    }
})

router.get('/admins',[adminAuthorization,checkTokenExists],async (req,res)=>{
    try {
        const  users = await User.find({role:'admin'})
        res.send(users)
    }catch (e){
        res.send(e)
    }
})
router.get('/numberOfUsers',[adminAuthorization,checkTokenExists],async (req,res)=>{
    try {
        const  users = await User.find()
        res.send(users.length)
    }catch (e){
        res.send(e)
    }
})
router.get('/userbyId/:userId', authentication, async (req, res) => {
    try {
        const user = await User.findById(req.params.userId).select('-password');
        if (!user) {
            return res.status(404).send({ message: 'User not found' });
        }
        res.status(200).send({ user });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Error fetching user' });
    }
});
router.get('/:email',checkTokenExists,async (req,res)=>{
    try {
        const  user = await User.findOne({email:req.params.email})
        if(!user){
            res.status(404).send({message:"user not found"})
        }
        res.send(user)
    }catch (error){
        res.send({error:error})
    }
})
router.put('/isActive/:id', [adminAuthorization, checkTokenExists], async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: 'Invalid user ID format' });
        }

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        user.isActive = user.isActive === undefined ? true : !user.isActive;

        user.markModified('isActive');

        const updatedUser = await user.save();

        const { isActive, _id, email } = updatedUser;
        res.status(200).json({
            message: 'User status updated successfully',
            user: { _id, email, isActive }
        });

    } catch (error) {
        console.error('Error updating user status:', error);

        const errorMessage = 'Failed to update user status';

        res.status(500).json({ error: errorMessage });
    }
});
router.delete('/delete/:id',[adminAuthorization,checkTokenExists],async (req,res)=>
{
    try {
        const result= await  User.findByIdAndDelete( req.params.id);
        if (!result) {
            return res.status(404).send({ error: "User not found" });
        }
        res.status(200).send({message:"user deleted successfully"})
    } catch (error){
        res.status(400).send({error:error})
    }
})

router.put('/edit/:id',  checkTokenExists, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: 'Invalid user ID format' });
        }

        const { firstname, lastname, email, phone, role, isActive } = req.body;

        // Vérifier si l'utilisateur existe
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Vérifier si l'email est déjà utilisé par un autre utilisateur
        if (email && email !== user.email) {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ error: 'Email already in use' });
            }
        }

        // Mettre à jour les champs
        const updateData = {};
        if (firstname !== undefined) updateData.firstname = firstname;
        if (lastname !== undefined) updateData.lastname = lastname;
        if (email !== undefined) updateData.email = email;
        if (phone !== undefined) updateData.phone = phone;
        if (role !== undefined) updateData.role = role;
        if (isActive !== undefined) updateData.isActive = isActive;

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        // Retirer le mot de passe de la réponse
        const userResponse = updatedUser.toObject();
        delete userResponse.password;
        delete userResponse.resetPasswordToken;
        delete userResponse.resetPasswordExpires;

        res.status(200).json({
            message: 'User updated successfully',
            user: userResponse
        });

    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

// ============= CHANGE PASSWORD =============
router.post('/change-password', authentication, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current and new passwords are required' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'New password must be at least 6 characters' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (user.isGoogleAuth) {
            return res.status(400).json({ error: 'Google accounts cannot change password here' });
        }

        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({ error: 'Current password is incorrect' });
        }

        user.password = newPassword;
        await user.save();

        res.status(200).json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'Failed to change password' });
    }
});

// ============= DELETE OWN ACCOUNT =============
router.delete('/delete-account', authentication, async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Cancel upcoming trips created by the user
        await Trip.updateMany(
            { creator: userId, status: 'upcoming' },
            { status: 'cancelled' }
        );

        // Remove user from passengers in all trips
        await Trip.updateMany(
            { 'passengers.userId': userId },
            { $pull: { passengers: { userId } } }
        );

        await User.findByIdAndDelete(userId);
        res.status(200).json({ message: 'Account deleted successfully' });
    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({ error: 'Failed to delete account' });
    }
});

// ============= USER STATS =============
router.get('/stats', authentication, async (req, res) => {
    try {
        const userId = req.user.userId;

        const [tripsCreated, tripsAsPassenger, user] = await Promise.all([
            Trip.countDocuments({ creator: userId }),
            Trip.find({ 'passengers.userId': userId }),
            User.findById(userId).select('rating ratingCount')
        ]);

        // Total amount paid on booked trips
        let totalSavings = 0;
        tripsAsPassenger.forEach(trip => {
            const booking = trip.passengers.find(p => String(p.userId) === String(userId));
            if (booking) totalSavings += trip.pricePerSeat * booking.seatsBooked;
        });

        res.status(200).json({
            tripsCreated,
            tripsTaken: tripsAsPassenger.length,
            totalSavings,
            rating: user && user.ratingCount > 0 ? (user.rating / user.ratingCount).toFixed(1) : null
        });
    } catch (error) {
        console.error('User stats error:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// ============= UPLOAD PROFILE PHOTO =============
router.put('/upload-photo', authentication, upload.single('photo'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const userId = req.user.userId;
        const baseUrl = process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`;
        const pictureUrl = `${baseUrl}/uploads/${req.file.filename}`;

        // Delete old photo file if it was uploaded locally
        const user = await User.findById(userId);
        if (user && user.picture && user.picture.includes('/uploads/')) {
            const oldFilename = user.picture.split('/uploads/')[1];
            const oldPath = path.join(uploadsDir, oldFilename);
            try {
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            } catch (unlinkErr) {
                console.error('Failed to delete old profile photo:', unlinkErr);
            }
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { picture: pictureUrl },
            { new: true }
        ).select('-password -resetPasswordToken -resetPasswordExpires');

        res.status(200).json({ message: 'Photo updated successfully', user: updatedUser });
    } catch (error) {
        console.error('Upload photo error:', error);
        res.status(500).json({ error: 'Failed to upload photo' });
    }
});

// ============= UPDATE PREFERENCES =============
router.put('/preferences', authentication, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { emailNotifications, language, privacy } = req.body;

        const allowedLanguages = ['English', 'French', 'Arabic'];
        const allowedPrivacy = ['Public', 'Friends only', 'Private'];

        const update = {};
        if (emailNotifications !== undefined) update['preferences.emailNotifications'] = !!emailNotifications;
        if (language !== undefined) {
            if (!allowedLanguages.includes(language)) {
                return res.status(400).json({ error: 'Invalid language value' });
            }
            update['preferences.language'] = language;
        }
        if (privacy !== undefined) {
            if (!allowedPrivacy.includes(privacy)) {
                return res.status(400).json({ error: 'Invalid privacy value' });
            }
            update['preferences.privacy'] = privacy;
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            update,
            { new: true, runValidators: true }
        ).select('-password -resetPasswordToken -resetPasswordExpires');

        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({ message: 'Preferences updated successfully', user: updatedUser });
    } catch (error) {
        console.error('Update preferences error:', error);
        res.status(500).json({ error: 'Failed to update preferences' });
    }
});

module.exports=router