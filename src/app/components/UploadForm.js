import {
  Autocomplete,
  Button,
  Input,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { uploadFile } from "../actions/commons";
import { useState } from "react";
import { UploadFile } from "@mui/icons-material";
import {
  othersworkLicenceOptions,
  ownworkLicenceOptions,
} from "../utils/licenceOptions";
import { useSession } from "next-auth/react";
import { popupCenter } from "../utils/popupTools";
import { toast } from "react-toastify";

const getWikiPageText = ({ description, source, date, license, author }) =>
  `
== {{int:filedesc}} ==
{{Information|
description=${description}|
date=${date}|
source=${source}|
author=${author}
}}

=={{int:license}}==
{{${license.toUpperCase()}}}

`.trim();
const UploadForm = ({
  title,
  license,
  video,
  wikiSource,
  provider,
  onUploaded,
  disabled,
}) => {
  const { data: session } = useSession();

  const fileTitleParts = title.split(".");
  fileTitleParts.pop();
  const fileTitle = fileTitleParts.join(".") + "(KenBurns)";

  const [loading, setLoading] = useState(false);
  const [formValues, setFormValues] = useState({
    title: fileTitle,
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
  });
  console.log({license})

  const onFieldUpdate = (e) => {
    setFormValues((state) => ({
      ...state,
      [e.target.name]: e.target.value,
    }));
  };

  const onUpload = async () => {
    setLoading(true);
    try {
      const data = {
        filename: `File:${formValues.title}.webm`,
        text: getWikiPageText({
          description: formValues.title,
          source: formValues.source,
          date: formValues.date,
          license: formValues.license,
          author: formValues.author,
        }),
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
    <Stack>
      <Stack direction="column" spacing={2}>
        <Stack spacing={1}>
          <Typography variant="body2">File name</Typography>
          <TextField
            name="title"
            value={formValues.title}
            onChange={onFieldUpdate}
            size="small"
            InputProps={{
              startAdornment: "File:",
              endAdornment: ".webm",
            }}
          />
        </Stack>
        <Stack spacing={1}>
          <Typography variant="body2">Date</Typography>
          <TextField
            name="date"
            value={formValues.date}
            onChange={onFieldUpdate}
            size="small"
          />
        </Stack>
        <Stack spacing={1}>
          <Typography variant="body2">Source</Typography>
          <TextField
            name="source"
            value={formValues.source}
            onChange={onFieldUpdate}
            size="small"
          />
        </Stack>
        <Stack spacing={1}>
          <Typography variant="body2">Author</Typography>
          <TextField
            name="author"
            value={formValues.author}
            onChange={onFieldUpdate}
            size="small"
          />
        </Stack>
        <Stack spacing={1}>
          <Typography variant="body2">License</Typography>
          <TextField
            name="license"
            value={formValues.license}
            onChange={onFieldUpdate}
            size="small"
          />
        </Stack>
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
