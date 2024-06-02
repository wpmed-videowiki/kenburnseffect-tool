import fs from "fs";
import { exec } from "child_process";
import { NextResponse } from "next/server";

const MULTIPLIER = 5;
const FPS = 25;

const generateRandomId = () => Math.random().toString(36).substring(7);

const getImageDimensions = async (imageFilePath) => {
  const cmd = `ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 ${imageFilePath}`;
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      }
      const [width, height] = stdout.split("x");
      resolve({ width: parseInt(width), height: parseInt(height) });
    });
  });
};

export const POST = async (req, res) => {
  const { fileUrl, endCrop, duration } = await req.json();
  const { x, y, width, height } = endCrop;
  const fileBuffer = await fetch(fileUrl).then((res) => res.arrayBuffer());

  const fileName = fileUrl.split("/").pop();
  const imageFilePath = `./${fileName}`;
  const outputFilePath = `./${generateRandomId()}.webm`;
  fs.writeFileSync(imageFilePath, Buffer.from(fileBuffer));

  const dimensions = await getImageDimensions(imageFilePath);
  const zoomLevel = Math.min(width, height);
  const totalFrames = (duration / 1000) * FPS;

  const xPosition = parseFloat(
    (dimensions.width * x + (width * dimensions.width) / 1.5) * MULTIPLIER
  ).toFixed(2);
  const yPosition = parseFloat(
    (dimensions.height * y + (height * dimensions.height) / 2) * MULTIPLIER
  ).toFixed(2);

  const startZoom = 1;
  const endZoom = 1 / zoomLevel;

  const zoompanFilter = `
    zoompan=
      z='if(lte(on,${totalFrames}),
          ${startZoom}+(((${endZoom}-${startZoom})/${totalFrames})*on),
          ${endZoom}
        )':
      d=${totalFrames}:
      x='${xPosition} - (${xPosition}/zoom)':
      y='${yPosition} - (${yPosition}/zoom)':
      fps=${FPS}:
      s=${dimensions.width}x${dimensions.height}
  `.replace(/\s+/g, "");

  const cmd = `ffmpeg -framerate ${FPS} -loop 1 -i ${imageFilePath} -f lavfi -i anullsrc=channel_layout=stereo:sample_rate=44100 -filter_complex "[0:v]scale=${
    dimensions.width * MULTIPLIER
  }x${
    dimensions.height * MULTIPLIER
  },${zoompanFilter},fps=${FPS},trim=duration=${parseFloat(
    parseInt(duration) / 1000
  ).toFixed(
    2
  )}[v]" -c:a libvorbis -map "[v]" -map "1:a" -shortest -y ${outputFilePath}`;

  await new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      }
      resolve();
    });
  });

  const file = fs.readFileSync(outputFilePath, "base64");

  // cleanup
  fs.unlinkSync(imageFilePath);
  fs.unlinkSync(outputFilePath);

  return NextResponse.json({ file });
};
