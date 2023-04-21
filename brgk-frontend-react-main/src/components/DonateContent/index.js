import { useRouter } from "next/router";
import React from "react";
import BergerakButton from "../Button/BergerakButton";
import PropTypes from "prop-types";

const DonateContent = ({ navigatePage, contentTitle, walletAddress, isContribute, proposalName, effortsLevel }) => {
  const { query, push: navigate } = useRouter();

  const navigateToMainPage = () => {
    navigate(`/`);
  };

  return (
    <div className="w-full px-4">
      <div className="w-full mt-24">
        <p className="font-bold text-[75px] leading-none uppercase">{contentTitle}</p>
        {/* <p className="text-xl font-bold">{query.address && truncateAddress(query.address, 4, 4)}</p> */}
        {/* Content 1 */}
        <div className="my-3.5 w-64">
          <p>
            Kamu, <span className="font-bold">{walletAddress}</span>,
          </p>
          <p>telah sukses mendukung proposal</p>
          <p className="capitalize font-bold text-[16px]">{proposalName}</p>
          {!isContribute && (
            <p className="text-sm">
              sebesar: <span className="font-bold text-md">{effortsLevel} BGRK</span>
            </p>
          )}
        </div>
        {/* Content 2 */}
        <div className="w-64">
          {!isContribute ? (
            <p>Ajak sebanyak-banyaknya saudara, teman, kenalan untuk ikut mendukung proyek itu ya</p>
          ) : (
            <p>Nah, sekarang kamu perlu ajak sebanyak-banyaknya saudara, teman, kenalan untuk mendukung ikut mendukung proyek itu.</p>
          )}
        </div>
        {/* Content 3 */}
        <div className="my-3.5">
          <p>
            Mari <span className="font-bold text-xl">BERGERAK!</span>
          </p>
        </div>
        {/* Content 4 */}
        {isContribute && (
          <div className="flex items-center space-x-5 align-middle">
            <p>Ingin berkontribusi BGRK</p>
            <BergerakButton handleClick={navigatePage} />
          </div>
        )}
      </div>
      <footer className="fixed left-0 bottom-10 w-full flex justify-center">
        <BergerakButton handleClick={navigateToMainPage} />
      </footer>
    </div>
  );
};

DonateContent.propTypes = {
  navigatePage: PropTypes.func,
  contentTitle: PropTypes.string,
  walletAddress: PropTypes.string,
  isContribute: PropTypes.bool,
  proposalName: PropTypes.string,
  effortsLevel: PropTypes.oneOfType[(PropTypes.string, PropTypes.number)]
};

export default DonateContent;
