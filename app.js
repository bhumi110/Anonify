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
const { postSchema } = require("./schema.js");
const Comment = require("./models/comment.js");

app.use(methodOverride('_method'));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.engine("ejs", ejsMate);
dayjs.extend(relativeTime);

const MONGO_URL = "mongodb://127.0.0.1:27017/anonify";

main()
    .then(() => {
        console.log("connected");
    })
    .catch((err) => console.log(err));

async function main() {
    await mongoose.connect(MONGO_URL);
}

const validatePost = (req, res, next) => {
    let { error } = postSchema.validate(req.body);
    if (error) {
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400, errMsg);
    } else {
        next();
    }
}

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
    let { id } = req.params;
    const post = await Post.findById(id).lean();

    // attach "time ago"
    post.timeAgo = dayjs(post.createdAt).fromNow();

    res.render("pages/post.ejs", { post });
}));


//------------NEW FORM INPUT---------------------------------
app.get("/create", wrapAsync(async (req, res) => {
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
    await newPost.save();
    res.redirect("/feed");
    console.log(newPost);
}));

//-------------EDIT-------------------------------------
app.get("/post/:id/edit", wrapAsync(async (req, res) => {
    let { id } = req.params;
    const post = await Post.findById(id);
    res.render("pages/edit.ejs", { post });
}));

//-----------UPDATE-------------------------------------
app.put("/post/:id", validatePost, wrapAsync(async (req, res) => {
    let { id } = req.params;
    await Post.findByIdAndUpdate(id, { ...req.body.post });
    res.redirect(`/post/${id}`);
}))

//--------------DELETE------------------------------------
app.delete("/post/:id", wrapAsync(async (req, res) => {
    let { id } = req.params;
    let deletedPost = await Post.findByIdAndDelete(id);
    console.log(deletedPost);
    res.redirect("/feed");
}))


//--------------COMMENT(POST)--------------------------------
app.post("/post/:id/comments",async(req,res)=>{
    let post=await Post.findById(req.params.id);
    let newComment=new Comment(req.body.comment);
    post.comments.push(newComment)
    await newComment.save();
    await post.save();
    console.log("new comment");
    res.redirect(`/post/${post._id}`);
});

//--------------PROFILE------------------------------
app.get("/profile", wrapAsync(async (req, res) => {
    res.send("profilepage");
}));

//--------------REACTIONS-------------------------------------------
app.post("/post/:id/react/:reaction", wrapAsync(async (req, res) => {
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