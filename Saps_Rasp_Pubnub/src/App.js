import Display1screen from "./components/Displays/Display1screen";
import Display2screens from "./components/Displays/Display2screens";
import Display4screens from "./components/Displays/Display4screens";
import { io } from "socket.io-client";
import { useEffect, useState, useRef } from "react";
import { VideoContext } from "./Context/VideoContext";


import qrcode from "./Images/qrcode.png";
import moment from 'moment';
import burnerad1 from "./data.json";

import schJsonFile from "./schedule/hello.json";

import camera from "./Images/camera.png";
import nocamera from "./Images/nocamera.png";

import navbaricon from "./Images/navbaricon.png";
// import SapsPurple from "./Images/SapsPurple.jpg";
import SapsPurple from "./Images/PostMyAddLogo.png";
//import SapsPurple from "./Images/skai_logo_psd.png";
//===> For update screen image
import { FETCH_URL } from "./fetchIp";
import macadd from "./macadd.json";
import { Typography } from "@mui/material";
//============================== PUBNUB Initialization ===================================//
// import PubNub from "pubnub";
// import ReactPlayer from "react-player/youtube";
import ReactPlayer from "react-player/lazy";
// import { PubNubProvider, usePubNub } from "pubnub-react";
// import readFile from "./readFile";
//let macadd = "1234"
// const pubnub = new PubNub({
//   publishKey: "pub-c-90d5fa5c-df63-46c7-b5f2-2d6ad4efd775",
//   subscribeKey: "sub-c-81c16c55-f391-4f72-8e57-2d9e052a360c",
//   // publishKey: "pub-c-1a0b4b54-d0f4-4493-86d8-fc2d56a06f55",
//   // subscribeKey: "sub-c-3df591b2-a923-460c-8078-2ab79fea5016",
//   restore: true,
//   presenceTimeout: 20,
//   autoNetworkDetection: true,

//   keepAliveSettings: {
//     keepAliveMsecs: 3600,
//     freeSocketKeepAliveTimeout: 3600,
//     timeout: 3600,
//     maxSockets: Infinity,
//     maxFreeSockets: 256
//   },
//   requestTimeout: 5*60000,
//   userId: PubNub.generateUUID(),

// });

//let DeviceID = "Device 2"
// let DeviceID;


