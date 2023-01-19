import {useCallback, useState} from 'react';
import {Symbl} from '@symblai/symbl-web-sdk';

const appId = "";
const appSecret = "";

export default function useSymbl(onError) {
    const [isStarting, setIsStarting] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [isMute, setIsMuted] = useState(false);
    const [startedTime, setStartedTime] = useState(null);

    const startSymblWebSocketApi = useCallback(
        async (handlers, options) => {
            if (isStarting) {
                console.log('Another connection already starting. Returning');
            }
            else {
                setIsStarting(true);
                const symbl = new Symbl({
                    appId: appId,
                    appSecret: appSecret
                });
                try {
                    console.log("Trying to create new connection");
                    window.connection = await symbl.createConnection();
                    console.log("Trying to start processing.");
                    await window.connection.startProcessing({
                        id: options.meetingId,
                        config: {
                            confidenceThreshold: 0.5,
                            meetingTitle: options.meetingTitle,
                            encoding: "OPUS" // Encoding can be "LINEAR16" or "OPUS"
                        },
                        speaker: {
                            userId: options.localParticipant && options.localParticipant.email,
                            name: options.localParticipant && options.localParticipant.name
                        }
                    });
                    setStartedTime(new Date().toISOString());
                    setIsConnected(true);
                    setIsStarting(false);

                    window.connection.on("speech_recognition", (speechData) => {
                        handlers.onSpeechDetected(speechData);
                    });
                    window.connection.on("message", (messageData) => {
                        handlers.onMessageResponse(messageData);
                    })
                } catch (err) {
                    console.log("I ran into an error");
                    onError(err);
                    setIsStarting(false);
                }
            }
        },
        [isStarting, onError]
    );

    const stopSymblWebSocketApi = useCallback(
        async (callback) => {
            if (window.connection) {
                try {
                    await window.connection.stopProcessing()
                    setIsConnected(false);
                } catch (err) {
                    onError(err);
                }
            }
        },
        [onError]
    );

    const muteSymbl = useCallback(
        async () => {
            if (window.connection) {
                try {
                    setIsMuted(true);
                } catch (err) {
                    onError(err);
                }
            }
        },
        [onError]
    );

    const unMuteSymbl = useCallback(
        async () => {
            if (window.connection) {
                try {
                    setIsMuted(false);
                } catch (err) {
                    onError(err);
                }
            }
        },
        [onError]
    );

    return {
        isConnected,
        isStarting,
        startSymblWebSocketApi,
        stopSymblWebSocketApi,
        muteSymbl,
        isMute,
        unMuteSymbl,
        startedTime
    };
}
