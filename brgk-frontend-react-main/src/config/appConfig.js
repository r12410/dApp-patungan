import { goerli, mainnet } from "wagmi";
import { polygonMumbai, polygon } from "@wagmi/core/chains";

export const isDev = process.env.NODE_ENV === "development";
export const isTestnet = process.env.NEXT_PUBLIC_NETWORK_ENV === "testnet";

export const APP_CHAIN = isTestnet ? polygonMumbai : polygon;
