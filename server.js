const express = require("express");
const exphbs = require("express-handlebars");

const app = express();
const PORT = process.env.PORT || 9000;

//***********all  static import goes here */
const globalConfig = require("./config/globalConfig");

//**********************view engine setup */
app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

app.use("/", (req, res) => {
  res.render("home");
});

app.listen(PORT, () => {
  console.log(`Server running on PORT: ${PORT}`);
});
