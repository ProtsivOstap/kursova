import React, { useEffect, useState } from 'react';
import axios from 'axios';
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
} from '@mui/material';

interface Part {
  partNumber: string;
  specificPartName: string;
  partGroupName: string;
  generalPartName: string;
  carModelName: string;
  carModelYear: number;
  carBrand: string;
}

interface PartsPageProps {
  onOrderSubmit: (orderData: { partNumber: string }[]) => void;
}
const PartsPage: React.FC<PartsPageProps> = ({ onOrderSubmit }) => {
  const [parts, setParts] = useState<Part[]>([]);
  const [error, setError] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10); // Set your preferred default limit here
  const [totalItems, setTotalItems] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [partNumbers, setPartNumbers] = useState<string[]>(['']);
  const [newPart, setNewPart] = useState<{
    generalPartName: string;
    carModelName: string;
  }>({
    generalPartName: '',
    carModelName: '',
  });

  useEffect(() => {
    const fetchParts = async () => {
      try {
        const response = await axios.get(
          `https://568f-109-207-116-159.ngrok-free.app/parts?page=${page}&limit=${limit}`,
          {
            headers: {
              'ngrok-skip-browser-warning': 'true',
            },
          }
        );
        const { parts, totalNumber } = response.data;
        setParts(parts);
        setTotalItems(totalNumber);

        // Calculate total pages
        const calculatedTotalPages = Math.ceil(totalNumber / limit);
        setTotalPages(calculatedTotalPages);
      } catch (error) {
        console.error('Error fetching parts:', error);
        setError('Failed to fetch parts. Please try again later.');
        setParts([]); // Set parts to an empty array in case of error
      }
    };

    fetchParts();
  }, [page, limit]);

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

  const handleAddPartNumber = () => {
    setPartNumbers([...partNumbers, '']);
  };

  const handleSubmitOrder = () => {
    const orderData = partNumbers.filter((part) => part !== '');
    onOrderSubmit(orderData.map((partNumber) => ({ partNumber })));
    handleCloseModal();
  };

  const handleCreateNew = () => {
    setPartNumbers(['']); // Reset part numbers
  };

  const handleCreatePart = async () => {
    try {
      const response = await axios.post(
        'https://568f-109-207-116-159.ngrok-free.app/parts',
        {
          generalPartName: newPart.generalPartName,
          carModelName: newPart.carModelName,
        }
      );
      const { partNumber } = response.data;
      setPartNumbers((prevPartNumbers) => [...prevPartNumbers, partNumber]);
    } catch (error) {
      console.error('Error creating new part:', error);
      // Handle error
    }
  };

  return (
    <div>
      <h1>Parts Page</h1>
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
            <TableRow key={index}>
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
      <Button onClick={handleOpenModal}>Create Order</Button>
      <Dialog open={openModal} onClose={handleCloseModal}>
        <DialogTitle>Create Order</DialogTitle>
        <DialogContent>
          {partNumbers.map((partNumber, index) => (
            <TextField
              key={index}
              label={`Part Number ${index + 1}`}
              value={partNumber}
              onChange={(event) =>
                setPartNumbers((prevPartNumbers) => {
                  const updatedPartNumbers = [...prevPartNumbers];
                  updatedPartNumbers[index] = event.target.value;
                  return updatedPartNumbers;
                })
              }
              fullWidth
              margin="normal"
            />
          ))}
          <Button onClick={handleAddPartNumber}>+</Button>
          <Button onClick={handleSubmitOrder}>Submit Order</Button>
          <Button onClick={handleCreatePart}>Create Part</Button>
          <Button onClick={handleCreateNew}>Create New</Button>
          <Button onClick={handleCloseModal}>Cancel</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PartsPage;