//====================================================================================//
function App() {
  // const [channels, setChannels] = useState([macadd[0].macaddress]);
  // const [socket, setSocket] = useState(null);
  
  const [videosdata, setVideosdata] = useState(null);
  const [displaytype, setDisplaytype] = useState(null);
  const [filetype, setFiletype] = useState("");
  //=========> To show code
  const [showqrcode, setShowqrcode] = useState(false);

  const [fullscreenvideostatus, setFullscreenvideostatus] = useState(false);
  const [videoStatus1, setVideoStatus1] = useState(false);
  const [videoStatus2, setVideoStatus2] = useState(false);
  const [videoStatus3, setVideoStatus3] = useState(false);
  const [videoStatus4, setVideoStatus4] = useState(false);

  const [videolink, setVideolink] = useState(null);
  const [videolink1, setVideolink1] = useState(null);
  const [videolink2, setVideolink2] = useState(null);
  const [videolink3, setVideolink3] = useState(null);
  
  const [fullscreenvideotag, setFullscreenvideotag] = useState(null);
  const [videoname, setVideoname] = useState("");
  const [videonamewebm, setVideonamewebm] = useState("");
  const [videonamemov, setVideonameMOV] = useState("");
  const [burnerVideoname, setBurnerVideoname] = useState("");
  const [imagename, setImagename] = useState("");
  const [updatescreen, setupdatescreen] = useState(false);
  const [videotag, setVideotag] = useState(null);
  const [videotag1, setVideotag1] = useState(null);
  const [videotag2, setVideotag2] = useState(null);
  const [videotag3, setVideotagwebm3] = useState(null);
  const [mutedStatus, setMutedStatus] = useState(false);

  const [online, setOnline] = useState(true);
  const [sensorval, setSensorval] = useState(true);
  const [playmode, setPlaymode] = useState(false);
  const [burnerad, setBurnerAd] = useState(burnerad1);
  // const [cameraC, setCameraC] = useState(false);

  const [cameraC, setCameraC] = useState(false);
  
  const [networkPubNub, setNetworkPubNub] = useState(false);
  // const [timeoutInterval, setTimeoutInterval] = useState(null);
  const [nextSlot, setNextSlot] = useState(false);

  
  const [schFile, setSchFile] = useState(schJsonFile)
  const [currentPlay, setCurrentPlay] = useState(false);
  console.log("schjsonfile", schFile);

  const socket = io("http://127.0.0.1:8000",{
    pingTimeout:60000,
    pingInterval:25000
  });

  // Play

  function reloadAd() {

    socket.emit("stop", {"orderId": "item.orderId"})

    const random = Math.floor(Math.random() * burnerad?.list?.length);
 
    console.log("burneradddddddd", burnerad?.list[random]);
    setBurnerVideoname(burnerad?.list[random]);
    setDisplaytype("fullscreen"); //==> "fullscreen",  "quadrant"
    setFullscreenvideostatus(true);
    setFiletype("burnerad");
    // if (!currentPlay && !nextSlot) {
      setTimeout(() => {
        reloadAd()
      }, 30000);

    // }
  }

  const playmedia = () => {
    console.log("CAlling playmedia ")

    if (schFile.length > 0 && !updatescreen && !showqrcode) {
      console.log("schFile length ", schFile.length)
      let item = schFile.pop()
      // if (schFile.length > 0) {
      while (new Date(item.scheduleDate).getTime() < new Date().getTime()) {
        console.log("condition not match popping itms ", schFile.length)
        if(schFile.length == 0){
          reloadAd()
          return
        } else {

          item = schFile.pop()
        }
        }
        
      console.log("Play", item)

      if (item.filetype === "url" && (new Date(item.scheduleDate).getTime() >= new Date().getTime())) {
        setTimeout(() => {
          setCurrentPlay(true);
          socket.emit("play", {"orderId": item.orderId, "second": item.scheduleDate})
        
          console.log("========================Url")
          setFullscreenvideostatus(true)
          setDisplaytype("fullscreen")
          setVideoname(item.videoname)
          setFiletype(item.filetype)

            playmedia()


        }, new Date(item.scheduleDate).getTime() - new Date().getTime());
      }

      if (item.filetype === "image/jpeg" && (new Date(item.scheduleDate).getTime() >= new Date().getTime())) {
        console.log("========================jpeg")
        
        setTimeout(() => {
          console.log("setTimeOut", item.videoname, item.filetype );
          setCurrentPlay(true);
          socket.emit("play", {"orderId": item.orderId, "second": item.scheduleDate})
          setFullscreenvideostatus(true)
          setDisplaytype("fullscreen")
          setImagename(item.videoname)
          setFiletype(item.filetype)

            playmedia()

        }, new Date(item.scheduleDate).getTime() - new Date().getTime());
      }

      if (item.filetype === "video/webm" && (new Date(item.scheduleDate).getTime() >= new Date().getTime())) {
        console.log("========================webm")
        setTimeout(() => {
          setCurrentPlay(true);
          socket.emit("play", {"orderId": item.orderId, "second": item.scheduleDate})

          console.log("========================Inside TimeOUT WEBM")

          setFiletype(item.filetype)
          setFullscreenvideostatus(true)
          setDisplaytype("fullscreen")
          setVideonamewebm(item.videoname)

            playmedia()

        }, new Date(item.scheduleDate).getTime() - new Date().getTime());
      }

      if (item.filetype === "video/mp4" && (new Date(item.scheduleDate).getTime() >= new Date().getTime())) {
        console.log("========================mp4")
        setTimeout(() => {
          setCurrentPlay(true);
          socket.emit("play", {"orderId": item.orderId, "second": item.scheduleDate})

          setFiletype(item.filetype)
          console.log("========================mp4 item.filetype",item.filetype)
          setFullscreenvideostatus(true)
          setDisplaytype("fullscreen")
          setVideoname(item.videoname)
          console.log("========================mp4 item.videoname",item.videoname)
            
            playmedia()

        }, new Date(item.scheduleDate).getTime() - new Date().getTime());
      }

      if (item.filetype === "video/mov" && (new Date(item.scheduleDate).getTime() >= new Date().getTime())) {
        console.log("========================mov")
        setTimeout(() => {
          setCurrentPlay(true);
          socket.emit("play", {"orderId": item.orderId, "second": item.scheduleDate})

          setFullscreenvideostatus(true)
          setDisplaytype("fullscreen")
          setVideonameMOV(item.videoname)
          setFiletype(item.filetype)

          setTimeout(() => {
            console.log("Stoppppppppppppppppppp")
            socket.emit("stop", {"orderId": item.orderId})
            
            playmedia()

          }, 30000);
        }, new Date(item.scheduleDate).getTime() - new Date().getTime());
      }

      if (item.filetype === "burnerad" && (new Date(item.scheduleDate).getTime() >= new Date().getTime())) {
        console.log("========================burnerad",burnerad)
        setTimeout(() => {
          socket.emit("stop", {"orderId": "item.orderId"})
          console.log("========================burnerad timeout", burnerad);
          setCameraC(burnerad.camera ? true : false);
          if (burnerad?.list?.length > 0) {
            console.log("========================burnerad list",burnerad?.list?.length)
            const random = Math.floor(Math.random() * burnerad?.list?.length);
            setBurnerVideoname(burnerad?.list[random]);
            setDisplaytype("fullscreen"); //==> "fullscreen",  "quadrant"
            setFullscreenvideostatus(true);
            setFiletype("burnerad");
          } else {
            setCurrentPlay(false)
            setDisplaytype(null);
            setFullscreenvideostatus(false);
            setVideolink("");
            setImagename("");
            setVideoname("");
            setVideonamewebm("");
            setFiletype("");

          }            
            playmedia()

        }, new Date(item.scheduleDate).getTime() - new Date().getTime());
      } 

    } else {
      if(!updatescreen && !showqrcode){
        console.log("schedule over")
        reloadAd()
      }
      else if(updatescreen && !showqrcode){
        // if (item.filetype === "updating" ) {
          console.log("========================updating")
          
            // socket.emit("play", {"orderId": item.orderId})
            setFullscreenvideostatus(true)
            setDisplaytype("fullscreen")
            setImagename("")
            setFiletype(updating)
              playmedia()
          
        // }
      }
    }

  }

  useEffect(() => {
    playmedia()
    socket.on("connect", ()=> {
      console.log("Socket.io connected Successfully");
    })
    socket.on("burnerAdEvent", (data) => {
      console.log("data from burnerAdEvent socket.io=>", data);
        setCameraC(data.camera)
    })

    socket.on("updating", (data) => {
      console.log("data from updating socket.io=>", data);
        setupdatescreen(data.updatescreen);
    })

    socket.on("showqr", (data) => {
      console.log("data from ShowQr socket.io=>", data);
        setShowqrcode(data.showqr);
    })

    socket.on("reloadPage", function() {
      console.log("Reloading Page To get New Content To Be Playes socket.io");
      window.location.reload();
    })
   
  }, [])

  useEffect(() => {       
    
      console.log("data from burnerad mm=>", burnerad)
      
  }, [burnerad])


  return (
    <div style={{ display: "flex", width: "100%" }}>
      <div style={{ position: "absolute", top: "10px", right: "10px" }}>
        {cameraC ?
          <img src={camera} /> :
          <img src={nocamera} />
        }
      </div>

      {
        online === false ? (
          <>
            <div
              style={{
                height: "100vh",
                width: "100%",
                backgroundColor: "black",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <img
                style={{ width: "500px", height: "500px", marginBottom: "10px" }}
                src={qrcode}
              />
              <Typography style={{ color: "white", marginBottom: "15px" }}>
                NOT CONNECTED TO INTERNET{" "}
              </Typography>
              <Typography style={{ color: "white", marginBottom: "25px" }}>
                STEPS TO CONNECT TO WiFi{" "}
              </Typography>
              <Typography style={{ color: "white", marginBottom: "10px" }}>
                1. Press & Hold Button 4 On Device For 3 Seconds{" "}
              </Typography>
              <Typography style={{ color: "white", marginBottom: "10px" }}>
                2. Now Turn ON Your Mobile WiFi & Scan Your Device{" "}
              </Typography>
              <Typography style={{ color: "white", marginBottom: "10px" }}>
                3. Now Connect Your Mobile To Device
              </Typography>
              <Typography style={{ color: "white", marginBottom: "10px" }}>
                4. Now Scan the Upper QR Code And Open The URL Provided Into The Browser
              </Typography>
              <Typography style={{ color: "white", marginBottom: "10px" }}>
                5. Now Enter Credential of Your WiFi, And Press Connect
              </Typography>
            </div>
          </>
        ) : (
          <>
            <VideoContext.Provider value={{ displaytype }}>
              {showqrcode == true ? (
                <>
                  <div
                    style={{
                      height: "100vh",
                      width: "100%",
                      color: "white",
                      backgroundColor: "black",
                      fontSize: "0.8rem",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      overflow: "hidden"
                    }}
                  >
                    <img
                      style={{
                        width: "500px",
                        height: "500px",
                        marginBottom: "5px",
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        backgroundRepeat: "no-repeat",
                        borderRadius: "10px",
                      }}
                      src={
                        showqrcode == true
                          ? require(`./Qrcode/qrcode.png`)
                          : SapsPurple
                      }
                    />
                    <h1>SCAN THE QR CODE TO ADD DEVICE</h1>
                  </div>
                </>
              ) : (
                <>
                  {
                    displaytype != null ? (
                      <>
                        {displaytype == "fullscreen" && fullscreenvideostatus && (
                          // <Display1screen
                          //   video={videolink}
                          //   video1status={fullscreenvideostatus}
                          //   fileName={fullscreenvideotag}
                          //   filenametype={filetype}
                          // />
                          <>
                            {fullscreenvideostatus == true &&
                              // fullscreenvideotag != null &&
                              filetype != null ? (
                              <>
                                <div
                                  style={{
                                    height: "100vh",
                                    width: "100vw",
                                    //backgroundColor : "red",
                                    // position: "absolute",
                                    top: "0",
                                    left: "0",
                                  }}
                                >
                                  {filetype && filetype == "video/mp4" && videoname && (
                                    <>
                                      {console.log("Video  Mp4")}

                                      <video
                                        style={{
                                          backgroundColor: "black",
                                          objectFit: "contain",
                                          minHeight: "100vh",
                                          minWidth: "100vw",
                                          height: "100vh",
                                          width: "100vw",
                                        }}
                                        controls
                                        loop
                                        //value={vidRef}
                                        autoPlay
                                        muted={true}
                                        //muted={false}
                                        //src={"http://localhost:8000/videos/surfing_720p.mp4"}
                                        src={require(`./Videos/${videoname}.mp4`)}
                                        type="video/mp4"
                                      ></video>
                                    </>
                                  )}


                                  {filetype && filetype == "video/webm" && videonamewebm && (
                                    <>
                                      {console.log("Video WEbM")}
                                      <video
                                        style={{
                                          backgroundColor: "black",
                                          objectFit: "contain",
                                          minHeight: "100vh",
                                          minWidth: "100vw",
                                          height: "100vh",
                                          width: "100vw",
                                        }}
                                        controls
                                        loop
                                        //value={vidRef}
                                        autoPlay
                                        muted={true}
                                        //muted={false}
                                        //src={"http://localhost:8000/videos/surfing_720p.mp4"}
                                        src={require(`./Videos/${videonamewebm}.webm`)}
                                        type="video/webm"
                                      ></video>
                                    </>
                                  )}


                                  {filetype && filetype == "video/mov" && videonamemov && (
                                    <>
                                      {console.log("Video MOV")}
                                      <video
                                        style={{
                                          backgroundColor: "black",
                                          objectFit: "contain",
                                          minHeight: "100vh",
                                          minWidth: "100vw",
                                          height: "100vh",
                                          width: "100vw",
                                        }}
                                        controls
                                        loop
                                        //value={vidRef}
                                        autoPlay
                                        muted={true}
                                        //muted={false}
                                        //src={"http://localhost:8000/videos/surfing_720p.mp4"}
                                        src={require(`./Videos/${videonamewebm}.mov`)}
                                        type="video/mov"
                                      ></video>
                                    </>
                                  )}


                                  {filetype && filetype == "image/jpeg" && imagename && (
                                    <>
                                      {console.log("  iM")}
                                      <img
                                        style={{
                                          objectFit: "contain",
                                          minHeight: "100%",
                                          minWidth: "100%",
                                          height: "100%",
                                          width: "100%",
                                          backgroundSize: "contain",
                                          backgroundPosition: "center",
                                          backgroundRepeat: "no-repeat",
                                        }}
                                        // src={SapsPurple}
                                        src={require(`./images_ad/${imagename}.jpg`)}
                                      />
                                    </>
                                  )}

                                  {filetype && filetype == "url" && (
                                    <ReactPlayer
                                      playing
                                      width={"100%"}
                                      height={"100vh"}
                                      //url="https://www.youtube.com/watch?v=668nUCeBHyY"
                                      url={videoname && videoname}
                                      muted={true}
                                      autoplay={true}
                                      loop={true}
                                    />
                                  )}

                                  {/* ==================== For Loading ============== */}
                                  {filetype && filetype == "updating" && updatescreen && (
                                    <>
                                      <div
                                        style={{
                                          height: "100vh",
                                          width: "100%",
                                          color: "white",
                                          backgroundColor: "black",
                                          fontSize: "2rem",
                                          display: "flex",
                                          flexDirection: "column",
                                          justifyContent: "center",
                                          alignItems: "center",
                                        }}
                                      >
                                        <img
                                          style={{
                                            width: "100%",
                                            height: "100vh",
                                            marginBottom: "5px",
                                            backgroundSize: "cover",
                                            backgroundPosition: "center",
                                            backgroundRepeat: "no-repeat",
                                            borderRadius: "10px",
                                          }}
                                          src={require("./Images/post_my_add_update.gif")}
                                        //src={require("./Images/skai_update.gif")}
                                        />
                                        {/* <h1>UPDATING...</h1> */}
                                      </div>{" "}
                                    </>
                                  )}

                                  {/* {----------For Burner Ad----------------} */}

                                  {filetype && filetype == "burnerad" && burnerVideoname && (
                                    <>
                                      {console.log("burned player")}
                                      <video
                                        style={{
                                          objectFit: "cover",
                                          minHeight: "100%",
                                          minWidth: "100%",
                                          height: "100%",
                                          width: "100%",
                                        }}
                                        controls
                                        loop
                                        autoPlay
                                        muted={true}
                                        src={require(`./BurnerAd/${burnerVideoname}`)}
                                        type="video/mp4"
                                      ></video>
                                    </>
                                  )}

                                  {/* {----------For Burner Ad----------------} */}


                                  {filetype && filetype == "pubnubNetwork" && networkPubNub && (
                                    <>
                                      <div
                                        style={{
                                          objectFit: "contain",
                                          height: "100%",
                                          width: "100%",
                                          color: "white",
                                          backgroundColor: "black",
                                          fontSize: "1.2rem",
                                          display: "flex",
                                          flexDirection: "column",
                                          justifyContent: "center",
                                          alignItems: "center",
                                        }}
                                      >
                                        <img
                                          style={{
                                            objectFit: "contain",
                                            minHeight: "100%",
                                            minWidth: "100%",
                                            height: "100%",
                                            width: "100%",
                                            backgroundSize: "contain",
                                            backgroundPosition: "center",
                                            backgroundRepeat: "no-repeat",
                                          }}
                                          src={SapsPurple}
                                        />
                                        <h1 style={{ position: "absolute", bottom: 0 }}>NETWORK DOWN </h1>
                                      </div>{" "}
                                    </>
                                  )}


                                  {/* <video
                          style={{
                            backgroundColor: "red",
                            objectFit: "cover",
                            minHeight: "100%",
                            minWidth: "100%",
                          }}
                          controls
                          muted
                          loop
                          autoPlay={true}
                          //src={"http://localhost:8000/videos/surfing_720p.mp4"}
                          //src ={videolink}
                          src={require(`../../Videos/${filename}.mp4`)}
                          type="video/mp4"
                        ></video> */}
                                </div>
                              </>
                            ) : (
                              <>
                                <div
                                  style={{
                                    objectFit: "contain",
                                    height: "100vh",
                                    width: "100%",
                                    color: "white",
                                    backgroundColor: "black",
                                    fontSize: "1.2rem",
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "center",
                                    alignItems: "center",
                                  }}
                                >
                                  <img
                                    style={{
                                      objectFit: "contain",
                                      minHeight: "100%",
                                      minWidth: "100%",
                                      height: "100%",
                                      width: "100%",
                                      backgroundSize: "contain",
                                      backgroundPosition: "center",
                                      backgroundRepeat: "no-repeat",
                                    }}
                                    src={SapsPurple}
                                  />
                                  {/* <h1>NO VIDEO SOURCE</h1> */}
                                </div>{" "}
                              </>
                            )}
                          </>
                        )}

                        {/* {displaytype == "quadrant" && (
                  <Display4screens
                    video={videolink}
                    video1={videolink1}
                    video2={videolink2}
                    video3={videolink3}
                    video1status={videoStatus1}
                    video2status={videoStatus2}
                    video3status={videoStatus3}
                    video4status={videoStatus4}
                    videoname={videotag}
                    videoname1={videotag1}
                    videoname2={videotag2}
                    videoname3={videotag3}
                  />
                )} */}
                      </>
                    ) : (
                      <>
                        <div
                          style={{
                            objectFit: "contain",
                            height: "100vh",
                            width: "100%",
                            color: "white",
                            backgroundColor: "black",
                            fontSize: "1.2rem",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          <img
                            style={{
                              objectFit: "contain",
                              minHeight: "100%",
                              minWidth: "100%",
                              height: "100%",
                              width: "100%",
                              backgroundSize: "contain",
                              backgroundPosition: "center",
                              backgroundRepeat: "no-repeat",
                            }}
                            src={SapsPurple}
                          />

                          {/* <h1>NO VIDEO SOURCE</h1> */}
                        </div>
                      </>
                    )}
                </>
              )}
            </VideoContext.Provider>
          </>
        )}
    </div>
  );
}
export default App;
