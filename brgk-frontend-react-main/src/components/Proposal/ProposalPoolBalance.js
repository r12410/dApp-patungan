import Image from "next/image";
import React from "react";
import UsersLogo from "../../assets/svg/users.svg";
import PropTypes from "prop-types";
import { useRouter } from "next/router";
import { truncateAddress } from "../../helpers";

const ProposalPoolBalance = ({ balance, address }) => {
  const { push: navigate, query } = useRouter();
  return (
    <div className="flex justify-center" style={{ cursor: !query.address && "pointer" }}>
      <div
        onClick={() => !query.address && navigate(`/pool-detail/${address}`)}
        className="flex flex-col justify-center items-center font-roboto">
        <Image width={30} src={UsersLogo} alt="users logo" />
        <h1 className="text-xs mt-3">Patungan</h1>
        <span className="text-xs">{query.address && truncateAddress(query.address, 4, 5)}</span>
        <p className="font-bold text-2xl mb-1">{balance}</p>
        <p className="text-sm font-semibold">BRGK</p>
      </div>
    </div>
  );
};

ProposalPoolBalance.propTypes = {
  balance: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  address: PropTypes.string
};

export default ProposalPoolBalance;
