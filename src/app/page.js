"use client";
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
  GridLegacy as Grid,
  Typography,
  Container,
  Modal,
  useTheme,
  useMediaQuery,
  ButtonGroup,
  Tooltip,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import DownloadIcon from "@mui/icons-material/Download";
import { useSearchParams } from "next/navigation";
import { fetchCommonsImage, fetchPageSource } from "./actions/commons";
import { loadCrossOriginImage } from "./utils/loadCrossOriginImage";
import {
  extractLicenseTag,
  extractPermission,
  extractCategories,
} from "./utils/sourceParser";
import UploadForm from "./components/UploadForm";
import Header from "./components/Header";
import SearchForm from "./components/SearchForm";
import { getAppUser } from "./actions/auth";
import { renderVideo } from "./actions/render";
import UpdateArticleSourceForm from "./components/UpdateArticleSourceForm";
import LinearProgressWithLabel from "./components/LinearProgressWithLabel";
import { useTranslations } from "next-intl";

const DEFAULT_IMAGE_WIDTH = 1280;
const DEFAULT_IMAGE_HEIGHT = 720;

const easing = bezierEasing(0, 0, 1, 1);

export default function Home() {
  const canvasRef = useRef(null);
  const previewCanvasRef = useRef(null);
  const effectRef = useRef(null);
  const previewEffectRef = useRef(null);
  const imageRef = useRef(null);

  const searchParams = useSearchParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const t = useTranslations();

  const [playing, setPlaying] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [cropType, setCropType] = useState("end");
  const [mode, setMode] = useState("single");
  const [startCrop, setStartCrop] = useState();
  const [startCropConverted, setStartCropConverted] = useState(null);
  const [endCrop, setEndCrop] = useState();
  const [endCropConverted, setEndCropConverted] = useState(null);
  const [duration, setDuration] = useState(2000);
  const [renderProgress, setRenderProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoBlob, setVideoBlob] = useState("");
  const [image, setImage] = useState();
  const [page, setPage] = useState();
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
    const zoom = Math.min(width_ratio, height_ratio);

    return {
      zoom: zoom,
      x: x_ratio,
      y: y_ratio,
    };
  };

  const onRenderFFmpeg = async () => {
    const data = {
      duration,
      fileUrl: imageUrl,
      endCrop: {
        x: endCrop.x / imageDimensions.width,
        y: endCrop.y / imageDimensions.height,
        width: endCrop.width / imageDimensions.width,
        height: endCrop.height / imageDimensions.height,
      },
    };

    try {
      setPlaying(true);
      const interval = setInterval(() => {
        // fake progress
        setRenderProgress((prev) => Math.min(prev + 1, 100));
      }, (duration * 100) / 2000);

      const response = await renderVideo(data);
      clearInterval(interval);
      const byteArray = Uint8Array.from(
        atob(response.file)
          .split("")
          .map((char) => char.charCodeAt(0))
      );
      const blob = new Blob([byteArray], { type: "video/webm" });
      setVideoUrl(URL.createObjectURL(blob));
      setVideoBlob(blob);
      setRenderProgress(0);
      setPlaying(false);
    } catch (err) {
      console.log(err);
    }
    setRenderProgress(0);
    setPlaying(false);
  };

  const onRender = async () => {
    const capturer = new window.CCapture({
      format: "webm",
      framerate: 30,
      verbose: false,
      quality: 0.8,
    });

    let isStopped = false;
    let start;

    function loop() {
      const now = window.performance.now();

      if (isStopped) return;
      if (!start) start = now;
      requestAnimationFrame(loop);
      let p = Math.min((now - start) / duration, 1);
      setRenderProgress(p * 100);

      effectRef.current?.animateStep(
        image,
        rectCrop(startCropConverted.zoom, [
          startCropConverted.x,
          startCropConverted.y,
        ]),
        rectCrop(endCropConverted.zoom, [
          endCropConverted.x,
          endCropConverted.y,
        ]),
        easing(p)
      );
      capturer.capture(canvasRef.current);
    }

    setPlaying(true);
    requestAnimationFrame(loop);
    capturer.start();

    setTimeout(() => {
      isStopped = true;
      capturer.stop();
      setPlaying(false);
      setRenderProgress(0);

      capturer.save((blob) => {
        setVideoUrl(URL.createObjectURL(blob));
        setVideoBlob(blob);
      });
    }, duration);
  };

  const onPreview = () => {
    previewEffectRef.current?.animate(
      image,
      rectCrop(startCropConverted.zoom, [
        startCropConverted.x,
        startCropConverted.y,
      ]),
      rectCrop(endCropConverted.zoom, [endCropConverted.x, endCropConverted.y]),
      duration,
      easing
    );
    setPreviewing(true);
    setTimeout(() => {
      setPreviewing(false);
    }, duration + 500);
  };

  const onUploaded = (imageinfo) => {
    setVideoUrl("");
    setVideoBlob("");
    setUploadedUrl(imageinfo.descriptionurl);
  };

  const onModeChange = (mode) => {
    setMode(mode);
    if (mode === "single") {
      setEndCrop(null);
      setEndCropConverted(null);
      setCropType("end");
    } else if (mode === "double") {
      setStartCrop(null);
      setStartCropConverted(null);
      setEndCrop(null);
      setEndCropConverted(null);
      setCropType("start");
    }
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
    if (!canvasRef.current) {
      return;
    }
    effectRef.current = new KenBurnsCanvas2D(
      canvasRef.current.getContext("2d")
    );
  }, [canvasRef.current]);

  useEffect(() => {
    if (!previewCanvasRef.current) {
      return;
    }
    previewEffectRef.current = new KenBurnsCanvas2D(
      previewCanvasRef.current.getContext("2d")
    );
  }, [previewCanvasRef.current]);

  useEffect(() => {
    async function init() {
      await getAppUser();
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
      const page = await fetchCommonsImage(
        searchParams.get("file"),
        searchParams.get("wikiSource")
      );
      const image = await loadCrossOriginImage(
        page.imageinfo[0].thumburl || page.imageinfo[0].url
      );
      setImageUrl(page.imageinfo[0].thumburl || page.imageinfo[0].url);
      const pageSource = await fetchPageSource(
        page.imageinfo[0].descriptionurl
      );
      const license = extractLicenseTag(pageSource.revisions[0].content);
      const permission = extractPermission(pageSource.revisions[0].content);
      const categories = extractCategories(pageSource.revisions[0].content);
      setCategories(categories);
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
      const imageWidth = containerRef.current.getBoundingClientRect().width;
      const imageHeight = imageWidth / imageAspectRatio;
      setImageDimensions({
        width: imageWidth,
        height: imageHeight,
      });
      setStartCrop({
        x: 0,
        y: 0,
        width: imageWidth,
        height: imageHeight,
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
          position: "absolute",
          top: -1000 - canvasDimensions.height,
        }}
      />

      {playing && (
        <Modal open={playing}>
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
            <Typography variant="h5">{t("Index_rendering_video")}</Typography>
            {renderProgress === 100 ? (
              <Typography variant="body2">{t("Index_finalizing_video")}</Typography>
            ) : (
              <Box sx={{ width: "100%" }}>
                <LinearProgressWithLabel
                  variant="determinate"
                  value={renderProgress}
                />
              </Box>
            )}
          </Stack>
        </Modal>
      )}
      <Container maxWidth="xl">
        <Grid container columnSpacing={4} rowSpacing={0} marginTop={11}>
          <Grid item xs={12} md={8} ref={containerRef}>
            <Stack alignItems="center" spacing={1} position="relative">
              {/* ReactCrop image */}
              <canvas
                ref={previewCanvasRef}
                width={imageDimensions.width}
                height={imageDimensions.height}
                style={{
                  maxHeight: imageRef?.current?.height,
                  opacity: !previewing ? 0 : 1,
                  zIndex: !previewing ? -10 : 10,
                  transitionDuration: ".5s",
                  position: "absolute",
                  top: 0,
                }}
              />
              <Box
                sx={{
                  opacity: previewing ? 0 : 1,
                  zIndex: previewing ? -10 : 10,
                  transitionDuration: ".5s",
                }}
              >
                <ReactCrop
                  aspect={
                    mode === "single"
                      ? imageDimensions.width / imageDimensions.height
                      : undefined
                  }
                  crop={cropType === "start" ? startCrop : endCrop}
                  onChange={(c) =>
                    cropType === "start" ? setStartCrop(c) : setEndCrop(c)
                  }
                >
                  {imageUrl && (
                    <img src={imageUrl}
                      style={{
                        width: imageDimensions.width,
                        height: imageDimensions.height,
                      }}
                      ref={imageRef}
                      alt=""
                    />
                  )}
                </ReactCrop>
              </Box>
            </Stack>
          </Grid>
          <Grid item xs={12} md={4}>
            <Stack spacing={5}>
              {!videoUrl && (
                <Stack spacing={1}>
                  <Typography variant="h6">{t("Index_how_it_works")}</Typography>
                  {mode === "single" ? (
                    <Typography variant="body2">
                      {t("Index_draw_end_crop")}
                    </Typography>
                  ) : (
                    <Typography variant="body2">
                      {t("Index_draw_start_end_crops")}
                    </Typography>
                  )}
                  <Typography variant="body2">
                    {t("Index_set_effect_duration")}
                  </Typography>
                  <Typography variant="body2">
                    {t("Index_click_on_preview")}
                  </Typography>
                  <Typography variant="body2">
                    {t("Index_click_on_render")}
                  </Typography>
                  <Typography variant="body2">
                    {t("Index_download_generated_video")}
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
                <Stack spacing={1}>
                  <Typography variant="h6">{t("Index_mode")}</Typography>
                  <ButtonGroup>
                    <Tooltip title="Animate starting from the full image to a specific position">
                      <Button
                        size="small"
                        variant="contained"
                        color={mode === "single" ? "primary" : "inherit"}
                        onClick={() => onModeChange("single")}
                      >
                        {t("Index_mode_single_crop")}
                      </Button>
                    </Tooltip>
                    <Tooltip title="Animate starting from a specific position to the end crop">
                      <Button
                        size="small"
                        variant="contained"
                        color={mode === "double" ? "primary" : "inherit"}
                        onClick={() => onModeChange("double")}
                      >
                        {t("Index_mode_double_crop")}
                      </Button>
                    </Tooltip>
                  </ButtonGroup>
                </Stack>
                <Stack spacing={1}>
                  <Typography variant="h6">{t("Index_settings")}</Typography>
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
                        : {
                          justifyContent:
                            mode === "double"
                              ? "space-between"
                              : "flex-start",
                        }
                    }
                  >
                    {mode === "double" && (
                      <>
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
                            {t("Index_start_crop")}
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
                            {t("Index_end_crop")}
                          </Button>
                        </Box>
                      </>
                    )}
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
                          {t("Index_duration_small_error")}
                        </Typography>
                      )}
                      {duration > 15000 && (
                        <Typography variant="body2" color="error">
                          {t("Index_duration_large_error")}
                        </Typography>
                      )}
                    </Box>
                  </Stack>
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
                      onClick={onPreview}
                      startIcon={<PlayArrowIcon />}
                      size="small"
                      disabled={
                        (!startCropConverted && mode === "double") ||
                        !endCropConverted ||
                        !duration ||
                        duration < 1000 ||
                        duration > 15000 ||
                        playing ||
                        previewing
                      }
                    >
                      {t("Index_preview")}
                    </Button>
                  </Box>
                  <Box>
                    <Button
                      variant="contained"
                      color="success"
                      onClick={mode == "single" ? onRenderFFmpeg : onRender}
                      size="small"
                      startIcon={<PlayArrowIcon />}
                      disabled={
                        (!startCropConverted && mode === "double") ||
                        !endCropConverted ||
                        !duration ||
                        duration < 1000 ||
                        duration > 15000 ||
                        playing ||
                        previewing
                      }
                    >
                      {t("Index_render")}
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
                          {t("Index_download")}
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
                    video={videoBlob}
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
                    {t('Index_view_on_commons')}
                  </a>
                  {searchParams.get("wikiSource") && (
                    <>
                      <a
                        href={searchParams.get("wikiSource")}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {t('Index_view_original_page')}
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
