import { Modal } from "@mui/material";
import { useAccount } from "wagmi";
import useConnectWallet from "../../hooks/useConnectWallet";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/router";
import { setIsGuest, setUser } from "../../shared/actions/userActions";
import ConnectButton from "../Button/ConnectButton";
import { classNames } from "../../helpers";
import { useEffect } from "react";
import PropTypes from "prop-types";

const ConnectModal = ({ open = false, handleOpen, isBlack }) => {
  const { disconnect } = useConnectWallet();
  const { isConnected } = useAccount();
  const isGuest = useSelector((state) => state.user.guestMode);
  const dispatch = useDispatch();
  const { push: navigate } = useRouter();

  useEffect(() => {
    if (isConnected) {
      handleOpen(false);
    }
  }, [isConnected]);

  return (
    <>
      {open && <div className="w-full h-screen bg-black absolute top-0 left-0 z-20 opacity-60"></div>}
      <Modal
        open={open}
        onClose={() => handleOpen(false)}
        sx={{
          width: "100%",
          height: "100vh",
          display: "grid",
          placeContent: "center",
          zIndex: "9999 !important"
        }}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description">
        <div className="bg-white w-[340px] max-w-[440px] shadow rounded-md p-3 text-center">
          {isConnected ? (
            <button
              className={classNames(
                "border w-full p-1.5 rounded-full",
                isBlack ? `text-[#000000] border-[#000000]` : "text-[#C4C4C4] border-[#C4C4C4]"
              )}
              disabled={!isConnected}
              onClick={() => {
                handleOpen(false);
                disconnect();
              }}>
              Disconnect
            </button>
          ) : (
            <div className="flex flex-col justify-center text-base space-y-2 text-white">
              {isGuest ? (
                <>
                  <button
                    className={classNames(
                      "border w-full p-1.5 rounded-full",
                      isBlack ? `text-[#000000] border-[#000000]` : "text-[#C4C4C4] border-[#C4C4C4]"
                    )}
                    onClick={() => {
                      setIsGuest(false, dispatch);
                      setUser(
                        {
                          address: "",
                          role: "",
                          isLoggedIn: false
                        },
                        dispatch
                      );
                      handleOpen(false);
                      navigate("/");
                    }}>
                    KEMBALI KE HALAMAN LOGIN
                  </button>
                  <ConnectButton isBlack={true} />
                </>
              ) : (
                <ConnectButton isBlack={true} />
              )}
            </div>
          )}
        </div>
      </Modal>
    </>
  );
};

ConnectModal.propTypes = {
  open: PropTypes.bool,
  handleOpen: PropTypes.func,
  isBlack: PropTypes.bool
};

export default ConnectModal;
