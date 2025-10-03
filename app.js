if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}

const express = require("express");
const app = express();
const path = require("path");
const methodOverride = require("method-override");
const mongoose = require("mongoose");
const ejsMate = require("ejs-mate");
const Post = require("./models/post");
const dayjs = require("dayjs");
const relativeTime = require("dayjs/plugin/relativeTime");
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");
const Comment = require("./models/comment.js");
//const Reply = require("./models/reply.js");
const passport = require("passport");
const localStrategy = require("passport-local");
const User = require("./models/user.js");
const { isLoggedIn, savedRedirectUrl, isOwner, validateComment, validatePost } = require("./middleware.js");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

const session = require("express-session");
const flash = require("connect-flash");



app.use(methodOverride('_method'));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.engine("ejs", ejsMate);
dayjs.extend(relativeTime);

const sessionOptions = {
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 1000,
        httpOnly: true,
    }
};

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

console.log("GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID);

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const email = profile.emails[0].value;

        // Only find existing user
        const user = await User.findOne({ email });

        if (!user) {
            // User not found → don’t create new user
            return done(null, false, { message: "No account found for this Google email." });
        }

        return done(null, user);
    } catch (err) {
        return done(err, null);
    }
}));




app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
});

const MONGO_URL = "mongodb://127.0.0.1:27017/anonify";

main()
    .then(() => {
        console.log("connected");
    })
    .catch((err) => console.log(err));

async function main() {
    await mongoose.connect(MONGO_URL);
}


/*
const validateReply = (req, res, next) => {
    let { error } = commentSchema.validate(req.body);
    if (error) {
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400, errMsg);
    } else {
        next();
    }
};
*/

/*
app.get("/demouser",async(req,res)=>{
    let fakeuser=new User({
        email:"someone@gmail.com",
        username:"someone"
    });
    let registereduser=await User.register(fakeuser,"password");
    res.send(registereduser);
});
*/


//--------------HOMEPAGE-------------------------
app.get("/", wrapAsync(async (req, res) => {
    res.render("pages/home.ejs");
}));


//-------------FEED--------------------------------
app.get("/feed", wrapAsync(async (req, res) => {
    const allPosts = await Post.find({});
    res.render("pages/feed.ejs", { allPosts });
}));


//-------------SHOW---------------------------
app.get("/post/:id", wrapAsync(async (req, res) => {
    const { id } = req.params;

    const post = await Post.findById(id)
        .populate({
            path: "comments",
            populate: {
                path: "author"
            }
        })
        .populate("owner")
        .lean();

    post.timeAgo = dayjs(post.createdAt).fromNow();

    if (post.comments) {
        post.comments.forEach(c => {
            c.timeAgo = dayjs(c.createdAt).fromNow();
        });
    }
    if (!post) {
        res.flash("error", "Post you requested for does not exist...");
        res.redirect("/feed");
    }
    res.render("pages/post.ejs", { post });
}));



//------------NEW FORM INPUT---------------------------------
app.get("/create", isLoggedIn, savedRedirectUrl, wrapAsync(async (req, res) => {
    res.render("pages/create.ejs");
}));

//-----------CREATE------------------------------------
app.post("/feed", validatePost, wrapAsync(async (req, res, next) => {
    //let {title,category,story,tags,anonymous,createdAt}=req.body;
    //let post=req.body.post;

    req.body.post.anonymous = req.body.post.anonymous === "on";

    if (req.body.post.tags && typeof req.body.post.tags === "string") {
        req.body.post.tags = req.body.post.tags
            .split(",")
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0);
    }

    const newPost = new Post(req.body.post);
    newPost.owner = req.user._id;
    await newPost.save();
    req.flash("success", "Post created successfully!")
    res.redirect("/feed");
    console.log(newPost);
}));

//-------------EDIT-------------------------------------
app.get("/post/:id/edit", isLoggedIn, isOwner, wrapAsync(async (req, res) => {
    let { id } = req.params;
    const post = await Post.findById(id);
    if (!post) {
        res.flash("error", "Post you requested for does not exist...");
        res.redirect("/feed");
    }
    res.render("pages/edit.ejs", { post });
}));

//-----------UPDATE-------------------------------------
app.put("/post/:id", isLoggedIn, isOwner, validatePost, wrapAsync(async (req, res) => {
    let { id } = req.params;
    await Post.findByIdAndUpdate(id, { ...req.body.post });
    req.flash("success", "Post updated successfully!")
    res.redirect(`/post/${id}`);
}))

//--------------DELETE------------------------------------
app.delete("/post/:id", isLoggedIn, isOwner, wrapAsync(async (req, res) => {
    let { id } = req.params;
    let deletedPost = await Post.findByIdAndDelete(id);
    console.log(deletedPost);
    req.flash("success", "Post deleted successfully!")
    res.redirect("/feed");
}))


//--------------COMMENT(POST)--------------------------------
app.post("/post/:id/comments", isLoggedIn, validateComment, wrapAsync(async (req, res) => {
    const post = await Post.findById(req.params.id);

    const newComment = new Comment(req.body.comment);
    newComment.author = req.user._id;
    post.comments.push(newComment);

    await newComment.save();
    await post.save();
    req.flash("success", "Comment created successfully!")
    res.redirect(`/post/${post._id}`);
}));

