// SuppliersPage.tsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
  TextField,
  Stack,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
} from "@mui/material";
import { BACK_URL } from "../constants/constants";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

interface Supplier {
  supplierName: string;
  supplierId: number;
  componentsToComplete: string;
  finishedComponents: string;
}

const SuppliersPage: React.FC = () => {
  const { auth } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [error, setError] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [filters, setFilters] = useState<{
    [key: string]: string;
  }>({});

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const response = await axios.get(`${BACK_URL}/suppliers`, {
          params: {
            page,
            limit,
            ...filters,
          },
          headers: {
            "ngrok-skip-browser-warning": "true",
            Authorization: `Bearer ${auth?.accessToken}`,
          },
        });
        const { suppliers, totalNumber } = response.data;
        setSuppliers(suppliers);
        setTotalItems(totalNumber);

        const calculatedTotalPages = Math.ceil(totalNumber / limit);
        setTotalPages(calculatedTotalPages);
      } catch (error) {
        console.error("Error fetching suppliers:", error);
        setError("Failed to fetch suppliers. Please try again later.");
        setSuppliers([]);
      }
    };

    fetchSuppliers();
  }, [page, limit, filters]);

  const handleChangePage = (
    event: React.ChangeEvent<unknown>,
    newPage: number
  ) => {
    setPage(newPage);
  };

  const handleFilterChange = (event: any) => {
    const { name, value } = event.target;
    setFilters((prevFilters) => ({
      ...prevFilters,
      [name]: value,
    }));
  };

  return (
    <div>
      <h1>Suppliers Page</h1>
      <Stack direction="row" spacing={2} alignItems="center">
        <TextField
          label="Supplier Name"
          name="supplierName"
          value={filters.supplierName || ""}
          onChange={handleFilterChange}
          margin="normal"
        />
        <TextField
          label="Part Number"
          name="partNumber"
          value={filters.partNumber || ""}
          onChange={handleFilterChange}
          margin="normal"
        />
        <TextField
          label="Specific Part Name"
          name="specificPartName"
          value={filters.specificPartName || ""}
          onChange={handleFilterChange}
          margin="normal"
        />
        <TextField
          label="Part Group Name"
          name="partGroupName"
          value={filters.partGroupName || ""}
          onChange={handleFilterChange}
          margin="normal"
        />
        <TextField
          label="General Part Name"
          name="generalPartName"
          value={filters.generalPartName || ""}
          onChange={handleFilterChange}
          margin="normal"
        />
        <FormControl sx={{ minWidth: 130 }}>
          <InputLabel id="order-by-label">Order By</InputLabel>
          <Select
            labelId="order-by-label"
            name="orderBy"
            value={filters.orderBy || ""}
            onChange={handleFilterChange}
          >
            <MenuItem value="">None</MenuItem>
            <MenuItem value="supplierName">Supplier Name</MenuItem>
            <MenuItem value="componentsToComplete">
              Components To Complete
            </MenuItem>
            <MenuItem value="finishedComponents">Finished Components</MenuItem>
          </Select>
        </FormControl>
      </Stack>
      {error && <p>{error}</p>}
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Supplier ID</TableCell>
            <TableCell>Supplier Name</TableCell>
            <TableCell>Components To Complete</TableCell>
            <TableCell>Finished Components</TableCell>
            <TableCell>Details</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {suppliers.map((supplier) => (
            <TableRow key={supplier.supplierId}>
              <TableCell>{supplier.supplierId}</TableCell>
              <TableCell>{supplier.supplierName}</TableCell>
              <TableCell>{supplier.componentsToComplete}</TableCell>
              <TableCell>{supplier.finishedComponents}</TableCell>
              <TableCell>
                <Link to={`/suppliers/${supplier.supplierId}`}>
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
    </div>
  );
};

export default SuppliersPage;
