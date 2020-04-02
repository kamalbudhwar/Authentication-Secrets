//jshint esversion:6
require('dotenv').config();
const express=require("express");
const ejs=require("ejs");
const bodyParser=require("body-parser");
const mongoose=require("mongoose");
const encrypt=require("mongoose-encryption");
const app=express();
mongoose.connect("mongodb://localhost:27017/userDB",{useNewUrlParser:true, useUnifiedTopology: true});
app.use(express.static("public"));
app.use(bodyParser.urlencoded(
  {extended:true}
));
app.set('view-engine','ejs');

const userSchema=new mongoose.Schema({
  email:String,
  password:String
});

userSchema.plugin(encrypt,{secret:process.env.SECRET, encryptedFields:["password"]});

const User= new mongoose.model("User",userSchema);

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

//************************************************Post route for all the pages*****************************************************//

app.post("/register",function(req,res){
  const newUser=new User({
    email:req.body.username,
    password:req.body.password
  });
  newUser.save(function(err){
    if(!err){
      res.render("secrets.ejs");
    }
    else{
      console.log(err);
    }
  });
});

app.post("/login",function(req,res){
  User.findOne({email:req.body.username},function(err,foundUser){
    if(err){
      console.log(err);
    }
      if(foundUser){
        if(foundUser.password===req.body.password){
          res.render("secrets.ejs");
        }
      }
      else{
        res.redirect("/home");
      }
  });
});






app.listen('3000',function(){
  console.log("Listening on port 3000");
});
