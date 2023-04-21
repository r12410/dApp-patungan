import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField } from "@mui/material";
import React from "react";
import { useEffect } from "react";
import { useState } from "react";
import PropTypes from "prop-types";

const SwitchNetworkDialog = ({ open, action, network }) => {
  const [host, setHost] = useState();
  useEffect(() => setHost(window.location.host), []);
  return (
    <div>
      <Dialog open={open}>
        <DialogTitle sx={{ fontSize: 25 }}>WRONG NETWORK!</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {host} is requesting you to switch the Network. You connected to {network}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <button onClick={action} className="px-4 rounded-md py-2 bg-black text-white font-bold">
            Agree
          </button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

SwitchNetworkDialog.propTypes = {
  open: PropTypes.bool,
  action: PropTypes.func,
  network: PropTypes.oneOfType[(PropTypes.string, PropTypes.number)]
};

export default SwitchNetworkDialog;
