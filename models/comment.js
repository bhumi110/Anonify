
const mongoose = require('mongoose');
const Schema = mongoose.Schema;



const commentSchema = new Schema(
  {
    comment: {
      type: String,
      required: true,
      
    },
    review:{
      heart: { type: Number, default: 0 },
      brokenheart: { type: Number, default: 0 },
    },
    author:{
      type:Schema.Types.ObjectId,
      ref:"User",
    },
  },
  { timestamps: true }
);



const Comment = mongoose.model("Comment", commentSchema);
module.exports = Comment;
