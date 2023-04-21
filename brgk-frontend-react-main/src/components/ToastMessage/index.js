import { APP_CHAIN } from "../../config/appConfig";

const ToastMessage = ({ message, txHash }) => {
  return (
    <div className="w-full">
      <h1>
        {message}{" "}
        <a className="underline" target="_blank" rel="noreferrer" href={`${APP_CHAIN.blockExplorers.default.url}/tx/${txHash}`}>{`${
          APP_CHAIN.blockExplorers.default.url
        }/tx/${txHash.slice(0, 10)}...`}</a>
      </h1>
    </div>
  );
};

export default ToastMessage;
