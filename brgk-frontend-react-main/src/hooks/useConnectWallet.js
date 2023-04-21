import { Connector, useAccount, useConnect, useContractRead, useDisconnect } from "wagmi";
import { useDispatch } from "react-redux";
import { setIsGuest, setUser } from "../shared/actions/userActions";
import { toast } from "react-toastify";
import { BRGK_EMBLEM_ABI, BRGK_EMBLEM_ADDRESS } from "../constants/contracts";

const useConnectWallet = () => {
  const dispatch = useDispatch();
  const { disconnectAsync } = useDisconnect();
  const { connectAsync, connectors } = useConnect();
  const { isConnected, address } = useAccount();

  const emblemContractParams = {
    address: BRGK_EMBLEM_ADDRESS,
    abi: BRGK_EMBLEM_ABI,
    chainId: 80001
  };

  const {
    data: emblemData,
    isSuccess: succsessFetchEmblem,
    error: errorFetchEmblem
  } = useContractRead({ ...emblemContractParams, functionName: "balanceOf", args: [address, 1] });

  const {
    data: owner,
    isSuccess: succsessFetchOwner,
    error: errorFetchOwner
  } = useContractRead({ ...emblemContractParams, functionName: "owner" });

  const checkUserRole = (userAddress) => {
    const isOwner = userAddress === owner;
    if (isOwner && succsessFetchOwner && address) {
      console.log("@ Masuk role admin ->", userAddress);
      setUser(
        {
          address: userAddress,
          role: "admin",
          isLoggedIn: true
        },
        dispatch
      );
    } else if (emblemData && succsessFetchEmblem && address) {
      if (emblemData > 0) {
        console.log("@ Masuk role penggerak ->", userAddress);
        setUser(
          {
            address: userAddress,
            role: "penggerak",
            isLoggedIn: true
          },
          dispatch
        );
      } else if (address) {
        console.log("@ Masuk role publik ->", userAddress);
        setUser(
          {
            address: userAddress,
            role: "publik",
            isLoggedIn: true
          },
          dispatch
        );
      }
    }
    if (address) {
      if (errorFetchEmblem) {
        console.error(errorFetchEmblem.message, "emblem blc");
        toast("There's some error:", errorFetchEmblem.message);
      }
      if (errorFetchOwner) {
        console.error(errorFetchOwner.message, "owner");
        toast("There's some error:", errorFetchOwner.message);
      }
    }
  };

  /**
   * Connect to ethereum using WAGMI
   * @param {Connector} connector
   */
  const connect = async (connector) => {
    if (!isConnected) {
      try {
        setIsGuest(false, dispatch);
        const conn = await connectAsync({ connector });
        checkUserRole(conn.account);
      } catch (err) {
        toast(err.message.replace("User", "You"));
      }
    }
  };

  const connectAsGuest = () => {
    if (!isConnected) {
      setIsGuest(true, dispatch);
      setUser(
        {
          address: "",
          role: "guest"
        },
        dispatch
      );
    }
  };

  const disconnect = async () => {
    if (isConnected) {
      await disconnectAsync();
      setUser(
        {
          address: "",
          role: "",
          isLoggedIn: false
        },
        dispatch
      );
      setIsGuest(false, dispatch);
    }
  };

  return { connect, connectAsGuest, disconnect, connectors, checkUserRole };
};

export default useConnectWallet;
