const express=require("express");
const app=express();
const path=require("path");
const methodOverride=require("method-override");
const mongoose=require("mongoose");
const ejsMate=require("ejs-mate");
const Post = require("./models/post");

app.use(methodOverride('_method'));
app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));
app.use(express.static(path.join(__dirname,"public")));
app.use(express.urlencoded({extended:true}));
app.engine("ejs",ejsMate);

const MONGO_URL="mongodb://127.0.0.1:27017/anonify";

main()
    .then(() => {
        console.log("connected");
    })
    .catch((err) => console.log(err));

async function main() {
    await mongoose.connect(MONGO_URL);
}


//--------------HOMEPAGE-------------------------
app.get("/",async(req,res)=>{
    res.render("pages/home.ejs");
});


//-------------FEED--------------------------------
app.get("/feed",async(req,res)=>{
    const allPosts=await Post.find({});
    res.render("pages/feed.ejs",{allPosts});
});


//-------------SHOW---------------------------
app.get("/post/:id",async(req,res)=>{
    let {id}=req.params;
    const post=await Post.findById(id);
    res.render("pages/post.ejs",{post});
});


//------------NEW FORM INPUT---------------------------------
app.get("/create",async(req,res)=>{
    res.render("pages/create.ejs");
});

//-----------CREATE------------------------------------
app.post("/feed",async(req,res)=>{
    //let {title,category,story,tags,anonymous,createdAt}=req.body;
    //let post=req.body.post;
    req.body.post.anonymous = req.body.post.anonymous === "on";
    const newPost= new Post(req.body.post);
    await newPost.save();
    res.redirect("/feed");
    console.log(newPost);
});

//-------------EDIT-------------------------------------
app.get("/post/:id/edit",async(req,res)=>{
    let {id}=req.params;
    const post=await Post.findById(id);
    res.render("pages/edit.ejs",{post});
});

//-----------UPDATE-------------------------------------
app.put("/post/:id",async(req,res)=>{
    let {id}=req.params;
    await Post.findByIdAndUpdate(id,{...req.body.post});
    res.redirect(`/post/${id}`);
})

//--------------DELETE------------------------------------
app.delete("/post/:id",async(req,res)=>{
    let {id}=req.params;
    let deletedPost=await Post.findByIdAndDelete(id);
    console.log(deletedPost);
    res.redirect("/feed");
})

//--------------PROFILE------------------------------
app.get("/profile",async(req,res)=>{
    res.send("profilepage");
});


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

app.listen(8080,()=>{
    console.log("listening to port 8080");
});