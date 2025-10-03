const mongoose=require("mongoose");
const initData=require("./data.js");
const Post=require("../models/post.js");


const MONGO_URL="mongodb://127.0.0.1:27017/anonify";
main()
    .then(() => {
        console.log("connected");
    })
    .catch((err) => console.log(err));

async function main() {
    await mongoose.connect(MONGO_URL);
}

const initDB=async()=>{
    await Post.deleteMany({});
    initData.data=initData.data.map((obj)=>({...obj,owner:"68df84537ae8da93ead3174f"}));
    await Post.insertMany(initData.data);
    console.log("data initialised");
};

initDB();