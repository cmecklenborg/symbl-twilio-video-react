import React, {createContext, useEffect, useState} from 'react';
import useSymbl from "./useSymbl/useSymbl";
import useVideoContext from "../../hooks/useVideoContext/useVideoContext";

export const SymblContext = createContext(null);

export function SymblProvider({
                                  options, roomName, children, onError = () => {
    }
                              }) {
    const onErrorCallback = (error) => {
        console.log(`ERROR: ${error.message}`, error);
        onError(error);
    };

    const [closedCaptionResponse, setClosedCaptionResponse] = useState({});
    const [messages, setMessages] = useState([]);
    const [newMessages, setNewMessages] = useState([]);
    const {
        room: {localParticipant}
    } = useVideoContext();

    const onSpeechDetected = (data) => {
        setClosedCaptionResponse(data)
    };

    const onMessageResponse = (newMessages) => {
        // console.log('newMessages: ', newMessages);
        setNewMessages(newMessages);
        setMessages([messages, ...newMessages]);
    };

    const onConversationCompleted = (messages) => {
        console.log('Conversation completed.', messages);
    }

    const handlers = {
        onSpeechDetected,
        onMessageResponse,
        onConversationCompleted,
        onInsightResponse: (data) => {
            console.log(JSON.stringify(data))
        },
    };

    const {
        isConnected, startedTime, startSymblWebSocketApi, stopSymblWebSocketApi,
        muteSymbl, unMuteSymbl, isMute
    } =
        useSymbl(onErrorCallback, {...options});

    useEffect(() => {
        (async () => {
            if (roomName) {
                await startSymblWebSocketApi(handlers, {
                    meetingTitle: roomName,
                    meetingId: btoa(roomName),
                    handlers,
                    localParticipant: {
                        name: localParticipant.identity
                    }
                });
            }
        })();
    }, [handlers, localParticipant.identity, roomName, startSymblWebSocketApi])

    return (
        <SymblContext.Provider
            value={{
                isConnected,
                startSymblWebSocketApi,
                stopSymblWebSocketApi,
                muteSymbl,
                unMuteSymbl,
                isMute,
                startedTime,
                closedCaptionResponse,
                newMessages,
                messages,
                onError: onErrorCallback,
            }}
        >
            {children}
        </SymblContext.Provider>
    );
}
