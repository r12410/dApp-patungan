import React from "react";
import { CircularProgress } from "@mui/material";
import PropTypes from "prop-types";

const Loader = ({ size, color }) => {
  return <CircularProgress size={size} sx={{ color }} />;
};

Loader.propTypes = {
  size: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  color: PropTypes.string
};

export default Loader;
