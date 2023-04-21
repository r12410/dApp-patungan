import SwipeableDrawer from "@mui/material/SwipeableDrawer";
import Navbar from "./Navbar";
import { useDispatch, useSelector } from "react-redux";
import { setSidebar } from "../../shared/actions/uiActions";
import { sidebarList } from "../../helpers";
import { useState } from "react";

const Sidebar = () => {
  const [state, setState] = useState({
    left: false,
    top: false
  });

  const sidebarState = useSelector((state) => state.ui.sidebar);
  const dispatch = useDispatch();

  const toggleDrawer = (anchor, open) => (event) => {
    if (event && event.type === "keydown" && (event.key === "Tab" || event.key === "Shift")) {
      return;
    }
    setSidebar({ ...state, [anchor]: open }, dispatch);
  };

  const list = (anchor) => (
    <div className="w-full h-screen bg-[#fbfbfb]" role="presentation" onClick={toggleDrawer(anchor, false)}>
      <div className="z-50">
        <Navbar />
      </div>
      <div className="w-full flex flex-col items-start">
        {sidebarList.map((list, index) => (
          <button key={index} className={`uppercase font-bold text-lg px-4 py-2 z-50 rounded-md ${list.classes}`}>
            <a href={list.href} target="_blank" rel="noreferrer">
              <h1>{list.title}</h1>
            </a>
          </button>
        ))}
      </div>
      <div className="[&>h1]:font-extrabold [&>h1]:font-roboto absolute left-5 top-[36.5vh] opacity-20">
        <h1 className="text-xl md:text-xl ml-1">MARI</h1>
        <h1 className="text-7xl md:text-[100px]">
          BERGE <br /> RAK
        </h1>
      </div>
    </div>
  );

  const iOS = typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent);

  return ["left"].map((anchor) => (
    <SwipeableDrawer
      classes={{ modal: "w-full flex justify-center", paper: "w-full max-w-lg" }}
      key={anchor}
      disableBackdropTransition={!iOS}
      disableDiscovery={iOS}
      anchor={anchor}
      open={sidebarState[anchor]}
      onClose={toggleDrawer(anchor, false)}
      onOpen={toggleDrawer(anchor, true)}>
      {list(anchor)}
    </SwipeableDrawer>
  ));
};
export default Sidebar;
