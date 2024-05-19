"use server";
import { cookies } from "next/headers";
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
