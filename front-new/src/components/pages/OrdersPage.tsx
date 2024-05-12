// OrdersPage.tsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
  TextField,
  Button,
  Stack,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import { format } from "date-fns";
import { BACK_URL, USER_ROLES } from "../constants/constants";
import { useAuth } from "../../context/AuthContext";

interface Order {
  createdAt: string;
  clientLastName: string;
  adminLastName: string | null;
  status: string;
  orderId: number;
}

const OrdersPage: React.FC = () => {
  const { auth } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [filters, setFilters] = useState<{
    [key: string]: string;
  }>({
    clientLastName: "",
    status: "",
    generalPartName: "",
    partGroupName: "",
    specificPartName: "",
    supplierName: "",
    partNumber: "",
  });

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.get(`${BACK_URL}/orders`, {
          params: {
            page,
            limit,
            ...filters,
          },
          headers: {
            Authorization: `Bearer ${auth?.accessToken}`,
            "ngrok-skip-browser-warning": "true",
          },
        });
        const { orders, totalNumber } = response.data;
        setOrders(orders);
        setTotalItems(totalNumber);

        const calculatedTotalPages = Math.ceil(totalNumber / limit);
        setTotalPages(calculatedTotalPages);
      } catch (error) {
        console.error("Error fetching orders:", error);
        setError("Failed to fetch orders. Please try again later.");
        setOrders([]);
      }
    };

    fetchOrders();
  }, [page, limit, filters]);

  const handleChangePage = (
    event: React.ChangeEvent<unknown>,
    newPage: number
  ) => {
    setPage(newPage);
  };

  const loadFile = ()=>{

  }

  const handleFilterChange = (event: any) => {
    const { name, value } = event.target;
    setFilters((prevFilters) => ({
      ...prevFilters,
      [name]: value,
    }));
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd MMM yyyy HH:mm:ss");
  };

  return (
    <div>
      <h1>Orders Page</h1>
      <p>
        Maybe add status accepted by admin and filter orders by current admin or
        unasigned
      </p>
      <Stack direction="row" spacing={2} alignItems="center">
        {auth?.role !== USER_ROLES.user ? (
          <TextField
            label="Client Last Name"
            name="clientLastName"
            value={filters.clientLastName}
            onChange={handleFilterChange}
            margin="normal"
          />
        ) : null}
        <FormControl sx={{ minWidth: 130 }}>
          <InputLabel id="order-by-label">Status</InputLabel>
          <Select
            label="Status"
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            sx={{ minWidth: 130 }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="created">created</MenuItem>
            <MenuItem value="in_progress">in_progress</MenuItem>
            <MenuItem value="finished">finished</MenuItem>
            <MenuItem value="received">received</MenuItem>
          </Select>
        </FormControl>
        <TextField
          label="General Part Name"
          name="generalPartName"
          value={filters.generalPartName}
          onChange={handleFilterChange}
          margin="normal"
        />
        <TextField
          label="Part Group Name"
          name="partGroupName"
          value={filters.partGroupName}
          onChange={handleFilterChange}
          margin="normal"
        />
        <TextField
          label="Specific Part Name"
          name="specificPartName"
          value={filters.specificPartName}
          onChange={handleFilterChange}
          margin="normal"
        />
        {auth?.role !== USER_ROLES.supplier ? (
          <TextField
            label="Supplier Name"
            name="supplierName"
            value={filters.supplierName}
            onChange={handleFilterChange}
            margin="normal"
          />
        ) : null}
        <TextField
          label="Part Number"
          name="partNumber"
          value={filters.partNumber}
          onChange={handleFilterChange}
          margin="normal"
        />
      </Stack>
      {error && <p>{error}</p>}
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Order ID</TableCell>
            <TableCell>Client Last Name</TableCell>
            <TableCell>Admin Last Name</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Created At</TableCell>
            <TableCell>Details</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.orderId}>
              <TableCell>{order.orderId}</TableCell>
              <TableCell>{order.clientLastName}</TableCell>
              <TableCell>{order.adminLastName || "-"}</TableCell>
              <TableCell>{order.status}</TableCell>
              <TableCell>{formatDate(order.createdAt)}</TableCell>
              <TableCell>
                {" "}
                <Link to={`/orders/${order.orderId}`}>
                  {" "}
                  <Button variant="contained" color="primary">
                    Details
                  </Button>
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Pagination
        count={totalPages}
        page={page}
        onChange={handleChangePage}
        variant="outlined"
        shape="rounded"
      />
      <Button
        variant="contained"
        onClick={() => {
          loadFile();
        }}
      >
        Load orders
      </Button>
    </div>
  );
};

export default OrdersPage;
