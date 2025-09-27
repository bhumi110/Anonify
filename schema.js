const Joi = require("joi");

module.exports.postSchema = Joi.object({
    post: Joi.object({
    title: Joi.string().required(),
    category: Joi.string()
      .valid("Relationship", "Family", "Advice", "Friendship", "drama", "Hot Take")
      .required(),
    story: Joi.string().required(),
    tags: Joi.alternatives().try(
      Joi.array().items(Joi.string()),
      Joi.string()
    ),
    anonymous: Joi.any()
  }).required()
});