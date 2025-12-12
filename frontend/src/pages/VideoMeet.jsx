import React, { useRef, useState, useEffect } from "react";
import { Badge, IconButton, TextField, Button } from "@mui/material";
import io from "socket.io-client";

import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import CallEndIcon from "@mui/icons-material/CallEnd";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import ScreenShareIcon from "@mui/icons-material/ScreenShare";
import StopScreenShareIcon from "@mui/icons-material/StopScreenShare";
import ChatIcon from "@mui/icons-material/Chat";
import SendIcon from "@mui/icons-material/Send";
import { useNavigate } from "react-router-dom";

import styles from "../styles/videoComponent.module.css";
import server from "../environment";

const server_url = server;
var connections = {};

const peerConfigConnections = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

// Helper functions
const silence = () => new MediaStream();
const black = (width = 640, height = 480) => {
  const canvas = Object.assign(document.createElement("canvas"), { width, height });
  canvas.getContext("2d").fillRect(0, 0, width, height);
  return canvas.captureStream();
};

export default function VideoMeetComponent() {
  const socketRef = useRef();
  const socketIDRef = useRef();
  const mainVideoRef = useRef();
  const localVideoRef = useRef();
  const videoRef = useRef([]);

  const [videoAvailable, setVideoAvailable] = useState(true);
  const [audioAvailable, setAudioAvailable] = useState(true);
  const [video, setVideo] = useState([]);
  const [audio, setAudio] = useState();
  const [screen, setScreen] = useState(false);
  const [screenAvailable, setScreenAvailable] = useState(false);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [newMessages, setNewMessages] = useState(0);
  const [askForUsername, setAskForUsername] = useState(true);
  const [username, setUsername] = useState("");
  const [videos, setVideos] = useState([]);
  const [showModal, setModal] = useState(true);

  useEffect(() => {
    getPermission();
  }, []);

  const getPermission = async () => {
    try {
      const videoPermission = await navigator.mediaDevices.getUserMedia({ video: true });
      setVideoAvailable(!!videoPermission);

      const audioPermission = await navigator.mediaDevices.getUserMedia({ audio: true });
      setAudioAvailable(!!audioPermission);

      setScreenAvailable(!!navigator.mediaDevices.getDisplayMedia);

      const userMediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      window.localStream = userMediaStream;

      if (mainVideoRef.current) mainVideoRef.current.srcObject = window.localStream;
      if (localVideoRef.current) localVideoRef.current.srcObject = window.localStream;
      const lobbyVideo = document.getElementById("lobbyVideo");
      if (lobbyVideo) lobbyVideo.srcObject = window.localStream;
    } catch (err) {
      console.log(err);
    }
  };

  const getUserMediaSuccess = (stream) => {
    window.localStream = stream;
    if (mainVideoRef.current) mainVideoRef.current.srcObject = stream;
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;

    for (let id in connections) {
      if (id === socketIDRef.current) continue;
     
      try {
        stream.getTracks().forEach((track) => {

          if (connections[id]) connections[id].addTrack(track, stream);
        });
      } catch (err) {
        console.warn("Error adding tracks to connection", id, err);
      }

      connections[id]
        .createOffer()
        .then((desc) =>
          connections[id].setLocalDescription(desc).then(() =>
            socketRef.current.emit(
              "signal",
              id,
              JSON.stringify({ sdp: connections[id].localDescription })
            )
          )
        )
        .catch((e) => console.log(e));
    }

    stream.getTracks().forEach(
      (track) =>
        (track.onended = () => {
          if (screen) setScreen(false);
          const blackSilence = () => new MediaStream([black(), silence()]);
          window.localStream = blackSilence();
          if (localVideoRef.current) localVideoRef.current.srcObject = window.localStream;
          getUserMedia();
        })
    );
  };

  const getUserMedia = () => {
    const useVideo = !!video && videoAvailable;
    const useAudio = !!audio && audioAvailable;
    if (useVideo || useAudio) {
      navigator.mediaDevices
        .getUserMedia({ video: useVideo, audio: useAudio })
        .then(getUserMediaSuccess)
        .catch((e) => console.log(e));
    }
  };

  useEffect(() => {
    if (video !== undefined && audio !== undefined) getUserMedia();
  }, [video, audio]);

  const getDisplayMediaSuccess = (stream) => {
    window.localStream = stream;
    if (mainVideoRef.current) mainVideoRef.current.srcObject = stream;
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;

    for (let id in connections) {
      if (id === socketIDRef.current) continue;
     
      try {
        stream.getTracks().forEach((track) => {
          if (connections[id]) connections[id].addTrack(track, stream);
        });
      } catch (err) {
        console.warn("Error adding display tracks to connection", id, err);
      }
      connections[id]
        .createOffer()
        .then((desc) =>
          connections[id].setLocalDescription(desc).then(() =>
            socketRef.current.emit(
              "signal",
              id,
              JSON.stringify({ sdp: connections[id].localDescription })
            )
          )
        )
        .catch((e) => console.log(e));
    }

    stream.getTracks().forEach((track) => (track.onended = () => setScreen(false)));
  };

  const getDisplayMedia = () => {
    if (screen && navigator.mediaDevices.getDisplayMedia) {
      navigator.mediaDevices
        .getDisplayMedia({ video: true, audio: true })
        .then(getDisplayMediaSuccess)
        .catch((e) => console.log(e));
    }
  };

  useEffect(() => {
    if (screen !== undefined) getDisplayMedia();
  }, [screen]);

  const gotMessageFromServer = (fromId, message) => {
    const signal = JSON.parse(message);

    //guard against undefined connections[fromId]
    if (fromId === socketIDRef.current) return;

    const connection = connections[fromId];
    if (!connection) {
      // If the connection doesn't exist yet, ignore the signal (or log)
      console.warn("Signal arrived before RTCPeerConnection was created for", fromId);
      return;
    }

    if (signal.sdp) {
      connection
        .setRemoteDescription(new RTCSessionDescription(signal.sdp))
        .then(() => {
          if (signal.sdp.type === "offer") {
            connection
              .createAnswer()
              .then((desc) =>
                connection.setLocalDescription(desc).then(() =>
                  socketRef.current.emit(
                    "signal",
                    fromId,
                    JSON.stringify({ sdp: connection.localDescription })
                  )
                )
              )
              .catch((e) => console.log(e));
          }
        })
        .catch((e) => {
          console.error("setRemoteDescription error for", fromId, e);
        });
    }
    if (signal.ice) {
      connection.addIceCandidate(new RTCIceCandidate(signal.ice)).catch((e) => console.log(e));
    }
  };

  let addMessage = (data, sender, socketIdSender) => {
    setMessages((prevMessages) => [...prevMessages, { sender: sender, data: data }]);
    if (socketIdSender !== socketIDRef.current) setNewMessages((prev) => prev + 1);
  };

  const connectToSocketServer = () => {
    socketRef.current = io.connect(server_url, { transports: ["websocket", "polling"] });

    socketRef.current.on("signal", gotMessageFromServer);

    socketRef.current.on("connect", () => {
      socketRef.current.emit("join-call", window.location.href);
      socketIDRef.current = socketRef.current.id;

      const selfVideo = {
        socketId: socketIDRef.current,
        stream: window.localStream,
        autoplay: true,
        playsinline: true,
      };
      setVideos((prev) => {
        videoRef.current = [...prev, selfVideo];
        return [...prev, selfVideo];
      });

      socketRef.current.on("chat-message", addMessage);

      socketRef.current.on("user-left", (id) => {
        setVideos((prev) => {
          videoRef.current = prev.filter((v) => v.socketId !== id);
          return prev;
        });
      });

      socketRef.current.on("user-joined", (id, clients) => {
        clients.forEach((socketListId) => {
          // create connection only if not exists
          if (!connections[socketListId]) {
            connections[socketListId] = new RTCPeerConnection(peerConfigConnections);
          }

          const pc = connections[socketListId];

          pc.onicecandidate = (event) => {
            if (event.candidate)
              socketRef.current.emit("signal", socketListId, JSON.stringify({ ice: event.candidate }));
          };

          pc.ontrack = (event) => {
            const exists = videoRef.current.find((v) => v.socketId === socketListId);
            const stream = event.streams && event.streams[0] ? event.streams[0] : null;
            if (!stream) return;

            if (exists) {
              setVideos((prev) => {
                const updated = prev.map((v) =>
                  v.socketId === socketListId ? { ...v, stream: stream } : v
                );
                videoRef.current = updated;
                return updated;
              });
            } else {
              const newVideo = {
                socketId: socketListId,
                stream: stream,
                autoplay: true,
                playsinline: true,
              };
              setVideos((prev) => {
                const updated = [...prev, newVideo];
                videoRef.current = updated;
                return updated;
              });
            }
          };

          // added tracks (audio then video) instead of addStream
          if (window.localStream) {
            try {
              // Add audio tracks first, then video tracks to keep order consistent
              window.localStream.getAudioTracks().forEach((t) => pc.addTrack(t, window.localStream));
              window.localStream.getVideoTracks().forEach((t) => pc.addTrack(t, window.localStream));
            } catch (err) {
              console.warn("Error adding local tracks to pc", socketListId, err);
            }
          }
        });

        if (id === socketIDRef.current) {
          for (let id2 in connections) {
            if (id2 === socketIDRef.current) continue;
            try {
              // adding tracks before creating offer
              if (window.localStream) {
                connections[id2].getSenders(); // harmless call to ensure senders exist
                try {
                  window.localStream.getAudioTracks().forEach((t) => connections[id2].addTrack(t, window.localStream));
                  window.localStream.getVideoTracks().forEach((t) => connections[id2].addTrack(t, window.localStream));
                } catch (err) {
                  console.warn("Error adding tracks before offer for", id2, err);
                }
              }
            } catch (e) {}
            connections[id2]
              .createOffer()
              .then((desc) =>
                connections[id2].setLocalDescription(desc).then(() =>
                  socketRef.current.emit(
                    "signal",
                    id2,
                    JSON.stringify({ sdp: connections[id2].localDescription })
                  )
                )
              )
              .catch((e) => console.log(e));
          }
        }
      });
    });
  };

  const getMedia = () => {
    setVideo(videoAvailable);
    setAudio(audioAvailable);
    connectToSocketServer();
  };

  const connect = () => {
    setAskForUsername(false);
    getMedia();
  };

  let routeTo = useNavigate();

  const handleVideo = () => setVideo(!video);
  const handleAudio = () => setAudio(!audio);
  const handleScreen = () => setScreen(!screen);

  let sendMessage = () => {
    socketRef.current.emit("chat-message", message, username);
    setMessage("");
  };

  let handleEndCall = () => {
    try {
      if (mainVideoRef.current && mainVideoRef.current.srcObject) {
        mainVideoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
    } catch (e) {
      console.log(e);
    }
    routeTo("/home");
  };

  return (
    <div>
      {askForUsername ? (
        <div>
          <h2>Enter into Lobby</h2>
          <TextField
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            variant="outlined"
          />
          <Button variant="contained" onClick={connect}>
            Connect
          </Button>

          <div>
            <video id="lobbyVideo" autoPlay muted></video>
          </div>

          <img
            src="/logo1.png"
            alt="Lobby Logo"
            style={{
              position: "absolute",
              top: "50%",
              right: "50px",
              transform: "translateY(-50%)",
              width: "800px",
              maxWidth: "40vw",
            }}
          />
        </div>
      ) : (
        <div className={styles.meetVideoContainer}>
          {showModal ? (
            <div className={styles.chatRoom}>
              <div className={styles.chatContainer}>
                <h1>Chat</h1>
                <div className={styles.chattingDisplay}>
                  {messages.map((item, index) => (
                    <div style={{ marginBottom: "20px" }} key={index}>
                      <p style={{ fontWeight: "bold" }}>{item.sender}</p>
                      <p>{item.data}</p>
                    </div>
                  ))}
                </div>
                <div className={styles.chattingArea}>
                  <TextField
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    id="outlined-basic"
                    label="Enter Your Text"
                    variant="outlined"
                  />
                  <Button variant="contained" onClick={sendMessage} endIcon={<SendIcon />}>
                    Send
                  </Button>
                </div>
              </div>
            </div>
          ) : null}

          <div className={styles.buttonContainers}>
            <IconButton onClick={handleVideo} style={{ color: "white" }}>
              {video ? <VideocamIcon /> : <VideocamOffIcon />}
            </IconButton>
            <IconButton onClick={handleEndCall} style={{ color: "red" }}>
              <CallEndIcon />
            </IconButton>
            <IconButton onClick={handleAudio} style={{ color: "white" }}>
              {audio ? <MicIcon /> : <MicOffIcon />}
            </IconButton>
            {screenAvailable && (
              <IconButton onClick={handleScreen} style={{ color: "white" }}>
                {!screen ? <StopScreenShareIcon /> : <ScreenShareIcon />}
              </IconButton>
            )}
            <Badge badgeContent={newMessages} max={999} color="secondary">
              <IconButton onClick={() => setModal(!showModal)} style={{ color: "white" }}>
                <ChatIcon />
              </IconButton>
            </Badge>
          </div>

          <video className={styles.meetUserVideo} ref={mainVideoRef} autoPlay muted></video>

          <div className={styles.conferenceView}>
            {videos
              .filter((v) => v.socketId !== socketIDRef.current)
              .map((v) => (
                <div key={v.socketId} className={styles.conferenceView}>
                  <video
                    autoPlay
                    playsInline
                    ref={(el) => {
                      if (el && v.stream && el.srcObject !== v.stream) el.srcObject = v.stream;
                    }}
                  />
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}