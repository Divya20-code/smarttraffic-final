


const mongoose = require("mongoose");

const citizenSchema = new mongoose.Schema(
{
userId: {
type: String,
unique: true,
required: true,
default: () => require("crypto").randomUUID(),
},


fullName: {
  type: String,
  required: true,
  trim: true,
},

username: {
  type: String,
  required: true,
  unique: true,
  trim: true,
  lowercase: true,
},

email: {
  type: String,
  required: true,
  unique: true,
  trim: true,
  lowercase: true,
},

password: {
  type: String,
  required: true,
},


},
{
timestamps: true,
}
);

module.exports =
mongoose.models.Citizen ||
mongoose.model("Citizen", citizenSchema);
