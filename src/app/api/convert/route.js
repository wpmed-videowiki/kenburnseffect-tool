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

const createKenBurnsEffect = (
  inputImage,
  outputVideo,
  startX,
  startY,
  startWidth,
  startHeight,
  endX,
  endY,
  endWidth,
  endHeight,
  duration,
  dimensions
) => {
  startWidth = Math.min(startWidth, 1);
  startHeight = Math.min(startHeight, 1)
  // const MULTIPLIER = 8000 / dimensions.width;
  const MULTIPLIER = 1;
  // Get image dimensions
  const imageWidth = dimensions.width * MULTIPLIER;
  const imageHeight = dimensions.height * MULTIPLIER;

  // Calculate pixel values from percentages
  const startXPixels = startX * imageWidth;
  const startYPixels = startY * imageHeight;
  const startWidthPixels = startWidth * imageWidth;
  const startHeightPixels = startHeight * imageHeight;

  const endXPixels = endX * imageWidth;
  const endYPixels = endY * imageHeight;
  const endWidthPixels = endWidth * imageWidth;
  const endHeightPixels = endHeight * imageHeight;

  const fps = 25; // Frames per second
  const totalFrames = duration * fps;

  // Zoom levels
  const startZoom = imageWidth / startWidthPixels;
  const endZoom = imageWidth / endWidthPixels;

  console.log({
    startX,
    startY,
    startWidth,
    startHeight,
  })
  // Construct the zoompan filter
  const zoompanFilter = `
    zoompan=
      z='if(lte(on,${totalFrames}),
          ${startZoom}+(((${endZoom}-${startZoom})/${totalFrames})*on),
          ${endZoom}
        )':
      d=${totalFrames}:
      x='${startXPixels}+(((${endXPixels}-${startXPixels})/${totalFrames})*on)':
      y='${startYPixels}+(((${endYPixels}-${startYPixels})/${totalFrames})*on)'
  `.replace(/\s+/g, "");

  const ffmpegCommand = `ffmpeg -y -i ${inputImage} -vf "scale=${imageWidth}:${imageHeight},${zoompanFilter},fps=${fps},format=yuv420p" -s "${dimensions.width}x${dimensions.height}" -t ${duration} -color_range 2 ${outputVideo}`;

  console.log({ ffmpegCommand });
  exec(ffmpegCommand, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing FFmpeg command: ${error.message}`);
      return;
    }

    if (stderr) {
      // console.error(`FFmpeg stderr: ${stderr}`);
      return;
    }

    console.log(`FFmpeg stdout: ${stdout}`);
    console.log("Ken Burns effect applied successfully");
  });
};


export const POST = async (req, res) => {
  const { fileUrl, startCrop, endCrop, duration } = await req.json();
  const { x, y, width, height } = endCrop;
  console.log({
    fileUrl,
    x,
    y,
    width,
    height,
    duration,
  });
  // const fileBuffer = await fetch(fileUrl).then((res) => res.arrayBuffer());

  // const fileName = fileUrl.split("/").pop();
  // const filePath = `./${fileName}`;
  // fs.writeFileSync(filePath, Buffer.from(fileBuffer));
  const filePath = `/Users/hassan/Documents/wpmed-videowiki/kenburns/1280px-OrteliusWorldMap.jpeg`;

  const dimensions = await getImageDimensions(filePath);
  const MULTIPLIER = 1;
  const FPS = 25;
  const widthRatio = width;
  const heightRatio = height;
  // const zoomLevel = Math.max(widthRatio, heightRatio);
  const zoomLevel = Math.sqrt(
    widthRatio * widthRatio + heightRatio * heightRatio
  );
  const startWidthRatio = 1 / startCrop.width;
  const startHeightRatio = 1 / startCrop.height;
  const startZoomLevel = Math.sqrt(
    startWidthRatio * startWidthRatio + startHeightRatio * startHeightRatio
  );

  const zoomIncrement =
    (duration / 1000 / FPS) * (startZoomLevel - zoomLevel) * 0.01;

  const xPosition = parseFloat(
    (dimensions.width * x + (width * dimensions.width) / 2) * MULTIPLIER
  ).toFixed(2);
  const yPosition = parseFloat(
    (dimensions.height * y + (height * dimensions.height) / 2) * MULTIPLIER
  ).toFixed(2);
  const startXPosition = parseFloat(
    (dimensions.width * startCrop.x +
      (startCrop.width * dimensions.width) / 2) *
      MULTIPLIER
  ).toFixed(2);
  const startYPosition = parseFloat(
    (dimensions.height * startCrop.y +
      (startCrop.height * dimensions.height) / 2) *
      MULTIPLIER
  ).toFixed(2);

  const xIncrement =
    (parseInt(xPosition) - parseInt(startXPosition)) / duration / 1000 / FPS;
  const yIncrement =
    (parseInt(yPosition) - parseInt(startYPosition)) / duration / 1000 / FPS;
  console.log({
    xPosition,
    startXPosition,
    xIncrement,
    yPosition,
    startYPosition,
    yIncrement,
  });

  const cmd = `ffmpeg -framerate ${FPS} -loop 1 -i ${filePath} -filter_complex "[0:v]scale=${
    dimensions.width * MULTIPLIER
  }x${
    dimensions.height * MULTIPLIER
  },zoompan=z='max(pzoom+${zoomIncrement},${startZoomLevel})':x='max(x+${xIncrement},${startXPosition})':y='max(y+${yIncrement},${startYPosition})':d=1:s=${
    dimensions.width
  }x${dimensions.height}:fps=${FPS},trim=duration=${parseFloat(
    parseInt(duration) / 1000
  ).toFixed(2)}[v]" -map "[v]" -y out.mp4`;

  console.log(cmd);
  // await new Promise((resolve, reject) => {
  //   exec(cmd, (error, stdout, stderr) => {
  //     if (error) {
  //       reject(error);
  //     }
  //     resolve();
  //   });
  // });
  createKenBurnsEffect(
    filePath,
    "out.mp4",
    startCrop.x,
    startCrop.y,
    startCrop.width,
    startCrop.height,
    endCrop.x,
    endCrop.y,
    endCrop.width,
    endCrop.height,
    4,
    dimensions
  );
  console.log("Done");
  return NextResponse.json({ success: true });
};
