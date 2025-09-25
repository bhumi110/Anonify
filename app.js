const express=require("express");
const app=express();
const path=require("path");
const methodOverride=require("method-override");
const mongoose=require("mongoose");
const ejsMate=require("ejs-mate");

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

app.get("/",(req,res)=>{
    res.send("Hello World");
});

app.get("/home",async(req,res)=>{
    res.render("pages/home.ejs");
});

app.get("/feed",async(req,res)=>{
    res.send("feed");
});

app.get("/create",async(req,res)=>{
    res.send("story form");
});

app.get("/profile",async(req,res)=>{
    res.send("profilepage");
});

app.listen(8080,()=>{
    console.log("listening to port 8080");
});