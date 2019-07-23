//Add all liberaries
var express = require("express");
var app = express();
var mongoose = require('mongoose');
var bodyParser = require("body-parser");
var methodOverride = require("method-override")
var Camp = require("./models/campgrounds.js");
var Comment = require("./models/comments.js");
var seedDB = require("./seeds.js");
app.locals.moment = require('moment');
var passport = require('passport');
var localStat = require('passport-local');
var passportLocalMongoose = require('passport-local-mongoose');
var User = require("./models/users.js");
var flash =require("connect-flash");

//solving mongoose errors
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
//Accessing The Data Base
mongoose.connect("mongodb://localhost/yelp_camp");
//Port
const port = 3000;
//Using Methods
app.use(methodOverride("_method"));
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({extended: true}));
app.use(require("express-session")({
    secret: "Welcome Mr Fahrenhiet" , 
    resave: false , 
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

passport.use(new localStat(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
//Use it to prevent writing "user:req.user" everywhere
app.use(function(req,res,next){
    res.locals.message = req.flash("error");
    res.locals.message2 = req.flash("success");
    next();
});
// seedDB(); was just to test that do cooments work or not


//********************************************************************************************************
// Routes                                                                                                *
//********************************************************************************************************


//=====================
//Campground  (Main Routes)
//=====================

//form route
app.get("/campg/new",islogged ,function(req,res){
    res.render("form.ejs",{user:req.user});
});
//index route
app.get("/" , function(req,res){
	res.render("home.ejs");
});
app.get("/campg", function(req,res){
	Camp.find({},function(err,data){
        if(err){
            console.log(err);
        }
        else{
            
            res.render("camp.ejs",{data:data, user:req.user});
        }
    });
	
});

app.post("/campg",function(req,res){
    var n = req.body.campsite;
    var i = req.body.imgurl;
    var d = req.body.des;
    var p = req.body.price;
    var author = {
        id: req.user.id,
        username: req.user.username
    }
    var o = {name: n , price: p , image: i , description: d , author:author};
    Camp.create(o,function(err,newcamp){
        if(err)
        {
            console.log(err);
        }
        else
        {   req.flash("success","Camp Added");
            res.redirect("/campg");
        }
    })
	
});
//Show Route
app.get("/campg/yid/:id",function(req,res){
    Camp.findById(req.params.id).populate("comments").exec(function(err,fcamp){
        if(err){
            console.log(err);
        }
        else{
            res.render("show.ejs",{camp:fcamp, user:req.user});
        }
    })
    
});
//Update Route
app.get("/campg/yid/:id/edit",isOwned, function(req,res){
    Camp.findById(req.params.id,function(err,camp){
        if(err){
            console.log(err);
        }
        else{
            res.render("edit.ejs",{camp:camp, user:req.user})
        }
    })
});
app.put("/campg/yid/:id",isOwned, function(req,res){
    var n = req.body.campsite;
    var i = req.body.imgurl;
    var d = req.body.des;
    var p = req.body.price
    var o = {name: n , price: p , image: i , description: d };
    Camp.findByIdAndUpdate(req.params.id,o,function(err,ucamp){
        if(err){
            console.log(err);
            res.redirect("/campg");
        }
        else
        {   req.flash("success","Camp Updated");
            res.redirect("/campg/yid/"+ req.params.id)
        }
    })

});
//delete route
app.delete("/campg/yid/:id",isOwned,function(req,res){
    Camp.findByIdAndRemove(req.params.id,function(err){
        if(err)
        {
            console.log(err);
        }
        else
        {   req.flash("success","Camp Deleted");
            res.redirect("/campg")
        }
    })
});
//===========================
//Comment Route
//===========================
app.get("/campg/yid/:id/comments/new",islogged ,function(req,res){
    Camp.findById(req.params.id,function(err,camp){
        if(err){
            console.log(err);
        }
        else
        {
            res.render("comment.ejs",{camp:camp, user:req.user});
        }
    });
    
});
app.post("/campg/yid/:id/comments",function(req,res){
//find camp id
    Camp.findById(req.params.id, function(err,camp){
        if(err)
        {
            console.log(err);
        }
        else
        {
            Comment.create(req.body.comment,function(err,comment){
                if(err){
                    console.log(err);
                }
                else{
                    camp.comments.push(comment);
                    camp.save();
                    req.flash("success","Comment added")

                    res.redirect('/campg/yid/'+ camp.id);
                }
            })
        }
    })
});

//Comment Update
app.get("/campg/yid/:id/comments/:idd/edit",isCommented,function(req,res){
	Camp.findById(req.params.id,function(err,fcamp){
		if(err){
			console.log(err);
		}
		else{
			Comment.findById(req.params.idd,function(err,fcomment){
				if(err){
					console.log(err);
				}
				else{
					res.render("comment_edit.ejs",{camp:fcamp,comment:fcomment, user:req.user});
				}
			});
		}
	});
	
	
});
app.put("/campg/yid/:id/comments/:idd",isCommented,function(req,res){
	var c = req.body.comment;
	var o = {text:c};
	Comment.findByIdAndUpdate(req.params.idd,o,function(err,fcomment){
		if(err){
			console.log(err);
		}
		else{
            req.flash("success","Comment Updated")
			res.redirect("/campg/yid/"+req.params.id);
		}
	})
});
//Comment Delete
app.delete("/campg/yid/:id/comments/:idd",isCommented,function(req,res){
	Comment.findByIdAndRemove(req.params.idd,function(err){
		if(err){
			console.log(err);
		}
		else{
            req.flash("success","Comment Deleted");
			res.redirect("/campg/yid/"+req.params.id);
		}
	})
})
//----------------------
//   Aut Routes
//----------------------

//Signup
app.get("/register",function(req,res){
    res.render("user.ejs",{user:req.user})
});
app.post("/register",function(req,res){
    var u = req.body.username;
    var p = req.body.password;
    var f = req.body.fname;
    var l = req.body.lname;
    var e = req.body.email;
    var nu = new User({username:u,firstName:f,lastName:l,email:e});
    User.register(nu,p,function(err,user){
        if(err){
            req.flash("error",err);
            return res.render("user.ejs");
        }
        passport.authenticate("local")(req,res,function(){
            req.flash("success","Account Made Successfully");
            res.redirect("/campg");
        });
    })
});
//login
app.get("/login",function(req,res){
    res.render("login.ejs",{user:req.user});
});
app.post("/login", passport.authenticate("local",{

    successRedirect: "/campg",
    failureRedirect: "/login"
}) ,function(req,res){
});
//Profile
app.get("/profile",function(req,res){
	res.render("profile.ejs",{user:req.user})
});
//logout
app.get("/logout",function(req,res){
    req.logout();
    req.flash("success","Logged you out");
    res.redirect("/campg");
});

//Middleware
function islogged(req,res,next){
    if(req.isAuthenticated()){
        return next();
    }
    req.flash("error","Please login first");
    res.redirect("/login");
}
//Aurthorization Middleware 
function isOwned(req,res,next){
	//islogged
	if(req.isAuthenticated())
	{
      Camp.findById(req.params.id,function(err,camp){
      	if(err)
      	{   console.log(err);
      		res.redirect("back");
      	}
      	else
      	{   //does user own the campground 
      		if(camp.author.id.equals(req.user.id)|| req.user.isadmin)
      		{   //if yes redirect
      			next();
      		}
      		else
      		{   //if not the redirect somewhere else

      			res.redirect("back");
      		}
      	}
      })
	}
	else
	{   req.flash("error","Please login first");
		res.redirect("/login");
	}
	   
	     
	   
}
function isCommented(req,res,next){
	//islogged
	if(req.isAuthenticated())
	{
		Comment.findById(req.params.idd,function(err,comment){
			if(err){
				console.log(err);
				res.redirect("back");
			}
			else
			{
				//does the user own the comment
				if(comment.author == req.user.username||req.user.isadmin)
				{
					next()
				}
				else{
					res.redirect("back");
				}
			}
		})
	}
	else{
        req.flash("error","Please login first");
		res.redirect("/login");
	}
}
//==================================================
// * route
//=================================================
app.get("*",function(req,res){
    req.flash("error","No route with that name exits")
    res.redirect("/");
});
//Server Start
app.listen(port,function(){
	console.log("Yelpcamp running on " + port + " server");
});