//jshint esversion:6
// Server Init
require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const findOrCreate = require("mongoose-findorcreate");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const compress_images = require("compress-images");
var moment = require("moment");
moment().format();

// Module from Server
const { uploadFile, uploadFileProfile } = require("./DB/s3");
const Photo = require("./DB/Photo");
const Feed = require("./DB/Feed");
const Comm = require("./DB/Comm");
const Follwers = require("./DB/Follwers");
const Follwing = require("./DB/Follwing");

const app = express();

// Public File Settings
app.use("*/css", express.static("public/css"));
app.use("*/images", express.static("public/images"));
app.use("*/js", express.static("public/js"));

// EJS Init
app.set("view engine", "ejs");

// Body Parser Init
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

// Login remember only sessios
app.use(
  session({
    secret: "Force secrets.",
    resave: false,
    saveUninitialized: false,
  })
);

// Passport init with save seesion
app.use(passport.initialize());
app.use(passport.session());

// DataBase Settings | .env file key
mongoose.connect(process.env.DB_KEY, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoose.set("useCreateIndex", true);
mongoose.set("useFindAndModify", false);

// DB schema USERS
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  profile_name: String,
  lights: { type: String, default: "0" },
  des: String,
  s3_profile: {
    type: String,
    default:
      "https://proiect-licenta.s3.eu-central-1.amazonaws.com/profileDefault",
  },
  secret: [Photo.schema],
  follwers: [Follwers.schema],
  follwing: [Follwing.schema],
});

// Passport Init
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

// Mongoose model
const User = new mongoose.model("User", userSchema);

// PassPort Settings
passport.use(User.createStrategy());

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});

// Home
app.get("/", function (req, res) {
  // Check user login
  if (req.isAuthenticated()) {
    //find user in User DB
    User.findById(req.user.id, function (err, fountItems) {
      //dinf items on Feed DB
      Feed.find({}, (err, foundItemsFeed) => {
        if (err) {
          console.log(err);
        } else {
          if (fountItems) {
            //render all intems on Home
            res.render("home", {
              userName: fountItems.profile_name,
              userPhoto: foundItemsFeed.reverse(),
              userStats: fountItems,
              userId: fountItems._id,
            });
          }
        }
      });
    });
  } else {
    res.render("autentificate");
  }
});

app.post("/", function (req, res) {
  // id from Home
  const _id = req.body.idCheck;
  setTimeout(function () {
    //find user in Db
    User.findById(req.user.id, (err, foundItemsUsers) => {
      // find items on feed DB
      Feed.findById(_id, (err, fountItemsFeed) => {
        // check err
        if (err) {
          console.log(err);
        } else {
          // save items on Db
          let commModel = new Comm();
          commModel.profile_name = foundItemsUsers.profile_name;
          commModel.comm = req.body.comm;
          fountItemsFeed.comm.push(commModel);
        }
        fountItemsFeed.save();
        // redirect user to specific post after procesing
        res.redirect("/#" + _id);
      });
    });
  }, 200);
});

// Lights
app.post("/lights", function (req, res) {
  const _id = req.body.idLights;
  // Find all items on Feed
  Feed.findById(_id, (err, fountItemsFeed) => {
    // Update lights
    Feed.findByIdAndUpdate(
      _id,
      { lights: fountItemsFeed.lights },
      (err, foundItemsLights) => {
        if (err) {
          console.log(err);
        } else {
          // save lights in DB
          foundItemsLights.lights = fountItemsFeed.lights + 1;
          foundItemsLights.save();
        }
      }
    );
    setTimeout(function () {
      // processing all lights on user post and sending to lights (total)
      User.findByIdAndUpdate(
        fountItemsFeed.id,
        { lights: 0 },
        (err, foundItemsLights_Stats) => {
          Feed.find({ id: fountItemsFeed.id }, (err, result) => {
            // calculating all post for lights
            const reducer = (accumulator, currentValue) =>
              accumulator + currentValue.lights;
            const allLights = result.reduce(reducer, 0);
            foundItemsLights_Stats.lights = allLights;
            console.log(allLights);
            foundItemsLights_Stats.save();
          });
          res.redirect("/#" + _id);
        }
      );
    }, 500);
  });
});

