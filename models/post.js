const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const postSchema=new Schema({
    title:{
        type: String,
        required: true,
    },
    category:{
        type: String,
        enum:[
            "Relationship",
            "Family",
            "Advice",
            "Friendship",
            "Drama",
            "Hot Take",
        ],
        required:true,
    },
    story:{
        type:String,
        required:true,
    },
    tags: {
        type: [String],
        validate: [arrayLimit, '{PATH} exceeds the limit of 5'],
    },
    anonymous: {
        type: Boolean,
        default: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

function arrayLimit(val) {
  return val.length <= 5;
}

const Post = mongoose.model("Post", postSchema);
module.exports = Post;