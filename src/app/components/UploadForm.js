import { Button, Stack, TextField, Typography } from "@mui/material";
import { fetchCommonsImage, uploadFile } from "../actions/commons";
import { useEffect, useState } from "react";
import { UploadFile } from "@mui/icons-material";
import { useSession } from "next-auth/react";
import { popupCenter } from "../utils/popupTools";
import { toast } from "react-toastify";
import { useDebounce } from "use-debounce";

const getWikiPageText = ({
  description,
  source,
  date,
  license,
  author,
  permission,
  categories
}) =>
  `
== {{int:filedesc}} ==
{{Information
|Description=${description}
|Date=${date}
|Source=${source}
|Permission=${permission}
|Author=${author}
}}

== {{int:license-header}} ==
{{${license}}}

${categories.join("\n")}
`.trim();
const UploadForm = ({
  title,
  license,
  permission,
  video,
  wikiSource,
  provider,
  onUploaded,
  disabled,
  categories = [],
}) => {
  const { data: session } = useSession();

  const fileTitleParts = title.split(".");
  fileTitleParts.pop();
  const tmpFileTitle = fileTitleParts.join(".") + "(KenBurns)";

  const [loading, setLoading] = useState(false);
  const [fileTitle, setFileTitle] = useState(tmpFileTitle);
  const [debouncedFileTitle] = useDebounce(fileTitle, 500);

  const [pageAlreadyExists, setPageAlreadyExists] = useState(false);
  const [text, setText] = useState(
    getWikiPageText({
      description: `${fileTitle}. Created by [https://kenburnseffect-tool.wmcloud.org/ Ken Burns Effect Tool].`,
      date: new Date().toISOString().split("T")[0],
      source: `[[:File:${title}]]`,
      author: `See [[:File:${title}|original file]] for the list of authors.`,
      license: license,
      permission,
      categories,
    })
  );

  const resetPageText = () => {
    setText(
      getWikiPageText({
        description: fileTitle,
        date: new Date().toISOString().split("T")[0],
        source: `${
          provider === "commons"
            ? "https://commons.wikimedia.org"
            : "https://nccommons.org"
        }/wiki/File:${title}`,
        author: `See [${
          provider === "commons"
            ? "https://commons.wikimedia.org"
            : "https://nccommons.org"
        }/wiki/File:${title} original file] for the list of authors.`,
        license: license,
        permission,
      })
    );
  };

  const onUpload = async () => {
    setLoading(true);
    try {
      const data = {
        filename: `File:${fileTitle}.webm`,
        text,
        file: video,
        wikiSource: wikiSource,
        provider,
      };
      const response = await uploadFile(data);
      onUploaded(response.imageinfo);
      toast.success("File uploaded successfully");
    } catch (err) {
      console.log(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!debouncedFileTitle) return;
    async function checkFileExists() {
      const page = await fetchCommonsImage(`File:${debouncedFileTitle}.webm`);
      if (page && page.pageid) {
        setPageAlreadyExists(true);
      } else {
        setPageAlreadyExists(false);
      }
    }
    checkFileExists();
  }, [debouncedFileTitle]);

  switch (provider) {
    case "commons":
      if (!session?.user?.wikimediaId) {
        return (
          <Stack spacing={1}>
            <Typography variant="body2">
              Please sign in with Wikimedia to upload this file.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              sx={{
                minWidth: 200,
              }}
              startIcon={<UploadFile />}
              onClick={() => popupCenter("/login?provider=wikimedia", "Login")}
            >
              Login to Wikimedia
            </Button>
          </Stack>
        );
      }
      break;
    case "nccommons":
      if (!session?.user?.nccommonsId) {
        return (
          <Stack spacing={1}>
            <Typography variant="body2">
              Please sign in with NC Commons to upload this file.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              sx={{
                minWidth: 200,
              }}
              startIcon={<UploadFile />}
              onClick={() => popupCenter("/login?provider=nccommons", "Login")}
            >
              Login to NC Commons
            </Button>
          </Stack>
        );
      }
      break;
    default:
      break;
  }

  return (
    <Stack direction="column" spacing={2}>
      <Stack spacing={1}>
        <Typography variant="body2">File name</Typography>
        <TextField
          name="title"
          value={fileTitle}
          onChange={(e) => setFileTitle(e.target.value)}
          size="small"
          InputProps={{
            startAdornment: "File:",
            endAdornment: ".webm",
          }}
        />
        {pageAlreadyExists && (
          <Typography variant="body2" color="orange">
            File with this name already exists. Using this file name will
            override the existing file.
          </Typography>
        )}
      </Stack>
      <Stack spacing={1}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Typography variant="body2">File Page source</Typography>
          <Button size="small" onClick={resetPageText}>
            Reset
          </Button>
        </Stack>
        <TextField
          name="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          size="small"
          multiline
          rows={10}
          maxRows={10}
        />
        <Button
          variant="contained"
          color="primary"
          sx={{
            minWidth: 200,
          }}
          startIcon={<UploadFile />}
          onClick={onUpload}
          disabled={loading || disabled}
        >
          {loading
            ? "Uploading..."
            : `Upload to ${
                provider === "nccommons" ? "NC Commons" : "Wikimedia Commons"
              }`}
        </Button>
      </Stack>
    </Stack>
  );
};

export default UploadForm;