// Follow
app.post("/follow", function (req, res) {
  const id = req.body.idFllw;

  User.findById(req.user.id, (err, foundItemsUsers) => {
    // const idUsers = req.user.id;

    Feed.findById(id, (err, foundItemsFollwing) => {
      User.findById(foundItemsFollwing.id, (err, foundItemsFollow) => {
        // add new fllw to Users DB
        //following process
        const followingModel = new Follwing();
        followingModel.follwing = foundItemsFollwing.profile_name;
        followingModel.id = foundItemsFollwing.id;

        foundItemsUsers.follwing.push(followingModel);
        foundItemsUsers.save();

        // followers process
        const follwersModel = new Follwers();
        follwersModel.follwers = foundItemsUsers.profile_name;
        follwersModel.id = foundItemsUsers.id;

        foundItemsFollow.follwers.push(follwersModel);
        foundItemsFollow.save();

        // followers on person following
        const follwersModel_Feed = new Follwers();
        follwersModel_Feed.follwers = foundItemsUsers.profile_name;
        follwersModel_Feed.id = foundItemsUsers.id;

        foundItemsFollwing.follwers.push(follwersModel_Feed);
        foundItemsFollwing.save();
      });
      //redirect to specific post
      res.redirect("/#" + id);
    });
  });
});

// Autentificate Get Req
app.get("/autentificate", function (req, res) {
  res.render("autentificate");
});

app.get("/register", function (req, res) {
  res.render("register");
});

// Profile privat
app.get("/profile", function (req, res) {
  // check user logged
  if (req.isAuthenticated()) {
    User.findById(req.user.id, function (err, fountItems) {
      if (err) {
        console.log(err);
      } else {
        if (fountItems) {
          // revers post to show correctly
          const fileInit = fountItems.secret;
          const fileReverse = fileInit.reverse();
          //render all stuff to profile
          res.render("profile", {
            userWithSecrets: fileReverse,
            userName: fountItems.profile_name,
            des: fountItems.des,
            userStats: fountItems,
          });
        }
      }
    });
  } else {
    res.redirect("/autentificate");
  }
});

// Login GET and POST ROUTE
app.post("/autentificate", function (req, res) {
  const user = new User({
    // req input from body
    username: req.body.username,
    password: req.body.password,
  });

  //login process
  req.login(user, function (err) {
    if (err) {
      consolo.log(err);
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/"); // Main index
      });
    }
  });
});

// Register GET and POST ROUTE
app.get("/register", function (req, res) {
  res.render("register");
});

// register process
app.post("/register", function (req, res) {
  User.register(
    {
      // req all user input data
      username: req.body.username,
      profile_name: req.body.name,
      des: req.body.des,
    },
    //password input from user
    req.body.password,
    function (err, user) {
      if (err) {
        console.log(err);
        res.redirect("/register");
      } else {
        passport.authenticate("local")(req, res, function () {
          res.redirect("/profile");
        });
      }
    }
  );
});

// Set Storage Engine
app.get("/upload", function (req, res) {
  if (req.isAuthenticated()) {
    // find all stuff from DB
    User.findById(req.user.id, (err, user) => {
      if (err) {
        console.log(err);
      } else {
        //render for upload
        res.render("upload"),
          {
            user: user,
          };
      }
    });
  } else {
    res.render("autentificate");
  }
});

const storage = multer.diskStorage({
  // destination on file user uploaded
  destination: "./public/images/upload_temporary",
  filename: (req, file, cb) => {
    cb(
      null,
      // create custom name for file uploaded
      file.fieldname +
        "-" +
        //date now
        Date.now() +
        "_id_" +
        //user id
        req.user.id +
        //extension
        path.extname(file.originalname)
    );
  },
});

// Init Upload
const upload = multer({
  storage: storage,
  //limit upload images
  limits: {
    fileSize: 4194304, // B to MB == 4MB max upload
  },
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
}).single("image_uploud"); //name from body for upload specific images

// Check File Type | Only Img
function checkFileType(file, cb) {
  //file allows
  const filetypes = /jpeg|jpg|png/;

  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);
  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb("Error: Images Only!");
  }
}

