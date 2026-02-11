const bcrypt  = require("bcrypt");
const jwt = require("jsonwebtoken");
 const { User } = require("../schema/userSchema");

const register = async (req, res)=> {

    try {
        const { username,email,password} = req.body;

        const extingUser = await User.findOne({ email });

        if(extingUser){
            return res.status(400).json({ message: "User already exists" });

        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = User.create({
            name: username,
            email : email,
            password_hash : hashedPassword,
        });

        res.status(201).json({ message: "User registered successfully" });

    }catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
 }

 const login = async (req,res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if( !user){
            return res.status(400).json({ message: "Invalid Username" });
        }
        if(! email){
            return res.status(400).json({ message: "Invalid Email" });
        }
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if(!isMatch){
            return res.status(400).json({ message: "Invalid Password" });
        }
     

        const token = jwt.sign(
                        {
                            id: user._id,
                            role: user.role
                        },
                        process.env.JWT_SECRET,
                        { expiresIn: "1d" }
                    );
     res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
}catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });       
}
}
 module.exports = { register,login };