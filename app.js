const express = require("express");
const multer = require("multer");
const path = require("path");
const mongoose = require("mongoose");

const app = express();
const port = 3000;

mongoose.connect(
  "mongodb+srv://admin:Sabree8647@cluster0.vhbdkub.mongodb.net/?retryWrites=true&w=majority",
  { useNewUrlParser: true, useUnifiedTopology: true }
);

const postSchema = new mongoose.Schema({
  images: [String], // Array of image filenames
});

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  posts: [postSchema], // Array of posts
});

const User = mongoose.model("User", userSchema);

const storage = multer.diskStorage({
  destination: "./uploads/",
  filename: (req, file, callback) => {
    const filename = Date.now() + path.extname(file.originalname);
    callback(null, filename);
  },
});
const upload = multer({
  storage: storage,
});

app.use(express.json());

//Endpoints for saving users
app.post("/create-user", async (req, res) => {
  try {
    // Assuming you have an 'upload' middleware setup
    upload.array("images", 3)(req, res, async (err) => {
      if (err instanceof multer.MulterError) {
        // A Multer error occurred during file upload

        if (err.code === "LIMIT_UNEXPECTED_FILE")
          return res
            .status(400)
            .json({ error: "Maximum 3 images are allowed" });
        return res.status(400).json({ error: "Multer Error: " + err.code });
      } else if (err) {
        // An unknown error occurred
        return res.status(500).json({ error: "Unknown Error: " + err.message });
      }

      const { name, email } = req.body;
      const images = req.files.map((file) => file.filename);

      if (!name || !email || images.length === 0) {
        return res
          .status(400)
          .json({ error: "Name, email, and at least one image are required" });
      }

      if (images.length > 3) {
        return res.status(400).json({ error: "Maximum 3 images are allowed" });
      }

      const newUser = new User({
        name,
        email,
        posts: [{ images }],
      });

      await newUser.save();

      res.json({ message: "User created successfully", user: newUser });
    });
  } catch (error) {
    // Handle other errors
    res.status(500).json({ error: "Internal Server Error: " + error.message });
  }
});

// Endpoint for fetching all users
app.get("/users", async (req, res) => {
  try {
    const users = await User.find();
    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
