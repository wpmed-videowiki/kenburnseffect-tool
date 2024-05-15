"use server";
import {getServerSession} from 'next-auth'
// import { getToken } from 'next-auth/jwt';

const PLAYER_IMAGE_WIDTH = 1280;

export const fetchCommonsImage = async (fileName) => {
  const infoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(
    fileName
  )}&prop=imageinfo&iiprop=url|mediatype|size&iiurlwidth=${PLAYER_IMAGE_WIDTH}&format=json&formatversion=2`;

  const response = await fetch(infoUrl);
  const data = await response.json();
  const pages = data.query.pages;
  const page = pages[0];
  const imageInfo = page.imageinfo[0];
  return imageInfo;
};

export const commonsAction = async (action, params) => {
    const session = await getServerSession();
    console.log('server session', {session});
// const token = await getToken({req, secret: process.env.SECRET});
}
