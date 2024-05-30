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
import { useSession } from "next-auth/react";
import { useState } from "react";
import { popupCenter } from "../utils/popupTools";
import { logoutPlatform } from "../actions/auth";
import Link from "next/link";

const Header = () => {
  const [anchorElUser, setAnchorElUser] = useState(null);

  const { data: session, update } = useSession();

  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const logout = async (provider) => {
    await logoutPlatform(provider);
    await update();
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
              <Link href="/">
                <Typography
                  variant="h1"
                  color="white !important"
                  fontSize="24px"
                >
                  Ken Burns Effect Tool
                </Typography>
              </Link>
            </Stack>
          </Stack>

          <Box sx={{ flexGrow: 0 }}>
            <Stack flexDirection="row" alignItems="center">
              <Tooltip title="Open settings">
                <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                  <Avatar>{session?.user.name?.slice(0, 1)}</Avatar>
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
                {session?.user.wikimediaId ? (
                  <MenuItem onClick={() => logout("wikimedia")}>
                    <Typography textAlign="center">Wikimedia Logout</Typography>
                  </MenuItem>
                ) : (
                  <MenuItem
                    onClick={() =>
                      popupCenter("/login?provider=wikimedia", "Login")
                    }
                  >
                    <Typography textAlign="center">Wikimedia Login</Typography>
                  </MenuItem>
                )}
                {session?.user.nccommonsId ? (
                  <MenuItem onClick={() => logout("nccommons")}>
                    <Typography textAlign="center">
                      NC Commons Logout
                    </Typography>
                  </MenuItem>
                ) : (
                  <MenuItem
                    onClick={() =>
                      popupCenter("/login?provider=nccommons", "Login")
                    }
                  >
                    <Typography textAlign="center">NC Commons Login</Typography>
                  </MenuItem>
                )}
                {session?.user.mdwikiId ? (
                  <MenuItem onClick={() => logout("mdwiki")}>
                    <Typography textAlign="center">MD Wiki Logout</Typography>
                  </MenuItem>
                ) : (
                  <MenuItem
                    onClick={() =>
                      popupCenter("/login?provider=mdwiki", "Login")
                    }
                  >
                    <Typography textAlign="center">MD Wiki Login</Typography>
                  </MenuItem>
                )}
              </Menu>
            </Stack>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header;