app.post("/upload", (req, res) => {
  if (req.isAuthenticated()) {
    //upload engine | upload POST
    upload(req, res, (err) => {
      if (err) {
      } else {
        // User db finn all stuff
        User.findById(req.user.id, (err, foundItems) => {
          if (err) {
            console.log(err);
          } else {
            //check file is not undefined
            if (req.file == undefined) {
              //render err
              res.render("upload", {
                msg: "Error: No file selected!",
              });
            } else {
              //find feed and upload new date to Feed DB
              Feed.find({}, (err, foundItemsFeed) => {
                const des = req.body.des;
                const feedModel = new Feed();
                feedModel.id = req.user.id;
                feedModel.filename = req.file.filename;
                feedModel.date = new Date();
                feedModel.s3_file =
                  "https://proiect-licenta.s3.eu-central-1.amazonaws.com/" +
                  req.file.filename;
                feedModel.profile_name = foundItems.profile_name;
                feedModel.lights = 0;
                feedModel.des = des;
                feedModel.s3_profile = foundItems.s3_profile;
                //save data
                feedModel.save();
              });

              //Photo section, add to Feed DB
              const secretModel = new Photo();
              secretModel.filename = req.file.filename;
              secretModel.date = new Date();
              secretModel.s3_file =
                "https://proiect-licenta.s3.eu-central-1.amazonaws.com/" +
                req.file.filename;
              // push all items to Db
              foundItems.secret.push(secretModel);
              //save date to DB
              foundItems.save();
              // Delay
              timeFunction();
            }
          }
        });

        function timeFunction() {
          setTimeout(MyFun, 1000);
        }

        // compreseed images procesing for reduce size and load page fastes
        function MyFun() {
          const path = "./public/images/upload_temporary/" + req.file.filename;
          compress_images(
            "./public/images/upload_temporary/" + req.file.filename,
            "./public/images/upload_compressed/",
            {
              compress_force: false,
              statistic: true,
              autoupdate: true,
            },
            false,
            {
              jpg: {
                engine: "mozjpeg",
                command: ["-quality", "60"],
              },
            },
            {
              png: {
                engine: "pngquant",
                command: ["--quality=20-50", "-o"],
              },
            },
            {
              svg: {
                engine: "svgo",
                command: "--multipass",
              },
            },
            {
              gif: {
                engine: "gifsicle",
                command: ["--colors", "64", "--use-col=web"],
              },
            },
            // and after photo processing, upload images on AWS S3
            async (err, completed) => {
              if (completed === true) {
                const result = await uploadFile(req.file);
                // remove file after images uploaded on AWS S3
                try {
                  fs.unlinkSync(path);
                  //file removed
                } catch (err) {
                  console.error(err);
                }
              } else {
                console.log(err);
              }
            }
          );
        }
      }
    });
  } else {
    res.render("autentificate");
  }
  res.redirect("/");
});

//Storage for images profile
const storageProfile = multer.diskStorage({
  destination: "./public/images/upload_compresed",
  filename: (req, file, cb) => {
    cb(null, file.fieldname + "-" + "_id_" + req.user.id);
  },
});

// upload images Profile on AWS S3
const uploadProfile = multer({
  storage: storageProfile,
  limits: {
    fileSize: 4194304, // B to MB == 4MB max upload
  },
  fileFilter: function (req, file, cb) {
    checkFileTypeProfile(file, cb);
  },
}).single("image_uploud_Profile"); //file from body

// Check File Type | Only Img
function checkFileTypeProfile(file, cb) {
  //check img extension
  const filetypes = /jpeg|jpg|png/;

  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);
  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb("Error: Images Only!");
  }
}

// Profile images upload
app.post("/updateProfile", (req, res) => {
  if (req.isAuthenticated()) {
    uploadProfile(req, res, async (err) => {
      //upload on AWS S3
      const result = await uploadFileProfile(req.file);
      //Find User in Db
      User.findById(req.user.id, (err, foundItems) => {
        //update profile images
        User.findByIdAndUpdate(
          req.user.id,
          {
            s3_profile: foundItems.s3_profile,
          },
          (err, foundItems) => {
            foundItems.s3_profile =
              "https://proiect-licenta.s3.eu-central-1.amazonaws.com/" +
              req.file.filename;
            foundItems.save();
          }
        );
      });
      // path for remove images after uploaded on AWS S3
      const path = "./public/images/upload_compresed/" + req.file.filename;
      // remove files
      try {
        fs.unlinkSync(path);
        //file removed
      } catch (err) {
        console.error(err);
      }
      res.redirect("/");
    });
  } else {
    // is not logged, redirect to login
    res.render("autentificate");
  }
});

// Logout Users
app.get("/logout", function (req, res) {
  req.logout();
  res.redirect("/autentificate");
});

// Server Settings
app.listen(process.env.PORT || 3000, function () {
  console.log("Server started succesfully on port 3000!");
});
