import { useRouter } from "next/navigation";
import { searchCommonsImages } from "../actions/commons";

const {
  Stack,
  TextField,
  Autocomplete,
  Box,
  Typography,
} = require("@mui/material");
const { useState, useEffect } = require("react");
const { useDebounce } = require("use-debounce");

const SearchForm = () => {
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [debouncedSearch] = useDebounce(search, 500);

  const router = useRouter();

  useEffect(() => {
    if (debouncedSearch) {
      async function search() {
        setLoading(true);
        const result = await searchCommonsImages(debouncedSearch);
        setSearchResults(result);
        setLoading(false);
      }
      search();
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearch]);

  return (
    <Box width="100%">
      <Autocomplete
        fullWidth
        id="search"
        noOptionsText={
          loading ? "Loading..." : "Paste the image url or file name here"
        }
        inputValue={search}
        onInputChange={(e, value) => setSearch(value.trim() || "")}
        options={searchResults}
        onChange={(e, value) => {
          router.push(`/?file=${value.title}`);
        }}
        renderOption={(props, option) => {
          return (
            <Box component="li" {...props}>
              <Stack direction="column" spacing={1}>
                <Typography variant="body1">{option.title}</Typography>
                <Typography variant="body2">
                  <small>({option.wikiSource})</small>
                </Typography>
              </Stack>
            </Box>
          );
        }}
        filterOptions={(x) => x}
        getOptionLabel={(option) => option.title}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Search for images on Commons and NC Commons"
          />
        )}
      />
    </Box>
  );
};

export default SearchForm;
