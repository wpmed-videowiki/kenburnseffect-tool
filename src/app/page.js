/* eslint-disable @next/next/no-img-element */
"use client";
import { useSession } from "next-auth/react";
import { signIn } from "next-auth/react";
import KenBurnsCanvas2D from "kenburns/lib/Canvas2D";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import bezierEasing from "bezier-easing";
import rectCrop from "rect-crop";
import { useEffect, useRef, useState, useCallback } from "react";
import { Button, Stack, TextField, Box } from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import DownloadIcon from "@mui/icons-material/Download";
import { useSearchParams } from "next/navigation";
import { commonsAction, fetchCommonsImage } from "./actions/commons";

const DEFAULT_IMAGE_WIDTH = 1280;
const DEFAULT_IMAGE_HEIGHT = 720;

const easing = bezierEasing(0, 0, 1, 1);

export default function Home() {
  const canvasRef = useRef(null);
  const effectRef = useRef(null);
  const imageRef = useRef(null);
  const searchParams = useSearchParams();

  const { data: session, status } = useSession();
  console.log({ session, status });
  const [playing, setPlaying] = useState(false);
  const [cropType, setCropType] = useState("start");
  const [startCrop, setStartCrop] = useState();
  const [startCropConverted, setStartCropConverted] = useState(null);
  const [endCrop, setEndCrop] = useState();
  const [endCropConverted, setEndCropConverted] = useState(null);
  const [duration, setDuration] = useState(4000);
  const [creatingVideo, setCreatingVideo] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [image, setImage] = useState();
  const [imageUrl, setImageUrl] = useState("");
  const [canvasDimensions, setCanvasDimensions] = useState({
    width: 0,
    height: 0,
  });

  const convertToRectCrop = (jsonCoords, imageWidth, imageHeight) => {
    const x_ratio = (jsonCoords.x + jsonCoords.width / 2) / imageWidth;
    const y_ratio = (jsonCoords.y + jsonCoords.height / 2) / imageHeight;
    const width_ratio = jsonCoords.width / imageWidth;
    const height_ratio = jsonCoords.height / imageHeight;
    const zoom = Math.sqrt(
      width_ratio * width_ratio + height_ratio * height_ratio
    );

    return {
      zoom: zoom,
      x: x_ratio,
      y: y_ratio,
    };
  };

  useEffect(() => {
    if (startCrop) {
      const rectCropFormatStart = convertToRectCrop(
        startCrop,
        canvasDimensions.width,
        imageRef.current.height
      );

      setStartCropConverted(rectCropFormatStart);
    }
    if (endCrop) {
      const rectCropFormatEnd = convertToRectCrop(
        endCrop,
        canvasDimensions.width,
        imageRef.current.height
      );
      setEndCropConverted(rectCropFormatEnd);
    }
  }, [endCrop, startCrop, canvasDimensions.width, imageRef.current?.height]);

  const loadCrossOriginImage = (src) =>
    new Promise((success, failure) => {
      let img = new window.Image();
      img.crossOrigin = "true";
      img.onload = () => success(img);
      img.onabort = img.onerror = failure;
      img.src = src;
    });

  const onApplyEffect = async () => {
    // const image = await loadCrossOriginImage(IMAGE_URL);
    // setImage(image);
    effectRef.current?.animate(
      image,
      rectCrop(startCropConverted.zoom, [
        startCropConverted.x,
        startCropConverted.y,
      ]),
      rectCrop(endCropConverted.zoom, [endCropConverted.x, endCropConverted.y]),
      duration,
      easing
    );
    setPlaying(true);
    setTimeout(() => {
      setPlaying(false);
    }, duration + 500);
  };

  const createAndDownloadVideo = useCallback(() => {
    const stream = canvasRef.current.captureStream();
    const recorder = new MediaRecorder(stream);
    const chunks = [];

    recorder.ondataavailable = (e) => chunks.push(e.data);

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      setVideoUrl(url);
    };

    recorder.start();
    setTimeout(() => {
      recorder.stop();
    }, duration);
  }, [duration]);

  const handleReset = () => {
    setPlaying(false);
    setDuration(4000);
    setStartCropConverted(null);
    setEndCropConverted(null);
    setStartCrop(null);
    setEndCrop(null);
    setCreatingVideo(false);
    setVideoUrl("");
  };
  useEffect(() => {
    if (playing && !creatingVideo) {
      setCreatingVideo(true);
      createAndDownloadVideo();
    }
  }, [createAndDownloadVideo, creatingVideo, playing]);

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }
    effectRef.current = new KenBurnsCanvas2D(
      canvasRef.current.getContext("2d")
    );
  }, [canvasRef.current]);

  useEffect(() => {
    async function init() {
      const imageInfo = await fetchCommonsImage(searchParams.get("file"));
      const image = await loadCrossOriginImage(imageInfo.url);
      setImageUrl(imageInfo.url);
      setImage(image);
      setCanvasDimensions({
        width:
          image.width > image.height
            ? DEFAULT_IMAGE_WIDTH
            : image.width * (DEFAULT_IMAGE_HEIGHT / image.height),
        height:
          image.width > image.height
            ? image.height * (DEFAULT_IMAGE_WIDTH / image.width)
            : DEFAULT_IMAGE_HEIGHT,
      });
      await commonsAction("", {})
    }
    init();
  }, [searchParams.get("file")]);

  return (
    <main>
      <Stack alignItems="center" spacing={1} position="relative">
        {/* canvas image */}
        <canvas
          ref={canvasRef}
          width={canvasDimensions.width}
          height={canvasDimensions.height}
          style={{
            maxHeight: imageRef?.current?.height,
            opacity: !playing ? 0 : 1,
            zIndex: !playing ? -10 : 10,
            transitionDuration: ".5s",
            position: "absolute",
            top: 0,
          }}
        />
        {/* ReactCrop image */}
        <Box
          sx={{
            opacity: playing ? 0 : 1,
            zIndex: playing ? -10 : 10,
            transitionDuration: ".5s",
          }}
        >
          <ReactCrop
            crop={cropType === "start" ? startCrop : endCrop}
            onChange={(c) =>
              cropType === "start" ? setStartCrop(c) : setEndCrop(c)
            }
          >
            <img
              src={imageUrl}
              style={{
                width: canvasDimensions.width,
                height: canvasDimensions.height,
              }}
              ref={imageRef}
              alt=""
            />
          </ReactCrop>
        </Box>
        {/* Buttons */}
        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            color={cropType === "start" ? "inherit" : "primary"}
            sx={{
              minWidth: 150,
            }}
            onClick={() => setCropType("start")}
          >
            Start crop
          </Button>
          <Button
            variant="contained"
            color={cropType === "end" ? "inherit" : "primary"}
            sx={{
              minWidth: 150,
            }}
            onClick={() => setCropType("end")}
          >
            End crop
          </Button>
          <TextField
            type="number"
            fullWidth
            label="duration (ms)"
            id="duration"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          />
        </Stack>
        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            color="success"
            sx={{
              minWidth: 200,
            }}
            onClick={onApplyEffect}
            startIcon={<PlayArrowIcon />}
            disabled={!startCropConverted || !endCropConverted || !duration}
          >
            Apply effect
          </Button>
          {videoUrl && (
            <a href={videoUrl} download="myVideo.webm">
              <Button
                variant="contained"
                color="primary"
                startIcon={<DownloadIcon />}
              >
                Download Video
              </Button>
            </a>
          )}
          <Button
            variant="outlined"
            sx={{
              minWidth: 200,
            }}
            onClick={handleReset}
            startIcon={<RestartAltIcon />}
          >
            Reset
          </Button>
          <Button
            variant="outlined"
            sx={{
              minWidth: 200,
            }}
            onClick={() => signIn("wikimedia")}
            startIcon={<RestartAltIcon />}
          >
            Login
          </Button>
        </Stack>
      </Stack>
    </main>
  );
}
