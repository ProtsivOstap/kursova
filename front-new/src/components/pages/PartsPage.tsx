import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Stack,
  DialogActions, // Import Stack component from Material-UI
} from "@mui/material";
import { BACK_URL, USER_ROLES } from "../constants/constants";
import { useAuth } from "../../context/AuthContext";
import * as FormDataTest from "form-data";

export interface Part {
  partId: string;
  partNumber: string;
  specificPartName: string;
  partGroupName: string;
  generalPartName: string;
  carModelName: string;
  carModelYear: number;
  carBrand: string;
  suppliers?: Supplier[];
}

type PartNoPartNumber = Omit<Part, "partNumber" | "partId">;
type PartOnlyPartNumber = Pick<Part, "partNumber">;
type CreateOrderPart = PartNoPartNumber | PartOnlyPartNumber;

export interface Supplier {
  supplierId: number;
  supplierName: string;
}

interface PartsPageProps {
  onOrderSubmit: (orderData: { partNumber: string }[]) => void;
}

const PartsPage: React.FC<PartsPageProps> = ({ onOrderSubmit }) => {
  const { auth } = useAuth();
  console.log(auth);

  const [parts, setParts] = useState<Part[]>([]);
  const [error, setError] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [totalItems, setTotalItems] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [openCreateOrderModal, setOpenCreateOrderModal] =
    useState<boolean>(false);
  const [partNumbers, setPartNumbers] = useState<Array<CreateOrderPart>>([]);
  const [filters, setFilters] = useState<{ [key: string]: string }>({
    specificPartName: "",
    partGroupName: "",
    generalPartName: "",
    carModelName: "",
    carBrand: "",
    carModelYear: "",
    partNumber: "",
  });
  const [file, setFile] = useState(null);
  const [fileModalOpen, setFileModalOpen] = useState(false);
  const [selectedPart, setSelectedPart] = useState<Part | null>(null); // New state to store selected part

  useEffect(() => {
    const fetchParts = async () => {
      try {
        const response = await axios.get(`${BACK_URL}/parts`, {
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
        const { parts, totalNumber } = response.data;
        setParts(parts);
        setTotalItems(totalNumber);

        // Calculate total pages
        const calculatedTotalPages = Math.ceil(totalNumber / limit);
        setTotalPages(calculatedTotalPages);
      } catch (error) {
        console.error("Error fetching parts:", error);
        setError("Failed to fetch parts. Please try again later.");
        setParts([]);
      }
    };

    fetchParts();
  }, [page, limit, filters]);

  const handleChangePage = (
    event: React.ChangeEvent<unknown>,
    newPage: number
  ) => {
    setPage(newPage);
  };
  const handleOpenModal = () => {
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  const handleOpenCreateOrderModal = () => {
    setOpenCreateOrderModal(true);
  };

  const handleCloseCreateOrderModal = () => {
    setOpenCreateOrderModal(false);
  };

  const handleAddPartNumber = () => {
    console.log("asdasdnk");

    setPartNumbers((prevPartNumbers) => [
      ...prevPartNumbers,
      { partNumber: "" } as CreateOrderPart, // Type assertion
    ]);
  };

  const handleSubmitOrder = async () => {
    console.log(partNumbers);
    const response = await axios.post(`${BACK_URL}/orders`, partNumbers, {
      headers: {
        Authorization: `Bearer ${auth?.accessToken}`,
      },
    });
    console.log(response);

    // const orderData = partNumbers.filter((part) => part !== "");
    // onOrderSubmit(orderData.map((partNumber) => ({ partNumber })));
    handleCloseCreateOrderModal();
  };

  const handleCreateNew = () => {
    setPartNumbers([]); // Reset part numbers
  };

  const handleCreatePart = async () => {
    try {
      const newPartNumber: PartNoPartNumber = {
        carBrand: "",
        carModelName: "",
        carModelYear: 0,
        generalPartName: "",
        partGroupName: "",
        specificPartName: "",
      };
      setPartNumbers((prevPartNumbers) => [...prevPartNumbers, newPartNumber]);
    } catch (error) {
      console.error("Error creating new part:", error);
      // Handle error
    }
  };

  const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFilters((prevFilters) => ({
      ...prevFilters,
      [name]: value,
    }));
  };

  const handlePartClick = async (partId: string) => {
    try {
      const response = await axios.get(`${BACK_URL}/parts/${partId}`,{
        headers:{
          Authorization: `Bearer ${auth?.accessToken}`,
        }
      }); // Fetch additional info for the clicked part
      setSelectedPart(response.data); // Set the selected part state with additional info
      setOpenModal(true); // Open the dialog to display additional part info
    } catch (error) {
      console.error("Error fetching part details:", error);
      // Handle error
    }
  };

  const handleUploadPartModal = () => {
    setFileModalOpen(true);
  };

  const handleFileChange = (event:any) => {
    setFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      // Handle file not selected
      return;
    }
// @ts-expect-error
    const formData = new FormDataTest();
    formData.append("file", file);
    console.log(formData);
    try {
      const response = await axios.post(`${BACK_URL}/csv-import/parts/supplier`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${auth?.accessToken}`,
        },
      });

      // Handle successful upload
    } catch (error) {
      // Handle upload error
      console.error("Error uploading file:", error);
    }

    setFileModalOpen(false);
  };

  const handleFileModalClose = () => {
    setFileModalOpen(false);
  };
  
  return (
    <div>
      <h1>Parts Page</h1>
      <Stack direction="row" spacing={2} alignItems="center">
        <TextField
          label="Specific Part Name"
          name="specificPartName"
          value={filters.specificPartName}
          onChange={handleFilterChange}
          fullWidth // Set fullWidth to true to match the width of its container
        />
        <TextField
          label="Part Group Name"
          name="partGroupName"
          value={filters.partGroupName}
          onChange={handleFilterChange}
          fullWidth // Set fullWidth to true to match the width of its container
        />
        <TextField
          label="General Part Name"
          name="generalPartName"
          value={filters.generalPartName}
          onChange={handleFilterChange}
          fullWidth // Set fullWidth to true to match the width of its container
        />
        <TextField
          label="Car Model Name"
          name="carModelName"
          value={filters.carModelName}
          onChange={handleFilterChange}
          fullWidth // Set fullWidth to true to match the width of its container
        />
        <TextField
          label="Car Brand"
          name="carBrand"
          value={filters.carBrand}
          onChange={handleFilterChange}
          fullWidth // Set fullWidth to true to match the width of its container
        />
        <TextField
          label="Car Model Year"
          name="carModelYear"
          value={filters.carModelYear}
          onChange={handleFilterChange}
          fullWidth // Set fullWidth to true to match the width of its container
        />
        <TextField
          label="Part number"
          name="partNumber"
          value={filters.partNumber}
          onChange={handleFilterChange}
          fullWidth // Set fullWidth to true to match the width of its container
        />
      </Stack>
      {error && <p>{error}</p>}
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Part Number</TableCell>
            <TableCell>Specific Part Name</TableCell>
            <TableCell>Part Group Name</TableCell>
            <TableCell>General Part Name</TableCell>
            <TableCell>Car Model Name</TableCell>
            <TableCell>Car Model Year</TableCell>
            <TableCell>Car Brand</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {parts.map((part, index) => (
            <TableRow key={index} onClick={() => handlePartClick(part.partId)}>
              {" "}
              {/* Add onClick handler */}
              <TableCell>{part.partNumber}</TableCell>
              <TableCell>{part.specificPartName}</TableCell>
              <TableCell>{part.partGroupName}</TableCell>
              <TableCell>{part.generalPartName}</TableCell>
              <TableCell>{part.carModelName}</TableCell>
              <TableCell>{part.carModelYear}</TableCell>
              <TableCell>{part.carBrand}</TableCell>
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
      {auth?.role === USER_ROLES.supplier && (
        <Button onClick={handleUploadPartModal}>Load parts</Button>
      )}

      <Dialog
        open={fileModalOpen}
        onClose={handleFileModalClose}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Upload Parts</DialogTitle>
        <DialogContent>
          <input type="file" onChange={handleFileChange} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleFileModalClose} color="primary">
            Close
          </Button>
          <Button onClick={handleUpload} color="primary">
            Upload
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog for displaying additional part info */}
      <Dialog
        open={openModal}
        onClose={handleCloseModal}
        fullWidth
        maxWidth="xl"
        sx={{ "& .MuiDialog-paper": { width: "90%" } }}
      >
        <DialogTitle>Part Details</DialogTitle>
        <DialogContent>
          {selectedPart && (
            <div>
              <p>Part Number: {selectedPart.partNumber}</p>
              <p>Specific Part Name: {selectedPart.specificPartName}</p>
              <p>Part Group Name: {selectedPart.partGroupName}</p>
              <p>General Part Name: {selectedPart.generalPartName}</p>
              <p>Car Model Name: {selectedPart.carModelName}</p>
              <p>Car Model Year: {selectedPart.carModelYear}</p>
              <p>Car Brand: {selectedPart.carBrand}</p>
              {selectedPart.suppliers && (
                <div>
                  <h3>Suppliers</h3>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Supplier ID</TableCell>
                        <TableCell>Supplier Name</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedPart.suppliers.map((supplier) => (
                        <TableRow key={supplier.supplierId}>
                          <TableCell>{supplier.supplierId}</TableCell>
                          <TableCell>{supplier.supplierName}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
          <Button onClick={handleCloseModal}>Close</Button>
        </DialogContent>
      </Dialog>
      {auth?.role === USER_ROLES.user && (
        <Button onClick={handleOpenCreateOrderModal}>Create Order</Button>
      )}

      <Dialog
        open={openCreateOrderModal}
        onClose={handleCloseCreateOrderModal}
        fullWidth
        maxWidth="xl"
        sx={{ "& .MuiDialog-paper": { width: "90%" } }}
      >
        <DialogTitle>Create Order</DialogTitle>
        <DialogContent>
          {partNumbers.map((part, index) => (
            <div key={index}>
              {Object.keys(part).map((key, i) => (
                <TextField
                  key={i}
                  label={key}
                  value={part[key as keyof CreateOrderPart]}
                  onChange={(event) =>
                    setPartNumbers((prevPartNumbers) => {
                      const updatedPartNumbers = [...prevPartNumbers];
                      updatedPartNumbers[index][key as keyof CreateOrderPart] =
                        event.target.value as never;
                      return updatedPartNumbers;
                    })
                  }
                  fullWidth
                  margin="normal"
                  style={
                    // @ts-expect-error
                    part.partNumber
                      ? { width: 400, margin: 20 }
                      : { width: 200, margin: 20 }
                  }
                />
              ))}
            </div>
          ))}
          <Button onClick={handleAddPartNumber}>Add part code</Button>
          <Button onClick={handleSubmitOrder}>Submit Order</Button>
          <Button onClick={handleCreatePart}>Add new part</Button>
          <Button onClick={handleCreateNew}>Create New</Button>
          <Button onClick={handleCloseModal}>Cancel</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PartsPage;
