const Post=require("./models/post.js");
const ExpressError = require("./utils/ExpressError.js");
const { postSchema, commentSchema, replySchema } = require("./schema.js");

module.exports.isLoggedIn=(req,res,next)=>{
    console.log(req.user,"....",req.path,"....",req.originalUrl);
    if(!req.isAuthenticated()) {
        req.session.redirectUrl=req.originalUrl;
    req.flash("error","You must be logged in...");
    return res.redirect("/login");
}
next();
}

module.exports.savedRedirectUrl=(req,res,next)=>{
    if(req.session.redirectUrl){
        res.locals.redirectUrl=req.session.redirectUrl;
    }
    next();
};

module.exports.isOwner=async(req,res,next)=>{
    let { id } = req.params;
    let post=await Post.findById(id);
    if(!post.owner.equals(res.locals.currUser._id)){
        req.flash("error","Access Denied!!")
        return res.redirect(`/post/${id}`);
    }
    next();
}

module.exports.validatePost = (req, res, next) => {
    let { error } = postSchema.validate(req.body);
    if (error) {
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400, errMsg);
    } else {
        next();
    }
};

module.exports.validateComment = (req, res, next) => {
    let { error } = commentSchema.validate(req.body);
    if (error) {
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400, errMsg);
    } else {
        next();
    }
};

module.exports.isCommentAuthor=async(req,res,next)=>{
    let { id,commentId } = req.params;
    let comment=await Comment.findById(commentId);
    if(!comment.author.equals(res.locals.currUser._id)){
        req.flash("error","Access Denied!!")
        return res.redirect(`/post/${id}`);
    }
    next();
}