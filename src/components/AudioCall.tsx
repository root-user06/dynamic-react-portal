import { useEffect, useState } from "react";
import Peer, { MediaConnection } from "peerjs";

const generateShortId = () => Math.random().toString(36).substring(2, 8); // 6-character ID

const AudioCall: React.FC = () => {
    const [peerId, setPeerId] = useState<string>(generateShortId());
    const [remotePeerId, setRemotePeerId] = useState<string>("");
    const [peer, setPeer] = useState<Peer | null>(null);
    const [call, setCall] = useState<MediaConnection | null>(null);
    const [isCalling, setIsCalling] = useState<boolean>(false);

    useEffect(() => {
        // Initialize PeerJS with a shorter ID
        const newPeer = new Peer(peerId);

        newPeer.on("open", (id: string) => setPeerId(id));

        newPeer.on("call", (incomingCall: MediaConnection) => {
            getUserAudio().then((stream) => {
                incomingCall.answer(stream);
                incomingCall.on("stream", playAudio);
            });
            setCall(incomingCall);
        });

        setPeer(newPeer);
        return () => newPeer.destroy();
    }, []);

    const getUserAudio = async () => {
        return await navigator.mediaDevices.getUserMedia({
            audio: {
                autoGainControl: true,
                noiseSuppression: true,
                echoCancellation: true,
                
            }
        });
    };

    const callPeer = (id: string) => {
        if (!peer) return;

        getUserAudio().then((stream) => {
            const outgoingCall = peer.call(id, stream);
            outgoingCall.on("stream", playAudio);
            setCall(outgoingCall);
            setIsCalling(true);
        });
    };

    const endCall = () => {
        if (call) call.close();
        setIsCalling(false);
    };

    const playAudio = (stream: MediaStream) => {
        const audio = document.createElement("audio");
        audio.srcObject = stream;
        audio.play();
    };

    return (
        <div style={{ textAlign: "center", marginTop: "50px" }}>
            <h2>Free Audio Call</h2>
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
        </div>
    );
};

export default AudioCall;
