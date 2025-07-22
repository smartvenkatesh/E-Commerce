import React, { useEffect, useState } from "react";
import { alpha } from "@mui/material/styles";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import InputBase from "@mui/material/InputBase";
import SearchIcon from "@mui/icons-material/Search";
import Dropdown from "react-bootstrap/Dropdown";
import axios from "axios";
import { Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import { useUser } from "../UserContext";
import { toast, ToastContainer } from "react-toastify";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import Badge from "@mui/material/Badge";
import IconButton from "@mui/material/IconButton";
import Slider from "react-slick";
import { decodeToken } from "../utils/decodeToken";
import ChatIcon from "@mui/icons-material/Chat";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import { styled, createTheme, ThemeProvider } from "@mui/material/styles";
import { deepPurple } from "@mui/material/colors";
import Avatar from "@mui/material/Avatar";

const customTheme = createTheme({
  palette: {
    primary: {
      main: deepPurple[500],
    },
  },
});

const StyledAvatar = styled(Avatar)`
  ${({ theme }) => `
  cursor: pointer;
  background-color: ${theme.palette.primary.main};
  transition: ${theme.transitions.create(["background-color", "transform"], {
    duration: theme.transitions.duration.standard,
  })};
  &:hover {
    background-color: ${theme.palette.secondary.main};
    transform: scale(1.3);
  }
  `}
`;

const socket = io("http://localhost:8080");

const sliderSettings = {
  dots: false,
  infinite: false,
  speed: 500,
  slidesToShow: 4,
  slidesToScroll: 2,
  responsive: [
    {
      breakpoint: 1024,
      settings: {
        slidesToShow: 3,
      },
    },
    {
      breakpoint: 600,
      settings: {
        slidesToShow: 2,
      },
    },
    {
      breakpoint: 480,
      settings: {
        slidesToShow: 1,
      },
    },
  ],
};

const Search = styled("div")(({ theme }) => ({
  position: "relative",
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  "&:hover": {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginLeft: 0,
  width: "100%",
  [theme.breakpoints.up("sm")]: {
    marginLeft: theme.spacing(1),
    width: "auto",
  },
}));

const SearchIconWrapper = styled("div")(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: "100%",
  position: "absolute",
  pointerEvents: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: "inherit",
  width: "100%",
  "& .MuiInputBase-input": {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create("width"),
    [theme.breakpoints.up("sm")]: {
      width: "12ch",
      "&:focus": {
        width: "20ch",
      },
    },
  },
}));

