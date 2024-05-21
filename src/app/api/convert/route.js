import fs from "fs";
import { exec } from "child_process";

import { NextResponse } from "next/server";

const getImageDimensions = async (filePath) => {
  const cmd = `ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 ${filePath}`;
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      }
      const [width, height] = stdout.split("x");
      console.log({ width, height });
      resolve({ width: parseInt(width), height: parseInt(height) });
    });
  });
};

export const POST = async (req, res) => {
  const { fileUrl, endCrop, duration } = await req.json();
  const { x, y, width, height } = endCrop;
  console.log({
    fileUrl,
    x,
    y,
    width,
    height,
    duration,
  });
  const fileBuffer = await fetch(fileUrl).then((res) => res.arrayBuffer());

  const fileName = fileUrl.split("/").pop();
  const filePath = `./${fileName}`;
  fs.writeFileSync(filePath, Buffer.from(fileBuffer));

  const dimensions = await getImageDimensions(filePath);
  const MULTIPLIER = 1;
  const FPS = 30;
  const widthRatio = width;
  const heightRatio = height;
  const zoomLevel = Math.max(widthRatio, heightRatio);

  const zoomIncrement = duration / 1000 / FPS * zoomLevel * 0.1;
  const xPosition = parseFloat(
    (dimensions.width * x + (width * dimensions.width) / 2) * MULTIPLIER
  ).toFixed(2);
  const yPosition = parseFloat(
    (dimensions.height * y + (height * dimensions.height) / 2) * MULTIPLIER
  ).toFixed(2);
  const cmd = `ffmpeg -framerate ${FPS} -loop 1 -i ${filePath} -filter_complex "[0:v]scale=${
    dimensions.width * MULTIPLIER
  }x${
    dimensions.height * MULTIPLIER
  },zoompan=z='pzoom+${zoomIncrement}':x='${xPosition}-(${xPosition}/zoom)':y='${yPosition}-(${yPosition}/zoom)':d=1:s=${
    dimensions.width
  }x${dimensions.height}:fps=${FPS},trim=duration=${parseFloat(
    parseInt(duration) / 1000
  ).toFixed(2)}[v]" -map "[v]" -y out.mp4`;

  console.log(cmd);
  await new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      }
      resolve();
    });
  });
  console.log("Done");
  return NextResponse.json({ success: true });
};
