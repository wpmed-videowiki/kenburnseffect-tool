import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import fs from "fs";
import { uploadFileToCommons } from "../utils/uploadUtils";

const COMMONS_BASE_URL = "https://commons.wikimedia.org/w/api.php";
const NCCOMMONS_BASE_URL = "https://nccommons.org/w/api.php";

const generateRandomId = () => Math.random().toString(36).substring(7);

export const POST = async (req, res) => {
  const token = await getToken({ req });

  const fileId = generateRandomId();

  const { filename, text, file, wikiSource } = await req.json();
  const fileBuffer = Buffer.from(file.split(",")[1], "base64");
  fs.writeFileSync(`./${fileId}.webm`, fileBuffer);
  const fileStream = fs.createReadStream(`./${fileId}.webm`);

  const baseUrl = wikiSource.includes("mdwiki.org")
    ? NCCOMMONS_BASE_URL
    : COMMONS_BASE_URL;

  const response = await uploadFileToCommons(baseUrl, token.access_token, {
    filename,
    text,
    file: fileStream,
  });
  await fs.unlinkSync(`./${fileId}.webm`);
  return NextResponse.json(response);
};
