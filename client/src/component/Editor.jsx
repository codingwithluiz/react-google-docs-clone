"use client";

import { useEffect, useState, useRef } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import { Box } from "@mui/material";
import styled from "@emotion/styled";
import { io } from "socket.io-client";
import { useParams } from "react-router-dom";

const Component = styled.div`
  background: #f5f5f5;

`;

const toolbarOptions = [
  ["bold", "italic", "underline", "strike"],
  ["blockquote", "code-block"],
  [{ header: 1 }, { header: 2 }],
  [{ list: "ordered" }, { list: "bullet" }],
  [{ script: "sub" }, { script: "super" }],
  [{ indent: "-1" }, { indent: "+1" }],
  [{ direction: "rtl" }],
  [{ size: ["small", false, "large", "huge"] }],
  [{ header: [1, 2, 3, 4, 5, 6, false] }],
  [{ color: [] }, { background: [] }],
  [{ font: [] }],
  [{ align: [] }],
  ["clean"],
];

const Editor = () => {
  const [socket, setSocket] = useState(null);
  const quillRef = useRef(null);
  const containerRef = useRef(null);
  const { id } = useParams();

  useEffect(() => {
    const socketServer = io("http://localhost:9000");
    setSocket(socketServer);

    return () => socketServer.disconnect();
  }, []);

  useEffect(() => {
    if (!containerRef.current || quillRef.current) return; // Evita recriação do editor

    const quillInstance = new Quill(containerRef.current, {
      theme: "snow",
      modules: { toolbar: toolbarOptions },
    });
    quillInstance.disable();
    quillInstance.setText("Loading the document...");
    quillRef.current = quillInstance;
  }, []);

  useEffect(() => {
    if (!socket || !quillRef.current) return;

    const handleChange = (delta, oldData, source) => {
      if (source === "user") {
        socket.emit("send-changes", delta);
      }
    };

    quillRef.current.on("text-change", handleChange);
    return () => quillRef.current.off("text-change", handleChange);
  }, [socket]);

  useEffect(() => {
    if (!socket || !quillRef.current) return;

    const handleReceiveChange = (delta) => {
      quillRef.current.updateContents(delta);
    };

    socket.on("receive-changes", handleReceiveChange);
    return () => socket.off("receive-changes", handleReceiveChange);
  }, [socket]);

  useEffect(() => {
    if (!socket || !quillRef.current) return;

    socket.once("load-document", (document) => {
      quillRef.current.setContents(document);
      quillRef.current.enable();
    });

    socket.emit("get-document", id);
  }, [socket, id]);

  useEffect(() => {
    if (!socket || !quillRef.current) return;

    const interval = setInterval(() => {
      socket.emit("save-document", quillRef.current.getContents());
    }, 2000);

    return () => clearInterval(interval);
  }, [socket]);

  return (
    <Component>
      <Box className="container" ref={containerRef} id='container'></Box>
    </Component>
  );
};

export default Editor;
