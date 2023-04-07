console.log("//============= PostMyadd BAckend has been started ==============//")
// const { pubnub } = require("./pubnub-module");
const PubNub = require("pubnub");
const download = require("download");
const unzipper = require("unzipper");
// const path = require("path");
const axios = require("axios");
const { exec, spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const { SerialPort } = require("serialport");
var Wifi = require("rpi-wifi-connection");
var wifi = new Wifi();
const port = new SerialPort({ path: "/dev/ttyS0", baudRate: 115200 });
var qr = require("qr-image");
//=========> For Git Update Library
const AutoGitUpdate = require("auto-git-update");
const { stdout, mainModule, stderr } = require("process");
const schedule = require("node-schedule");
const checkDiskSpace = require('check-disk-space').default

const express = require("express")
const cors = require("cors");
const app = express()
const httpServer = require('http').createServer(app);
const socketio = require('socket.io');

// Imports the Google Cloud client library
const vision = require('@google-cloud/vision');

// Import the Node_Webcam liberary
var NodeWebcam = require("node-webcam");

// Import the Moment liberary for time
const moment = require('moment');

var { Base64 } = require("./Base64");

const { ReadlineParser } = require("@serialport/parser-readline");
const { clearInterval } = require("timers");

const packageJson = require("./package.json")

const version = packageJson.version;
console.log("versionnnnnnn", version);

// let time = moment();

let timer = null;

//------------------------------------------- Socket.io--------------------------------------------//

const server = new socketio.Server(httpServer, {
    cors: {
        origin: '*'
    },
    pingTimeout:60000,
    pingInterval:25000
});
app.use(cors());
server.on('connection', (client) => {
    console.log("Connection to socket")
    client.on('play', data => {
        console.log("play =>", data)
        orderId = data.orderId;
        second = data.second;

        console.log("Clearing timer for photo in play function");
        clearInterval(timer);

        // start timer to click photo
        console.log("Starting timer for photo");

                pubnub.publish(
                    {
                        channel: masterChannel,
                        message: {
                            mac_id: publishChannel,
                            eventname: "playresp",
                            orderId: orderId,
                            second: second,
                            status: "played"
                        },
                        publishTimeout: 5*60000
                    },
                    (status, response) => {
                        console.log("Status Pubnub ===> ", status);
                    }
                );


        timer = setInterval(click_photo, 5000);
    })
    client.on('stop', data => {
        console.log("stop =>", data)

        console.log("Clearing timer for photo in play function");
        clearInterval(timer);
    })
    client.send("message", "hello")
    client.on("disconnect", () => {
        console.log("disconnected")
    })
})

httpServer.listen(8000, () => {
    console.log("Server Running")
})

//-------------------------------------------------------------------------------------------------//

//-------------------------------------------Necessary Folders-------------------------------------//

let dir = null;

let dir_schedule = null;

let dir_videos = null;

let dir_images_ad = null;

let dir_new_videos = null;

let dir_new_images_ad = null;

function createNecessaryFolders(){

    if (!dir) {
        dir = path.join(__dirname, "/Saps_Rasp_Pubnub/src/BurnerAd/")
        if (!fs.existsSync(dir)) {
            console.log("Creating Burner Ad Folder===")
            fs.mkdirSync(dir)
        } else {
            console.log("===== BurnerAd Folder Already Exist=====")
        }
    }
    
    if (!dir_schedule) {
        dir_schedule = path.join(__dirname, "./Saps_Rasp_Pubnub/src/schedule")
        if (!fs.existsSync(dir_schedule)) {
            console.log("Creating schedule Folder===")
            fs.mkdirSync(dir_schedule)
        } else {
            console.log("===== schedule Folder Already Exist=====")
        }
    }
    
    if (!dir_videos) {
        dir_videos = path.join(__dirname, "/Saps_Rasp_Pubnub/src/Videos")
        if (!fs.existsSync(dir_videos)) {
            console.log("Creating Videos Folder===")
            fs.mkdirSync(dir_videos)
        } else {
            console.log("===== Videos Folder Already Exist=====")
        }
    }
    
    if (!dir_images_ad) {
        dir_images_ad = path.join(__dirname, "/Saps_Rasp_Pubnub/src/images_ad")
        if (!fs.existsSync(dir_images_ad)) {
            console.log("Creating images_ad Folder===")
            fs.mkdirSync(dir_images_ad)
        } else {
            console.log("===== images_ad Folder Already Exist=====")
        }
    }
    
    if (!dir_new_videos) {
        dir_videos = path.join(__dirname, "/Saps_Rasp_Pubnub/src/NewVideos")
        if (!fs.existsSync(dir_videos)) {
            console.log("Creating NewVideosFolder===")
            fs.mkdirSync(dir_videos)
        } else {
            console.log("===== NewVideos Folder Already Exist=====")
        }
    }
    
    if (!dir_new_images_ad) {
        dir_new_images_ad = path.join(__dirname, "/Saps_Rasp_Pubnub/src/new_images_ad")
        if (!fs.existsSync(dir_new_images_ad)) {
            console.log("Creating new_images_ad Folder===")
            fs.mkdirSync(dir_new_images_ad)
        } else {
            console.log("===== new_images_ad Folder Already Exist=====")
        }
    }
}

createNecessaryFolders();

//----------------------------------------------------------------------------//

//----------------------------------- interface Webcam------------------------//

var opts = {

    width: 1920,

    height: 1080,

    quality: 100,

    frames: 1,

    output: "jpeg",

    callbackReturn: "base64",
};


//Creates webcam instance

var Webcam = NodeWebcam.create(opts);
var cam = 14
// get web cam list
function countwebCamList() {
    Webcam.list(function (list) {
        // console.log("============WEBCAM COUNT==========", list.length)
        cam = list.length
    })
}

//----------------------------------------------------------------------------------------------//

let pubnub;

var slot;

var adPlaying = false;

var burnerAdPlaying = false;
var update_screen = false;

let timer_burnerad = null;
var image;

//---------------------------------PUBNUB Channels-------------------------------------------------//

let masterChannel = "c3RvcmFnZS5zYXBzLm9uZQ=="           ///=====> For server Backend
let postmyaddChannel = "cG9zdE15QWRkQ2hhbm5lbA=="        ///===> For PostMybAckend update channel

let publishChannel;            //===> Device Original mac ID
let frontendChannel;          //===> For only Frontend
let a = [];

//for live content
let liveContentLink;
let fileType;
let burnerad;

let frontendstarted = false;


//-------------------------------OTA From GitHub Related Issue------------------------------------//

const config = {
    repository: "https://github.com/namanshandilyapsiborg/PostMyAdd",
    fromReleases: false,
    tempLocation: "/home/pi/Documents",
    //token: "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",
    //ignoreFiles: ['util/config.js'],
    //executeOnComplete: 'C:/Users/scheg/Desktop/worksapce/AutoGitUpdate/startTest.bat',
    //executeOnComplete: print(),
    exitOnComplete: false,
};
const updater = new AutoGitUpdate(config);

//-----------------------------------------------------------------------------------------------//

//====================== For Led =========================//
var Gpio = require("onoff").Gpio; //include onoff to interact with the GPIO
var LED = new Gpio(26, "out"); //use GPIO pin 4, and specify that it is output
var LED2 = new Gpio(26, "out"); //===> For QR Code LED GLOWING

//====================== For Qr COde ===========================//
const button = new Gpio(5, "in", "both");



// let a = ["jNWN2kTOwITNmBDN"];
// pubnub.subscribe({
//   channels: a,
// });


//========================= Getting MAcID ======================//
async function getChannel() {
    if (await fs.existsSync("./realmacadd.json") && await fs.existsSync("./frontendMac.json")) {
        console.log("//=== macadress Channel exist ==//");
        let data = fs.readFileSync("./realmacadd.json", "utf-8");
        //console.log("MAC id inside mac address json file ==> ", JSON.parse(data));
        let mcadd = JSON.parse(data);
        console.log("mcadd inside get_mac ===> ", mcadd[0].macaddress);
        //=================== For Frontend channel ==============================//
        let data1 = fs.readFileSync("./frontendMac.json", "utf-8");
        let mcadd1 = JSON.parse(data1);
        console.log("Frontend MAC ===> ", mcadd1[0].macaddress);

        // const uuid = PubNub.generateUUID();

        pubnub = new PubNub({
            publishKey: "pub-c-90d5fa5c-df63-46c7-b5f2-2d6ad4efd775",
            subscribeKey: "sub-c-81c16c55-f391-4f72-8e57-2d9e052a360c",

            // publishKey: "pub-c-1a0b4b54-d0f4-4493-86d8-fc2d56a06f55",
            // subscribeKey: "sub-c-3df591b2-a923-460c-8078-2ab79fea5016",
            //uuid: uuid,
            restore: true,
            presenceTimeout: 20,
            autoNetworkDetection: true,
            userId: mcadd[0].macaddress,

            keepAliveSettings: {
                keepAliveMsecs: 3600,
                freeSocketKeepAliveTimeout: 3600,
                timeout: 3600,
                maxSockets: Infinity,
                maxFreeSockets: 256
            },

            requestTimeout: 5*60000,

            withPresence: true
            //keepAlive : true,
        });

        //==================== Mac address to write to the device ======================//
        publishChannel = mcadd[0].macaddress
        frontendChannel = mcadd1[0].macaddress
        a.push(mcadd[0].macaddress);
        //let SkaiChannel = "c2thaVVwZGF0ZUNoYW5uZWw="
        //let postmyaddChannel = "cG9zdE15QWRkQ2hhbm5lbA=="
        a.push(postmyaddChannel)
        a.push(masterChannel)
        pubnub.subscribe({
            channels: a,
        });

        // getScheduleJson();

    }
}

// getChannel()

//========================= PUBNUB LISTENER ====================//

async function adlistner() {
    if (await fs.existsSync("./realmacadd.json") && await fs.existsSync("./frontendMac.json")) {

        pubnub.addListener({
            status: function (statusEvent) {
                if (statusEvent.category === "PNNetworkDownCategory") {
                    console.log("PNNetworkDownCategory ===> ", statusEvent.category);
                    pubnub.reconnect()
                }
                if (statusEvent.category === "PNConnectedCategory") {
                    console.log("statusEvent ===> ", statusEvent.category);
                }
                if (statusEvent.category === "PNNetworkUpCategory") {
                    console.log("statusEvent ===> ", statusEvent.category);
                } else {
                    console.log("//== Connection failed ===//");
                    // pubnub.reconnect();
                }
            },
            category: function (e) {
                console.log(e.category === "PNNetworkDownCategory");
            },
            message: function (messageEvent) {
                console.log("Message From Pubnub ===> ", messageEvent.message);
                //if(messageEvent.channel == "c2thaVVwZGF0ZUNoYW5uZWw=")
                if (messageEvent.channel == postmyaddChannel) {
                    //=====================================================================//
                    if (messageEvent.message.eventname == "update") {
                        forceUpdater()
                    }

                    if (messageEvent.message.eventname == "autoupdate") {
                        autoUpdater()
                    }

                    if (messageEvent.message.eventname == "autoUpdateTimer") {
                        autoUpdateTimer()
                    }
                    if (messageEvent.message.eventname == "updateScreenEnabled") {
                        showUpdateScreen("updateScreenEnabled")
                    }
                    if (messageEvent.message.eventname == "updateScreenDisabled") {
                        showUpdateScreen("updateScreenDisabled")
                    }
                    if (messageEvent.message.eventname == "force reboot") {
                        console.log("//=== Rebooting ForceFully =========//")
                        exec("sudo reboot")
                    }
                    if (messageEvent.message.eventname == "space available") {
                        console.log("//===Checking Disk Space =========//")
                        checkSpace();
                    }

                    if (messageEvent.message.eventname == "delete_aftr_two_hr") {
                        console.log("//=== delete_aftr_two_hr =========//")
                        deleteFilesAftertwoHours(2 * 3600 * 1000);
                    }

                    if (messageEvent.message.eventname == "download_burner_ad") {
                        console.log("//===Downloading Burner ad=========//")
                        DownloadBurnerAdZip(
                            // ==> Download Function
                            messageEvent.message.fileurl,
                            messageEvent.message.uniquefilename,
                            messageEvent.message.filetype
                        );
                    }


                    if (messageEvent.message.eventname == "force reboot") {
                        console.log("//=== Rebooting ForceFully =========//")
                        exec("sudo reboot")
                    }

                    if (messageEvent.message.eventname == "space available") {
                        console.log("//===Checking Disk Space =========//")
                        checkSpace();
                    }
                    if (messageEvent.message.eventname == "download_schedule_file") {
                        console.log("//=== download_schedule_file =========//")
                        getScheduleJson();

                    }
                    if (messageEvent.message.eventname == "delete_schedule_file") {
                        console.log("//=== delete_schedule_file =========//")
                        deleteScheduleJson();
                        // deleteScheduleMedia();
                        // moveContentFromNewLocationToOld();

                    }
                    if (messageEvent.message.eventname == "download_schedule_file_extra") {
                        console.log("//=== delete_schedule_file =========//")
                        // deleteScheduleJson();
                        // deleteScheduleMedia();
                        moveContentFromNewLocationToOld();

                    }

                    if (messageEvent.message.eventname == "restart_frontend") {
                        console.log("//=== restart_frontend =========//")
                        restartFrontend();
                    } 

                }

                else if (messageEvent.channel == masterChannel) {
                    if (messageEvent.message.eventname == "download_burner_ad") {
                        console.log("//===Downloading Burner ad Master Channel=========//")
                        DownloadBurnerAdZip(
                            // ==> Download Function
                            messageEvent.message.fileurl,
                            messageEvent.message.uniquefilename,
                            messageEvent.message.filetype
                        );
                    }

                    if (messageEvent.message.eventname == "delete_user_file") {
                        //console.log("Eventname => ", messageEvent.message.eventname);
                        DeleteUserFiles(
                            messageEvent.message.uniquename,
                            messageEvent.message.filetype
                        );
                    }
                }
                else {

                    if (messageEvent.message.eventname == "update") {
                        forceUpdater()
                    }
                    if (messageEvent.message.eventname == "autoupdate") {
                        autoUpdater()
                    }
                    if (messageEvent.message.eventname == "autoUpdateTimer") {
                        autoUpdateTimer()
                    }
                    if (messageEvent.message.eventname == "updateScreenEnabled") {
                        showUpdateScreen("updateScreenEnabled")
                    }
                    if (messageEvent.message.eventname == "updateScreenDisabled") {
                        showUpdateScreen("updateScreenDisabled")
                    }


                    if (messageEvent.message.eventname === "download_video") {
                        // DownloadVideoZip(
                        //     // ==> Download Function
                        //     messageEvent.message.fileurl,
                        //     messageEvent.message.uniquefilename,
                        //     messageEvent.message.filetype
                        // );
                    }


                    if (messageEvent.message.eventname == "download_burner_ad") {
                        console.log("//===Downloading Burner ad=========//")
                        DownloadBurnerAdZip(
                            // ==> Download Function
                            messageEvent.message.fileurl,
                            messageEvent.message.uniquefilename,
                            messageEvent.message.filetype
                        );
                    }

                    if (messageEvent.message.eventname == "delete_user_file") {
                        //console.log("Eventname => ", messageEvent.message.eventname);
                        DeleteUserFiles(
                            messageEvent.message.uniquename,
                            messageEvent.message.filetype
                        );
                    }


                    if (messageEvent.message.eventname == "get_device_file") {
                        //console.log("Eventname => ", messageEvent.message.eventname);
                        if (frontendstarted) {
                            getUserFilesName(messageEvent.message.filetype);
                        }
                        else {
                            pubnub.publish(
                                {
                                    channel: masterChannel,
                                    message: {
                                        mac_id: publishChannel,
                                        eventname: "resp_get_device_file",
                                        status: "Get Device File Failure",
                                    },
                                    publishTimeout: 5*60000
                                },
                                (status, response) => {
                                    console.log("Status Pubnub ===> ", status);
                                }
                            );
                        }

                    }

                    //============================= Play/Pause ===========================================//
                    if (messageEvent.message.eventname == "play") {
                        if (!update_screen) {
                            // PlayPauseVideo(messageEvent.message)
                        }

                    }   //=================== to stop the video =================>
                    if (messageEvent.message.eventname == "stop") {
                        if (!update_screen) {
                            // PlayPauseVideo(messageEvent.message)
                        }

                    }

                    if (messageEvent.message.eventname == "getlive") {
                        pubnub.publish(
                            {
                                channel: publishChannel,
                                message: {
                                    mac_id: publishChannel,
                                    eventname: "getlivelink",
                                    link: liveContentLink,
                                    fileType: fileType
                                },
                                publishTimeout: 5*60000
                            },
                            (status, response) => {
                                console.log("Status Pubnub ===> ", status);
                            }
                        );
                    }

                    if (messageEvent.message.eventname == "force reboot") {
                        console.log("//=== Rebooting ForceFully =========//")
                        exec("sudo reboot")
                    }

                    if (messageEvent.message.eventname == "space available") {
                        console.log("//===Checking Disk Space =========//")
                        checkSpace();
                    }
                    if (messageEvent.message.eventname == "download_schedule_file") {
                        console.log("//=== download_schedule_file =========//")
                        getScheduleJson();

                    }
                    if (messageEvent.message.eventname == "delete_schedule_file") {
                        console.log("//=== delete_schedule_file =========//")
                        deleteScheduleJson();
                        // deleteScheduleMedia();
                        // moveContentFromNewLocationToOld();

                    }
                    if (messageEvent.message.eventname == "download_schedule_file_extra") {
                        console.log("//=== delete_schedule_file =========//")
                        // deleteScheduleJson();
                        // deleteScheduleMedia();
                        moveContentFromNewLocationToOld();

                    }

                    if (messageEvent.message.eventname == "restart_frontend") {
                        console.log("//=== restart_frontend =========//")
                        restartFrontend();
                    }                    

                }
            },
            // presence: function (presenceEvent) {
            //     console.log("Handle Presence ===> ", presenceEvent);
            // },
        });
    }

}

// adlistner();

function checkWifiConnection() {

    return new Promise((resolve, reject) => {
        exec("iwconfig", (error, stdout, stderr) => {
            if (error) {
                console.warn(error);

            }
            // console.log("checkwifi ==>", typeof stdout)
            let myPattern = new RegExp('(\\w*' + "Not-Associated" + '\\w*)', 'gi')
            let matches = stdout.match(myPattern)

            if (matches) {
                // console.log("my pattern does exist")
                exec("sudo rfkill unblock wifi")
                exec("sudo ifconfig wlan0 up")
                console.log("======== Wifi connection is turned ON ==========")
                resolve(true)
            }
            reject("already connected")
        });
    });
}


checkWifiConnection().then((data) => {
    setTimeout(async () => {

        const child = exec(
            "ping -c 5 www.google.com",
            function (error, stdout, stderr) {
                if (error !== null) {
                    console.log("Internet Not available");
                } else {
                    console.log("Internet Available");
                    restart();
                }

            }
        );


        console.log("== connection done ==", data)
    }, 50000)

}).catch((err) => {
    const child = exec(
        "ping -c 5 www.google.com",
        function (error, stdout, stderr) {
            if (error !== null) {
                console.log("Internet Not available");
            } else {
                console.log("Internet Available");
                restart();
            }

        }
    );
    console.log("== connection done ==", err)
})


async function restart() {
    if (await fs.existsSync("./realmacadd.json") && await fs.existsSync("./frontendMac.json")) {

        await getChannel();

        await adlistner();

        deleteScheduleJson();

        let timer2 = setTimeout(async () => {
            console.log("Deleting Old File 2 Hr Older Content-------->>>>>>>");
            restartstatus();
            checkSpace();
            getScheduleJson();
            clearTimeout(timer2);
        }, 10000);

    }

}

// restart();

function restartstatus() {
    pubnub.publish(
        {
            channel: masterChannel,
            message: {
                mac_id: publishChannel,
                eventname: "devicerestart",
                status: "restarted",
                version: version
            },
            publishTimeout: 5*60000
        },
        (status, response) => {
            console.log("Status Pubnub ===> ", status);
        }
    );
}





//=======> Checking DiskSpace=======>
function checkSpace() {
    // On Linux or macOS
    checkDiskSpace('/home').then((diskSpace) => {
        console.log(diskSpace)
       
        // Note: `free` and `size` are in bytes

        totalSpace = (diskSpace.size / 1024) / 1024 / 1024;

        freeSpace = (diskSpace.free / 1024) / 1024 / 1024;

        totalSpace = totalSpace.toFixed(3);
        freeSpace = freeSpace.toFixed(3);

        console.log("Total Space in gIGA bYT3", totalSpace);
        console.log("Free Space in GB", freeSpace);

        pubnub.publish(
            {
                channel: masterChannel,
                message: {
                    mac_id: publishChannel,
                    eventname: "diskSpace",
                    totalspace: totalSpace,
                    freespace: freeSpace,
                    version: version
                },
                publishTimeout: 5*60000
            },
            (status, response) => {
                console.log("Status Pubnub ===> ", status);
            }
        );
    })
}





//===> To play Pause 
// function PlayPauseVideo(data) {
//     console.log("playPauseVideo func() ==> ", data)
//     countwebCamList()

//     //for google vision api------------------------------------------

//     orderId = data.orderId;
//     second = data.second;

//     if (data.eventname == "play") {
//         burnerAdPlaying = false;
//         console.log("Clearing timer for photo in play function");
//         clearInterval(timer);
//         console.log("Clearing timer for BurnerAd in play function");
//         clearInterval(timer_burnerad);

//         liveContentLink = data.contentLink
//         fileType = data.filetype
//         data["webcam"] = cam === 14 ? false : true
//         data["cameraEvent"] = "camera"
//         if (data && data.filetype == "image/jpeg") {
//             console.log("Image name ==> ", data.filename);
//             if (fs.existsSync(path.join(__dirname, `/Saps_Rasp_Pubnub/src/images_ad/${data.filename}.jpg`))) {
//                 console.log("//=== Yes Image exist ===//")
//                 if (frontendChannel) {
//                     pubnub.publish(
//                         {
//                             channel: frontendChannel,
//                             message: data,
//                         },
//                         (status, response) => {
//                             console.log("Status Pubnub ===> ", status);
//                         }
//                     );
//                 }

//                 pubnub.publish(
//                     {
//                         channel: masterChannel,
//                         message: {
//                             mac_id: publishChannel,
//                             eventname: "playresp",
//                             orderId: orderId,
//                             second: second,
//                             status: "played"
//                         },
//                         publishTimeout: 5*60000
//                     },
//                     (status, response) => {
//                         console.log("Status Pubnub ===> ", status);
//                     }
//                 );

//                 // start timer to click photo
//                 console.log("Starting timer for photo");
//                 timer = setInterval(click_photo, 5000);


//             }
//         }
//         if (data && data.filetype == "video/mp4") {
//             console.log("Video name ==> ", data.filename);
//             if (fs.existsSync(path.join(__dirname, `/Saps_Rasp_Pubnub/src/Videos/${data.filename}.mp4`))) {
//                 console.log("//=== Yes Video exist ===//")
//                 if (frontendChannel) {
//                     pubnub.publish(
//                         {
//                             channel: frontendChannel,
//                             message: data,
//                         },
//                         (status, response) => {
//                             console.log("Status Pubnub ===> ", status);
//                         }
//                     );
//                 }


//                 pubnub.publish(
//                     {
//                         channel: masterChannel,
//                         message: {
//                             mac_id: publishChannel,
//                             eventname: "playresp",
//                             orderId: orderId,
//                             second: second,
//                             status: "played"
//                         },
//                         publishTimeout: 5*60000
//                     },
//                     (status, response) => {
//                         console.log("Status Pubnub ===> ", status);
//                     }
//                 );

//                 // start timer to click photo
//                 console.log("Starting timer for photo");
//                 timer = setInterval(click_photo, 5000);

//             }
//         }

//         if (data && data.filetype == "video/webm") {
//             console.log("Video name ==> ", data.filename);
//             if (fs.existsSync(path.join(__dirname, `/Saps_Rasp_Pubnub/src/Videos/${data.filename}.webm`))) {
//                 console.log("//=== Yes Video exist ===//")
//                 if (frontendChannel) {
//                     pubnub.publish(
//                         {
//                             channel: frontendChannel,
//                             message: data,
//                         },
//                         (status, response) => {
//                             console.log("Status Pubnub ===> ", status);
//                         }
//                     );
//                 }


//                 pubnub.publish(
//                     {
//                         channel: masterChannel,
//                         message: {
//                             mac_id: publishChannel,
//                             eventname: "playresp",
//                             orderId: orderId,
//                             second: second,
//                             status: "played"
//                         },
//                         publishTimeout: 5*60000
//                     },
//                     (status, response) => {
//                         console.log("Status Pubnub ===> ", status);
//                     }
//                 );

//                 // start timer to click photo
//                 console.log("Starting timer for photo");
//                 timer = setInterval(click_photo, 5000);

//             }
//         }


//         if (data && data.filetype == "url") {
//             console.log("Video link ==> ", data.filename);
//             if (frontendChannel) {
//                 pubnub.publish(
//                     {
//                         channel: frontendChannel,
//                         message: data,
//                     },
//                     (status, response) => {
//                         console.log("Status Pubnub ===> ", status);
//                     }
//                 );
//             }

//             pubnub.publish(
//                 {
//                     channel: masterChannel,
//                     message: {
//                         mac_id: publishChannel,
//                         eventname: "playresp",
//                         orderId: orderId,
//                         second: second,
//                         status: "played"
//                     },
//                     publishTimeout: 5*60000
//                 },
//                 (status, response) => {
//                     console.log("Status Pubnub ===> ", status);
//                 }
//             );

//             // start timer to click photo
//             console.log("Starting timer for photo");
//             timer = setInterval(click_photo, 5000);
//         }

//         // // start timer to click photo
//         // console.log("Starting timer for photo");
//         // timer = setInterval(click_photo, 5000);
//     }
//     else if (data.eventname == "stop") {
//         liveContentLink = null;

//         console.log("Clearing timer for photo in stop function");
//         clearInterval(timer);

//         console.log("Clearing timer for BurnerAd in stop function");
//         clearInterval(timer_burnerad);

//         // getBurnerAdFileName(burnarAdFolder);

//         console.log("Burner ad list----->", burnerad.length);

//         if (burnerad.length > 0) {
//             burnerAdPlaying = true;
//             const random = Math.floor(Math.random() * burnerad.length)

//             liveContentLink = null;
//             data["filetype"] = "burnerad";
//             data["filename"] = burnerad[random];

//         }
//         else {
//             data["filetype"] = null;
//             data["filename"] = null;
//         }

//         if (frontendChannel) {
//             pubnub.publish(
//                 {
//                     channel: frontendChannel,
//                     message: data,
//                 },
//                 (status, response) => {
//                     console.log("Status Pubnub ===> ", status);
//                 }
//             );
//         }

//         pubnub.publish(
//             {
//                 channel: masterChannel,
//                 message: {
//                     mac_id: publishChannel,
//                     eventname: "playresp",
//                     orderId: orderId,
//                     second: second,
//                     status: "stopped"
//                 },
//                 publishTimeout: 5*60000
//             },
//             (status, response) => {
//                 console.log("Status Pubnub ===> ", status);
//             }
//         );

//         // console.log("Clearing timer for photo");
//         // clearInterval(timer);

//         timer_burnerad = setInterval(getBurnerAd, 30000);  //getBurnerAd(); playBurnerAd

//     }

// }


// let timer = setInterval(click_photo, 5000);

async function sendPhotoToServer(orderId, photo) {
    try {
        let body = {
            orderId,
            publishChannel,
            photo
        }
        let resp = await axios.post("http://api.postmyad.ai/api/order/orderViewsImage", body)
        // console.log("response from sendPhotoToServer====>", resp.data)
        console.log("response from sendPhotoToServer====>")
    } catch (error) {
        // console.log("Error From sendPhotoToServer====>", error)
        console.log("response from sendPhotoToServer <<<<<<<<<<<<<<ERROR>>>>>>>>>>>>>>>>====>")
    }
}

// Webcam.list( function( list ) {

//     //Use another device

//     var anotherCam = NodeWebcam.create( { device: list[ 1 ] } );

//     console.log(anotherCam);

// });


async function click_photo() {
    await NodeWebcam.capture(`./images/photo.jpg`, opts, function (err, data) {
        // image = "<img src='" + data + "'>";
        if (err) {
            // console.log("Error From Click_photo", err);
            console.log("Error From Click_photo");
        }
        image = data;
        console.log("Quickstart after photo clicked ==>");

        sendPhotoToServer(orderId, image);

    });
}

// Webcam.clear();

//------------------Google Vision---------------------------------//

// async function quickstart() {

//     let time = moment();

//     slot = time.format('H');

//     console.log(
//         "Today is:", slot
//     );

//     // Creates a client
//     const client = new vision.ImageAnnotatorClient({
//         keyFilename: "visionKey2.json"
//     });

//     // // Performs label detection on the9 image file
//     // const [result] = await client.faceDetection('./images/photo.jpg');

//     const [result] = await client.faceDetection({
//         image: {
//             source: { filename: './images/photo.jpg' }
//         },
//         features: [
//             {
//                 maxResults: 2000,
//                 type: vision.protos.google.cloud.vision.v1.Feature.Type.FACE_DETECTION,
//                 // type: "FACE_DETECTION",
//             },
//         ],
//     });


//     const faces = result.faceAnnotations;
//     faceCount = faces.length;
//     console.log('Faces ==>:', faceCount);

//     pubnub.publish(
//         {
//             channel: masterChannel,
//             message: {
//                 mac_id: publishChannel,
//                 eventname: "faceCount",
//                 orderId: orderId,
//                 faceCount: faceCount,
//                 timeSlot: slot
//             },
//             publishTimeout: 5*60000
//         },
//         (status, response) => {
//             console.log("Status Pubnub ===> ", status);
//         }
//     );

//     sendPhotoToServer(orderId, image)
// }
//   quickstart();



async function showUpdateScreen(eventname) {
    try {
        if (eventname && eventname == "updateScreenEnabled") {
            let versionChecker = await updater.compareVersions();
            console.log("Version Inside showUpdateScreen ===> ", versionChecker)
            if (versionChecker["remoteVersion"] && versionChecker.currentVersion != versionChecker.remoteVersion) {
                console.log("Clearing timer for BurnerAd in F11 Function function");
                clearInterval(timer_burnerad);

                // if (frontendChannel) {
                //     console.log("//=== yes frontend channel exist ===//")
                //     let data = {
                //         eventname: "play",
                //         filename: "updating",
                //         displaytype: "fullscreen",
                //         filetype: "updating"
                //     }
                //     if (data) {
                //         pubnub.publish(
                //             {
                //                 channel: frontendChannel,
                //                 message: data,
                //             },
                //             (status, response) => {
                //                 console.log("Status Pubnub ===> ", status);
                //             }
                //         );

                server.emit("updatingt", {
                    "updatescreen": true,                    
                });

                        pubnub.publish(
                            {
                                channel: masterChannel,
                                message: {
                                    mac_id: publishChannel,
                                    eventname: "updatescreenresp",
                                    status: "started"
                                },
                                publishTimeout: 5*60000
                            },
                            (status, response) => {
                                console.log("Status Pubnub ===> ", status);
                            }
                        );
                    // }
                }

                update_screen = true;
                // if(timer != null)
                //updatescreen/ {
                //     console.log("Clearing timer for photo in Update Screen Function");
                //     clearInterval(timer); 
                // }           
            // }
        }
        if (eventname && eventname == "updateScreenDisabled") {
            // if (frontendChannel) {
            //     let data = {
            //         eventname: "stop",
            //         filename: "updating",
            //         displaytype: "fullscreen",
            //         filetype: "updating"
            //     }
            //     if (data) {
            //         pubnub.publish(
            //             {
            //                 channel: frontendChannel,
            //                 message: data,
            //             },
            //             (status, response) => {
            //                 console.log("Status Pubnub ===> ", status);
            //             }
            //         );
            //     }
            // }

            server.emit("updatingt", {
                "updatescreen": false,                    
            });

            update_screen = false;
        }

    } catch (e) {
        console.log("Error in UpdateScreen Function")
        return;
    }

}


//==================== To Download Video ====================//
function DownloadVideoZip(fileurl, zipname, filetype) {
    console.log("Inside DownloadVideoZip ==> ", fileurl);
    if (fileurl && zipname && filetype) {
        const file = fileurl;

        checkSpace();

        //===> for video download ====>
        if (filetype == "video/mp4") {
            console.log(" //=== Video/mp4 ======//");
            //====> first check if video already downloaded
            if (fs.existsSync(path.join(__dirname, `/Saps_Rasp_Pubnub/src/Videos/${zipname}.mp4`))) {
                console.log("//=== File already exist =======//")
                //===> Pubnub Publish of Download Completion ===>
                let timer = setTimeout(() => {
                    pubnub.publish(
                        {
                            channel: masterChannel,
                            message: {
                                mac_id: publishChannel,
                                eventname: "Downloaded",
                                status: "Video Already Exist",
                                filename: zipname,
                                filetype: "video/mp4"
                            },
                            publishTimeout: 5*60000
                        },
                        (status, response) => {
                            console.log("Status Pubnub ===> ", status);
                        }
                    );
                    clearTimeout(timer)
                }, 3000)
                return;
            }
            else {
                const filePath = `${__dirname}/zippedfiles`;

                download(file, filePath).then(() => {
                    console.log("//==   Video Download Completed   ==//");

                    //============ Now unzip the file ==================//
                    console.log("Inside Zip file name ==>", zipname);
                    const path = `./zippedfiles/${zipname}.zip`;
                    console.log("path ==>", path);

                    try {

                        fs.createReadStream(path).pipe(
                            unzipper.Extract({ path: "./Saps_Rasp_Pubnub/src/Videos" })
                        );

                    } catch (e) {
                        console.log("Error in Extracting Video From zipped content", e);
                    }

                    setTimeout(() => {
                        try {
                            fs.unlinkSync(`./zippedfiles/${zipname}.zip`, () => {
                                console.log("deleted");
                            });

                        } catch (e) {
                            console.log("Error in deleting zipped content", e);
                        }
                    }, 10000);
                    //===> Pubnub Publish of Download Completion ===>
                    pubnub.publish(
                        {
                            channel: masterChannel,
                            message: {
                                mac_id: publishChannel,
                                eventname: "Downloaded",
                                status: "Download Success",
                                filename: zipname,
                                filetype: "video/mp4"
                            },
                            publishTimeout: 5*60000
                        },
                        (status, response) => {
                            console.log("Status Pubnub ===> ", status);
                        }
                    );


                });
            }
        }
        else if (filetype == "video/webm") {
            console.log(" //=== Video/webm ======//");
            //====> first check if video already downloaded
            if (fs.existsSync(path.join(__dirname, `/Saps_Rasp_Pubnub/src/Videos/${zipname}.webm`))) {
                console.log("//=== File already exist =======//")
                //===> Pubnub Publish of Download Completion ===>
                let timer = setTimeout(() => {
                    pubnub.publish(
                        {
                            channel: masterChannel,
                            message: {
                                mac_id: publishChannel,
                                eventname: "Downloaded",
                                status: "Video Already Exist",
                                filename: zipname,
                                filetype: "video/webm"
                            },
                            publishTimeout: 5*60000
                        },
                        (status, response) => {
                            console.log("Status Pubnub ===> ", status);
                        }
                    );
                    clearTimeout(timer)
                }, 3000)
                return;
            }
            else {
                const filePath = `${__dirname}/zippedfiles`;

                download(file, filePath).then(() => {
                    console.log("//==   Video Download Completed   ==//");

                    //============ Now unzip the file ==================//
                    console.log("Inside Zip file name ==>", zipname);
                    const path = `./zippedfiles/${zipname}.zip`;
                    console.log("path ==>", path);

                    fs.createReadStream(path).pipe(
                        unzipper.Extract({ path: "./Saps_Rasp_Pubnub/src/Videos" })
                    );
                    setTimeout(() => {
                        fs.unlinkSync(`./zippedfiles/${zipname}.zip`, () => {
                            console.log("deleted");
                        });
                    }, 1000);
                    //===> Pubnub Publish of Download Completion ===>
                    pubnub.publish(
                        {
                            channel: masterChannel,
                            message: {
                                mac_id: publishChannel,
                                eventname: "Downloaded",
                                status: "Download Success",
                                filename: zipname,
                                filetype: "video/webm"
                            },
                            publishTimeout: 5*60000
                        },
                        (status, response) => {
                            console.log("Status Pubnub ===> ", status);
                        }
                    );


                });
            }
        }
        else if (filetype == "image/jpeg") {
            if (fs.existsSync(path.join(__dirname, `/Saps_Rasp_Pubnub/src/images_ad/${zipname}.jpg`))) {
                console.log("//=== File already exist =======//")
                let timer = setTimeout(() => {
                    pubnub.publish(
                        {
                            channel: masterChannel,
                            message: {
                                mac_id: publishChannel,
                                eventname: "Downloaded",
                                status: "Image Already Exist",
                                filename: zipname,
                                filetype: "image/jpeg"
                            },
                            publishTimeout: 5*60000
                        },
                        (status, response) => {
                            console.log("Status Pubnub ===> ", status);
                        }
                    );
                    clearTimeout(timer)
                }, 3000)
                return;
            }
            else {
                const file = fileurl;
                console.log("Image file url ==> ", fileurl);
                //const filePath = `${__dirname}/zippedfiles`;
                const filePath = `${__dirname}/Saps_Rasp_Pubnub/src/images_ad`;
                download(file, filePath).then(() => {
                    console.log("//==  Image Download Completed   ==//");
                    //===> Pubnub Publish of Download Completion ===>
                    pubnub.publish(
                        {
                            channel: masterChannel,
                            message: {
                                mac_id: publishChannel,
                                eventname: "Downloaded",
                                status: "Download Success",
                                filename: zipname,
                                filetype: "image/jpeg"
                            },
                            publishTimeout: 5*60000
                        },
                        (status, response) => {
                            console.log("Status Pubnub ===> ", status);
                        }
                    );
                });
            }
        }
    }
}


//==================== To Download BurnerAd ====================//
function DownloadBurnerAdZip(fileurl, zipname, filetype) {
    console.log("Inside DownloadBurnerAdZip ==> ", fileurl);
    if (fileurl && zipname && filetype) {
        const file = fileurl;

        checkSpace();

        console.log("Clearing timer for BurnerAd in play function");
        clearInterval(timer_burnerad);

        //===> for video download ====>
        if (filetype == "video/mp4") {
            console.log(" //=== Video/mp4 ======//");
            //====> first check if video already downloaded
            if (fs.existsSync(path.join(__dirname, `/Saps_Rasp_Pubnub/src/BurnerAd/${zipname}.mp4`))) {
                console.log("//=== File already exist =======//")
                //===> Pubnub Publish of Download Completion ===>
                let timer = setTimeout(() => {
                    pubnub.publish(
                        {
                            channel: masterChannel,
                            message: {
                                mac_id: publishChannel,
                                eventname: "Downloaded",
                                status: "Video Already Exist",
                                filename: zipname,
                                filetype: "video/mp4"
                            },
                            publishTimeout: 5*60000
                        },
                        (status, response) => {
                            console.log("Status Pubnub ===> ", status);
                        }
                    );
                    clearTimeout(timer)
                }, 3000)
                return;
            }
            else {
                const filePath = `${__dirname}/zippedfiles`;

                download(file, filePath).then(() => {
                    console.log("//==   Video Download Completed   ==//");

                    //============ Now unzip the file ==================//
                    console.log("Inside Zip file name ==>", zipname);
                    const path = `./zippedfiles/${zipname}.zip`;
                    console.log("path ==>", path);

                    fs.createReadStream(path).pipe(
                        unzipper.Extract({ path: "./Saps_Rasp_Pubnub/src/BurnerAd" })
                    );
                    setTimeout(() => {
                        fs.unlinkSync(`./zippedfiles/${zipname}.zip`, () => {
                            console.log("deleted");
                        });
                    }, 1000);
                    //===> Pubnub Publish of Download Completion ===>
                    pubnub.publish(
                        {
                            channel: masterChannel,
                            message: {
                                mac_id: publishChannel,
                                eventname: "Downloaded",
                                status: "Download Success",
                                filename: zipname,
                                filetype: "video/mp4"
                            },
                            publishTimeout: 5*60000
                        },
                        (status, response) => {
                            console.log("Status Pubnub ===> ", status);
                            getBurnerAdFileName(burnarAdFolder);
                            timer_burnerad = setInterval(getBurnerAd, 30000); //getBurnerAd,playBurnerAd

                        }
                    );


                });
            }
        }
        //  else if (filetype == "image/jpeg") {
        //     if(fs.existsSync(path.join(__dirname , `/Saps_Rasp_Pubnub/src/images_ad/${zipname}.jpg`)))
        //     {
        //         console.log("//=== File already exist =======//")
        //         let timer = setTimeout(()=>{
        //             pubnub.publish(
        //                 {
        //                     channel: masterChannel,
        //                     message: {
        //                         mac_id :  publishChannel,
        //                         eventname : "Downloaded",
        //                         status: "Image Already Exist",
        //                         filename : zipname,
        //                         filetype : "image/jpeg"
        //                     },
        //                 },
        //                 (status, response) => {
        //                     console.log("Status Pubnub ===> ", status);
        //                 }
        //             );
        //             clearTimeout(timer)
        //         },3000)
        //         return ;
        //     }
        // else
        // {
        //     const file = fileurl;
        //     console.log("Image file url ==> ", fileurl);
        //     //const filePath = `${__dirname}/zippedfiles`;
        //     const filePath = `${__dirname}/Saps_Rasp_Pubnub/src/images_ad`;
        //     download(file, filePath).then(() => {
        //         console.log("//==  Image Download Completed   ==//");
        //         //===> Pubnub Publish of Download Completion ===>
        //         pubnub.publish(
        //             {
        //                 channel: masterChannel,
        //                 message: {
        //                     mac_id :  publishChannel,
        //                     eventname : "Downloaded",
        //                     status: "Download Success",
        //                     filename : zipname,
        //                     filetype : "image/jpeg"
        //                 },
        //             },
        //             (status, response) => {
        //                 console.log("Status Pubnub ===> ", status);
        //             }
        //         );
        //     });
        // }
        // }
    }
}





const imageFolder = './Saps_Rasp_Pubnub/src/images_ad/';
const videoFolder = './Saps_Rasp_Pubnub/src/Videos/';
const burnarAdFolder = './Saps_Rasp_Pubnub/src/BurnerAd/';

async function readFileNameAndTime(fileFolder, filetype) {

    try {

        let file = await fs.promises.readdir(fileFolder)

        let body = {
            files: file,
            deviceMacId: publishChannel,
            fileType: filetype
        }

        let resp = await axios.post("http://api.postmyad.ai/api/device/deviceGallery/deviceFiles", body)
        // console.log("response from sendPhotoToServer====>", resp.data)
        console.log("response from readFileNameAndTime====>")

        pubnub.publish(
            {
                channel: masterChannel,
                message: {
                    mac_id: publishChannel,
                    eventname: "resp_get_device_file",
                    status: "Get Device File Success",
                },
                publishTimeout: 5*60000
            },
            (status, response) => {
                console.log("Status Pubnub ===> ", status);
            }
        );

    } catch (error) {
        console.log("Error From sendPhotoToServer====>", error)
    }

}


async function getUserFilesName(filetype) {

    if (filetype === "video/mp4") {
        await readFileNameAndTime(videoFolder, filetype)
    }
    if (filetype === "video/webm") {
        await readFileNameAndTime(videoFolder, filetype)
    }
    if (filetype === "video/mov") {
        await readFileNameAndTime(videoFolder, filetype)
    }
    else if (filetype === "image/jpeg") {
        await readFileNameAndTime(imageFolder, filetype)
    }
    else if (filetype === "burnerad") {
        await readFileNameAndTime(burnarAdFolder, filetype)
    }

}


async function getBurnerAdFileName(fileFolder) {
    burnerad = await fs.promises.readdir(fileFolder)
    console.log("burnerrrrrrrrrrr---->>>>>>>", burnerad);
}

getBurnerAdFileName(burnarAdFolder);


// function playBurnerAd() {
//     countwebCamList();
//     console.log("return After Cam Count ===>", cam);

//     if (!update_screen) {
//         console.log("Burner ad list----->", burnerad.length);

//         let data = {};

//         data["webcam"] = cam === 14 ? false : true
//         data["cameraEvent"] = "camera"

//         if (burnerad.length > 0) {
//             const random = Math.floor(Math.random() * burnerad.length)

//             liveContentLink = null;
//             data["filetype"] = "burnerad";
//             data["filename"] = burnerad[random];
//             data["eventname"] = "stop";
//             data["displaytype"] = "fullscreen";

//             if (frontendChannel) {
//                 pubnub.publish(
//                     {
//                         channel: frontendChannel,
//                         message: data,
//                     },
//                     (status, response) => {
//                         console.log("Status Pubnub ===> ", status);
//                     }
//                 );
//             }
//             else {
//                 liveContentLink = null;
//                 data["filetype"] = null;
//                 data["filename"] = null;
//                 data["eventname"] = "stop";
//                 data["displaytype"] = "fullscreen";

//                 if (frontendChannel) {
//                     pubnub.publish(
//                         {
//                             channel: frontendChannel,
//                             message: data,
//                         },
//                         (status, response) => {
//                             console.log("Status Pubnub ===> ", status);
//                             burnerAdPlaying = true;
//                         }
//                     );
//                 }
//             }
//         }
//         else {
//             if (frontendChannel) {
//                 pubnub.publish(
//                     {
//                         channel: frontendChannel,
//                         message: data,
//                     },
//                     (status, response) => {
//                         console.log("Status Pubnub ===> ", status);
//                     }
//                 );
//             }
//         }
//     }
// }


//=================== Delete files ==========================//
// Saps_Rasp_Pubnub/src/Videos

function DeleteUserFiles(uniquefilename, filetype) {
    console.log("//====== Delete user files ===== //");

    if (filetype == "burnerad" && burnerAdPlaying) {
        // const random = Math.floor(Math.random() * burnerad.length)

        // liveContentLink = null;
        // data["filetype"] = null;
        // data["filename"] = null;
        // data["eventname"] = "stop";
        // data["displaytype"] = "fullscreen";

        // if (frontendChannel) {
        //     pubnub.publish(
        //         {
        //             channel: frontendChannel,
        //             message: data,
        //         },
        //         (status, response) => {
        //             console.log("Status Pubnub ===> ", status);
        //         }
        //     );
        // }

        server.emit("stopcurrent", {
            "stopcurrent": true,                    
        });

    }

    if (filetype && uniquefilename) {
        console.log("Filetype => ", filetype, "uniquefilename => ", uniquefilename);
        let path1 =
            filetype && filetype == "video/mp4"
                ? path.join(
                    __dirname,
                    `/Saps_Rasp_Pubnub/src/Videos/${uniquefilename}`
                )
                : filetype && filetype == "video/webm"
                    ? path.join(
                        __dirname,
                        `/Saps_Rasp_Pubnub/src/Videos/${uniquefilename}`
                    )
                    : filetype && filetype == "image/jpeg"
                        ? path.join(
                            __dirname,
                            `/Saps_Rasp_Pubnub/src/images_ad/${uniquefilename}`
                        )
                        : filetype && filetype == "burnerad"
                            ? path.join(
                                __dirname,
                                `/Saps_Rasp_Pubnub/src/BurnerAd/${uniquefilename}.mp4`
                            )
                            : null;
        console.log("path == >", path1);
        if (fs.existsSync(path1)) {
            console.log("yes path exist");
            fs.unlinkSync(path1, () => {
                console.log("User File Has Been Deleted Successfully");

                if (!adPlaying) {
                    // playBurnerAd();
                    getBurnerAd();
                }

            });
        } else {
            console.log("path doesn't exist");
        }
    }
}

//=============================== Auto Starting Backend =====================================//
async function frontendStart() {
    let masterTimer = setTimeout(async () => {
        let { stdout } = await exec("npm start", { cwd: "./Saps_Rasp_Pubnub" });
        if (stdout) {
            console.log("//============== Frontend Has Been Started ============//")
            let timer2 = setTimeout(async () => {
                // exec("chromium-browser --app=http://www.localhost:3000/ --kiosk",(err,stdout , stderr)=>{
                let { stdout } = exec("firefox http://www.localhost:3000 --kiosk")
                if (stdout) {
                    console.log("//========= fireFox has been started =========//")
                    let timer3 = setTimeout(() => {
                        let { stdout } = exec("xdotool search --sync --onlyvisible --name firefox key F11")
                        if (stdout) {
                            console.log("//========= F11 Command has been executed ====//")
                            adPlaying = false;
                            frontendstarted = true;

                            // console.log("Clearing timer for BurnerAd in F11 Function function");
                            // clearInterval(timer_burnerad);

                            // console.log("Burner ad list----->",burnerad.length);


                            // if (burnerad.length > 0)
                            // {
                            //     let data = {};
                            //     const random = Math.floor(Math.random()*burnerad.length)

                            //     liveContentLink = null;
                            //     data["filetype"] = "burnerad";
                            //     data["filename"] = burnerad[random];
                            //     data["eventname"] = "stop";
                            //     data["displaytype"] = "fullscreen";

                            //     if(frontendChannel)
                            //     {
                            //        pubnub.publish(
                            //            {
                            //                channel: frontendChannel,
                            //                message: data,
                            //            },
                            //            (status, response) => {
                            //                console.log("Status Pubnub ===> ", status);
                            //                burnerAdPlaying = true;
                            //            }
                            //        );
                            //     }

                            // }
                            // console.log("Starting timer for BurnerAd in F11 Function function");

                            timer_burnerad = setInterval(getBurnerAd, 30000);  //getBurnerAd, playBurnerAd
                            // else{
                            //     data["filetype"] = null;
                            //     data["filename"] = null;  
                            // }



                        }
                        clearTimeout(timer3)
                    }, 20000)

                }
                clearTimeout(timer2)
                clearTimeout(masterTimer)
            }, 60000);

            // let timer2  = setTimeout(async() => {
            //                // exec("chromium-browser --app=http://www.localhost:3000/ --kiosk",(err,stdout , stderr)=>{
            //                 exec("firefox --kiosk http://www.localhost:3000/",(err,stdout , stderr)=>{
            //                     if(err)
            //                     {
            //                         console.log("Error in Starting Chromium")
            //                         return;
            //                     }
            //                     console.log("//=========== Chromium Has been Started ==============//")
            //                     let timer2 = setTimeout(()=>{
            //                         pubnub.publish(
            //                             {
            //                                 channel: masterChannel,
            //                                 message: {
            //                                     mac_id :  publishChannel,
            //                                     eventname : "Rebooted",
            //                                 },
            //                             },
            //                             (status, response) => {
            //                                 console.log("Status Pubnub ===> ", status);
            //                             }
            //                         );
            //                         clearTimeout(timer2)
            //                     },10000)
            //                 });
            //                 clearTimeout(timer2)
            //             }, 50000);
        }
    }, 20000);
}
frontendStart();




//======================== UART MAC ID =======================================//

function blinkLED() {
    //function to start blinking
    if (LED.readSync() === 0) {
        //check the pin state, if the state is 0 (or off)
        LED.writeSync(1); //set pin state to 1 (turn LED on)
    } else {
        LED.writeSync(0); //set pin state to 0 (turn LED off)
    }
}

function endBlink() {
    //function to stop blinking
    //clearInterval(blinkInterval); // Stop blink intervals
    LED.writeSync(0); // Turn LED off
    //LED.unexport(); // Unexport GPIO to free resources
}
//============================== Button =================================//
button.watch((err, value) => {
    if (err) {
        throw err;
    }
    console.log("value ===>", value);
    if (value == 1) {
        // pubnub.publish(
        //     {
        //         channel: frontendChannel,
        //         message: {
        //             eventname: "qrcode",
        //             show: true,
        //         },
        //     },
        //     (status, response) => {
        //         console.log("Status Pubnub ===> ", status);
        //         console.log("response Pubnub ====> ", response);
        //     }
        // );

        server.emit("showqr", {
            "showqr": true,                    
        });

    } else if (value == 0) {
        // pubnub.publish(
        //     {
        //         channel: frontendChannel,
        //         message: {
        //             eventname: "qrcode",
        //             show: false,
        //         },
        //     },
        //     (status, response) => {
        //         console.log("Status Pubnub ===> ", status);
        //         console.log("response Pubnub ====> ", response);
        //     }
        // );

        server.emit("showqr", {
            "showqr": false,                    
        });
    }
    LED2.writeSync(value);
});

// process.on("SIGINT", (_) => {
//   LED2.unexport();
//   button.unexport();
// });

//==============================================================================================//

const parser = port.pipe(new ReadlineParser({ delimiter: "\r\n" }));

parser.on("data", (data) => {
    console.log("Data from port Device=====>", data);
    if (data.includes("ssid")) {
        let a = JSON.parse(data);
        console.log("wifi credetainls ===> ", a);
        console.log("ssid ==> ", a.ssid);
        let wifiname = a.ssid;
        let password = a.pass;
        wifi
            .connect({ ssid: wifiname, psk: password })
            .then(() => {
                console.log("Connected to network.");
            })
            .catch((error) => {
                console.log(error);
            });
    }

    if (data.includes("Shutting Down")) {
        console.log(" ----- shutting down getting hit ---- ");

        pubnub.publish(
            {
                channel: masterChannel,
                message: {
                    mac_id: publishChannel,
                    eventname: "shutdown",
                    status: "shutdown"
                },
                publishTimeout: 5*60000
            },
            (status, response) => {
                console.log("Status Pubnub ===> ", status);
            }
        );


        //exec("sudo shutdown now")
        exec("pkill -o chromium", (e, i) => {
            if (e) {
                console.log("error in Shutting down ===> ", e);
            }
            exec("sudo shutdown now");
        });
    }

    if (data.includes("check_hang")) {
        blinkLED();
        // let timer = setInterval(blinkLED, 250);
        // setTimeout(() => {
        //     endBlink();
        //     clearInterval(timer);
        // }, 5000);

        // const child = exec(
        //     "ping -c 5 www.google.com",
        //     function (error, stdout, stderr) {
        //         if (error !== null) {
        //             console.log("Not available");
        //         } else {
        //             console.log("Available");
        //         }

        //         port.write("pi_ok", function (err) {
        //             if (err) {
        //                 return console.log("Error on Write: ", err.message);
        //             }
        //             console.log("message written");
        //         });
        //     }
        // );


        port.write("pi_ok", function (err) {
            if (err) {
                return console.log("Error on Write: ", err.message);
            }
            console.log("message written");
        });
    }

    if (data.includes("get_ip")) {
        console.log(" ----- get_ip getting hit ---- ");
        let IP = ip.address();
        console.log("ip =====>", IP);
        port.write(IP, function (err) {
            if (err) {
                return console.log("Error on Write: ", err.message);
            }
            console.log("message written");
        });
    }

    //========================== For MacADD  =================================//
    if (data.includes("get_mac")) {
        let a = data;
        console.log("wifi credetainls ===> ", a);
        if (fs.existsSync("./realmacadd.json")) {
            console.log("//=== macadress file exist ==//");
            let data = fs.readFileSync("./realmacadd.json", "utf-8");
            console.log("MAC id inside mac address json file ==> ", JSON.parse(data));
            let mcadd = JSON.parse(data);
            console.log("mcadd inside get_mac ===> ", mcadd);
            //==================== Mac address to write to the device ======================//
            port.write(`{\"pi_mac\":\"${mcadd[0]["macaddress"]}\"}`, function (err) {
                if (err) {
                    return console.log("Error on Write: ", err.message);
                }
                console.log("//==== mac address has been send ===//");
            });
            getChannel();
        } else {
            console.log("//============ MAcadd file doesnot exist ============= //");
            port.write('{"pi_mac":"NA"}', function (err) {
                if (err) {
                    return console.log("Error on Write: ", err.message);
                }
                console.log("//==== mac address failed ===//");
            });
        }
    }

    if (data.includes("mac_add")) {
        console.log("//============== device is asking for macadd ==========//");
        console.log(
            "mac address form the device ==> ",
            JSON.parse(data)["mac_add"]
        );
        //==== Need to convert into Base64 encoded ==========//
        console.log(
            "Base 64 encoded ==> ",
            Base64.encode(JSON.parse(data)["mac_add"])
        );
        let mcadd = Base64.encode(JSON.parse(data)["mac_add"]);

        function reverseString(str) {
            var splitString = str.split("");
            var reverseArray = splitString.reverse();
            var joinArray = reverseArray.join("");
            return joinArray;
        }
        mcadd = reverseString(mcadd);
        console.log("Reverse MAc id ==> ", mcadd);
        let realmcadd = [];
        jsonVariable = { macaddress: mcadd };
        realmcadd.push(jsonVariable);

        let mcaddFrontend = [];       //===> For 
        jsonVariable1 = { macaddress: mcadd.concat("FrontEnd") }
        mcaddFrontend.push(jsonVariable1)

        //========== Generating JSON file with Mac addr BAse 64 Encoded  ======//
        fs.writeFileSync("./realmacadd.json", JSON.stringify(realmcadd), "utf-8");

        fs.writeFileSync("./frontendMac.json", JSON.stringify(mcaddFrontend), "utf-8");

        fs.writeFileSync(
            "./Saps_Rasp_Pubnub/src/macadd.json",
            JSON.stringify(mcaddFrontend),
            "utf-8"
        );


        //============= Generating QRCode =================================//
        var qr_code = qr.image(mcadd, { type: "png" });
        qr_code.pipe(
            require("fs").createWriteStream(
                "./Saps_Rasp_Pubnub/src/Qrcode/qrcode.png"
            )
        );
        getChannel();
    }
});



//================================== Git Code Updater ========================================//
// async function forceUpdater() {
//     console.log("//========================== ForceUpdater func() =========================//")
//     let versionChecker = await updater.compareVersions();
//     console.log("version Checker value ===> ", versionChecker)
//     if (versionChecker["remoteVersion"] && versionChecker.currentVersion != versionChecker.remoteVersion) {
//         console.log("//=== Verisons are not same ===//")
//         //updater.forceUpdate();

//         console.log("Clearing timer for BurnerAd in F11 Function function");
//         clearInterval(timer_burnerad);

//         let updateStatus = await updater.autoUpdate();

//         if(updateStatus)
//         {
//              //======> For updating the Frontend Screen
//            let updateTimer =  setTimeout(()=>{
//             if(frontendChannel)
//             {
//                 let data = {
//                     eventname : "play",
//                     filename : "updating",
//                     displaytype : "fullscreen",
//                     filetype : "updating"
//                 }
//                 pubnub.publish(
//                         {
//                             channel: frontendChannel,
//                             message: data,
//                         },
//                         (status, response) => {
//                             console.log("Status Pubnub ===> ", status);
//                         }
//                     ); 

//                     pubnub.publish(
//                         {
//                             channel: masterChannel,
//                             message: {
//                                 mac_id :  publishChannel,
//                                 eventname : "updateresp",
//                                 status : "started"
//                             },
//                         },
//                         (status, response) => {
//                             console.log("Status Pubnub ===> ", status);
//                         }
//                     );    
//              }
//         clearTimeout(updateTimer);
//         },25000)

//             let timer = setTimeout(() => {
//                 const child = spawn('npm i', {
//                     stdio: 'inherit',
//                     shell: true,
//                     cwd: './'
//                 })

//                 child.on('close', (code) => {               
//                     console.log(`Backend Node modules ===>  ${code}`);
//                 let child2 = spawn('npm i', {
//                         stdio: 'inherit',
//                         shell: true,
//                         cwd: './Saps_Rasp_Pubnub'
//                     })

//                 child2.on('close', (code)=>{
//                     console.log("//==== Fronted Node Modules ===//")
//                     execShellCommand().then(() => {
//                         exec("pkill -f firefox")
//                         setTimeout(()=>{
//                             console.log("//=============== REBOOTING ================//")
//                             exec("sudo reboot");
//                         },50000)
//                     });
//                 })    
//                 });
//                 console.log("//====== Timer Completed =====//")
//                 clearTimeout(timer)
//             }, 5*60000)    ///===> timer for reboot ==>  5 min
//         }
//     }
//     else if (versionChecker.upToDate == true) {
//         console.log("//==== Version is UpDated ===//")
//         return;
//     }
// }



//================================== Git Code Updater ========================================//
async function forceUpdater() {
    console.log("//========================== ForceUpdater func() =========================//")
    // let versionChecker = await updater.compareVersions();
    // console.log("version Checker value ===> ", versionChecker)
    // if (versionChecker["remoteVersion"] && versionChecker.currentVersion != versionChecker.remoteVersion) {
    console.log("//=== Verisons are not same ===//")

    // let data = {
    //     eventname: "play",
    //     filename: "updating",
    //     displaytype: "fullscreen",
    //     filetype: "updating"
    // }
    // pubnub.publish(
    //     {
    //         channel: frontendChannel,
    //         message: data,
    //     },
    //     (status, response) => {
    //         console.log("Status Pubnub ===> ", status);
    //     }
    // );


    server.emit("updatingt", {
        "updatescreen": true,                    
    });

    console.log("Clearing timer for BurnerAd in F11 Function function");
    clearInterval(timer_burnerad);

    let updateStatus = updater.forceUpdate();

    // let updateStatus = await updater.autoUpdate();

    if (updateStatus) {
        //======> For updating the Frontend Screen
        let updateTimer = setTimeout(() => {
            // if (frontendChannel) {
            //     let data = {
            //         eventname: "play",
            //         filename: "updating",
            //         displaytype: "fullscreen",
            //         filetype: "updating"
            //     }
            //     pubnub.publish(
            //         {
            //             channel: frontendChannel,
            //             message: data,
            //         },
            //         (status, response) => {
            //             console.log("Status Pubnub ===> ", status);
            //         }
            //     );

            //     pubnub.publish(
            //         {
            //             channel: masterChannel,
            //             message: {
            //                 mac_id: publishChannel,
            //                 eventname: "updateresp",
            //                 status: "started"
            //             },
            //         },
            //         (status, response) => {
            //             console.log("Status Pubnub ===> ", status);
            //         }
            //     );
            // }

            server.emit("updatingt", {
                "updatescreen": true,                    
            });

            clearTimeout(updateTimer);
        }, 25000)



        let timer = setTimeout(() => {
            const child = spawn('npm i', {
                stdio: 'inherit',
                shell: true,
                cwd: './'
            })

            child.on('close', (code) => {
                console.log(`Backend Node modules ===>  ${code}`);
                let child2 = spawn('npm i', {
                    stdio: 'inherit',
                    shell: true,
                    cwd: './Saps_Rasp_Pubnub'
                })

                child2.on('close', (code) => {

                    console.log("//==== Fronted Node Modules ===//")

                    execShellCommand().then(() => {
                        exec("pkill -f firefox")
                        setTimeout(() => {
                            console.log("//=============== REBOOTING ================//")
                            exec("sudo reboot");
                        }, 50000)
                    });
                    // exec("pkill -f firefox")
                    // setTimeout(()=>{
                    //     console.log("//=============== REBOOTING ================//")
                    //     exec("sudo reboot");
                    // },10000)
                })
            });
            console.log("//====== Timer Completed =====//")
            clearTimeout(timer)
        }, 5 * 60000)    ///===> timer for reboot ==>  5 min
    }
    // }
    // else if (versionChecker.upToDate == true) {
    //     console.log("//==== Version is UpDated ===//")
    //     return;
    // }
}



async function autoUpdater() {
    console.log("//========================== ForceUpdater func() =========================//")
    let versionChecker = await updater.compareVersions();
    console.log("version Checker value ===> ", versionChecker)
    if (versionChecker["remoteVersion"] && versionChecker.currentVersion != versionChecker.remoteVersion) {
        console.log("//=== Verisons are not same ===//")

        console.log("Clearing timer for BurnerAd in F11 Function function");
        clearInterval(timer_burnerad);

        //updater.forceUpdate();

        let updateStatus = await updater.autoUpdate();

        if (updateStatus) {
            //======> For updating the Frontend Screen
            let updateTimer = setTimeout(() => {
                // if (frontendChannel) {
                //     let data = {
                //         eventname: "play",
                //         filename: "updating",
                //         displaytype: "fullscreen",
                //         filetype: "updating"
                //     }
                //     pubnub.publish(
                //         {
                //             channel: frontendChannel,
                //             message: data,
                //         },
                //         (status, response) => {
                //             console.log("Status Pubnub ===> ", status);
                //         }
                //     );

                //     pubnub.publish(
                //         {
                //             channel: masterChannel,
                //             message: {
                //                 mac_id: publishChannel,
                //                 eventname: "updateresp",
                //                 status: "started"
                //             },
                //         },
                //         (status, response) => {
                //             console.log("Status Pubnub ===> ", status);
                //         }
                //     );
                // }


                server.emit("updatingt", {
                    "updatescreen": true,                    
                });

                clearTimeout(updateTimer);
            }, 25000)



            let timer = setTimeout(() => {
                const child = spawn('npm i', {
                    stdio: 'inherit',
                    shell: true,
                    cwd: './'
                })

                child.on('close', (code) => {
                    console.log(`Backend Node modules ===>  ${code}`);
                    let child2 = spawn('npm i', {
                        stdio: 'inherit',
                        shell: true,
                        cwd: './Saps_Rasp_Pubnub'
                    })

                    child2.on('close', (code) => {

                        console.log("//==== Fronted Node Modules ===//")

                        execShellCommand().then(() => {
                            exec("pkill -f firefox")
                            setTimeout(() => {
                                console.log("//=============== REBOOTING ================//")
                                exec("sudo reboot");
                            }, 50000)
                        });
                        // exec("pkill -f firefox")
                        // setTimeout(()=>{
                        //     console.log("//=============== REBOOTING ================//")
                        //     exec("sudo reboot");
                        // },10000)
                    })
                });
                console.log("//====== Timer Completed =====//")
                clearTimeout(timer)
            }, 5 * 60000)    ///===> timer for reboot ==>  5 min
        }
    }
    else if (versionChecker.upToDate == true) {
        console.log("//==== Version is UpDated ===//")
        return;
    }
}




function execShellCommand() {
    return new Promise((resolve, reject) => {
        exec("sudo apt-get install fswebcam", (error, stdout, stderr) => {
            if (error) {
                console.warn(error);
            }
            resolve(stdout ? stdout : stderr);
        });
    });
}

let scheduleJob;

async function autoUpdateTimer() {
    console.log("//====================== autoUpdateTimer() ======================  //")
    scheduleJob = schedule.scheduleJob('0 0 4 20 * *', async () => {
        console.log("//== scheduleJob inside autoUpdateTime ==//")
        let versionChecker = await updater.compareVersions();
        console.log("version Checker value ===> ", versionChecker)
        if (versionChecker["remoteVersion"] && versionChecker.currentVersion != versionChecker.remoteVersion) {
            console.log("//=== Verisons are not same ===//")

            console.log("Clearing timer for BurnerAd in F11 Function function");
            clearInterval(timer_burnerad);

            updater.forceUpdate();

            let timer = setTimeout(() => {
                const child = spawn('npm i', {
                    stdio: 'inherit',
                    shell: true,
                    cwd: './'
                })

                child.on('close', (code) => {                 //--> after build run the frontend
                    console.log(`child process exited with code ${code}`);
                    let child2 = spawn('npm i', {
                        stdio: 'inherit',
                        shell: true,
                        cwd: './Saps_Rasp_Pubnub'
                    })

                    child2.on('close', (code) => {
                        exec("pkill -f firefox")
                        setTimeout(() => {
                            exec("sudo reboot");
                        }, 15000)
                    })
                });
                console.log("//====== Timer Completed =====//")
                clearTimeout(timer)
            }, 300000)
        }
        else if (versionChecker.upToDate == true) {
            console.log("//==== Version is UpDated ===//")
            return;
        }

    })
}




async function getScheduleJson() {
    let time = moment().format("YYYY-MM-DD");
    if (publishChannel) {
        console.log(time, publishChannel);
        try {
            axios.get(`http://api.postmyad.ai/api/schedule/getSchedulebyDate?date=${time}&macId=${publishChannel}`).then(resp => {
                // console.log("SCHEDULE DATA", resp.data.msg);
                if (fs.existsSync(`./Saps_Rasp_Pubnub/src/schedule/hello.json`)) {
                    console.log(`hello.json File already exist`);

                    deleteFilesAftertwoHours(1000); 

                    // read arr
                    let olddata = fs.readFileSync(`./Saps_Rasp_Pubnub/src/schedule/hello.json`, "utf-8");
                    console.log("readSchJson inside json file ==> ", JSON.parse(olddata));
                    
                    // schJsonData = JSON.parse(olddata);
                    // response arr
                    let ret = getScheduleJsonIterate(resp.data.msg)
                    // merge both
                    let newArr = [...ret,...olddata]
                    
                    // update json
                    fs.writeFileSync(`./Saps_Rasp_Pubnub/src/schedule/hello.json`, JSON.stringify(newArr), "utf-8");
                    
                    readScheduleJson();
                    let timer2 = setTimeout(async () => {
                        console.log("Deleting Old File 2 Hr Older Content-------->>>>>>>");
                        deleteFilesAftertwoHours(1000);
                        clearTimeout(timer2);
                    }, 1000);

                    let timer3 = setTimeout(async () => {
                        console.log("Downloading New Media Content to New Location -------->>>>>>>");
                        getScheduleMediaDownloadForNewContent();
                        clearTimeout(timer3);
                    }, 10000);
                    
                }
                else {
                    console.log(`hello.json File dose not exist creating`);
                    let ret = getScheduleJsonIterate(resp.data.msg)

                    // console.log("Ret value before writing it to file===>", ret);

                    console.log("=====================================>");

                    fs.writeFileSync(`./Saps_Rasp_Pubnub/src/schedule/hello.json`, JSON.stringify(ret), "utf-8");
                

                if (fs.existsSync(`./Saps_Rasp_Pubnub/src/schedule/hello.json`)) {
                    console.log(`hello.json File already exist Download File `);
                    readScheduleJson();
                    let timer2 = setTimeout(async () => {
                        console.log("Deleting Old File 2 Hr Older Content-------->>>>>>>");
                        deleteFilesAftertwoHours(1000);
                        clearTimeout(timer2);
                    }, 1000);

                    let timer3 = setTimeout(async () => {
                        console.log("Downloading Schedued Media Content From json-------->>>>>>>");
                        getScheduleMediaDownload();
                        clearTimeout(timer3);
                    }, 10000);

                }
            }

            });
        } catch (err) {
            console.log("Error from dateListSchedule", err.message)
        }
    }
}

let schJsonData
function readScheduleJson() {
    let time = moment().format("YYYY-MM-DD");

    let readSchJson = fs.readFileSync(`./Saps_Rasp_Pubnub/src/schedule/hello.json`, "utf-8");
    console.log("readSchJson inside json file ==> ", JSON.parse(readSchJson));
    schJsonData = JSON.parse(readSchJson);
    // console.log("mcadd inside get_mac ===> ", mcadd);
}



function getScheduleJsonIterate(schdata) {
    let arr = []
    for (let i = 0; i < schdata.length; i++) {
        if (new Date(schdata[i].scheduleDate).getTime() > new Date().getTime()) {
            console.log("inside getScheduleJson", schdata[i]); 
            
                if (schdata[i].filetype === "image/jpeg") {
                    schdata[i].contentLink = schdata[i].contentLink.replace("thumbnails", "fullimages").replace(".png", ".jpg");
                    arr.push(schdata[i])
                }
                else if(schdata[i].filetype === "video/mp4" || schdata[i].filetype === "video/webm" || schdata[i].filetype === "video/mov"){
                    schdata[i].contentLink = schdata[i].contentLink.replace("compressedvideos", "originalvideos").replace("compressed", "");
                    arr.push(schdata[i])
                }else
                {
                    arr.push(schdata[i])
                }
                        
        }
    }
    return arr
}

function getScheduleMediaDownload() {

    checkSpace();

    let item1;

    for (let item of schJsonData) {
        if (item1 !== item.contentLink) {
            item1 = item.contentLink

            DownloadVideo(
                // ==> Download Function
                item.contentLink,
                item.videoname,
                item.filetype
            );
        }
    }
}


function getScheduleMediaDownloadForNewContent() {

    checkSpace();

    let item1;

    for (let item of schJsonData) {
        if (item1 !== item.contentLink) {
            item1 = item.contentLink

            DownloadVideoNewLocation(
                // ==> Download Function
                item.contentLink,
                item.videoname,
                item.filetype
            );
        }
    }
}


function deleteScheduleJson() {
    // let time = moment().format("YYYY-MM-DD");
    // if(fs.existsSync(`./Saps_Rasp_Pubnub/src/schedule/${time}.json`)){
    // fs.unlinkSync(`./Saps_Rasp_Pubnub/src/schedule/${time}.json`);
    // }

    dir_schedule = null;

    fs.rmSync("./Saps_Rasp_Pubnub/src/schedule", { recursive: true, force: true });

    deleteScheduleMedia();

    if (!dir_schedule) {
        dir_schedule = path.join(__dirname, "./Saps_Rasp_Pubnub/src/schedule")
        if (!fs.existsSync(dir_schedule)) {
            console.log("Creating schedule Folder===")
            fs.mkdirSync(dir_schedule)
        } else {
            console.log("===== schedule Folder Already Exist=====")
        }
    }

}
function deleteScheduleMedia() {
    fs.rmSync("./Saps_Rasp_Pubnub/src/Videos", { recursive: true, force: true });
    fs.rmSync("./Saps_Rasp_Pubnub/src/images_ad", { recursive: true, force: true });

    dir_videos = null;
    dir_images_ad = null;

    if (!dir_videos) {
        dir_videos = path.join(__dirname, "./Saps_Rasp_Pubnub/src/Videos")
        if (!fs.existsSync(dir_videos)) {
            console.log("Creating Videos Folder===")
            fs.mkdirSync(dir_videos)
        } else {
            console.log("===== Videos Folder Already Exist=====")
        }
    }

    if (!dir_images_ad) {
        dir_images_ad = path.join(__dirname, "./Saps_Rasp_Pubnub/src/images_ad")
        if (!fs.existsSync(dir_images_ad)) {
            console.log("Creating images_ad Folder===")
            fs.mkdirSync(dir_images_ad)
        } else {
            console.log("===== images_ad Folder Already Exist=====")
        }
    }

}

async function getBurnerAd() {

    let dataJson = {};
    await getBurnerAdFileName(burnarAdFolder);

    countwebCamList();
    console.log("return After Cam Count ===>", cam);
    let camStat = (cam === 14) ? false : true



    if (!update_screen) {
        console.log("Burner ad list----->", burnerad.length);

        if (burnerad.length > 0) {
            server.emit("burnerAdEvent", {
                "camera": camStat,
                "burnerAd": true,
                "list": burnerad
            })

        
            if (fs.existsSync(`./Saps_Rasp_Pubnub/src/data.json`)) {
                console.log(`data.json File already exist`);
                
                dataJson["camera"] = camStat;
                dataJson["burnerAd"] = true;
                dataJson["list"] = burnerad;
                fs.writeFileSync(`./Saps_Rasp_Pubnub/src/data.json`, JSON.stringify(dataJson), "utf-8");
            
            }    

        } else {
            server.emit("burnerAdEvent", {
                "camera": camStat,
                "burnerAd": false,
                "list": []
            })

            if (fs.existsSync(`./Saps_Rasp_Pubnub/src/data.json`)) {
                console.log(`data.json File already exist`);
                
                dataJson["camera"] = camStat;
                dataJson["burnerAd"] = true;
                dataJson["list"] = [];
                fs.writeFileSync(`./Saps_Rasp_Pubnub/src/data.json`, JSON.stringify(dataJson), "utf-8");
            
            }  
        }

    }
}

//  ======================== Delete video image folder files ==================== //
function deleteFilesAftertwoHours(time) {
    // let time = moment().format("YYYY-MM-DD");
    if (fs.existsSync(`./Saps_Rasp_Pubnub/src/schedule/hello.json`)) {
        console.log(" ===== deleteFilesAftertwoHours ====== ");

        let newList = schJsonData.filter((item) => new Date(item.scheduleDate).getTime() > new Date().getTime() - time)
        // deleteMediaFile(schJsonData)
        console.log("Filtered Data ==>", schJsonData);
        console.log("after Filter ==>", newList);

        fs.writeFileSync(`./Saps_Rasp_Pubnub/src/schedule/hello.json`, JSON.stringify(newList), "utf-8");
    }
}

function deleteMediaFile(arr) {
    for (let item of arr) {
        if (item.filetype === "video/mp4") {
            DeleteUserFiles(item.videoname + ".mp4", item.filetype);
        }
        if (item.filetype === "video/webm") {
            DeleteUserFiles(item.videoname + ".webm", item.filetype);
        }
        if (item.filetype === "image/jpeg") {
            DeleteUserFiles(item.videoname + ".jpg", item.filetype);
        }

    }
}
// deleteFilesAftertwoHours()
getBurnerAd();




//==================== To Download Video ====================//
function DownloadVideo(fileurl, zipname, filetype) {
    console.log("Inside DownloadVideoZip ==> ", fileurl);
    if (fileurl && zipname && filetype) {
        const file = fileurl;

        checkSpace();

        //===> for video download ====>
        if (filetype == "video/mp4") {
            console.log(" //=== Video/mp4 ======//");
            //====> first check if video already downloaded
            if (fs.existsSync(path.join(__dirname, `/Saps_Rasp_Pubnub/src/Videos/${zipname}.mp4`))) {
                console.log("//=== File already exist =======//")
                //===> Pubnub Publish of Download Completion ===>
                let timer = setTimeout(() => {
                    // pubnub.publish(
                    //     {
                    //         channel: masterChannel,
                    //         message: {
                    //             mac_id: publishChannel,
                    //             eventname: "Downloaded",
                    //             status: "Video Already Exist",
                    //             filename: zipname,
                    //             filetype: "video/mp4"
                    //         },
                    //     },
                    //     (status, response) => {
                    //         console.log("Status Pubnub ===> ", status);
                    //     }
                    // );
                    clearTimeout(timer)
                }, 3000)
                return;
            }
            else {
                const filePath = "./Saps_Rasp_Pubnub/src/Videos";

                download(file, filePath).then(() => {
                    console.log("//==   Video Download Completed   ==//");

                    //============ Now unzip the file ==================//
                    console.log("Inside Videos Folder file name ==>", zipname);
                    // const path = `./zippedfiles/${zipname}.zip`;
                    // console.log("path ==>", path);

                    // try{

                    //     fs.createReadStream(path).pipe(
                    //             unzipper.Extract({ path: "./Saps_Rasp_Pubnub/src/Videos" })
                    //     );

                    // }catch(e){
                    //     console.log("Error in Extracting Video From zipped content",e);
                    // }

                    // setTimeout(() => {
                    //     try{
                    //         fs.unlinkSync(`./zippedfiles/${zipname}.zip`, () => {
                    //             console.log("deleted");
                    //         });

                    //     }catch(e){
                    //         console.log("Error in deleting zipped content",e);
                    //     }
                    // }, 10000);
                    //===> Pubnub Publish of Download Completion ===>
                    
                    // pubnub.publish(
                    //     {
                    //         channel: masterChannel,
                    //         message: {
                    //             mac_id: publishChannel,
                    //             eventname: "Downloaded",
                    //             status: "Download Success",
                    //             filename: zipname,
                    //             filetype: "video/mp4"
                    //         },
                    //     },
                    //     (status, response) => {
                    //         console.log("Status Pubnub ===> ", status);
                    //     }
                    // );


                });
            }
        }
        else if (filetype == "video/webm") {
            console.log(" //=== Video/webm ======//");
            //====> first check if video already downloaded
            if (fs.existsSync(path.join(__dirname, `/Saps_Rasp_Pubnub/src/Videos/${zipname}.webm`))) {
                console.log("//=== File already exist =======//")
                //===> Pubnub Publish of Download Completion ===>
                let timer = setTimeout(() => {
                    // pubnub.publish(
                    //     {
                    //         channel: masterChannel,
                    //         message: {
                    //             mac_id: publishChannel,
                    //             eventname: "Downloaded",
                    //             status: "Video Already Exist",
                    //             filename: zipname,
                    //             filetype: "video/webm"
                    //         },
                    //     },
                    //     (status, response) => {
                    //         console.log("Status Pubnub ===> ", status);
                    //     }
                    // );
                    clearTimeout(timer)
                }, 3000)
                return;
            }
            else {
                const filePath = "./Saps_Rasp_Pubnub/src/Videos";

                download(file, filePath).then(() => {
                    console.log("//==   Video Download Completed   ==//");

                    //============ Now unzip the file ==================//
                    console.log("Inside Video Folder file name ==>", zipname);
                    // const path = `./zippedfiles/${zipname}.zip`;
                    // console.log("path ==>", path);

                    // try{

                    //     fs.createReadStream(path).pipe(
                    //             unzipper.Extract({ path: "./Saps_Rasp_Pubnub/src/Videos" })
                    //     );

                    // }catch(e){
                    //     console.log("Error in Extracting Video From zipped content",e);
                    // }

                    // setTimeout(() => {
                    //     try{
                    //         fs.unlinkSync(`./zippedfiles/${zipname}.zip`, () => {
                    //             console.log("deleted");
                    //         });

                    //     }catch(e){
                    //         console.log("Error in deleting zipped content",e);
                    //     }
                    // }, 10000);
                    //===> Pubnub Publish of Download Completion ===>
                    
                    // pubnub.publish(
                    //     {
                    //         channel: masterChannel,
                    //         message: {
                    //             mac_id: publishChannel,
                    //             eventname: "Downloaded",
                    //             status: "Download Success",
                    //             filename: zipname,
                    //             filetype: "video/webm"
                    //         },
                    //     },
                    //     (status, response) => {
                    //         console.log("Status Pubnub ===> ", status);
                    //     }
                    // );


                });
            }
        }
        else if (filetype == "image/jpeg") {
            if (fs.existsSync(path.join(__dirname, `/Saps_Rasp_Pubnub/src/images_ad/${zipname}.jpg`))) {
                console.log("//=== File already exist =======//")
                let timer = setTimeout(() => {
                    // pubnub.publish(
                    //     {
                    //         channel: masterChannel,
                    //         message: {
                    //             mac_id: publishChannel,
                    //             eventname: "Downloaded",
                    //             status: "Image Already Exist",
                    //             filename: zipname,
                    //             filetype: "image/jpeg"
                    //         },
                    //     },
                    //     (status, response) => {
                    //         console.log("Status Pubnub ===> ", status);
                    //     }
                    // );
                    clearTimeout(timer)
                }, 3000)
                return;
            }
            else {
                const file = fileurl;
                console.log("Image file url ==> ", fileurl);
                //const filePath = `${__dirname}/zippedfiles`;
                const filePath = `${__dirname}/Saps_Rasp_Pubnub/src/images_ad`;
                download(file, filePath).then(() => {
                    console.log("//==  Image Download Completed   ==//");
                    //===> Pubnub Publish of Download Completion ===>
                    
                    // pubnub.publish(
                    //     {
                    //         channel: masterChannel,
                    //         message: {
                    //             mac_id: publishChannel,
                    //             eventname: "Downloaded",
                    //             status: "Download Success",
                    //             filename: zipname,
                    //             filetype: "image/jpeg"
                    //         },
                    //     },
                    //     (status, response) => {
                    //         console.log("Status Pubnub ===> ", status);
                    //     }
                    // );
                });
            }
        }
    }
}


function DownloadVideoNewLocation(fileurl, zipname, filetype) {
    console.log("Inside DownloadVideoZip ==> ", fileurl);
    if (fileurl && zipname && filetype) {
        const file = fileurl;


        //===> for video download ====>
        if (filetype == "video/mp4") {
            console.log(" //=== Video/mp4 ======//");
            //====> first check if video already downloaded
            if (fs.existsSync(path.join(__dirname, `/Saps_Rasp_Pubnub/src/NewVideos/${zipname}.mp4`))) {
                console.log("//=== File already exist =======//")
                //===> Pubnub Publish of Download Completion ===>
                let timer = setTimeout(() => {
                    // pubnub.publish(
                    //     {
                    //         channel: masterChannel,
                    //         message: {
                    //             mac_id: publishChannel,
                    //             eventname: "Downloaded",
                    //             status: "Video Already Exist",
                    //             filename: zipname,
                    //             filetype: "video/mp4"
                    //         },
                    //     },
                    //     (status, response) => {
                    //         console.log("Status Pubnub ===> ", status);
                    //     }
                    // );
                    clearTimeout(timer)
                }, 3000)
                return;
            }
            else {
                const filePath = "./Saps_Rasp_Pubnub/src/NewVideos";

                download(file, filePath).then(() => {
                    console.log("//==   Video Download Completed   ==//");

                    //============ Now unzip the file ==================//
                    console.log("Inside NewVideos Folder file name ==>", zipname);
                    // const path = `./zippedfiles/${zipname}.zip`;
                    // console.log("path ==>", path);

                    // try{

                    //     fs.createReadStream(path).pipe(
                    //             unzipper.Extract({ path: "./Saps_Rasp_Pubnub/src/Videos" })
                    //     );

                    // }catch(e){
                    //     console.log("Error in Extracting Video From zipped content",e);
                    // }

                    // setTimeout(() => {
                    //     try{
                    //         fs.unlinkSync(`./zippedfiles/${zipname}.zip`, () => {
                    //             console.log("deleted");
                    //         });

                    //     }catch(e){
                    //         console.log("Error in deleting zipped content",e);
                    //     }
                    // }, 10000);
                    //===> Pubnub Publish of Download Completion ===>
                    
                    // pubnub.publish(
                    //     {
                    //         channel: masterChannel,
                    //         message: {
                    //             mac_id: publishChannel,
                    //             eventname: "Downloaded",
                    //             status: "Download Success",
                    //             filename: zipname,
                    //             filetype: "video/mp4"
                    //         },
                    //     },
                    //     (status, response) => {
                    //         console.log("Status Pubnub ===> ", status);
                    //     }
                    // );


                });
            }
        }
        else if (filetype == "video/webm") {
            console.log(" //=== Video/webm ======//");
            //====> first check if video already downloaded
            if (fs.existsSync(path.join(__dirname, `/Saps_Rasp_Pubnub/src/NewVideos/${zipname}.webm`))) {
                console.log("//=== File already exist =======//")
                //===> Pubnub Publish of Download Completion ===>
                let timer = setTimeout(() => {
                    // pubnub.publish(
                    //     {
                    //         channel: masterChannel,
                    //         message: {
                    //             mac_id: publishChannel,
                    //             eventname: "Downloaded",
                    //             status: "Video Already Exist",
                    //             filename: zipname,
                    //             filetype: "video/webm"
                    //         },
                    //     },
                    //     (status, response) => {
                    //         console.log("Status Pubnub ===> ", status);
                    //     }
                    // );
                    clearTimeout(timer)
                }, 3000)
                return;
            }
            else {
                const filePath = "./Saps_Rasp_Pubnub/src/NewVideos";

                download(file, filePath).then(() => {
                    console.log("//==   Video Webm Download Completed   ==//");

                    //============ Now unzip the file ==================//
                    console.log("Inside NewVideos Folder file name ==>", zipname);
                    // const path = `./zippedfiles/${zipname}.zip`;
                    // console.log("path ==>", path);

                    // try{

                    //     fs.createReadStream(path).pipe(
                    //             unzipper.Extract({ path: "./Saps_Rasp_Pubnub/src/Videos" })
                    //     );

                    // }catch(e){
                    //     console.log("Error in Extracting Video From zipped content",e);
                    // }

                    // setTimeout(() => {
                    //     try{
                    //         fs.unlinkSync(`./zippedfiles/${zipname}.zip`, () => {
                    //             console.log("deleted");
                    //         });

                    //     }catch(e){
                    //         console.log("Error in deleting zipped content",e);
                    //     }
                    // }, 10000);
                    //===> Pubnub Publish of Download Completion ===>

                    // pubnub.publish(
                    //     {
                    //         channel: masterChannel,
                    //         message: {
                    //             mac_id: publishChannel,
                    //             eventname: "Downloaded",
                    //             status: "Download Success",
                    //             filename: zipname,
                    //             filetype: "video/webm"
                    //         },
                    //     },
                    //     (status, response) => {
                    //         console.log("Status Pubnub ===> ", status);
                    //     }
                    // );


                });
            }
        }
        else if (filetype == "image/jpeg") {
            if (fs.existsSync(path.join(__dirname, `/Saps_Rasp_Pubnub/src/new_images_ad/${zipname}.jpg`))) {
                console.log("//=== File already exist =======//")
                let timer = setTimeout(() => {
                    // pubnub.publish(
                    //     {
                    //         channel: masterChannel,
                    //         message: {
                    //             mac_id: publishChannel,
                    //             eventname: "Downloaded",
                    //             status: "Image Already Exist",
                    //             filename: zipname,
                    //             filetype: "image/jpeg"
                    //         },
                    //     },
                    //     (status, response) => {
                    //         console.log("Status Pubnub ===> ", status);
                    //     }
                    // );
                    clearTimeout(timer)
                }, 3000)
                return;
            }
            else {
                const file = fileurl;
                console.log("Image file url ==> ", fileurl);
                //const filePath = `${__dirname}/zippedfiles`;
                const filePath = `${__dirname}/Saps_Rasp_Pubnub/src/new_images_ad`;
                download(file, filePath).then(() => {
                    console.log("//==  Image Download Completed   ==//");
                    //===> Pubnub Publish of Download Completion ===>
                    // pubnub.publish(
                    //     {
                    //         channel: masterChannel,
                    //         message: {
                    //             mac_id: publishChannel,
                    //             eventname: "Downloaded",
                    //             status: "Download Success",
                    //             filename: zipname,
                    //             filetype: "image/jpeg"
                    //         },
                    //     },
                    //     (status, response) => {
                    //         console.log("Status Pubnub ===> ", status);
                    //     }
                    // );
                });
            }
        }
    }
}

function moveContentFromNewLocationToOld()
{
    //deleting Media Folder AT 00:00
    deleteScheduleMedia();
  

        fs.rename("./Saps_Rasp_Pubnub/src/new_images_ad","./Saps_Rasp_Pubnub/src/images_ad", (err) => {
           
        });

    
            fs.rename("./Saps_Rasp_Pubnub/src/NewVideos","./Saps_Rasp_Pubnub/src/Videos", (err) => {
                // if(err) console.log(err);
                // console.log(`File ${fileName} moved successfully`)
            });
              
}

async function restartFrontend(){
    server.emit("reloadPage");
}
