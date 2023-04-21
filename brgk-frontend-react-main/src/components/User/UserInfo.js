import React from "react";
import { useSelector } from "react-redux";
import { truncateAddress } from "../../helpers";
import UserIdenticon from "./UserIdenticon";
import useViewport from "../../hooks/useViewport";
import useConnectWallet from "../../hooks/useConnectWallet";
import { useAccount } from "wagmi";
import { useEffect } from "react";

const UserInfo = () => {
  const userState = useSelector((state) => state.user);
  const { vWidth } = useViewport();
  const { checkUserRole } = useConnectWallet();
  const { isConnected, address } = useAccount();

  useEffect(() => {
    const check = async () => {
      checkUserRole(address);
    };
    if (isConnected && address) {
      check();
    }
  }, [isConnected, address]);

  return (
    <div className="flex items-center space-x-1 absolute right-[3vw] top-[2.5vh] md:right-0 md:pr-4">
      <div className="w-fit h-fit rounded-full border-[2px] border-blue-500">
        <div
          id="user-identicon"
          className="rounded-full w-7 h-7 md:w-9 md:h-9 overflow-hidden grid place-content-center border-[2px] border-black">
          <UserIdenticon size={vWidth < 500 ? "20" : "30"} hash={userState && (userState.address ?? "DefaultIcon")} />
        </div>
      </div>
      <div className="flex flex-col items-start font-roboto-c">
        <h1 className="font-bold text-xs md:text-sm">{userState.role}</h1>
        <h1 className="text-xs md:text-sm">{userState.guestMode ? "0x" : userState.address && truncateAddress(userState.address, 4, 3)}</h1>
      </div>
    </div>
  );
};

export default UserInfo;
