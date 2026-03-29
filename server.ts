import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";

const app = express();
const PORT = 3000;
const JWT_SECRET = "berlin_secret_key_123";
const DATA_DIR = path.join(process.cwd(), "data");

// Ensure data directory and files exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

const initJsonFile = (filename, initialData) => {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(initialData, null, 2));
  }
};

initJsonFile("users.json", []);
initJsonFile("categories.json", [
  { id: 1, title: "IPL 2026 LIVE" },
  { id: 2, title: "Match Highlights" },
  { id: 3, title: "Trending Movies" }
]);
initJsonFile("banners.json", [
  { id: 1, title: "IPL 2026: Final Match Live", image_url: "https://picsum.photos/seed/ipl1/1200/400" },
  { id: 2, title: "CSK vs MI: El Clasico", image_url: "https://picsum.photos/seed/ipl2/1200/400" }
]);
initJsonFile("movies.json", [
  { 
    id: 1, 
    categoryId: 1, 
    title: "CSK vs MI - Live Stream", 
    poster_url: "https://picsum.photos/seed/cskmi/300/450", 
    description: "Watch the biggest rivalry in cricket history live.", 
    rating: "4.9", 
    year: "2026", 
    watch_link: "https://example.com/stream1" 
  },
  { 
    id: 2, 
    categoryId: 2, 
    title: "RCB vs KKR Highlights", 
    poster_url: "https://picsum.photos/seed/rcbkkr/300/450", 
    description: "Catch the best moments from the high-scoring thriller.", 
    rating: "4.7", 
    year: "2026", 
    watch_link: "https://example.com/highlights1" 
  }
]);

app.use(express.json());
app.use(cookieParser());

// Helper to read/write JSON
const readData = (file) => JSON.parse(fs.readFileSync(path.join(DATA_DIR, `${file}.json`), "utf-8"));
const writeData = (file, data) => fs.writeFileSync(path.join(DATA_DIR, `${file}.json`), JSON.stringify(data, null, 2));

// Auth Middleware
const authenticate = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};

const authenticateAdmin = (req, res, next) => {
  const token = req.cookies.admin_token;
  if (!token) return res.status(401).json({ error: "Unauthorized Admin" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== "admin") throw new Error();
    req.admin = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid admin token" });
  }
};

// --- API ROUTES ---

// User Auth
app.post("/api/auth/signup", (req, res) => {
  const { username, password } = req.body;
  const users = readData("users");
  if (users.find(u => u.username === username)) return res.status(400).json({ error: "User exists" });
  const newUser = { id: Date.now(), username, password };
  users.push(newUser);
  writeData("users", users);
  res.json({ success: true });
});

app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  const users = readData("users");
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) return res.status(401).json({ error: "Invalid credentials" });
  
  const token = jwt.sign({ id: user.id, username: user.username, role: "user" }, JWT_SECRET, { expiresIn: "24h" });
  res.cookie("token", token, { maxAge: 24 * 60 * 60 * 1000, httpOnly: true, sameSite: 'none', secure: true });
  res.json({ success: true });
});

// Admin Auth
app.post("/api/auth/admin-login", (req, res) => {
  const { key } = req.body;
  if (key !== "BERLIN786") return res.status(401).json({ error: "Invalid Admin Key" });
  
  const token = jwt.sign({ role: "admin" }, JWT_SECRET, { expiresIn: "24h" });
  res.cookie("admin_token", token, { maxAge: 24 * 60 * 60 * 1000, httpOnly: true, sameSite: 'none', secure: true });
  res.json({ success: true });
});

app.post("/api/auth/logout", (req, res) => {
  res.clearCookie("token", { sameSite: 'none', secure: true });
  res.clearCookie("admin_token", { sameSite: 'none', secure: true });
  res.json({ success: true });
});

app.get("/api/auth/me", (req, res) => {
  const token = req.cookies.token;
  const adminToken = req.cookies.admin_token;
  let user = null;
  let isAdmin = false;

  if (token) {
    try { user = jwt.verify(token, JWT_SECRET); } catch(e) {}
  }
  if (adminToken) {
    try { const d = jwt.verify(adminToken, JWT_SECRET); if(d.role === 'admin') isAdmin = true; } catch(e) {}
  }

  res.json({ user, isAdmin });
});

// Data Routes
app.get("/api/banners", (req, res) => res.json(readData("banners")));
app.get("/api/categories", (req, res) => res.json(readData("categories")));
app.get("/api/movies", (req, res) => {
  const { categoryId, search } = req.query;
  let movies = readData("movies");
  if (categoryId) movies = movies.filter(m => m.categoryId == categoryId);
  if (search) {
    const s = String(search).toLowerCase();
    movies = movies.filter(m => m.title.toLowerCase().includes(s));
  }
  res.json(movies);
});

app.get("/api/movies/:id", (req, res) => {
  const movies = readData("movies");
  const movie = movies.find(m => m.id == req.params.id);
  res.json(movie);
});

// Admin CRUD
app.post("/api/admin/movies", authenticateAdmin, (req, res) => {
  const movies = readData("movies");
  const newMovie = { ...req.body, id: Date.now() };
  movies.push(newMovie);
  writeData("movies", movies);
  res.json(newMovie);
});

app.delete("/api/admin/movies/:id", authenticateAdmin, (req, res) => {
  let movies = readData("movies");
  movies = movies.filter(m => m.id != req.params.id);
  writeData("movies", movies);
  res.json({ success: true });
});

app.put("/api/admin/movies/:id", authenticateAdmin, (req, res) => {
  let movies = readData("movies");
  const id = parseInt(req.params.id);
  const index = movies.findIndex(m => m.id === id);
  if (index === -1) return res.status(404).json({ error: "Movie not found" });
  movies[index] = { ...movies[index], ...req.body };
  writeData("movies", movies);
  res.json({ success: true, movie: movies[index] });
});

app.post("/api/admin/categories", authenticateAdmin, (req, res) => {
  const categories = readData("categories");
  const newCat = { ...req.body, id: Date.now() };
  categories.push(newCat);
  writeData("categories", categories);
  res.json(newCat);
});

app.delete("/api/admin/categories/:id", authenticateAdmin, (req, res) => {
  let categories = readData("categories");
  categories = categories.filter(c => c.id != req.params.id);
  writeData("categories", categories);
  res.json({ success: true });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
