const app = require("./app");
const connectDB = require("./config/database");
require("dotenv").config();

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
// connectDB(); // Handled in app.js middleware for serverless compatibility

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
