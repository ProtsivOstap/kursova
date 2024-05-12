import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  List,
  ListItem,
  ListItemText,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import { format } from "date-fns";
import { BACK_URL, USER_ROLES } from "../constants/constants";
import myStyles from "./styles/order-details.module.css";
import { useAuth } from "../../context/AuthContext";

interface Order {
  createdAt: string;
  client: {
    firstName: string;
    lastName: string;
    email: string;
    id: number;
  };
  admin: {
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    id: number | null;
  };
  status: string;
  orderId: number;
  orderComponents: {
    specificPartName: string;
    partGroupName: string;
    generalPartName: string;
    supplierName: string | null;
    supplierId: number | null;
    orderComponentStatus: string;
    orderComponentId: string;
    orderComponentPrice: string;
  }[];
}

const OrderDetailsPage: React.FC = () => {
  const { auth } = useAuth();
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string>("");
  const [reloadPage, setReloadPage] = useState<Boolean>(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [openPriceDialog, setOpenPriceDialog] = useState(false);
  const [supplierName, setSupplierName] = useState<string>("");
  const [orderComponentId, setOrderComponentId] = useState<string>("");
  const [price, setPrice] = useState<string>("");

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await axios.get(`${BACK_URL}/orders/${id}`, {
          headers: {
            Authorization: `Bearer ${auth?.accessToken}`,
            "ngrok-skip-browser-warning": "true",
          },
        });
        const fetchedOrder: Order = response.data;
        setOrder(fetchedOrder);
      } catch (error) {
        console.error("Error fetching order:", error);
        setError("Failed to fetch order. Please try again later.");
        setOrder(null);
        window.location.href = "/orders";
      }
    };

    fetchOrder();
  }, [id, reloadPage]);

  const assignToMe = async () => {
    try {
      await axios.put(
        `${BACK_URL}/orders/${order?.orderId}/assign/admin`,
        {},
        {
          headers: {
            Authorization: `Bearer ${auth?.accessToken}`,
            "ngrok-skip-browser-warning": "true",
          },
        }
      );
      setReloadPage(!reloadPage);
    } catch (error) {
      console.error("Error assigning order to me:", error);
      setError("Failed to assign order to me. Please try again later.");
    }
  };

  const declineOrder = async () => {
    try {
      await axios.put(
        `${BACK_URL}/orders/${order?.orderId}/decline/admin`,
        {},
        {
          headers: {
            Authorization: `Bearer ${auth?.accessToken}`,
            "ngrok-skip-browser-warning": "true",
          },
        }
      );
      setReloadPage(!reloadPage);
    } catch (error) {
      console.error("Error assigning order to me:", error);
      setError("Failed to assign order to me. Please try again later.");
    }
  };

  const userAcceptOrderComponent = async (selectedOrderComponentId: string) => {
    await axios.put(
      `${BACK_URL}/orders/${selectedOrderComponentId}/accept`,
      {},
      {
        headers: {
          Authorization: `Bearer ${auth?.accessToken}`,
          "ngrok-skip-browser-warning": "true",
        },
      }
    );
    setReloadPage(!reloadPage);
  };

  const declineOrderComponent = async (selectedOrderComponentId: string) => {
    await axios.put(
      `${BACK_URL}/orders/${selectedOrderComponentId}/decline`,
      {},
      {
        headers: {
          Authorization: `Bearer ${auth?.accessToken}`,
          "ngrok-skip-browser-warning": "true",
        },
      }
    );
    setReloadPage(!reloadPage);
  };

  const handleOpenAssignSupplierModal = (orderComponentId: string) => {
    setOrderComponentId(orderComponentId);
    setSupplierName("");
    setOpenDialog(true);
  };

  const handleOpenPriceDialog = (orderComponentId: string) => {
    setOrderComponentId(orderComponentId);
    setPrice("");
    setOpenPriceDialog(true);
  };

  const handleClosePriceDialog = () => {
    setOpenPriceDialog(false);
  };

  const handleAssignSupplierModalClose = () => {
    setOpenDialog(false);
  };

  const handleSupplierNameChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSupplierName(event.target.value);
  };

  const handlePriceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPrice(event.target.value);
  };

  const handleAssignSupplier = async () => {
    try {
      const data = {
        orderComponentId,
        price: auth?.role === USER_ROLES.supplier ? price : null,
        supplierName: auth?.role === USER_ROLES.supplier ? null : supplierName,
      };

      await axios.put(
        `${BACK_URL}/orders/${orderComponentId}/assign/supplier`,
        data,
        {
          headers: {
            Authorization: `Bearer ${auth?.accessToken}`,
            "ngrok-skip-browser-warning": "true",
          },
        }
      );
      setReloadPage(!reloadPage);
      setOpenDialog(false);
    } catch (error) {
      console.error("Error assigning supplier:", error);
      setError("Failed to assign supplier. Please try again later.");
    }
  };

  const handleAssignPrice = async () => {
    try {
      const data = {
        price,
      };

      await axios.put(`${BACK_URL}/orders/${orderComponentId}/accept`, data, {
        headers: {
          Authorization: `Bearer ${auth?.accessToken}`,
          "ngrok-skip-browser-warning": "true",
        },
      });
      setReloadPage(!reloadPage);
      setOpenPriceDialog(false);
    } catch (error) {
      console.error("Error assigning price:", error);
      setError("Failed to assign price. Please try again later.");
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd MMM yyyy HH:mm:ss");
  };

  return (
    <div>
      <h1>Order Details</h1>
      {error && <p>{error}</p>}
      {order && (
        <div>
          <div className={myStyles.generalInfoContainer}>
            <div>
              <h2>Order Information</h2>
              <p>Order ID: {order.orderId}</p>
              <p>Created At: {formatDate(order.createdAt)}</p>
              <p>Status: {order.status}</p>
            </div>
            <div>
              <h3>Client Details:</h3>
              <List>
                <ListItem>
                  <ListItemText
                    primary={`First Name: ${order.client.firstName}`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary={`Last Name: ${order.client.lastName}`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText primary={`Email: ${order.client.email}`} />
                </ListItem>
              </List>
            </div>

            <div>
              <h3>Admin Details</h3>
              {!order.admin.lastName && auth?.role === USER_ROLES.admin ? (
                <Button variant="contained" onClick={assignToMe}>
                  Assign to Me
                </Button>
              ) : (
                <div>
                  <List>
                    <ListItem>
                      <ListItemText
                        primary={`First Name: ${
                          order.admin.firstName || "N/A"
                        }`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary={`Last Name: ${order.admin.lastName || "N/A"}`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary={`Email: ${order.admin.email || "N/A"}`}
                      />
                    </ListItem>
                  </List>
                </div>
              )}
            </div>
          </div>
          <div>
            {auth?.role === USER_ROLES.admin && !['finished','received', 'declined'].includes(order.status) && (
              <Button variant="contained" onClick={declineOrder}>
                Decline order
              </Button>
            )}
          </div>
          <h2>Order Components</h2>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>OrderComponentId</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Specific Part Name</TableCell>
                <TableCell>Part Group Name</TableCell>
                <TableCell>General Part Name</TableCell>
                <TableCell>Supplier Name</TableCell>
                {auth?.role !== USER_ROLES.admin && (
                  <TableCell>Action</TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {order.orderComponents.map((component, index) => (
                <TableRow key={index}>
                  <TableCell>{component.orderComponentId}</TableCell>
                  <TableCell>{component.orderComponentStatus}</TableCell>
                  <TableCell>
                    {component.orderComponentPrice || "N\\A"}
                  </TableCell>
                  <TableCell>{component.specificPartName}</TableCell>
                  <TableCell>{component.partGroupName}</TableCell>
                  <TableCell>{component.generalPartName}</TableCell>
                  <TableCell>
                    {(!component.supplierName ||
                      ["declined_supplier", "declined_user"].includes(
                        component.orderComponentStatus
                      )) && order.status !== 'declined' &&
                    auth?.role === USER_ROLES.admin ? (
                      <Button
                        variant="contained"
                        onClick={() => {
                          handleOpenAssignSupplierModal(
                            component.orderComponentId
                          );
                        }}
                      >
                        Assign Supplier
                      </Button>
                    ) : (
                      component.supplierName
                    )}
                  </TableCell>
                  {auth?.role !== USER_ROLES.admin && (
                    <TableCell>
                      {auth?.role === USER_ROLES.supplier &&
                        component.orderComponentStatus ===
                          "assigned_to_supplier" && order.status !== 'declined' && (
                          <div>
                            <Button
                              variant="contained"
                              onClick={() => {
                                handleOpenPriceDialog(
                                  component.orderComponentId
                                );
                              }}
                              sx={{ marginRight: "10px" }}
                            >
                              Accept
                            </Button>
                            <Button
                              variant="contained"
                              onClick={() => {
                                declineOrderComponent(
                                  component.orderComponentId
                                );
                              }}
                            >
                              Decline
                            </Button>
                          </div>
                        )}
                      {auth?.role === USER_ROLES.user &&
                        component.orderComponentStatus ===
                          "approved_supplier" && order.status !== 'declined' && (
                          <div>
                            <Button
                              variant="contained"
                              onClick={() => {
                                userAcceptOrderComponent(
                                  component.orderComponentId
                                );
                              }}
                              sx={{ marginRight: "10px" }}
                            >
                              Accept
                            </Button>
                            <Button
                              variant="contained"
                              onClick={() => {
                                declineOrderComponent(
                                  component.orderComponentId
                                );
                              }}
                            >
                              Decline
                            </Button>
                          </div>
                        )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Dialog for assigning supplier */}
      <Dialog open={openDialog} onClose={handleAssignSupplierModalClose}>
        <DialogTitle>Assign Supplier</DialogTitle>
        <DialogContent>
          <TextField
            label="Supplier Name"
            value={supplierName}
            onChange={handleSupplierNameChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAssignSupplierModalClose}>Cancel</Button>
          <Button variant="contained" onClick={handleAssignSupplier}>
            Submit
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog for entering price */}
      <Dialog open={openPriceDialog} onClose={handleClosePriceDialog}>
        <DialogTitle>Enter Price</DialogTitle>
        <DialogContent>
          <TextField label="Price" value={price} onChange={handlePriceChange} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePriceDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleAssignPrice}>
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default OrderDetailsPage;
