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
const flash = require("connect-flash");
const bcrypt = require("bcryptjs");

const app = express();
const PORT = process.env.PORT || 9000;

//***********all  static import goes here */
const globalConfig = require("./config/globalConfig");
const User = require("./models/user");

//************local passport module */
require("./passport/facebook");
require("./passport/local");

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
app.use(flash());
app.use((req, res, next) => {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  res.locals.error = req.flash("error");
  next();
});

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

app.get("/newAccount", ensureGuest, (req, res) => {
  res.render("resister");
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

app.get("/loginErrors", (req, res) => {
  let errors = [];
  errors.push({ text: "please provide a valid username and password" });
  res.render("login", {
    errors: errors,
  });
});

//*********************all post message goes here */
app.post("/signUp", (req, res) => {
  let errors = [];
  if (req.body.password !== req.body.conpassword) {
    errors.push({ text: "Password Does not Match" });
  }
  if (req.body.password.length < 5) {
    errors.push({ text: "password should be atleast 5 char long." });
  }
  if (errors.length > 0) {
    res.render("resister", {
      errors: errors,
      fullname: req.body.fullname,
      email: req.body.email,
      password: req.body.password,
      conpassword: req.body.conpassword,
    });
  } else {
    User.findOne({ email: req.body.email })
      .then((user) => {
        if (user) {
          let errors = [];
          errors.push({ text: "Email already exists" });
          res.render("resister", {
            errors: errors,
          });
        } else {
          var salt = bcrypt.genSaltSync(10);
          var hash = bcrypt.hashSync(req.body.password, salt);
          const newUser = {
            fullname: req.body.fullname,
            password: hash,
            email: req.body.email,
          };
          new User(newUser).save((err, user) => {
            if (err) {
              throw err;
            }
            if (user) {
              let success = [];
              success.push({
                text: "account created. Please login to continue.",
              });
              res.render("login", {
                success: success,
              });
            }
          });
        }
      })
      .catch();
  }
});

app.post(
  "/signIn",
  passport.authenticate("local", {
    successRedirect: "/profile",
    failureRedirect: "/loginErrors",
  })
);

app.listen(PORT, () => {
  console.log(`Server running on PORT: ${PORT}`);
});
