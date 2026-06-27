// ================= ENV SETUP =================
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

// ================= BASIC SETUP ===============
const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
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
const searchRouter = require("./routes/search");
const pricingRouter = require("./routes/pricing");
const bookingRouter = require("./routes/booking");
const cacheRouter = require("./routes/cache");
const filterRouter = require("./routes/filter");
const tripRouter = require("./routes/tripPlanner");
const recommendationRouter = require("./routes/recommendation");
const waitlistRouter = require("./routes/waitlist");
const mapsRouter = require("./routes/maps");
const aiRouter = require("./routes/ai");

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
app.use(express.json());
app.use(methodOverride("_method"));

// CDN & Cache Control
const { cacheControlMiddleware, cdnLocals } = require("./utils/cdn");
app.use(cdnLocals); // Makes assetUrl() available in all EJS templates
app.use(cacheControlMiddleware); // Aggressive caching for static files
app.use(express.static(path.join(__dirname, "public"), {
  maxAge: process.env.NODE_ENV === "production" ? "30d" : 0,
  etag: true,
  lastModified: true,
}));

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

// ================= CACHE LAYER ==================
const { cache } = require("./utils/cache");
cache.initialize(process.env.REDIS_URL || null);

// ================= AI SERVICE ==================
const { initializeAI } = require("./utils/aiService");
initializeAI();

// ================= REALTIME (WebSocket) ==================
const { initializeSocket } = require("./utils/realtime");
initializeSocket(server);

// ================= WORKER QUEUES ==================
const { initializeQueues, setupScheduledJobs } = require("./utils/workerQueue");
initializeQueues();
setupScheduledJobs();

// ================= HEALTH CHECK & GRACEFUL SHUTDOWN ==================
const { setupGracefulShutdown, healthRoutes } = require("./utils/healthCheck");
setupGracefulShutdown(server);

// ================= ROUTES ====================
app.get("/", (req, res) => {
  return res.redirect("/listings");
});

app.use("/", userRouter);
app.use("/", bookingRouter);
app.use("/search", searchRouter);
app.use("/filter", filterRouter);
app.use("/trips", tripRouter);
app.use("/recommendations", recommendationRouter);
app.use("/api/waitlist", waitlistRouter);
app.use("/waitlist", waitlistRouter);
app.use("/api/maps", mapsRouter);
app.use("/ai", aiRouter);
app.use("/api/pricing", pricingRouter);
app.use("/api/cache", cacheRouter);
app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);

// Health check routes (no auth, no session needed)
healthRoutes(app);

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
server.listen(PORT, () => {
  console.log(` Server is running on port ${PORT}`);
});
