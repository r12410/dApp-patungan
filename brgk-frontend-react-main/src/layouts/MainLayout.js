import React, { useEffect, useState } from "react";
import Navbar from "../components/Navigations/Navbar";
import Sidebar from "../components/Navigations/Sidebar";
import { useDispatch, useSelector } from "react-redux";
import { useAccount, useNetwork, useSwitchNetwork } from "wagmi";
import { useRouter } from "next/router";
import { setIsGuest } from "../shared/actions/userActions";
import { APP_CHAIN } from "../config/appConfig";
import SwitchNetworkDialog from "../components/Dialog/SwitchNetwork";
import Loader from "../components/Loader";

const MainLayout = ({ children }) => {
  const [isWrongNetwork, setisWrongNetwork] = useState(false);
  const [DOMLoaded, setDOMLoaded] = useState();
  const { isConnected } = useAccount();
  const { chain } = useNetwork();
  const isGuest = useSelector((state) => state.user.guestMode);
  const { push: navigate } = useRouter();
  const { switchNetworkAsync, isSuccess } = useSwitchNetwork();
  const dispatch = useDispatch();

  useEffect(() => setDOMLoaded(true), []);
  useEffect(() => {
    if (!isConnected && localStorage.getItem("isGuest") === "true") {
      setIsGuest(true, dispatch);
    } else if (!isConnected && !isGuest) {
      setTimeout(() => navigate("/login"), 1000);
    }
  }, [isConnected, dispatch, navigate]);

  useEffect(() => {
    const detectWrongNetwork = () => {
      if (chain && chain.network !== APP_CHAIN.network) {
        setisWrongNetwork(true);
      } else {
        setisWrongNetwork(false);
      }
    };
    detectWrongNetwork();
  }, [chain, isSuccess]);

  return (
    DOMLoaded && (
      <div className="w-full">
        <Sidebar />
        <div className="w-full mx-auto relative z-50 max-w-lg bg-[#fbfbfb] h-screen overflow-y-scroll scrollbar-hide">
          <SwitchNetworkDialog
            network={chain && chain.name}
            open={isWrongNetwork}
            action={async () => await switchNetworkAsync(APP_CHAIN.id)}
          />
          <Navbar />
          {isConnected || isGuest ? (
            <main className="container mx-auto px-6 pb-16 md:px-10">{children}</main>
          ) : (
            <div className="w-full h-screen grid place-content-center fixed left-0 z-50 top-0 bg-[rgba(0,0,0,0.5)]">
              <Loader size={50} color="#000" />
            </div>
          )}
        </div>
      </div>
    )
  );
};

export default MainLayout;
