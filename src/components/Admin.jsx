import React, { useEffect, useState } from "react";
import "../App.css";
import { Badge, Button, TextField, Typography } from "@mui/material";
import { encrypt } from "../utils/encrypted";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import { useNavigate, useParams } from "react-router-dom";
import ClearIcon from "@mui/icons-material/Clear";
import { socket } from "../utils/socket";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import EditIcon from "@mui/icons-material/Edit";
import { useUser } from "../UserContext";

const Admin = () => {
  const { userId } = useUser();
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productImage, setProductImage] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [queries, setQueries] = useState([]);
  const [viewProducts, setViewProducts] = useState([]);
  const [queryMessages, setQueryMessages] = useState({});
  const [messageInputs, setMessageInputs] = useState({});
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalCategories: 0,
    pendingOrders: 0,
    completedOrders: 0,
  });
  const [count, setCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [productCount, setProductCount] = useState();
  const [editTab, setEditTab] = useState("noEdit");
  const navigate = useNavigate();
  const [productId, setProductId] = useState("");

  const fetchQueries = () => {
    axios
      .get("http://localhost:8080/ecommerce/admin/queries")
      .then((res) => {
        setQueries(res.data);
        const messagesMap = {};
        res.data.forEach((q) => {
          messagesMap[q._id] = q.messages || [];
        });

        setQueryMessages(messagesMap);
      })
      .catch((err) => console.error("Query fetch failed", err));
  };

  const fetchMetrics = () => {
    axios
      .get("http://localhost:8080/ecommerce/admin/metrics")
      .then((res) => {
        setMetrics(res.data);
        setCount(res.data.pendingQueries);
      })
      .catch((err) => console.error("Failed to fetch metrics", err));
  };

  const orderNotifyGet = () => {
    axios.get("http://localhost:8080/ecommerce/notify/get").then((res) => {
      setOrderCount(res.data);
      console.log("orderNotifyGet", res.data);
    });
  };

  useEffect(() => {
    const messagesMap = {};
    queries.forEach((q) => {
      messagesMap[q._id] = q.messages || [];
    });
    setQueryMessages(messagesMap);
  }, [queries]);

  useEffect(() => {
    fetchMetrics();
    fetchQueries();
    socket.on("newUserRegistered", fetchMetrics);
    socket.on("orderPlaced", fetchMetrics);
    socket.on("orderCompleted", fetchMetrics);
    socket.on("newProduct", fetchMetrics);
    socket.on("updateForAdmin", handleGetProducts);
    // socket.on("deleteCart",handleGetProducts)
    socket.on("newQuery", () => {
      console.log("Received newQuery event");
      fetchQueries();
      fetchMetrics();
    });
    socket.on("orderPlaced", orderNotifyGet);
    socket.on("queryResolved", fetchMetrics);
    socket.on("queryMessage", ({ queryId, message }) => {
      setQueryMessages((prev) => {
        const oldMessages = prev[queryId] || [];
        return { ...prev, [queryId]: [...oldMessages, message] };
      });
    });

    return () => {
      socket.off("newUserRegistered", fetchMetrics);
      socket.off("orderPlaced", fetchMetrics);
      socket.off("orderCompleted", fetchMetrics);
      socket.off("newProduct", fetchMetrics);
      socket.off("newQuery", fetchQueries);
      socket.off("queryResolved", fetchMetrics);
      socket.off("queryMessage");
      socket.off("updateForAdmin", handleGetProducts);
      socket.off("orderCount", orderNotifyGet);
    };
  }, []);

  const handleAddProducts = () => {
    const formData = new FormData();
    formData.append("file", productImage);
    formData.append("productName", productName);
    formData.append("productDescription", productDescription);
    formData.append("productCategory", productCategory);
    formData.append("productPrice", productPrice);

    axios
      .post("http://localhost:8080/ecommerce/home/admin/upload", formData)
      .then((res) => {
        toast.success(res.data.message);
        setProductName("");
        setProductImage(null);
        setProductDescription("");
        setProductCategory("");
        setProductPrice("");
      })
      .catch((err) => toast.error("Upload failed"));
  };

  const handleDelete = (id) => {
    axios
      .delete(`http://localhost:8080/ecommerce/home/admin/${id}`)
      .then((res) => {
        toast.success(res.data.message);
        handleGetProducts();
      });
  };

  const handleResolveQuery = (id) => {
    axios
      .patch(`http://localhost:8080/ecommerce/admin/queries/${id}/resolve`)
      .then((res) => {
        toast.success("Query resolved");
        setQueries((prev) =>
          prev.map((q) => (q._id === id ? { ...q, isResolved: true } : q))
        );

        fetchMetrics();
      })
      .catch((err) => toast.error("Failed to resolve query"));
  };

  const sendMessage = (queryId) => {
    const text = messageInputs[queryId];
    if (!text) return;

    axios
      .post(
        `http://localhost:8080/ecommerce/admin/queries/${queryId}/message`,
        { text }
      )
      .then((res) => {
        toast.success("Message sent");
        setMessageInputs((prev) => ({ ...prev, [queryId]: "" }));
      })
      .catch(() => toast.error("Failed to send message"));
  };

  const handleGetProducts = () => {
    axios.get("http://localhost:8080/ecommerce/home/admin").then((res) => {
      setViewProducts(res.data);
      setActiveTab("productList");
    });
  };

  const handleGetCategories = () => {
    axios
      .get("http://localhost:8080/ecommerce/home/admin/categories")
      .then((res) => {
        const data = res.data;
        const result = data.reduce((acc, curr) => {
          if (
            !acc.find((item) => item.productCategory === curr.productCategory)
          )
            acc.push(curr);
          return acc;
        }, []);
        setCategories(result);
        setActiveTab("categoriesList");
      });
  };

  const handleChangeNotify = () => {
    axios.post("http://localhost:8080/ecommerce/notify/change");
  };

  const handleGetOrders = () => {
    axios
      .get("http://localhost:8080/ecommerce/order")
      .then((res) => {
        setOrders(res.data);
        setActiveTab("orders");
        handleChangeNotify();
        setTimeout(() => {
          orderNotifyGet();
        }, 3000);
      })
      .catch((err) => toast.error("Error loading orders", err));
  };

  const handleAddQty = (id) => {
    const data = { productCount };
    console.log("productCount", data);
    axios
      .post(`http://localhost:8080/ecommerce/add/qty/${id}`, { data })
      .then((res) => {
        toast.success(res.data.message);
        setProductCount();
        handleGetProducts();
      });
  };
  const { id } = useParams();

  const startEdit = (id) => {
    axios.get(`http://localhost:8080/ecommerce/home/user/${id}`).then((res) => {
      console.log("startEdit", res.data._id);
      const data = res.data;
      setProductId(data._id);
      setActiveTab("add");
      setEditTab("edit");
      setProductName(data.productName);
      setProductImage(data.productImage);
      setProductDescription(data.productDescription);
      setProductCategory(data.productCategory);
      setProductPrice(data.productPrice);
    });
  };

  const updateProducts = () => {
    const formData = new FormData();
    formData.append("file", productImage);
    formData.append("productName", productName);
    formData.append("productDescription", productDescription);
    formData.append("productCategory", productCategory);
    formData.append("productPrice", productPrice);
    console.log("id", productId);

    axios
      .put(
        `http://localhost:8080/ecommerce/home/admin/edit/${productId}`,
        formData
      )
      .then((res) => {
        toast.success(res.data.message);
        setProductName("");
        setProductImage(null);
        setProductDescription("");
        setProductCategory("");
        setProductPrice("");
        setActiveTab("productList");
        setEditTab("noEdit");
      })
      .catch((err) => toast.error("Upload failed"));
  };
  const handleLogout = () => {
    axios.post("http://localhost:8080/ecommerce/logout", { userId });
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    navigate("/login");
  };

  return (
    <div className="admin-container">
      <header className="admin-header">
        <h1>
          INZPYRE <span>Admin Panel</span>
        </h1>
        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </header>

      <nav className="admin-nav">
        <button onClick={() => setActiveTab("dashboard")}>DashBoard</button>
        <button onClick={() => setActiveTab("add")}>Add Products</button>
        <Badge badgeContent={count} color="error">
          <button className="query-btn" onClick={() => setActiveTab("queries")}>
            User Queries
          </button>
        </Badge>
        <button onClick={handleGetProducts}>Products</button>
        <button onClick={handleGetCategories}>Categories</button>
        <Badge badgeContent={orderCount} color="error">
          <button className="query-btn" onClick={handleGetOrders}>
            Order List
          </button>
        </Badge>
      </nav>

      {activeTab === "add" && (
        <div className="admin-form">
          <TextField
            fullWidth
            label="Product Name"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
          />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setProductImage(e.target.files[0])}
          />
          <TextField
            fullWidth
            label="Description"
            multiline
            rows={3}
            value={productDescription}
            onChange={(e) => setProductDescription(e.target.value)}
          />
          <TextField
            fullWidth
            label="Category"
            value={productCategory}
            onChange={(e) => setProductCategory(e.target.value)}
          />
          <TextField
            fullWidth
            label="Price"
            type="number"
            value={productPrice}
            onChange={(e) => setProductPrice(e.target.value)}
          />
          {editTab === "noEdit" ? (
            <Button variant="contained" onClick={handleAddProducts}>
              Add Product
            </Button>
          ) : (
            <Button variant="contained" onClick={updateProducts}>
              Update Product
            </Button>
          )}
        </div>
      )}

      {activeTab === "queries" && (
        <div className="admin-queries">
          <h2>User Queries</h2>
          {queries.length === 0 ? (
            <p>No pending queries</p>
          ) : (
            queries.map((query) => (
              <Accordion
                key={query._id}
                style={{
                  backgroundColor: query.isResolved ? "#d4edda" : "white",
                }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  {query.userName} -{" "}
                  {new Date(query.createdAt).toLocaleString()}
                </AccordionSummary>
                <AccordionDetails>
                  <p>
                    <b>User:</b> {query.queryText}
                  </p>

                  {/* Messages thread */}
                  <div
                    className="messages-thread"
                    style={{
                      maxHeight: "200px",
                      overflowY: "auto",
                      border: "1px solid #ccc",
                      padding: "8px",
                      marginBottom: "10px",
                    }}
                  >
                    {(queryMessages[query._id] || []).map((msg, idx) => (
                      <div
                        key={idx}
                        style={{
                          marginBottom: "6px",
                          textAlign: msg.sender === "admin" ? "right" : "left",
                        }}
                      >
                        <b>
                          {msg.sender === "admin" ? "Admin" : query.userName}:
                        </b>{" "}
                        {msg.text}
                        <br />
                        <small>
                          {new Date(msg.timestamp).toLocaleString()}
                        </small>
                      </div>
                    ))}
                  </div>

                  {/* Input box to send admin reply */}
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Type a reply"
                    value={messageInputs[query._id] || ""}
                    onChange={(e) =>
                      setMessageInputs((prev) => ({
                        ...prev,
                        [query._id]: e.target.value,
                      }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage(query._id);
                      }
                    }}
                  />
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => sendMessage(query._id)}
                    style={{ marginTop: "6px" }}
                  >
                    Send
                  </Button>

                  {query.isResolved ? (
                    <Typography
                      variant="body2"
                      style={{
                        marginTop: "10px",
                        color: "green",
                        fontWeight: "bold",
                      }}
                    >
                      Resolved
                    </Typography>
                  ) : (
                    <Button
                      variant="contained"
                      color="success"
                      onClick={() => handleResolveQuery(query._id)}
                      style={{ marginTop: "10px" }}
                    >
                      Mark as Resolved
                    </Button>
                  )}
                </AccordionDetails>
              </Accordion>
            ))
          )}
        </div>
      )}

      {activeTab === "dashboard" && (
        <div className="dashboard-head">
          <div className="dashboard-tiles">
            <h2>Users</h2>
            <p>{metrics.totalUsers}</p>
          </div>
          <div className="dashboard-tiles">
            <h2>Orders Pending</h2>
            <p>{metrics.pendingOrders}</p>
          </div>
          <div className="dashboard-tiles">
            <h2>Orders Completed</h2>
            <p>{metrics.completedOrders}</p>
          </div>
          <div className="dashboard-tiles">
            <h2>Categories</h2>
            <p>{metrics.totalCategories}</p>
          </div>
          <div className="dashboard-tiles">
            <h2>Products</h2>
            <p>{metrics.totalProducts}</p>
          </div>
          <div className="dashboard-tiles">
            <h2>Queries Pending</h2>
            <p>{metrics.pendingQueries}</p>
          </div>
          <div className="dashboard-tiles">
            <h2>Queries Completed</h2>
            <p>{metrics.completedQueries}</p>
          </div>
        </div>
      )}

      {activeTab === "productList" && (
        <div className="product-list">
          {viewProducts.map((product, index) => (
            <div
              className={
                product.totalProducts === 0 ? "unavailable" : "product-card"
              }
              key={index}
            >
              <ClearIcon
                className="delete-icon"
                onClick={() => handleDelete(product._id)}
              />
              <img
                src={`http://localhost:8080/uploads/${product.productImage}`}
                alt={product.productName}
              />
              <h4>{product.productName}</h4>
              <p>{product.productDescription}</p>
              <span>Category: {product.productCategory}</span>
              <strong>₹{product.productPrice}</strong>
              {product.totalProducts === 0 && (
                <div>
                  <input
                    type="number"
                    value={productCount}
                    onChange={(e) => setProductCount(e.target.value)}
                  />
                  <button onClick={() => handleAddQty(product._id)}>
                    Add Qty
                  </button>
                </div>
              )}
              <span className="editIcon" onClick={() => startEdit(product._id)}>
                <EditIcon />
              </span>
            </div>
          ))}
        </div>
      )}

      {activeTab === "categoriesList" && (
        <div className="categoriesList">
          {categories.map((item, index) => (
            <ul key={index}>
              <li>{item.productCategory}</li>
            </ul>
          ))}
        </div>
      )}

      {activeTab === "orders" && (
        <div className="order-section">
          <h2>Orders</h2>
          {orders.map((order, i) => (
            <div key={i} className="order-card">
              <h4>User: {order.userId}</h4>
              <p>{new Date(order.createdAt).toLocaleString("en-GB")}</p>
              {order.products.map((p, j) => (
                <p key={j}>
                  🛒 {p.productName} — ₹{p.productPrice} × {p.quantity}
                </p>
              ))}
            </div>
          ))}
        </div>
      )}
      <ToastContainer />
    </div>
  );
};

export default Admin;
