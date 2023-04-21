import { useEffect, useState } from "react";

const useViewport = () => {
  const [viewport, setViewport] = useState({
    width: globalThis.innerWidth,
    height: globalThis.innerHeight
  });

  useEffect(() => {
    setViewport({
      width: globalThis.innerWidth,
      height: globalThis.innerHeight
    });
  }, []);

  const vWidth = viewport.width || globalThis.innerWidth;
  const vHeight = viewport.height || globalThis.innerHeight;

  return { vWidth, vHeight };
};

export default useViewport;
