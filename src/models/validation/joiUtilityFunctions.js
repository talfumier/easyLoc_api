import Joi from "joi";

export const JoiObjectIdSchema = Joi.string()
  .regex(/^[0-9a-fA-F]{24}$/)
  .required();
export function validateObjectId(id) {
  //ObjectId validation
  return JoiObjectIdSchema.validate(id);
}
export function joiSubSchema(base, fields) {
  return fields.reduce((schema, field) => {
    return schema.concat(
      Joi.object({
        [field]: base.extract(field),
      })
    );
  }, Joi.object());
}
