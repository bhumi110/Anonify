const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose=require("passport-local-mongoose");

const userSchema=new Schema({
    email:{
        type:String,
        required:true,
    },
    username:{
        type:String,
        required:true,
        unique:true
    },
    emailVerified: { 
        type: Boolean, 
        default: false 
    },
    googleId: { 
        type: String 
    },
    emailToken:{
        type:String,
    },
    emailTokenExpires:{
        type:Date,
        expires:3600
    },
});

userSchema.plugin(passportLocalMongoose,{ usernameField: "email" });

module.exports=mongoose.model("User",userSchema);