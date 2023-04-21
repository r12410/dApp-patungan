import React from "react";
import Image from "next/image";
import UsersIcon from "../../assets/svg/users.svg";
import PipeIcon from "../../assets/svg/pipe.svg";
import HourglassIcon from "../../assets/svg/hourglass.svg";
import { classNames, truncateAddress } from "../../helpers";
import PropTypes from "prop-types";
import { useRouter } from "next/router";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import { BsCircleFill } from "react-icons/bs";

const ProposalCard = ({
  title,
  totalBalance,
  status,
  date,
  proposalAddress,
  minimumVote,
  deadlineCount,
  gatauIniApa,
  href = null,
  description = null
}) => {
  const { push: navigate } = useRouter();

  const navigateToProposalDetail = () => {
    if (href !== null) {
      navigate(href);
    }
  };

  return (
    <div className="w-full mx-auto flex flex-col font-roboto-c max-w-md relative">
      <div className="w-full flex justify-between items-center mb-3">
        <div onClick={navigateToProposalDetail} className={classNames("w-full flex flex-col", href !== null && "cursor-pointer")}>
          <p className="text-xs">{date}</p>
          <h1 className="font-bold text-sm md:text-base">{title}</h1>
          <p className="text-xs flex md:text-sm">{truncateAddress(proposalAddress, 5, 23)}</p>
        </div>
        <span className="flex text-sm w-fit space-x-1 items-center">
          <div className="flex items-center space-x-1">
            <p>{totalBalance}</p>
            <p className="font-bold">BGRK</p>
          </div>
          <div className="w-fit">
            {status === "TUNDA" && <BsCircleFill className="w-3.5 h-3.5 md:w-4 md:h-4 text-yellow-500" />}
            {status === "UNSUCCSESSFULL" && <BsCircleFill className="w-3.5 h-3.5 md:w-4 md:h-4 text-transparent" />}
            {status === "SUCCSESS" && <CheckCircleIcon className="w-[18px] h-[18px] md:w-5 md:h-5 text-green-500" />}
          </div>
        </span>
      </div>
      <div className="w-full flex justify-around items-center">
        <div className="w-full">{description && <p className="text-sm">tautan</p>}</div>
        <div className="flex space-x-3 [&>span]:flex [&>span]:space-x-1 [&>span]:items-center [&>span]:w-max">
          <span>
            <Image width={15} src={UsersIcon} alt="users logo" />
            <p className="text-xs">{minimumVote}</p>
          </span>
          <span>
            <Image width={15} src={PipeIcon} alt="users logo" />
            <p className="text-xs">{gatauIniApa}</p>
          </span>
          <span>
            <Image width={12} src={HourglassIcon} alt="users logo" />
            <p className="text-xs">{new Date(deadlineCount).toLocaleDateString()}</p>
          </span>
        </div>
      </div>
      {description && <p className="text-sm mt-3">{description}</p>}
    </div>
  );
};

ProposalCard.propTypes = {
  handleClick: PropTypes.func.isRequired,
  width: PropTypes.oneOfType[(PropTypes.string, PropTypes.number)],
  height: PropTypes.oneOfType[(PropTypes.string, PropTypes.number)],
  title: PropTypes.string,
  totalBalance: PropTypes.string,
  date: PropTypes.string,
  proposalAddress: PropTypes.string,
  minimumVote: PropTypes.string,
  deadlineCount: PropTypes.string,
  href: PropTypes.string,
  description: PropTypes.string,
  status: PropTypes.string
};

export default ProposalCard;
