
const mongoose = require('mongoose');
const Schema = mongoose.Schema;



const commentSchema = new Schema(
  {
    comment: {
      type: String,
      required: true,

    },
    review: {
      hearts: [{ type: Schema.Types.ObjectId, ref: "User" }],
      brokenhearts: [{ type: Schema.Types.ObjectId, ref: "User" }],
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    /*
    replies: [
      { type: Schema.Types.ObjectId, ref: "Reply" },
    ],
    */
  },
  
  { timestamps: true }
);



const Comment = mongoose.model("Comment", commentSchema);
module.exports = Comment;
