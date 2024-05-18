"use server";
import { cookies } from "next/headers";
const PLAYER_IMAGE_WIDTH = 720;

export const fetchCommonsImage = async (
  fileName,
  wikiSource = "https://commons.wikimedia.org"
) => {
  const infoUrl = `${wikiSource}/w/api.php?action=query&titles=${encodeURIComponent(
    fileName
  )}&prop=imageinfo&iiprop=url|mediatype|size&iiurlwidth=${PLAYER_IMAGE_WIDTH}&format=json&formatversion=2`;

  const response = await fetch(infoUrl);
  const data = await response.json();
  const pages = data.query.pages;
  const page = pages[0];
  return page;
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
