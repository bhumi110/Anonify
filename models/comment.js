const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const commentSchema = new Schema({
    comment: {
      type: String,
      required: true
    },
    
    createdAt: {
        type: Date,
        default: Date.now()
    },
    
},{ timestamps: true });

/*
commentSchema.virtual("timeAgo").get(function () {
  const dayjs = require("dayjs");
  const relativeTime = require("dayjs/plugin/relativeTime");
  dayjs.extend(relativeTime);
  return dayjs(this.createdAt).fromNow();
});

commentSchema.set("toJSON", { virtuals: true });
commentSchema.set("toObject", { virtuals: true });

*/

module.exports = mongoose.model("Comment", commentSchema);