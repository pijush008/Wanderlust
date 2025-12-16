// ================= ENV SETUP =================
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

// ================= BASIC SETUP ===============
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");


// ================= MODELS ====================
const Listing = require("./models/listing");
const Review = require("./models/review");
const User = require("./models/user");

// ================= UTILS =====================
const ExpressError = require("./utils/ExpressError");

// ================= ROUTES ====================
const listingRouter = require("./routes/listing");
const reviewRouter = require("./routes/review");
const userRouter = require("./routes/user");

// ================= AUTH & SESSION ============
const session = require("express-session");
const MongoStore = require("connect-mongo");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const flash = require("connect-flash");

// ================= CONFIG ====================
const PORT = process.env.PORT;
const dbUrl = process.env.ATLASDB_URL;
const SESSION_SECRET = process.env.SESSION_SECRET;

// ================= EJS SETUP =================
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ================= MIDDLEWARE ================
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

// ================= SESSION STORE =============
const store = MongoStore.create({
  mongoUrl: dbUrl,
  collectionName: "sessions",   // IMPORTANT
  ttl: 7 * 24 * 60 * 60          // 7 days (seconds)
});

store.on("error", (err) => {
  console.error(" Mongo Session Store Error:", err);
});


// ================= SESSION CONFIG ============
app.use(
  session({
    store,
    name: "wanderlust-session",
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      secure: process.env.NODE_ENV === "production",
    },
  })
);

app.use(flash());

// ================= PASSPORT ==================
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// ================= GLOBAL LOCALS ==============

app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user || null;
  next();
});


// ================= DATABASE ==================
mongoose
  .connect(dbUrl)
  .then(() => console.log(" MongoDB is Connected"))
  .catch((err) => console.log(" MongoDB Error:", err));

// ================= ROUTES ====================
app.get("/", (req, res) => {
  return res.redirect("/listings");
});

// ================= GLOBAL VARIABLES ==========
app.use((req, res, next) => {
  res.locals.currUser = req.user || null;
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});


app.use("/", userRouter);
app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);

// ================= 404 HANDLER ===============
app.use((req, res, next) => {
  next(new ExpressError(404, "Page Not Found"));
});


// ================= ERROR HANDLER ==============
app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }
  const { statusCode = 500, message = "Something went wrong!" } = err;
  res.status(statusCode).render("error", { message });
});

// ================= SERVER ====================
app.listen(PORT, () => {
  console.log(` Server is running on port ${PORT}`);
});
