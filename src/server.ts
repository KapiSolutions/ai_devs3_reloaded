import app from "./app";
import dotenv from "dotenv";
dotenv.config();

app.listen(process.env.PORT || 3000, () => {
  console.log("Server running on http://localhost:3000");
});
 