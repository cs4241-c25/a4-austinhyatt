import fs from "fs";
import path from "path";
import express from "express";
import { createServer } from "vite";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";
import passport from "passport";
import session from "express-session";
import { Strategy as GitHubStrategy } from "passport-github2";
import { Strategy as LocalStrategy } from "passport-local";

// Load environment variables
dotenv.config();

// Destructure process.env to get nice to read variable names
// const {
//   MONGO_USER,
//   MONGO_PASS,
//   MONGO_HOST,
//   MONGO_DBNAME,
//   MONGO_DBCOLLECTION,
//   GITHUB_CLIENT_ID,
//   GITHUB_CLIENT_SECRET,
//   EXPRESS_SESSION_SECRET
// } = process.env;
const GITHUB_CLIENT_ID = "Ov23li1F0M1sReRgCk8G";
const GITHUB_CLIENT_SECRET = "9b5974cce6e6e5fd30cf9cb79988eefd3527cbba";

// MongoDB Connection
const url = "mongodb+srv://austin:mingming7ate9@austina3.uwuux.mongodb.net/";
const dbconnect = new MongoClient(url);
let scoresCollection = null;

await dbconnect.connect();
const db = dbconnect.db("cs4241");
scoresCollection = db.collection("cars");

console.log("Connected to MongoDB");

const startServer = async () => {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json()); // Ensures JSON parsing
  app.use(express.urlencoded({ extended: true })); // Handles form data
  app.use(bodyParser.json());
  app.use(session({ secret: "secret", resave: false, saveUninitialized: true }));
  app.use(passport.initialize());
  app.use(passport.session());

  // Passport GitHub Authentication
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: "https://a4-austinhyatt.onrender.com/auth/github/callback",
      },
      function (accessToken, refreshToken, profile, done) {
        return done(null, profile);
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user);
  });

  passport.deserializeUser((obj, done) => {
    done(null, obj);
  });

  // GitHub Auth Routes
  app.get("/auth/github", passport.authenticate("github", { scope: ["user:email"] }));

  app.get(
    "/auth/github/callback",
    passport.authenticate("github", { failureRedirect: "/" }),
    (req, res) => {
      res.redirect("/dashboard");
    }
  );

  // Dummy users (Replace with real MongoDB authentication logic)
  const users = [{ id: 1, username: "a", password: "a" }];

  // Define Passport Local Strategy
  passport.use(
    new LocalStrategy((username, password, done) => {
      console.log("Authenticating:", username, password); // Debugging

      console.log("Login successful:", username, password);
      return done(null, username);
    })
  );


  // Local Login Route
  app.post("/api/login", (req, res, next) => {
    console.log("running");
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        console.error("Login error:", err);
        return res.status(500).json({ success: false, message: "Server error during authentication" });
      }

      if (!user) {
        console.log("Unauthorized: Invalid credentials");
        return res.status(401).json({ success: false, message: "Invalid username or password" });
      }

      req.logIn(user, (err) => {
        if (err) {
          console.error("Login session error:", err);
          return res.status(500).json({ success: false, message: "Session error" });
        }
        return res.json({ success: true, message: "Login successful!", user });
      });
    })(req, res, next);
  });


  // Set up Vite in middleware mode
  const vite = await createServer({
    server: {
      middlewareMode: true,
    },
    appType: "custom",
  });

  app.use(vite.middlewares);

  // Highscore Routes
  app.post("/check", async (req, res) => {
    if (req.user) {
      let user = req.user.username ? req.user.username : req.user
      console.log("Manual user:", user,
        "req.user:", req.user,
        "req.user.username:", req.user.username);

      let databaseArray = await scoresCollection.find().toArray();
      let filteredArray = databaseArray.filter((v) => v.user === user);
      sortItem(filteredArray);
      res.json(filteredArray);
    } else {
      return res.status(500).json({ success: false, message: "Session error" });
    }
  });

  app.post("/submit", async (req, res) => {
    console.log("Request user:", req.user);

    let user = req.user.username ? req.user.username : req.user

    const { username, name, score, date } = req.body;
    let id = crypto.randomUUID();
    let submission = { _id: id, rank: null, user: user, name, score, date };

    if (name && score && date) {
      await scoresCollection.insertOne(submission);
      updateRankings(user);
      res.json({ message: "Submission successful" });
    } else {
      res.status(400).json({ error: "Invalid input" });
    }
  });


  app.post("/delete", async (req, res) => {
    const { index, user } = req.body;

    let correctUser = req.user.username ? req.user.username : req.user

    let databaseArray = await scoresCollection.find().toArray();
    let filteredArray = databaseArray.filter((v) => v.user === correctUser && v.rank === index + 1);

    if (filteredArray.length === 0) {
      return res.status(400).json({ error: "No matching record found" });
    }

    await scoresCollection.deleteOne({ _id: filteredArray[0]._id });
    updateRankings(correctUser);
    res.json({ message: "Deleted successfully" });
  });

  app.post("/edit", async (req, res) => {
    const { index, name, score, date, user } = req.body;

    let correctUser = req.user.username ? req.user.username : req.user

    let databaseArray = await scoresCollection.find().toArray();
    let filteredArray = databaseArray.filter((v) => v.user === correctUser && v.rank === index + 1);

    if (filteredArray.length === 0) {
      return res.status(400).json({ error: "No matching record found" });
    }

    await scoresCollection.updateOne(
      { _id: filteredArray[0]._id },
      { $set: { name, score, date } }
    );

    updateRankings(correctUser);
    res.json({ message: "Edited successfully" });
  });

  // Serve Frontend (Vite SSR)
  app.get("*", async (req, res) => {
    try {
      const template = fs.readFileSync("index.html", "utf-8");
      const transformedTemplate = await vite.transformIndexHtml(req.originalUrl, template);
      const { render } = await vite.ssrLoadModule("/src/entry-server.jsx");

      const html = transformedTemplate.replace(`<!--outlet-->`, render);
      res.status(200).set({ "Content-Type": "text/html" }).end(html);
    } catch (error) {
      console.error(error);
      res.status(500).end(error.toString());
    }
  });

  // Start server
  app.listen(5000, () => {
    console.log("Server running at http://localhost:5000");
  });
};

startServer();

// Sorting Function
const sortItem = (array) => {
  array?.sort((a, b) => b.score - a.score);
};

// Update Rankings
async function updateRankings(user) {
  let databaseArray = await scoresCollection.find().toArray();
  let userScores = databaseArray.filter((v) => v.user === user);
  sortItem(userScores);

  userScores.forEach((item, index) => {
    item.rank = index + 1;
  });

  let otherScores = databaseArray.filter((v) => v.user !== user);
  userScores.push(...otherScores);

  await scoresCollection.deleteMany({});
  if (userScores.length > 0) {
    await scoresCollection.insertMany(userScores);
  }
}
