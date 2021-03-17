const express = require("express");
const exphbs = require("express-handlebars");
const Handlebars = require("handlebars");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const passport = require("passport");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const {
  allowInsecurePrototypeAccess,
} = require("@handlebars/allow-prototype-access");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 9000;

//***********all  static import goes here */
const globalConfig = require("./config/globalConfig");
const User = require("./models/user");
require("./passport/facebook");

//************helpers */
const { requireLogin, ensureGuest } = require("./helpers/auth");

//**********************view engine setup */
app.engine(
  "handlebars",
  exphbs({
    defaultLayout: "main",
    handlebars: allowInsecurePrototypeAccess(Handlebars),
  })
);
app.set("view engine", "handlebars");

//************************database connection here ******************/
mongoose
  .connect(globalConfig.DB_CONN, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true,
  })
  .then(() => {
    console.log("and database connected!");
  })
  .catch((err) => {});

//**********gobal config */

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/public", express.static(path.join(__dirname, "public")));

//****************for  facebook authentication */
app.use(cookieParser());
app.use(
  session({
    secret: "mysecret",
    resave: true,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());

//*************make user global for protecting route */

app.use((req, res, next) => {
  res.locals.user = req.user || null;
  next();
});

//******************all get routes */
app.get("/", (req, res) => {
  res.render("home");
});
app.get("/login", ensureGuest, (req, res) => {
  res.render("login");
});

app.get(
  "/auth/facebook",
  passport.authenticate("facebook", {
    scope: ["email"],
  })
);
app.get(
  "/auth/facebook/callback",
  passport.authenticate("facebook", {
    successRedirect: "/profile",
    failureRedirect: "/login",
  })
);

app.get("/profile", requireLogin, (req, res) => {
  User.findById({ _id: req.user._id })
    .then((user) => {
      if (user) {
        user.online = true;
        user.save((err, user) => {
          if (err) {
            throw err;
          } else {
            res.render("profile", {
              title: "profile",
              user: user,
            });
          }
        });
      }
    })
    .catch((err) => {});
});

app.get("/logout", (req, res) => {
  User.findById({ _id: req.user._id }).then((user) => {
    user.online = false;
    user.save((err, user) => {
      if (err) {
        throw err;
      }
      if (user) {
        req.logOut();
        res.redirect("/login");
      }
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on PORT: ${PORT}`);
});
