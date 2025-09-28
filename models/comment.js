
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
    }
  },
  { timestamps: true }
);



const Comment = mongoose.model("Comment", commentSchema);
module.exports = Comment;
