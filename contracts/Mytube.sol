//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

contract MyTube {
  uint public videoCount = 0;
  string public name = "MyTube";
  mapping(uint => Video) public videos;

  struct Video {
    uint id;
    string hash;
    string title;
    address author;
  }

  event VideoUploaded(
    uint id,
    string hash,
    string title,
    address author
  );


  function uploadVideo(string memory _videoHash, string memory _title) public {
    require(bytes(_videoHash).length > 0,"Video has doesn't exist");
    require(bytes(_title).length > 0,"title length can't be 0");
    require(msg.sender!=address(0),"Address is 0 address");

    videoCount ++;


    videos[videoCount] = Video(videoCount, _videoHash, _title, msg.sender);

    emit VideoUploaded(videoCount, _videoHash, _title, msg.sender);
  }

  function getVideoDetails(uint id)public view returns(Video memory){
      Video storage video = videos[id];
      return video;  
  }
}

