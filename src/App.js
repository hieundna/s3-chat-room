import React, { useState, useEffect, useRef } from "react";
import socketIOClient from "socket.io-client";
import "./styles/index.scss";

const host =
  "https://chat-room-ob19jmg4n-hieu-nguyens-projects-9bc66264.vercel.app";

function App() {
  const [name, setName] = useState("");
  const [isJoined, setIsJoined] = useState(false);
  const [listMessage, setListMessage] = useState([]);
  const [message, setMessage] = useState("");
  const [id, setId] = useState("");
  const [typingMessage, setTypingMessage] = useState("");
  const [totalUser, setTotalUser] = useState(1);

  const boxMessage = useRef();
  const socketRef = useRef();
  const mesInputRef = useRef();
  const nameInputRef = useRef();
  const typingTimeOut = useRef();

  useEffect(() => {
    nameInputRef.current?.focus();
    socketRef.current = socketIOClient.connect(host);

    socketRef.current.on("getId", (data) => {
      setId(data);
    });

    socketRef.current.on("newMember", (data) => {
      setListMessage((oldMsgs) => [...oldMsgs, data]);
    });

    socketRef.current.on("receive.publicRoom", (data) => {
      setListMessage((oldMsgs) => [...oldMsgs, data]);
    });

    socketRef.current.on("totalUser", (data) => {
      setTotalUser(data);
    });

    return () => {
      // cleanup
      socketRef.current.disconnect();
    };
  }, []);

  useEffect(() => {
    if (isJoined && id) {
      mesInputRef.current?.focus();
      socketRef.current?.emit("joinPublicRoom", {
        id,
        name,
      });

      socketRef.current.on("typingList", (data) => {
        const list = data.filter((user) => user.id !== id);
        if (list.length === 1) {
          setTypingMessage(`${list[0].name} is typing...`);
        } else if (list.length === 2) {
          setTypingMessage(`${list[0].name} and ${list[1].name} are typing...`);
        } else if (list.length > 2) {
          setTypingMessage(`${list.length} people are typing...`);
        } else {
          setTypingMessage("");
        }
      });
    }
  }, [id, isJoined, name]);

  useEffect(() => {
    boxMessage.current?.scrollIntoView({ behavior: "smooth" });
  }, [listMessage]);

  const sendMessage = () => {
    if (message.trim()) {
      const msg = {
        id,
        content: message,
        name,
      };
      socketRef.current.emit("sendMessage", msg);
      setListMessage((oldMsgs) => [...oldMsgs, msg]);
      setMessage("");
    }
  };

  const handleKeyDown = (e, func) => {
    if (e.key === "Enter") {
      if (func) {
        func();
      }
    }
  };

  const handleMessageChange = (e) => {
    if (typingTimeOut.current) {
      clearTimeout(typingTimeOut.current);
    } else {
      socketRef.current.emit("typing", {
        id,
        name,
        typing: true,
      });
    }

    setMessage(e.target.value);

    typingTimeOut.current = setTimeout(() => {
      socketRef.current.emit("typing", {
        id,
        name,
        typing: false,
      });

      typingTimeOut.current = null;
    }, 2000);
  };

  const renderMess = listMessage.map((m, index) => {
    if (m.content) {
      return (
        <div
          key={index}
          className={`chat-item ${
            m.id === id ? "your-message" : "other-people"
          }`}
        >
          <div className="chat-item-name">{m.id === id ? "You" : m.name}</div>
          <div className="chat-item-message">{m.content}</div>
        </div>
      );
    }
    return (
      <div className="chat-item-note">
        <span>{m.name} has joined</span>
      </div>
    );
  });

  if (!isJoined) {
    return (
      <div className="form-container">
        <h3>Welcome to S3 Chat room</h3>
        <div className="form-item">
          <input
            type="text"
            ref={nameInputRef}
            value={name}
            onKeyUp={(e) => handleKeyDown(e, () => setIsJoined(true))}
            placeholder="Type your name"
            onChange={(e) => setName(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setIsJoined(true)}
            disabled={!name}
          >
            Join
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="box-chat">
      <div className="box-chat_title">
        <h3>S3 Channel</h3>
        <div className="total-user">{totalUser}</div>
      </div>

      <div className="box-chat_message">
        {renderMess}

        <div className="typing-message">
          <span>{typingMessage}</span>
        </div>
        <div ref={boxMessage} />
      </div>

      <div className="send-box">
        <textarea
          type="text"
          ref={mesInputRef}
          value={message}
          onKeyUp={(e) => handleKeyDown(e, sendMessage)}
          onChange={handleMessageChange}
          placeholder="Type your message ..."
        />
        <button onClick={sendMessage} disabled={!message.trim()}>
          Send
        </button>
      </div>
    </div>
  );
}

export default App;
