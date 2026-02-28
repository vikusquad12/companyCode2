import dotenv from "dotenv";
dotenv.config();
console.log("MONGO_URI:", process.env.MONGO_URI);

import express from "express"
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";      
import { CloudinaryStorage } from "multer-storage-cloudinary";

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Multer storage for Cloudinary
const cloudinaryStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "profile_pics",
        allowed_formats: ["jpg", "png", "jpeg"]
    }
});
const upload = multer({
    storage: cloudinaryStorage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        } else {
            cb(new Error("Only image files are allowed!"), false);
        }
    },
    limits: { fileSize: 2 * 1024 * 1024 } // 2MB limit (optional)
});

import Register from "./models/registers.js";


mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB Atlas Connection Successful");
    })
    .catch((e) => {
        console.log("MongoDB Atlas Connection Failed");
        console.log(e);
    });


import path from "path"
import { fileURLToPath } from "url";



import session from "express-session";
import MongoStore from "connect-mongo";




const app = express();
const port = process.env.PORT || 8000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const absPathh = path.resolve("..", "views");
const static_path = path.join(__dirname, "../public");
app.use(express.static(static_path));
app.use(express.json());
app.use(express.urlencoded({extended : false}));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../views"));



app.use(session({
    secret: "your#@Secret_Key", // change this to a strong secret
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI,
        collectionName: "sessions"
    }),
    cookie: { maxAge: 1000 * 60 * 60 } // 1 hour
}));




app.get("/", (req,resp)=>{
    // console.log(req.url)
    // resp.sendFile( absPathh + '/home.html')
    resp.render('home')
})

app.get("/user-login", (req,resp)=>{
    resp.render("login")
})



// user logged-in route
app.get("/user-loggedin", (req, res) => {
    if (!req.session || !req.session.user) {
        // If session not set, redirect to login
        return res.redirect("/");
    }
    // Safe to access req.session.user now
    res.render("user-loggedin", { user: req.session.user });
});


// Upload Profile Picture
app.post("/upload-profile-pic", (req, res) => {

    upload.single("profilePic")(req, res, async function (err) {

        if (err) {
            return res.status(400).send(err.message);
        }

        try {
            if (!req.session.user) return res.redirect("/");

            const imageUrl = req.file.path;

            const updatedUser = await Register.findByIdAndUpdate(
                req.session.user._id,
                { profilePic: imageUrl },
                { returnDocument: "after" }
            );

            req.session.user.profilePic = updatedUser.profilePic;

            req.session.save(err => {
                if (err) console.log(err);
                res.redirect("/user-loggedin?updated=true");
            });

        } catch (error) {
            console.log(error);
            res.status(500).send("Upload failed");
        }

    });
});


app.post("/user-login-check", async (req, res) => {
    try {
        const check = await Register.findOne({ username: req.body.username.trim() });
        if (!check) return res.send("User not found");

        // Compare hashed password
        const isMatch = await bcrypt.compare(req.body.password, check.password);
        if (!isMatch) return res.send("Wrong password");

        req.session.user = {
            _id: check._id,
            username: check.username,
            email: check.email,
            phone: check.phone,
            profilePic: check.profilePic
        };

        req.session.save(err => {
            if (err) console.log(err);
            res.redirect("/user-loggedin");
        });

    } catch (err) {
        console.log(err);
        res.status(500).send("Server Error");
    }
});


// logout user
app.get("/logout", (req, res) => {
    req.session.destroy(err => {
        if (err) console.log(err);
        res.redirect("/"); // Redirect to login
    });
});


// create a new user in database
app.post("/user-signup-submit", async (req, resp) => {
    try {
        const password = req.body.password;
        const cpassword = req.body.confirm_password;

        if (password !== cpassword) {
            return resp.send("Passwords do not match");
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10); // 10 rounds

        const registerEmployee = new Register({
            username: req.body.username,
            email: req.body.email,
            phone: req.body.phone,
            password: hashedPassword,
            confirm_password: hashedPassword // store hash, not plain text
        });

        const registered = await registerEmployee.save();
        resp.status(201).redirect("/");

    } catch (error) {
        resp.status(400).send("error " + error.message);
    }
});


//updates 
app.post("/update-mobile", async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ success: false, message: "Not logged in" });
        }

        const newPhone = req.body.phone.trim();

        // Validation
        if (!/^[0-9]{10}$/.test(newPhone)) {
            return res.json({ success: false, message: "Enter valid 10 digit number" });
        }

        const updatedUser = await Register.findByIdAndUpdate(
            req.session.user._id,
            { updated_phone: newPhone }, // ✅ saving in new field
            { returnDocument: "after" }
        );

        // Update session also
        req.session.user.updated_phone = updatedUser.updated_phone;

        req.session.save(err => {
            if (err) console.log(err);
            res.json({ success: true, phone: updatedUser.updated_phone });
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});




app.get("/new-user", (req,resp) =>{
    resp.render("signup.ejs")
})

app.get("/contactus", (req,resp) =>{
    resp.sendFile( absPathh + '/contactus.html')
})

app.get("/aboutus", (req,resp) =>{
    resp.sendFile( absPathh + '/aboutus.html')
})

app.get("/office-location", (req,resp) =>{
    resp.sendFile( absPathh + '/office-location.html')
})


app.get("/admin-dash", (req,resp) =>{
    resp.sendFile( absPathh + '/dashboard.html')
})

// Route to view all registered users
app.get("/admin/users", async (req, res) => {
    try {
        const users = await Register.find({}).sort({ createdAt: -1 }); // latest first
        res.render("users-confiedential", { users });
    } catch (err) {
        console.log(err);
        res.status(500).send("Server Error");
    }
});




app.use( (req,resp)=>{
    resp.status(404).sendFile(absPathh + '/404.html');
} )



app.listen(port, ()=>{
    console.log(`running at ${port}`)
})