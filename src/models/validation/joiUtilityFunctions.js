import Joi from "joi";

export const JoiObjectIdSchema = Joi.string()
  .regex(/^[0-9a-fA-F]{24}$/)
  .required();
export function validateObjectId(id) {
  //ObjectId validation
  return JoiObjectIdSchema.validate(id);
}
export const JoiIntegerIdSchema = Joi.number().integer().required();
export function validateIntegerId(id) {
  return JoiIntegerIdSchema.validate(id);
}
export function joiSubSchema(base, fields) {
  const baseFields = Object.keys(base.describe().keys);
  if (fields.every((field) => baseFields.includes(field))) {
    //check that incoming fields are all contained in base schema fields
    const sub = fields.reduce((schema, field) => {
      if (baseFields.indexOf(field) !== -1)
        return schema.concat(
          Joi.object({
            [field]: base.extract(field),
          })
        );
    }, Joi.object());
    return sub;
  }
  return null;
}
