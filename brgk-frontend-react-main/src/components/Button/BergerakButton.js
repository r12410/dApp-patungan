import React from "react";
import PropTypes from "prop-types";
import BergerakHand from "../../assets/svg/bergerak-hand.svg";
import Image from "next/image";

const BergerakButton = (props) => {
  const { children, handleClick, width, height, asFormSubmit = false } = props;
  return asFormSubmit ? (
    <button type="submit">
      <Image src={BergerakHand} alt="bergerak button" width={width} height={height} />
    </button>
  ) : (
    <button onClick={handleClick}>
      <Image src={BergerakHand} alt="bergerak button" width={width} height={height} />
      {children}
    </button>
  );
};

BergerakButton.propTypes = {
  handleClick: PropTypes.func.isRequired,
  asFormSubmit: PropTypes.bool,
  width: PropTypes.string || PropTypes.number,
  height: PropTypes.string || PropTypes.number
};

export default BergerakButton;
