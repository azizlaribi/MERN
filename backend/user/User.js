const mongoose=require('mongoose')
const bcryptjs=require('bcryptjs')

const userSchema=new mongoose.Schema({
    firstname:String,
    lastname:String,
    picture:String,
    email:{required:true,unique:true,type:String},
    isActive:Boolean,
    phone:Number,
    isGoogleAuth: { type: Boolean, default: false },
    googleId: { type: String },
    role: {
        type: String,
        enum: ['admin', 'user'],
        default: 'user'
    },
    password:String,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    rating: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    preferences: {
        emailNotifications: { type: Boolean, default: true },
        language: { type: String, enum: ['English', 'French', 'Arabic'], default: 'English' },
        privacy: { type: String, enum: ['Public', 'Friends only', 'Private'], default: 'Friends only' }
    }
},{ timestamps: true });
userSchema.pre('save',async function(next){
    if(this.isModified('password')){
        this.password=await bcryptjs.hash(this.password,10)
    }
    next();
})

userSchema.methods.comparePassword=async function(userPassword){
    return bcryptjs.compare(userPassword,this.password)
}

module.exports=mongoose.model('User',userSchema)