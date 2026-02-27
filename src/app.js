import dotenv from "dotenv";
dotenv.config();

import express from "express"
import mongoose from "mongoose";
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

const upload = multer({ storage: cloudinaryStorage });

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
app.post("/upload-profile-pic", upload.single("profilePic"), async (req, res) => {
    try {
        if (!req.session.user) return res.redirect("/");

        const imageUrl = req.file.path; // Cloudinary URL

        const updatedUser = await Register.findByIdAndUpdate(
            req.session.user._id,
            { profilePic: imageUrl },
            { returnDocument: 'after' }
        );

        req.session.user.profilePic = updatedUser.profilePic;

        req.session.save(err => {
            if (err) console.log(err);
            res.redirect("/user-loggedin");
        });

    } catch (err) {
        console.log(err);
        res.status(500).send("Upload failed");
    }
});


app.post("/user-login-check", async (req, res) => {
    try {
        const check = await Register.findOne({ username: req.body.username.trim() });
        if (!check) return res.send("User not found");

        if (check.password === req.body.password) {
            req.session.user = {
                _id: check._id,
                username: check.username,
                email: check.email,
                phone: check.phone,
                profilePic: check.profilePic
            };
            
            // Save session and redirect
            req.session.save(err => {
                if (err) console.log(err);
                res.redirect("/user-loggedin");
            });
        } else {
            res.send("Wrong password");
        }
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

        if (password === cpassword) {

            const registerEmployee = new Register({
                username: req.body.username,
                email: req.body.email,
                phone: req.body.phone,
                password: req.body.password,            
                confirm_password: req.body.confirm_password 
            });

            const registered = await registerEmployee.save();
            resp.status(201).redirect("/");

        } else {
            resp.send("Password don't matches");
        }

    } catch (error) {
        resp.status(400).send("error " + error.message);
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