const  mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true},
    email : { type: String , required: true, unique: true},
    password_hash : { type : String, required: true},
    role : { type: String, enum: [ 'admin', 'developer', 'viewer'], default: 'viewer'},
    created_at : { type: Date, default:Date.now},
    updated_at : { type: Date, default: Date.now}
},
 { timestamps: true }
);



module.exports.User = mongoose.model("User", userSchema);