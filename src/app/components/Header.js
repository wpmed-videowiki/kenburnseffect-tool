import { Login } from "@mui/icons-material";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  IconButton,
  Menu,
  Stack,
  Toolbar,
  Typography,
  Container,
  Tooltip,
  MenuItem,
} from "@mui/material";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import { popupCenter } from "../utils/popupTools";

const Header = () => {
  const [anchorElUser, setAnchorElUser] = useState(null);

  const { data: session } = useSession();

  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  return (
    <AppBar position="fixed">
      <Container maxWidth="xl">
        <Toolbar
          disableGutters
          sx={{
            display: { md: "flex" },
            justifyContent: { md: "space-between" },
            mx: "auto",
          }}
        >
          <Stack
            sx={{
              display: { xs: "none", md: "flex" },
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="h1" color="white !important" fontSize="24px">
                KenBurns Effect Tool
              </Typography>
            </Stack>
          </Stack>

          <Box sx={{ flexGrow: 0 }}>
            {session ? (
              <Stack flexDirection="row" alignItems="center">
                <Typography
                  textAlign="center"
                  variant="caption"
                  marginRight={2}
                >
                  {session.providerName || session.provider} <br />(
                  {session.user.name})
                </Typography>
                <Tooltip title="Open settings">
                  <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                    <Avatar>{session.user.name.slice(0, 1)}</Avatar>
                  </IconButton>
                </Tooltip>
                <Menu
                  sx={{ mt: "45px" }}
                  id="menu-appbar"
                  anchorEl={anchorElUser}
                  anchorOrigin={{
                    vertical: "top",
                    horizontal: "right",
                  }}
                  keepMounted
                  transformOrigin={{
                    vertical: "top",
                    horizontal: "right",
                  }}
                  open={Boolean(anchorElUser)}
                  onClose={handleCloseUserMenu}
                >
                  <MenuItem onClick={() => signOut()}>
                    <Typography textAlign="center">Logout</Typography>
                  </MenuItem>
                </Menu>
              </Stack>
            ) : (
              <Stack direction="row" spacing={1}>
                <Box>
                  <Button
                    variant="outlined"
                    onClick={() => popupCenter("/login", "Login")}
                    startIcon={<Login />}
                    size="small"
                    sx={{ color: "white", borderColor: "white" }}
                  >
                    Login
                  </Button>
                </Box>
              </Stack>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header;
