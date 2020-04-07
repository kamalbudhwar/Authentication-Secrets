//jshint esversion:6
require('dotenv').config();
const express=require("express");
const ejs=require("ejs");
const bodyParser=require("body-parser");
const mongoose=require("mongoose");
const session=require('express-session');
const passport=require("passport");
const passportLocalMongoose=require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy=require('passport-facebook').Strategy;
const findOrCreate = require('mongoose-findorcreate');
const app=express();

app.use(express.static("public"));
app.use(bodyParser.urlencoded(
  {extended:true}
));
app.set('view-engine','ejs');
app.use(session({
  secret:"Our little secret.",
  resave: false,
  saveUninitialized:false
}));
app.use(passport.initialize());
app.use(passport.session());
mongoose.connect("mongodb://localhost:27017/userDB",{useNewUrlParser:true, useUnifiedTopology: true});
mongoose.set("useCreateIndex",true)
const userSchema=new mongoose.Schema({
  email:String,
  password:String,
  secret:String
});
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
const User= new mongoose.model("User",userSchema);
passport.use(User.createStrategy());

// ****************************************GoogleStrategy*********************************************************//

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    // userProfileURL:"http://localhost:3000/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log("Google PROFILE:",profile);
        User.findOrCreate({ email:profile._json.email},function (err, user,created) {
          if(user){
            console.log("Existing USER: ",user);
             console.log("end of user");}
             return cb(err, user);

        });
       }
     ));

// ***********************************************facebookStrategy************************************************************//

passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log("FAcebook PROFILE:",profile);
     profile.username=profile.displayName;
    User.findOrCreate({username:profile.username} ,function (err, user) {
      if(user){
        console.log("Existing USER: ",user);
         console.log("end of user");}
        return cb(err, user);
    });
  }
));

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

// ************************************************All route Page requests********************************************************//

app.get("/home",function(req,res){
  res.render("home.ejs");
});
app.get("/login",function(req,res){
  res.render("login.ejs");
});
app.get("/register",function(req,res){
  res.render("register.ejs");
});
app.get("/submit",function(req,res){
  res.render("submit.ejs");
});
app.get("/secrets",function(req,res){
  User.find({"secret":{$ne:null}},function(err,foundUsers){
    if(err){
      console.log(err);
    }
    else{
      if(foundUsers){
        res.render('secrets.ejs',{usersWithSecrets:foundUsers});
      }
    }
  });
});
app.get("/logout",function(req,res){
  req.logout();
  res.redirect("/home");
});

app.get('/auth/google',passport.authenticate('google',{scope:["Profile","Email"]}));
app.get('/auth/google/secrets',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

app.get('/auth/facebook',passport.authenticate('facebook', { scope: ['user_friends'] }));

app.get('/auth/facebook/secrets',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

app.get("/submit",function(req,res){
  if(req.isAuthenticated()){
    res.render("submit.ejs");
  }
  else{
    res.redirect("/login");
  }
});
app.get("/logout",function(req,res){
  res.logout();
  res.redirect('/home');
});
//************************************************Post route for all the pages*****************************************************//

app.post("/register",function(req,res){
  User.register({username:req.body.username},req.body.password,function(err,user){
    if(err){
      console.log(err);
      res.redirect("/register");
    }
    else{
      passport.authenticate("local")(req,res,function(){
        res.redirect("/secrets");
      });
    }
  });
});

app.post("/login",function(req,res){
  const user=new User({
    username:req.body.username,
    password:req.body.password
  });
  req.login(user,function(err){
    if(err){
      console.log(err);
    }
    else{
      passport.authenticate("local")(req,res,function(){
        res.redirect("/secrets");
      });
    }
  })
});
app.post('/submit',function(req,res){
  const submittedSecret=req.body.secret;
   User.findById(req.user._id,function(err,foundUser){
     if(err){
       console.log(err);
     }
     else{
       if(foundUser){
         console.log("Authenticated User who is Submitting:",foundUser);
         foundUser.secret=submittedSecret;
         foundUser.save(function(){
           res.redirect('/secrets');
         });
        }
     }
   });
});


app.listen('3000',function(){
  console.log("Listening on port 3000");
});
