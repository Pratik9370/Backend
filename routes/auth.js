const express = require('express')
const { body, validationResult } = require('express-validator');
const router = express.Router()
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken')
const nodemailer = require('nodemailer')
const user = require('../models/User')
const fetchUser = require('../middleware/fetchUser')
const crypto = require("crypto");
const redis = require("redis");
const validator = require('validator');
const client = redis.createClient({
    url: "redis://redis-13490.crce182.ap-south-1-1.ec2.redns.redis-cloud.com:13490",
    password: "yWyRMxvbUIbHzUs7N6CZMPo74JDjswGc"
});
client.on("error", (err) => console.log("Redis Error:", err));
client.connect(); // Connect to Redis

// Route 1: Create new user using: POST "/api/auth/createUser" logged in not required
router.post("/createUser", [body('email', 'Enter valid email').isEmail(), body('password', 'Password length should be 5 or more').isLength({ min: 5 })], async (req, res) => {

    // Validate the inputs
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const messages = errors.array().map(error => error.msg);
        return res.status(400).json({ errors: messages })
    }

    try {

        let User = await user.findOne({ email: req.body.email })

        // Checking user with this email already exist or not
        if (User) {
            return res.status(400).json({ message: "User with this email already exist" })
        }

        // Hashing the password
        let salt = bcrypt.genSaltSync(10);
        let hash = bcrypt.hashSync(req.body.password, salt);

        // Creating and saving details in Data Base
        User = await user.create({
            name: req.body.name,
            email: req.body.email,
            password: hash
        })

        // Generating token of User email using jwt
        const token = jwt.sign({ email: User.email }, 'shhhhh');
        res.cookie("auth-token", token, { httpOnly: true, secure: true, sameSite: 'Strict', maxAge: 24 * 60 * 60 * 1000 });
        res.status(200).json({ token })

    } catch (error) {
        error => {
            console.log(error)
            res.status(500).json({ message: "Internal server error" })
        }
    }

})

router.post("/sendEmail", async (req, res) => {
    try {
        let User = await user.findOne({ email: req.body.reciever })

        // Checking user with this email already exist or not
        if (User) {
            return res.status(400).json({ message: "User with this email already exist" })
        } else if (!validator.isEmail(req.body.reciever)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }

        const OTPlen = 6
        const generateOTP = crypto.randomInt(10 ** (OTPlen - 1), 10 ** OTPlen).toString();
        await client.setEx(req.body.reciever, 300, generateOTP); // Store OTP with 5-minute expiry
        console.log(generateOTP); // Example: 573829

        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            secure: true, // Set to true if using port 465
            auth: {
                user: "pratikvj9370@gmail.com",
                pass: "lmedtotaczjivikp",
            },
        });

        const info = await transporter.sendMail({
            from: `"Pratik" <${process.env.EMAIL_USER}>`,
            to: req.body.reciever,
            subject: "OTP",
            text: generateOTP,
            html: `<b>${generateOTP}</b>`,
        });

        console.log("Message sent: %s", info.messageId);
        res.json({ message: "Email sent successfully", info });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error sending email", error });
    }
});

router.post("/ForgotPasswordOtp", async (req, res) => {
    try {
        let User = await user.findOne({ email: req.body.reciever })

        // Checking user with this email already exist or not
        if (User) {
            const OTPlen = 6
            const generateOTP = crypto.randomInt(10 ** (OTPlen - 1), 10 ** OTPlen).toString();
            await client.setEx(req.body.reciever, 300, generateOTP); // Store OTP with 5-minute expiry
            console.log(generateOTP); // Example: 573829

            const transporter = nodemailer.createTransport({
                host: "smtp.gmail.com",
                secure: true, // Set to true if using port 465
                auth: {
                    user: "pratikvj9370@gmail.com",
                    pass: "lmedtotaczjivikp",
                },
            });

            const info = await transporter.sendMail({
                from: `"Pratik" <${process.env.EMAIL_USER}>`,
                to: req.body.reciever,
                subject: "OTP",
                text: generateOTP,
                html: `<b>${generateOTP}</b>`,
            });

            console.log("Message sent: %s", info.messageId);
            res.json({ message: "Email sent successfully", info });
        } else if (!validator.isEmail(req.body.reciever)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }else{
            return res.status(400).json({message:"User with this email not found"})
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error sending email", error });
    }
})

router.post("/verifyEmail", async (req, res) => {

    const storedOTP = await client.get(req.body.reciever);
    console.log(req.body.OTP == storedOTP)
    if (storedOTP === req.body.OTP) {
        await client.del(req.body.reciever); // Delete OTP after verification
        res.json({ verified: true });
    } else {
        res.json({ verified: false });
    }
})

router.post("/resetPassword", async(req, res)=>{
    try{
        let User = await user.findOne({ email: req.body.email })
        let salt = bcrypt.genSaltSync(10);
        let hash = bcrypt.hashSync(req.body.password, salt);
        User.password = hash;
        await User.save();
        res.json({message:"Password Reset Successfully"})
    }catch(err){
        console.error(err);
        res.status(500).json({message:"Internal Server Error"})
    }
})

// Route 2: Loging an User using: POST "/api/auth/login" logged in not required
router.post("/login", [body('email', 'Enter valid email').isEmail(), body('password', 'Password cannot be blank').exists()], async (req, res) => {

    // Validate the inputs
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    try {
        const { email, password } = req.body
        let User = await user.findOne({ email })

        // Checking user with this email is exist or not 
        if (!User) {
            return res.status(400).json({ message: 'Something went wrong' })
        }

        // Comparing entered password with the password in data base
        const isValid = await bcrypt.compare(password, User.password)

        // if password doesnt match then return bad status and message
        if (!isValid) {
            return res.status(400).json({ message: 'Something went wrong' })
        }

        // Generating token of User email using jwt after validation of all credentials
        const token = jwt.sign({ email: User.email }, 'shhhhh');
        await res.cookie("auth-token", token, { httpOnly: true, secure: true, sameSite: 'None', maxAge: 24 * 60 * 60 * 1000 });
        return res.status(200).json({ message: "Logged in successfully", token: token })
    } catch {
        (error) {
            console.log(error)
            res.status(500).json({ message: "Internal server error", })
        }
    }
})

// Route 3: Get all data of loggedin user using: Post "/api/auth/getUser" logged in required
router.get("/getUser", fetchUser, async (req, res) => {
    try {
        // Fetch user details using email from req.user
        if (!req.user) {
            return res.status(404).json({ message: "User not found" });
        }
        const token = req.cookies["auth-token"]
        if (!token) {
            return res.status(401).json({ message: "No token found" });
        }
        res.status(200).json({ token })
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

router.post("/logout", fetchUser, async (req, res) => {
    try {
        res.cookie("auth-token", "", {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            expires: new Date(0),
            path: "/"
        });

        res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        console.error("Logout Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});


module.exports = router
