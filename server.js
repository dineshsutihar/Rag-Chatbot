import express from "express";
import { processRequest } from "./controllers/apiController.js";

const app = express();
app.use(express.json());

app.post("/", processRequest);

app.listen(3000, () => {
  console.log("Listening on port 3000");
});
