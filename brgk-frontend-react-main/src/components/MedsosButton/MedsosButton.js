import Image from "next/image";
import React from "react";
import PropTypes from "prop-types";

const MedsosButton = (props) => {
  const { labelMedsos, iconMedsos, handleClick, children } = props;
  return (
    <div className="radials-bg">
      <button onClick={handleClick} className="w-full btn-medsos-icon ml-1">
        {children}
        <Image alt={labelMedsos} src={iconMedsos} className="mx-auto" />
      </button>
    </div>
  );
};

MedsosButton.propTypes = {
  labelMedsos: PropTypes.string,
  iconMedsos: PropTypes.oneOfType([PropTypes.object, PropTypes.array]).isRequired,
  handleClick: PropTypes.func,
  children: PropTypes.node
};

export default MedsosButton;
