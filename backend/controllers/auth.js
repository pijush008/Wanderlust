const User = require("../models/user");
const { generateToken } = require("../middleware/auth");

// POST /api/auth/signup
exports.signup = async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: "All fields required" });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  const existing = await User.findOne({ $or: [{ username }, { email }] });
  if (existing) return res.status(409).json({ error: "Username or email already taken" });

  const user = await User.create({ username, email, password });
  const token = generateToken(user._id);

  res.status(201).json({ user, token });
};

// POST /api/auth/login
exports.login = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: "Credentials required" });

  const user = await User.findOne({ $or: [{ username }, { email: username }] });
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const valid = await user.comparePassword(password);
  if (!valid) return res.status(401).json({ error: "Invalid credentials" });

  const token = generateToken(user._id);
  res.json({ user, token });
};

// GET /api/auth/me
exports.me = async (req, res) => {
  res.json({ user: req.user });
};
