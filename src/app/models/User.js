import mongoose from "mongoose";

const Schema = mongoose.Schema;

const UserSchema = new Schema(
  {
    username: {type: String, default: ''},

    wikimediaId: {type: String, default: ''},
    wikimediaToken: {type: String, default: ''},
    wikimediaRefreshToken: {type: String, default: ''},
    wikimediaProfile: {type: Object, default: {}},

    mdwikiId: {type: String, default: ''},
    mdwikiToken: {type: String, default: ''},
    mdwikiRefreshToken: {type: String, default: ''},
    mdwikiProfile: {type: Object, default: {}},

    nccommonsId: {type: String, default: ''},
    nccommonsToken: {type: String, default: ''},
    nccommonsRefreshToken: {type: String, default: ''},
    nccommonsProfile: {type: Object, default: {}},
  },
  { timestamps: true }
);

const UserModel = mongoose.models.User || mongoose.model("User", UserSchema);

export default UserModel;
