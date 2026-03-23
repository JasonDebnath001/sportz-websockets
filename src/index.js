import express from "express";

const app = express();

// Use JSON middleware
app.use(express.json());

// Root GET route
app.get("/", (req, res) => {
  res.send("Welcome to the Sportz server!");
});

// Start the server
const PORT = 8000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
