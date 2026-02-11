const  mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true},
    email : { type: String , required: true, unique: true},
    password_hash : { type : String, required: true},
    role : { type: String, enum: [ 'admin', 'developer', 'devops'], default: 'developer'}
},
 { timestamps: true }
);



module.exports.User = mongoose.model("User", userSchema);