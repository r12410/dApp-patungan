import { useConnect } from "wagmi";
import useConnectWallet from "../../hooks/useConnectWallet";
import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { classNames } from "../../helpers";

const ConnectButton = ({ isBlack }) => {
  const { connect } = useConnectWallet();
  const { connectors } = useConnect();
  const [host, setHost] = useState();
  const [DOMLoaded, setDOMLoaded] = useState(false);

  useEffect(() => {
    setHost(window.location.host);
    setDOMLoaded(true);
  }, []);

  return (
    <>
      {DOMLoaded && !window.ethereum ? (
        <a
          className={classNames(
            "border w-full max-w-[320px] p-1.5 rounded-full text-center",
            isBlack ? `text-[#000000] border-[#000000]` : "text-[#C4C4C4] border-[#C4C4C4]"
          )}
          href={`https://metamask.app.link/dapp/${host}/login`}>
          SAMBUNG METAMASK
        </a>
      ) : (
        connectors.map((connector) => {
          return (
            <button
              key={connector.id}
              className={classNames(
                "border w-full max-w-[320px] p-1.5 rounded-full text-center",
                isBlack ? `text-[#000000] border-[#000000]` : "text-[#C4C4C4] border-[#C4C4C4]"
              )}
              // disabled={!connector.ready}
              onClick={() => {
                connect(connector);
              }}>
              SAMBUNG METAMASK
            </button>
          );
        })
      )}
    </>
  );
};
ConnectButton.propTypes = {
  isBlack: PropTypes.bool
};
export default ConnectButton;