const Home = () => {
  const { userId, setRole, role, userName, setUserName } = useUser();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [viewProducts, setViewProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [show, setShow] = useState(true);
  const [count, setCount] = useState(0);
  const [cart, setCart] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [updateQuantity, setUpdateQuantity] = useState("");
  const [alert, setAlert] = useState(false);

  useEffect(() => {
    const storedCount = localStorage.getItem("cartCount");
    if (storedCount) {
      setCount(parseInt(storedCount, 10));
    }

    handleRefreshProducts();

    const token = localStorage.getItem("token");
    if (!token) return;
    const decoded = decodeToken(token);
    if (!decoded) return;
    console.log("decoded", decoded);
    setRole(decoded.role);
    setUserName(decoded.name);

    socket.on("newProduct", (newProduct) => {
      setProducts((prev) => [newProduct, ...prev]);
    });

    socket.on("newQuantity", (newQuantity) => {
      setUpdateQuantity(newQuantity);
    });

    socket.on("added", (added) => {
      toast.success(`${added} added by admin`);
    });

    socket.on("addByAdmin", (add) => {
      toast.success(`${add} added by admin`);
      handleRefreshProducts();
    });

    socket.on("queryResolved", handleQuerySolved);

    socket.on("newCount", (newCount) => {
      setCount(newCount);
      console.log("newCount", newCount);

      localStorage.setItem("cartCount", newCount);
    });
    socket.on("updateProducts", handleRefreshProducts);

    return () => {
      socket.off("newProduct");
      socket.off("queryResolved", handleQuerySolved);
      socket.off("updateProducts", handleRefreshProducts);
    };
  }, []);

  const handleRefreshProducts = () => {
    axios.get("http://localhost:8080/ecommerce/home/admin").then((res) => {
      setProducts(res.data);
      console.log(res.data);
      toast.success(res.data.message);
    });
  };

  const handleHome = () => {
    setShow(true);
    navigate("/home");
  };
  const handleQuerySolved = () => {
    toast.success("Your Query Solved");
  };

  const handleViewDetails = (id) => {
    axios
      .get(`http://localhost:8080/ecommerce/home/user/${id}`)
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : [res.data];
        if (data.every((item) => item.productName && item.productCategory)) {
          setViewProducts(data);
          setShow(false);
        } else {
          console.log("new error");
        }
      })
      .catch((err) => {
        toast.error(err);
      });
  };

  const handleBuyNow = async (productId) => {
    await handleAddToCart(productId);
    navigate("/home/cart");
  };

  const handleAddToCart = async (productId) => {
    try {
      const response = await axios.post(
        "http://localhost:8080/ecommerce/add-to-cart/single",
        {
          userId,
          productId,
        }
      );
      toast.success("Added to cart");
    } catch (err) {
      handleRefreshProducts();
      if (err.response.status === 404) {
        toast.warn(err.response?.data?.message);
      }
      console.error(err);
      toast.error("Failed to add to cart");
    }
  };

  const handleShowCard = () => {
    axios
      .get(`http://localhost:8080/ecommerce/cart/${userId}`)
      .then((res) => {
        const cartItems = res.data.cart || [];
        setCart(cartItems);
        setCount(cartItems.length);
      })
      .catch((err) => {
        toast.error(err.message || "Error fetching cart");
      });
  };

  const handleQuantityChange = (productId, delta) => {
    setQuantities((prev) => {
      const current = prev[productId] || 1;
      const newQuantity = Math.max(1, current + delta);
      return { ...prev, [productId]: newQuantity };
    });
  };

  const handleAddToCartWithQuantity = async (productId) => {
    const quantity = quantities[productId] || 1;

    console.log("quantity", quantity);

    try {
      const res = await axios.post(
        "http://localhost:8080/ecommerce/add-to-cart",
        {
          userId,
          productId,
          quantity,
        }
      );
      toast.success("Added to cart");
      toast.error(res.err);
    } catch (err) {
      handleRefreshProducts();
      if (err.response.status === 404) {
        toast.warning(err.response?.data?.message);
      } else if (err.response.status === 400) {
        toast.warn(err.response?.data?.message);
      } else if (err.response.status === 204) {
        toast.warning(err.response?.data?.message);
      } else {
        toast.error("Failed to add to cart");
      }
    }
  };
  const filteredProducts = products.filter((product) =>
    product.productName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedProducts = filteredProducts.reduce((acc, product) => {
    if (!acc[product.productCategory]) acc[product.productCategory] = [];
    acc[product.productCategory].push(product);
    return acc;
  }, {});

  const handleLogout = () => {
    if (!userId) {
      toast.error("Please login to add to cart");
      navigate("/login");
      return;
    }
    axios.post("http://localhost:8080/ecommerce/logout", { userId });
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    navigate("/login");
  };

  return (
    <div>
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="fixed">
          <Toolbar>
            <Typography
              variant="h5"
              noWrap
              component="div"
              sx={{ flexGrow: 1, display: { xs: "none", sm: "block" } }}
              onClick={handleHome}
            >
              INZPYRE
            </Typography>
            <div className="avatar">
              <Search>
                <SearchIconWrapper>
                  <SearchIcon />
                </SearchIconWrapper>
                <StyledInputBase
                  placeholder="Search…"
                  inputProps={{ "aria-label": "search" }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </Search>
              <ThemeProvider theme={customTheme}>
                <StyledAvatar title="Chat to admin" className="avatar">
                  <ChatIcon
                    className="chatIcon"
                    onClick={() => navigate("/home/userChat")}
                  />
                </StyledAvatar>
              </ThemeProvider>

              <ThemeProvider theme={customTheme}>
                <Badge badgeContent={count} color="error">
                  <StyledAvatar title="View Cart">
                    <IconButton
                      size="large"
                      aria-label="show 17 new notifications"
                      color="inherit"
                      onClick={() => navigate("/home/cart")}
                    >
                      <ShoppingCartIcon className="shoppingcart" />
                    </IconButton>
                  </StyledAvatar>
                </Badge>
              </ThemeProvider>

              {!userId ? (
                <Button
                  variant="contained"
                  color="success"
                  onClick={() => navigate("/login")}
                >
                  Login
                </Button>
              ) : (
                <Dropdown>
                  <Dropdown.Toggle variant="success" id="dropdown-basic">
                    {userName}
                  </Dropdown.Toggle>

                  <Dropdown.Menu>
                    <Dropdown.Item onClick={() => navigate("/user/profile")}>
                      Profile
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => navigate("/home/cart")}>
                      Cart
                    </Dropdown.Item>
                    <Dropdown.Item onClick={handleLogout}>Logout</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              )}
            </div>
          </Toolbar>
        </AppBar>
      </Box>
      {show && (
        <div className="hiding">
          {Object.entries(groupedProducts).map(([category, items]) => (
            <div key={category}>
              <h2 className="product-title">{category.toUpperCase()}</h2>
              <div>
                <Slider {...sliderSettings}>
                  {items.map((product, idx) => {
                    if (product.totalProducts === 0) {
                      return <div key={idx}></div>;
                    }
                    return (
                      // <div key={idx} className='product-card'>
                      //   <div className='for-click' onClick={() => handleViewDetails(product._id)}>
                      //     <img
                      //       src={`http://localhost:8080/uploads/${product.productImage}`}
                      //       alt={product.productName}
                      //     />
                      //     <h3>{product.productName}</h3>
                      //     <p>₹{product.productPrice}</p>
                      //   </div>
                      //   <span className='buy-btn'>
                      //     <Button variant='contained' onClick={() => handleBuyNow(product._id)}>Buy Now</Button>
                      //     <div style={{ display: 'inline-flex', alignItems: 'center', margin: '0 10px' }}>
                      //       <Button variant='outlined' onClick={() => handleQuantityChange(product._id, -1)}>-</Button>
                      //       <Typography sx={{ mx: 1 }}>{quantities[product._id] || 1}</Typography>
                      //       <Button variant='outlined' onClick={() => handleQuantityChange(product._id, 1, product.totalProducts)}>+</Button>
                      //     </div>
                      //     <Button variant='contained' color='success' onClick={() => handleAddToCartWithQuantity(product._id)}>Add to Cart</Button>
                      //   </span>
                      // </div>
                      <Card sx={{ maxWidth: 345 }}>
                        <CardMedia
                          sx={{ width: 250, height: 260 }}
                          style={{ backgroundSize: "contain" }}
                          image={`http://localhost:8080/uploads/${product.productImage}`}
                          title={product.productName}
                          className="for-click"
                          id="image-view"
                          onClick={() => handleViewDetails(product._id)}
                        />
                        <CardContent>
                          <Typography gutterBottom variant="h5" component="div">
                            {product.productName}
                          </Typography>
                          <Typography className="text-center">
                            {new Intl.NumberFormat("en-In", {
                              style: "currency",
                              currency: "INR",
                            }).format(product.productPrice)}
                          </Typography>
                        </CardContent>
                        <CardActions>
                          <span className="buy-btn">
                            <Button
                              variant="contained"
                              onClick={() => handleBuyNow(product._id)}
                            >
                              Buy Now
                            </Button>
                            <div
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                margin: "0 10px",
                              }}
                            >
                              <Button
                                variant="outlined"
                                onClick={() =>
                                  handleQuantityChange(product._id, -1)
                                }
                              >
                                -
                              </Button>
                              <Typography sx={{ mx: 1 }}>
                                {quantities[product._id] || 1}
                              </Typography>
                              <Button
                                variant="outlined"
                                onClick={() =>
                                  handleQuantityChange(
                                    product._id,
                                    1,
                                    product.totalProducts
                                  )
                                }
                              >
                                +
                              </Button>
                            </div>
                            <Button
                              variant="contained"
                              color="success"
                              onClick={() =>
                                handleAddToCartWithQuantity(product._id)
                              }
                            >
                              Add to Cart
                            </Button>
                          </span>
                        </CardActions>
                      </Card>
                    );
                  })}
                </Slider>
              </div>
            </div>
          ))}
        </div>
      )}

      {show === false && (
        <div className="product-details">
          {Array.isArray(viewProducts) &&
            viewProducts.map((details, index) => (
              <div className="frontView" key={index}>
                <div className="imageView">
                  <h1>{details.productName}</h1>
                  <img
                    src={`http://localhost:8080/uploads/${details.productImage}`}
                    alt={details.productName}
                    width="480px"
                    height="450px"
                  />
                  <span className="btn-view">
                    <Button
                      variant="contained"
                      onClick={() => handleBuyNow(details._id)}
                    >
                      Buy Now
                    </Button>
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        margin: "0 10px",
                      }}
                    >
                      <Button
                        variant="outlined"
                        onClick={() => handleQuantityChange(details._id, -1)}
                      >
                        -
                      </Button>
                      <Typography sx={{ mx: 1 }}>
                        {quantities[details._id] || 1}
                      </Typography>
                      <Button
                        variant="outlined"
                        onClick={() => handleQuantityChange(details._id, 1)}
                      >
                        +
                      </Button>
                    </div>
                    <Button
                      variant="contained"
                      color="success"
                      onClick={() => handleAddToCartWithQuantity(details._id)}
                    >
                      Add to Cart
                    </Button>
                  </span>
                </div>
                <div className="sideView">
                  <p>Product Description</p>
                  <h3>{details.productDescription}</h3>
                  <p>Product Category</p>
                  <h3>{details.productCategory.toUpperCase()}</h3>
                  <p>Product Price</p>
                  <h3>
                    {new Intl.NumberFormat("en-In", {
                      style: "currency",
                      currency: "INR",
                    }).format(details.productPrice)}
                  </h3>
                  <p>Total Quantity</p>
                  <h3>
                    {updateQuantity ? updateQuantity : details.totalProducts}
                  </h3>
                </div>
              </div>
            ))}
        </div>
      )}

      <ToastContainer
        position="top-center"
        autoClose={4000}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
};

export default Home;
