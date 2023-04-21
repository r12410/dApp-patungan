import React, { useState } from "react";
import { Menu as MenuIcons } from "@mui/icons-material";
import Image from "next/image";
import BergerakLogo from "../../assets/images/bergerak-logo-sm.png";
import { useDispatch, useSelector } from "react-redux";
import UserInfo from "../User/UserInfo";
import { setSidebar } from "../../shared/actions/uiActions";
import ConnectModal from "../Modals/ConnectModal";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import useConnectWallet from "../../hooks/useConnectWallet";
import { useRouter } from "next/router";
import { APP_CHAIN } from "../../config/appConfig";

const Navbar = () => {
  const [open, handleOpen] = useState(false);
  const sidebarAnchor = useSelector((state) => state.ui.sidebar);
  const isGuest = useSelector((state) => state.user.guestMode);
  const userAddress = useSelector((state) => state.user.address);
  const userRole = useSelector((state) => state.user.role);
  const dispatch = useDispatch();

  const { disconnect } = useConnectWallet();

  const [anchorEl, setAnchorEl] = React.useState(null);
  const openMenu = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const { push: navigate } = useRouter();

  return (
    <div className="w-full z-[100]">
      <div className="container relative flex justify-between items-center mx-auto p-4">
        <button onClick={() => setSidebar({ top: !sidebarAnchor.top, left: !sidebarAnchor.left }, dispatch)} className="self-center">
          <MenuIcons />
        </button>
        <button onClick={() => navigate("/")} className="w-10 self-center md:w-14">
          <Image src={BergerakLogo} alt="bergerak logo" />
        </button>
        {isGuest && (
          <button onClick={() => handleOpen(true)} className="w-6">
            <UserInfo />
          </button>
        )}
        {!isGuest && (
          <>
            <button onClick={handleClick}>
              <UserInfo />
            </button>
            <Menu anchorEl={anchorEl} open={openMenu} onClose={handleClose}>
              <div>
                {/* Uncomment this user role checks admin menu page */}
                {userRole === "admin" && (
                  <MenuItem
                    onClick={() => {
                      navigate("/admin");
                      handleClose();
                    }}>
                    Admin Menu
                  </MenuItem>
                )}
                <MenuItem
                  onClick={() => {
                    window && window.open(`${APP_CHAIN.blockExplorers.default.url}/address/${userAddress}`);
                    handleClose();
                  }}>
                  Buka Dompet
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    disconnect();
                    handleClose();
                  }}>
                  Keluar
                </MenuItem>
              </div>
            </Menu>
          </>
        )}

        <ConnectModal handleOpen={handleOpen} open={open} isBlack={true} />
      </div>
    </div>
  );
};

export default Navbar;