//-----------DELETE COMMENT---------------------------------------------
app.delete("/post/:id/comments/:commentId", isLoggedIn, wrapAsync(async (req, res) => {
    let { id, commentId } = req.params;
    await Post.findByIdAndUpdate(id, { $pull: { comments: commentId } });
    await Comment.findByIdAndDelete(commentId);
    req.flash("success", "Comment deleted successfully!")
    res.redirect(`/post/${id}`);
}));



/*
//------------REPLY TO COMMENT------------------------------------------------------------
app.post(
  "/post/:id/comments/:commentId/reply",
  validateReply,
  wrapAsync(async (req, res) => {
    const { id, commentId } = req.params;

    const parentComment = await Comment.findById(commentId);
    if (!parentComment) {
      return res.status(404).send("Comment not found");
    }

    const reply = new Reply({
      reply: req.body.reply,
      author: req.user._id,
      comment: parentComment._id,
    });

    await reply.save();
    parentComment.replies.push(reply._id);
    await parentComment.save();

    res.redirect(`/post/${id}`);
  })
);
*/



//--------------PROFILE------------------------------
app.get("/profile", wrapAsync(async (req, res) => {
    res.send("profilepage");
}));

//--------------REACTIONS-------------------------------------------
app.post("/post/:id/react/:reaction", isLoggedIn, wrapAsync(async (req, res) => {
    const { id, reaction } = req.params;
    const validReactions = ["fire", "drama", "skull", "shock"];
    if (!validReactions.includes(reaction)) {
        return res.status(400).send("Invalid reaction type");
    }

    await Post.findByIdAndUpdate(id, {
        $inc: { [`reactions.${reaction}`]: 1 }
    });
    res.json({ success: true });
}));


//----------------COMMENT REVIEW------------------------------------------------------------------
app.post("/post/:id/comment/:commentId/review/:type", isLoggedIn, async (req, res) => {
    const { commentId, type } = req.params;
    if (!["heart", "brokenheart"].includes(type)) {
        return res.status(400).json({ success: false, message: "Invalid review type" });
    }

    try {
        const updatedComment = await Comment.findByIdAndUpdate(
            commentId,
            { $inc: { [`review.${type}`]: 1 } },
            { new: true }
        );

        if (!updatedComment) {
            return res.status(404).json({ success: false, message: "Comment not found" });
        }
        res.json({ success: true, review: updatedComment.review });
    } catch (err) {
        console.error("Error updating review:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});


//-----------------USER ROUTE--------------------------------------------------------------------------------
app.get("/signup", (req, res) => {
    res.render("users/signup.ejs");
});

app.post("/signup", wrapAsync(async (req, res) => {
    try {
        let { username, email, password } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            req.flash("error", "Email is already registered. Try logging in.");
            return res.redirect("/signup");
        }

        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
            req.flash("error", "Username already taken! Try a different one.");

            return res.redirect("/signup");
        }

        const newUser = new User({ email, username });
        const registeredUser = await User.register(newUser, password);
        console.log(registeredUser);
        req.login(registeredUser, (err) => {
            if (err) {
                return next(err);
            }
            req.flash("success", "Account Created!!")
            res.redirect("/feed");

        })

    } catch (e) {
        req.flash("error", e.message);
        res.redirect("/signup");
    }
}));


app.get("/login", (req, res) => {
    res.render("users/login.ejs");
});


app.post("/login", savedRedirectUrl, passport.authenticate("local", { failureRedirect: "/login", failureFlash: true }), async (req, res) => {
    req.flash("success", "Welcome back!!");
    let redirectUrl = res.locals.redirectUrl || "/feed";
    res.redirect(redirectUrl);

});


app.get("/logout", (req, res) => {
    req.logout((err) => {
        if (err) {
            next(err);
        }
        req.flash("success", "you are logged out!")
        res.redirect("/");

    })
})

//-----------------EMAIL CHECK----------------------------------------
app.get("/check-email", async (req, res) => {
    const { email } = req.query;
    const user = await User.findOne({ email });
    res.json({ exists: !!user });
});


//-----------------Google routes-----------------------------------------
app.get("/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get("/auth/google/callback",
    passport.authenticate("google", {
        failureRedirect: "/login",
        failureFlash: true
    }),
    (req, res) => {
        req.flash("success", "Logged in with Google!");
        res.redirect("/feed");
        console.log(req.user);
    }
);


/*
app.get("/testpost",async(req,res)=>{
    let samplePost=new Post({
        title:"My roommate keeps eating my food and won't admit it",
        category: "drama",
        story: "I've been living with this girl for about 6 months now and it started off great. We got along well and everything seemed normal. But about 3 months ago I started noticing my food disappearing from the fridge.",

    });
    await samplePost.save();
    console.log("sample saved");
    res.send("successs");
});
*/



app.use((req, res, next) => {
    next(new ExpressError(404, 'Page Not Found!'));
});

app.use((err, req, res, next) => {
    let { statusCode = 500, message = 'Something went wrong' } = err;
    //res.status(statusCode).send(message);
    res.render("error.ejs", { message });
});

app.listen(8080, () => {
    console.log("listening to port 8080");
});