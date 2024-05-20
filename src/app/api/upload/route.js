import { NextResponse } from "next/server";
import fs from "fs";
import { uploadFileToCommons } from "../utils/uploadUtils";
import UserModel from "../../models/User";

const COMMONS_BASE_URL = "https://commons.wikimedia.org/w/api.php";
const NCCOMMONS_BASE_URL = "https://nccommons.org/w/api.php";

const generateRandomId = () => Math.random().toString(36).substring(7);

export const POST = async (req, res) => {
  const appUserId = req.cookies.get("app-user-id")?.value;

  const user = await UserModel.findById(appUserId);

  const { filename, text, file, provider } = await req.json();
  const fileId = generateRandomId();

  const fileBuffer = Buffer.from(file.split(",")[1], "base64");
  fs.writeFileSync(`./${fileId}.webm`, fileBuffer);
  const fileStream = fs.createReadStream(`./${fileId}.webm`);

  const baseUrl =
    provider === "nccommons" ? NCCOMMONS_BASE_URL : COMMONS_BASE_URL;
  const token =
    provider === "nccommons" ? user.nccommonsToken : user.wikimediaToken;

  const response = await uploadFileToCommons(baseUrl, token, {
    filename,
    text,
    file: fileStream,
  });
  await fs.unlinkSync(`./${fileId}.webm`);
  return NextResponse.json(response);
};
