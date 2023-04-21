import React from "react";
import InfiniteScroll from "react-infinite-scroll-component";

const InfiniteScrolls = ({ children, next }) => {
  return (
    <div
      id="scrollableDiv"
      className="overflow-y-scroll scrollbar-hide"
      style={{
        height: 300,
        display: "flex",
        flexDirection: "column"
      }}>
      {/*Put the scroll bar always on the bottom*/}
      <InfiniteScroll
        dataLength={children.length}
        next={next}
        style={{ display: "flex", flexDirection: "column" }} //To put endMessage and loader to the top.
        inverse={true} //
        hasMore={true}
        loader={<h1>Loading ...</h1>}
        scrollableTarget="scrollableDiv">
        {children}
      </InfiniteScroll>
    </div>
  );
};

export default InfiniteScrolls;
