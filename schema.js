const Joi = require("joi");

module.exports.postSchema = Joi.object({
  post: Joi.object({
    title: Joi.string().required(),
    category: Joi.string()
      .valid("Relationship", "Family", "Advice", "Friendship", "Drama", "Hot Take")
      .required(),
    story: Joi.string().required(),
    tags: Joi.alternatives().try(
      Joi.array().items(Joi.string()),
      Joi.string()
    ),
    anonymous: Joi.any(),
  }).required(),
});

module.exports.commentSchema = Joi.object({
  comment: Joi.object({
    comment: Joi.string().required(),
  }).required(),
});

/*
module.exports.replySchema = Joi.object({
  reply: Joi.object({
    reply: Joi.string().min(1).max(1000).required()
  }).required()
});
*/