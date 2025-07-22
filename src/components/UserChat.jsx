import React, { useEffect, useState } from "react";
import { useUser } from "../UserContext";
import {
  Button,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import { decodeToken } from "../utils/decodeToken";
import { socket } from "../utils/socket";
import "./UserChat.css";
import BackButton from "../utils/BackButton";

const UserChat = () => {
  const { userId, userName, setUserName } = useUser();
  const [queryText, setQueryText] = useState("");
  const [queries, setQueries] = useState([]);

  // Fetch user-related queries from the server
  const fetchQueries = async () => {
    try {
      const res = await axios.get(
        `http://localhost:8080/ecommerce/user/${userId}/queries`
      );
      setQueries(res.data);
    } catch (err) {
      toast.error("Failed to fetch queries");
    }
  };

  useEffect(() => {
    if (!userId) return;

    fetchQueries();

    const token = localStorage.getItem("token");
    if (!token) return;

    const decoded = decodeToken(token);
    if (!decoded) return;

    setUserName(decoded.name);

    socket.on("queryMessage", ({ queryId, message }) => {
      setQueries((prev) =>
        prev.map((q) =>
          q._id === queryId
            ? {
                ...q,
                messages: [...q.messages, message],
              }
            : q
        )
      );
    });

    socket.on("queryResolved", fetchQueries);

    return () => {
      socket.off("queryMessage");
    };
  }, [userId]);

  const submitQuery = () => {
    axios
      .post("http://localhost:8080/ecommerce/queries", {
        userId,
        queryText,
        userName,
      })
      .then((res) => {
        toast.success(res.data.message);
        setQueryText("");
        fetchQueries();
      })
      .catch((err) => {
        if (err.response.status === 404) {
          toast.error(err.response.data.message);
        } else {
          toast.error("Failed to submit query");
        }
      });
  };

  return (
    <div>
      <BackButton />
      <div className="chat-header">
        <h1>UserChat</h1>
      </div>
      <div className="chat-all">
        <div className="chat-body">
          {queries.map((query, idx) => (
            <Accordion
              key={query._id}
              style={{
                backgroundColor: query.isResolved ? "#d4edda" : "white",
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>
                  <strong>Query {idx + 1}:</strong> {query.queryText}
                  {query.isResolved && (
                    <span style={{ color: "green", marginLeft: 10 }}>
                      (Resolved)
                    </span>
                  )}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                {query.messages.map((msg, i) => (
                  <div key={i} style={{ marginBottom: "10px" }}>
                    <strong>{msg.sender === "admin" ? "Admin" : "You"}:</strong>{" "}
                    {msg.text}
                    <br />
                    <small>{new Date(msg.timestamp).toLocaleString()}</small>
                  </div>
                ))}
              </AccordionDetails>
            </Accordion>
          ))}
        </div>
        <div className="chat-direction">
          <TextField
            fullWidth
            label="Ask your question"
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
          />
          <Button variant="contained" onClick={submitQuery}>
            Submit Query
          </Button>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

export default UserChat;
