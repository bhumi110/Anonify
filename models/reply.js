const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const replySchema = new Schema(
    {
        reply: {
            type: String,
            required: true,
            
        },
        parentComment: {
            type: Schema.Types.ObjectId,
            ref: "Comment",
            required: true
        },
        
    },
    { timestamps: true }
);

const Reply = mongoose.model("Reply", replySchema);
module.exports=Reply;
