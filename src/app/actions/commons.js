"use server";
import { cookies } from "next/headers";
import UserModel from "../models/User";
import connectDB from "../api/lib/connectDB";
import { updateArticleText } from "../api/utils/uploadUtils";
const PLAYER_IMAGE_WIDTH = 720;

export const fetchCommonsImage = async (fileName, wikiSource) => {
  const baseUrl = wikiSource.includes("mdwiki.org")
    ? "https://nccommons.org"
    : "https://commons.wikimedia.org";
  const infoUrl = `${baseUrl}/w/api.php?action=query&titles=${encodeURIComponent(
    fileName
  )}&prop=imageinfo&iiprop=url|mediatype|size&iiurlwidth=${PLAYER_IMAGE_WIDTH}&format=json&formatversion=2`;

  const response = await fetch(infoUrl);
  const data = await response.json();
  const pages = data.query.pages;
  const page = pages[0];
  return page;
};

export const fetchPageSource = async (wikiSource) => {
  const baseUrl = wikiSource.split("/wiki/")[0];
  const title = wikiSource.split("/wiki/")[1];

  const sourceUrl = `${baseUrl}/w/api.php?action=query&titles=${encodeURIComponent(
    title
  )}&prop=revisions&rvprop=content&format=json&formatversion=2`;

  const response = await fetch(sourceUrl);

  const data = await response.json();
  const pages = data.query.pages;
  const page = pages[0];
  return page;
};

export const updatePageSource = async (wikiSource, text) => {
  await connectDB();

  const appUserId = cookies().get("app-user-id")?.value;
  const user = await UserModel.findById(appUserId);

  const baseUrl = `${wikiSource.split("/wiki/")[0]}/w/api.php`;
  const title = wikiSource.split("/wiki/")[1];
  const token = baseUrl.includes("mdwiki.org")
    ? user.mdwikiToken
    : user.wikimediaToken;

  const result = await updateArticleText(baseUrl, token, { title, text });
  return result;
};

export const uploadFile = async (data) => {
  const req = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/upload`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: (await cookies()).toString(),
    },
    body: JSON.stringify(data),
  });
  const response = await req.json();
  return response;
};
