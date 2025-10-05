const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Comment=require("./comment.js");

function arrayLimit(val) {
    return val.length <= 5;
}

const postSchema = new Schema(
  {
    title: { 
        type: String, 
        required: true 
    },
    category: {
      type: String,
      enum: ["Relationship", "Family", "Advice", "Friendship", "Drama", "Hot Take"],
      required: true,
    },
    story: { 
        type: String, 
        required: true 
    },
    tags: {
      type: [String],
      default: [],
      validate: [val => val.length <= 5, "{PATH} exceeds the limit of 5"],
    },
    anonymous: { 
        type: Boolean, 
        default: false 
    },
    reactions: {
      fire: { type: Number, default: 0 },
      drama: { type: Number, default: 0 },
      skull: { type: Number, default: 0 },
      shock: { type: Number, default: 0 },
    },
    owner:{
      type:Schema.Types.ObjectId,
      ref:"User",
    },
    comments: [
        { 
            type: Schema.Types.ObjectId, 
            ref: "Comment" 
        }
    ],
    

  },
  { timestamps: true }
);

postSchema.post("findOneAndDelete",async(post)=>{
    if(post){
        await Comment.deleteMany({_id:{$in: post.comments}});
    }
});

const Post = mongoose.model("Post", postSchema);
module.exports = Post;