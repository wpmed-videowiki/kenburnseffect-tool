"use client";
import { useSession } from "next-auth/react";
import KenBurnsCanvas2D from "kenburns/lib/Canvas2D";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import bezierEasing from "bezier-easing";
import rectCrop from "rect-crop";
import { useEffect, useRef, useState, useCallback } from "react";
import {
  Button,
  Stack,
  TextField,
  Box,
  Grid,
  Typography,
  Container,
  Modal,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import DownloadIcon from "@mui/icons-material/Download";
import { useSearchParams } from "next/navigation";
import { fetchCommonsImage, fetchPageSource } from "./actions/commons";
import { loadCrossOriginImage } from "./utils/loadCrossOriginImage";
import { extractLicenseTag, extractPermission ,extractCategories } from "./utils/sourceParser";
import UploadForm from "./components/UploadForm";
import { blobToBase64 } from "./utils/blobToBase64";
import Header from "./components/Header";
import SearchForm from "./components/SearchForm";
import { getAppUser } from "./actions/auth";
import UpdateArticleSourceForm from "./components/UpdateArticleSourceForm";

const DEFAULT_IMAGE_WIDTH = 720;
const DEFAULT_IMAGE_HEIGHT = 480;
const DEFAULT_CANVAS_WIDTH = 1280;
const DEFAULT_CANVAS_HEIGHT = 720;

const easing = bezierEasing(0, 0, 1, 1);

export default function Home() {
  const canvasRef = useRef(null);
  const effectRef = useRef(null);
  const imageRef = useRef(null);
  const searchParams = useSearchParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [playing, setPlaying] = useState(false);
  const [cropType, setCropType] = useState("start");
  const [startCrop, setStartCrop] = useState();
  const [startCropConverted, setStartCropConverted] = useState(null);
  const [endCrop, setEndCrop] = useState();
  const [endCropConverted, setEndCropConverted] = useState(null);
  const [duration, setDuration] = useState(4000);
  const [creatingVideo, setCreatingVideo] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoBase64, setVideoBase64] = useState("");
  const [image, setImage] = useState();
  const [page, setPage] = useState();
  const [pageSource, setPageSource] = useState("");
  const [permission, setPermission] = useState("");
  const [license, setLicense] = useState("");
  const [categories, setCategories] = useState([]);
  const [uploadedUrl, setUploadedUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [canvasDimensions, setCanvasDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [imageDimensions, setImageDimensions] = useState({
    width: 0,
    height: 0,
  });
  const containerRef = useRef(null);

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

  const onApplyEffect = async () => {
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
      setCreatingVideo(false);
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
      blobToBase64(blob)
        .then((base64) => {
          setVideoBase64(base64);
        })
        .catch((err) => {
          console.error(err);
        });
    };

    recorder.start();
    setTimeout(() => {
      recorder.stop();
    }, duration);
  }, [duration]);

  const onUploaded = (imageinfo) => {
    setVideoUrl("");
    setVideoBase64("");
    setUploadedUrl(imageinfo.descriptionurl);
  };

  const handleReset = () => {
    setPlaying(false);
    setDuration(4000);
    setStartCropConverted(null);
    setEndCropConverted(null);
    setStartCrop(null);
    setEndCrop(null);
    setCreatingVideo(false);
    setVideoUrl("");
    setVideoBase64("");
    setUploadedUrl("");
  };

  useEffect(() => {
    if (startCrop) {
      const rectCropFormatStart = convertToRectCrop(
        startCrop,
        imageDimensions.width,
        imageDimensions.height
      );

      setStartCropConverted(rectCropFormatStart);
    }
    if (endCrop) {
      const rectCropFormatEnd = convertToRectCrop(
        endCrop,
        imageDimensions.width,
        imageDimensions.height
      );
      setEndCropConverted(rectCropFormatEnd);
    }
  }, [endCrop, startCrop, imageDimensions.width, imageDimensions.height]);

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
      const fileName = searchParams.get("file");
      if (!fileName || !containerRef.current) {
        return;
      }
      if (!fileName.includes("File:")) {
        // redirect to include File: prefix with all search params
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set("file", `File:${fileName}`);
        window.location.href = newUrl.href;
        return;
      }
      await getAppUser();
      const page = await fetchCommonsImage(
        searchParams.get("file"),
        searchParams.get("wikiSource")
      );
      const image = await loadCrossOriginImage(page.imageinfo[0].thumburl || page.imageinfo[0].url);
      setImageUrl(page.imageinfo[0].thumburl || page.imageinfo[0].url);
      const pageSource = await fetchPageSource(
        page.imageinfo[0].descriptionurl
      );
      const license = extractLicenseTag(pageSource.revisions[0].content);
      const permission = extractPermission(pageSource.revisions[0].content);
      const categories = extractCategories(pageSource.revisions[0].content);
      setCategories(categories);
      setPageSource(pageSource);
      setLicense(license);
      setPermission(permission);
      setPage(page);
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
      const imageAspectRatio = image.width / image.height;
      setImageDimensions({
        width: containerRef.current.getBoundingClientRect().width,
        height:
          containerRef.current.getBoundingClientRect().width / imageAspectRatio,
      });
    }
    init();
  }, [searchParams.get("file"), containerRef.current]);

  if (!searchParams.get("file")) {
    return (
      <main>
        <Header />
        <Container maxWidth="xl">
          <Stack
            alignItems="center"
            justifyContent="center"
            sx={{ height: "calc(100vh - 64px)" }}
          >
            <SearchForm />
          </Stack>
        </Container>
      </main>
    );
  }

  return (
    <main>
      <Header />
      <canvas
        ref={canvasRef}
        width={canvasDimensions.width}
        height={canvasDimensions.height}
        style={{
          transitionDuration: ".5s",
          position: "absolute",
          top: -1000 - canvasDimensions.height,
        }}
      />
      {playing && (
        <Modal open={playing} onClose={() => setPlaying(false)}>
          <Stack
            alignItems="center"
            justifyContent="center"
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              color: "white",
              padding: 2,
              borderRadius: 2,
            }}
          >
            <Typography variant="h5">Creating video, please wait...</Typography>
          </Stack>
        </Modal>
      )}
      <Container maxWidth="xl">
        <Grid container columnSpacing={4} rowSpacing={0} marginTop={11}>
          <Grid item xs={12} md={8} ref={containerRef}>
            <Stack alignItems="center" spacing={1}>
              {/* ReactCrop image */}
              <Box
                sx={{
                  opacity: 1,
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
                      width: imageDimensions.width,
                      height: imageDimensions.height,
                    }}
                    ref={imageRef}
                    alt=""
                  />
                </ReactCrop>
              </Box>
            </Stack>
          </Grid>
          <Grid item xs={12} md={4}>
            <Stack spacing={5}>
              {!videoUrl && (
                <Stack spacing={1}>
                  <Typography variant="body1">How does it work?</Typography>
                  <Typography variant="body2">
                    1. Select the start and end crop areas of the image.
                  </Typography>
                  <Typography variant="body2">
                    2. Set the duration of the effect.
                  </Typography>
                  <Typography variant="body2">
                    3. Click on the "Apply" button.
                  </Typography>
                  <Typography variant="body2">
                    4. Download the video or upload it to Wikimedia Commons.
                  </Typography>
                </Stack>
              )}
              <Stack spacing={2} justifyContent="center">
                {/* Buttons */}
                {videoUrl && !playing && (
                  <video
                    controls
                    src={videoUrl}
                    style={{ width: "100%" }}
                    autoPlay
                    muted
                  />
                )}
                <Stack
                  direction="row"
                  spacing={2}
                  sx={
                    isMobile
                      ? {
                          alignItems: "center",
                          flexWrap: "wrap",
                          rowGap: 3,
                          justifyContent: "center",
                        }
                      : {}
                  }
                >
                  <Box>
                    <Button
                      variant="contained"
                      color={cropType === "start" ? "primary" : "inherit"}
                      sx={{
                        minWidth: 150,
                      }}
                      onClick={() => setCropType("start")}
                      size="large"
                    >
                      Start crop
                    </Button>
                  </Box>
                  <Box>
                    <Button
                      variant="contained"
                      color={cropType === "end" ? "primary" : "inherit"}
                      sx={{
                        minWidth: 150,
                      }}
                      onClick={() => setCropType("end")}
                      size="large"
                    >
                      End crop
                    </Button>
                  </Box>
                  <Box>
                    <TextField
                      type="number"
                      fullWidth
                      label="duration (ms)"
                      id="duration"
                      value={duration}
                      onChange={(e) => setDuration(parseInt(e.target.value))}
                      size="small"
                    />
                    {duration <= 1000 && (
                      <Typography variant="body2" color="error">
                        Duration must be greater than 1000ms
                      </Typography>
                    )}
                  </Box>
                </Stack>
                <Stack
                  direction="row"
                  spacing={2}
                  justifyContent="center"
                  sx={
                    isMobile
                      ? {
                          alignItems: "center",
                          flexWrap: "wrap",
                          rowGap: 3,
                          justifyContent: "center",
                        }
                      : {}
                  }
                >
                  <Box>
                    <Button
                      variant="contained"
                      color="success"
                      onClick={onApplyEffect}
                      size="small"
                      startIcon={<PlayArrowIcon />}
                      disabled={
                        !startCropConverted ||
                        !endCropConverted ||
                        !duration ||
                        duration < 1000 ||
                        playing
                      }
                    >
                      Apply
                    </Button>
                  </Box>
                  <Box>
                    <Button
                      variant="outlined"
                      sx={{
                        minWidth: 200,
                      }}
                      onClick={handleReset}
                      startIcon={<RestartAltIcon />}
                      size="small"
                    >
                      Reset
                    </Button>
                  </Box>
                  <Box>
                    {videoUrl && (
                      <a href={videoUrl} download={`${page.title}.webm`}>
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          startIcon={<DownloadIcon />}
                        >
                          Download
                        </Button>
                      </a>
                    )}
                  </Box>
                </Stack>
              </Stack>

              {videoUrl && !uploadedUrl && (
                <>
                  <UploadForm
                    title={page?.title.replace(/\s/g, "_").replace("File:", "")}
                    license={
                      license || page?.imageinfo[0].extmetadata.License?.value
                    }
                    permission={permission}
                    categories={categories}
                    video={videoBase64}
                    onUploaded={onUploaded}
                    disabled={playing}
                    wikiSource={searchParams.get("wikiSource")}
                    provider={
                      page?.imageinfo[0].descriptionurl.includes(
                        "nccommons.org"
                      )
                        ? "nccommons"
                        : "commons"
                    }
                  />
                </>
              )}
              {uploadedUrl && (
                <Stack
                  justifyContent="center"
                  alignItems="center"
                  width="100%"
                  spacing={2}
                >
                  <a href={uploadedUrl} target="_blank" rel="noreferrer">
                    View on Commons
                  </a>
                  {searchParams.get("wikiSource") && (
                    <>
                      <a
                        href={searchParams.get("wikiSource")}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View Original Page
                      </a>
                      <UpdateArticleSourceForm
                        wikiSource={searchParams.get("wikiSource")}
                        originalFileName={searchParams.get("file")}
                        fileName={uploadedUrl.split("/").pop()}
                      />
                    </>
                  )}
                </Stack>
              )}
            </Stack>
          </Grid>
        </Grid>
      </Container>
    </main>
  );
}
