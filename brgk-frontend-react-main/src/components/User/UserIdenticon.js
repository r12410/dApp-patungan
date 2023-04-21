import Jdenticon from "react-jdenticon";
import PropTypes from "prop-types";

const UserIdenticon = ({ size, hash }) => {
  return <Jdenticon size={size} value={hash} />;
};

UserIdenticon.propTypes = {
  size: PropTypes.string,
  hash: PropTypes.string.isRequired
};

export default UserIdenticon;
