import app from "./app";
import { config } from "./config";

const port = Number(config.port);
app.listen(port, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${port}`);
});
