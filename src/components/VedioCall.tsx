import { useEffect, useState, useRef } from "react";
import Peer, { MediaConnection } from "peerjs";

const generateShortId = () => Math.random().toString(36).substring(2, 8); // 6-character ID

const VideoCall: React.FC = () => {
    const [peerId, setPeerId] = useState<string>(generateShortId());
    const [remotePeerId, setRemotePeerId] = useState<string>("");
    const [peer, setPeer] = useState<Peer | null>(null);
    const [call, setCall] = useState<MediaConnection | null>(null);
    const [isCalling, setIsCalling] = useState<boolean>(false);

    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const newPeer = new Peer(peerId);

        newPeer.on("open", (id: string) => setPeerId(id));

        newPeer.on("call", (incomingCall: MediaConnection) => {
            getUserMedia().then((stream) => {
                incomingCall.answer(stream);
                if (localVideoRef.current) localVideoRef.current.srcObject = stream;

                incomingCall.on("stream", (remoteStream) => {
                    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
                });
            });
            setCall(incomingCall);
        });

        setPeer(newPeer);
        return () => newPeer.destroy();
    }, []);

    const getUserMedia = async () => {
        return await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: {
                noiseSuppression: true,
                echoCancellation: true,
                autoGainControl: true
            }
        });
    };

    const callPeer = (id: string) => {
        if (!peer) return;

        getUserMedia().then((stream) => {
            if (localVideoRef.current) localVideoRef.current.srcObject = stream;
            const outgoingCall = peer.call(id, stream);

            outgoingCall.on("stream", (remoteStream) => {
                if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
            });

            setCall(outgoingCall);
            setIsCalling(true);
        });
    };

    const endCall = () => {
        if (call) call.close();
        setIsCalling(false);
    };

    return (
        <div style={{ textAlign: "center", marginTop: "50px" }}>
            <h2>Free Video Call</h2>
            <p>Your ID: <strong>{peerId}</strong></p>

            <input
                type="text"
                placeholder="Enter Peer ID to call"
                value={remotePeerId}
                onChange={(e) => setRemotePeerId(e.target.value)}
                style={{ padding: "5px", width: "200px" }}
            />

            <br /><br />

            {!isCalling ? (
                <button onClick={() => callPeer(remotePeerId)} style={{ padding: "10px 20px", cursor: "pointer" }}>
                    Call
                </button>
            ) : (
                <button onClick={endCall} style={{ padding: "10px 20px", cursor: "pointer", backgroundColor: "red", color: "white" }}>
                    End Call
                </button>
            )}

            <div style={{ display: "flex", justifyContent: "center", marginTop: "20px" }}>
                <div>
                    <h3>You</h3>
                    <video ref={localVideoRef} autoPlay muted style={{ width: "300px", borderRadius: "10px" }}></video>
                </div>
                <div>
                    <h3>Remote</h3>
                    <video ref={remoteVideoRef} autoPlay style={{ width: "300px", borderRadius: "10px" }}></video>
                </div>
            </div>
        </div>
    );
};

export default VideoCall;
