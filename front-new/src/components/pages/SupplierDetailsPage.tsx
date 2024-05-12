import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@mui/material";
import { format } from "date-fns";
import { BACK_URL } from "../constants/constants";
import myStyles from "./styles/order-details.module.css";
import { useAuth } from "../../context/AuthContext";

interface SupplierDetails {
  supplierName: string;
  supplierId: number;
  supplierEmail: string;
  parts: {
    partNumber: string;
    partId: number;
    specificPartName: string;
    partGroupName: string;
    generalPartName: string;
    carModelName: string;
    carModelYear: number;
    carBrand: string;
  }[];
  orderComponents: {
    status: string;
    orderId: number;
    orderComponentId: number;
    price: number | null;
    partNumber: string;
    partId: number;
    specificPartName: string;
    partGroupName: string;
    generalPartName: string;
    carModelName: string;
    carModelYear: number;
    carBrand: string;
  }[];
}

const SupplierDetailsPage: React.FC = () => {
  const { auth } = useAuth();
  const { id } = useParams<{ id: string }>();
  const [supplierDetails, setSupplierDetails] =
    useState<SupplierDetails | null>(null);

  useEffect(() => {
    const fetchSupplierDetails = async () => {
      try {
        const response = await axios.get(`${BACK_URL}/suppliers/${id}`, {
          headers: {
            Authorization: `Bearer ${auth?.accessToken}`,
          },
        });
        const fetchedSupplierDetails: SupplierDetails = response.data;
        setSupplierDetails(fetchedSupplierDetails);
      } catch (error) {
        console.error("Error fetching supplier details:", error);
        // Handle error state
      }
    };

    fetchSupplierDetails();
  }, [id]);

  return (
    <div>
      <h1>Supplier Details</h1>
      {supplierDetails && (
        <div>
          <div className={myStyles.generalInfoContainer}>
            <div>
              <h2>Supplier Information</h2>
              <p>Supplier Name: {supplierDetails.supplierName}</p>
              <p>Supplier ID: {supplierDetails.supplierId}</p>
              <p>Supplier Email: {supplierDetails.supplierEmail}</p>
            </div>
          </div>
          <h2>Supplier Parts</h2>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Part Number</TableCell>
                <TableCell>Specific Part Name</TableCell>
                <TableCell>Part Group Name</TableCell>
                <TableCell>General Part Name</TableCell>
                <TableCell>Car Model</TableCell>
                <TableCell>Car Year</TableCell>
                <TableCell>Car Brand</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {supplierDetails.parts.map((part, index) => (
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
          <h2>Supplier Order Components</h2>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Order ID</TableCell>
                <TableCell>Order Component ID</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Part Number</TableCell>
                <TableCell>Specific Part Name</TableCell>
                <TableCell>Part Group Name</TableCell>
                <TableCell>General Part Name</TableCell>
                <TableCell>Car Model</TableCell>
                <TableCell>Car Year</TableCell>
                <TableCell>Car Brand</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {supplierDetails.orderComponents.map((component, index) => (
                <TableRow key={index}>
                  <TableCell>{component.orderId}</TableCell>
                  <TableCell>{component.orderComponentId}</TableCell>
                  <TableCell>{component.status}</TableCell>
                  <TableCell>{component.price || "N/A"}</TableCell>
                  <TableCell>{component.partNumber}</TableCell>
                  <TableCell>{component.specificPartName}</TableCell>
                  <TableCell>{component.partGroupName}</TableCell>
                  <TableCell>{component.generalPartName}</TableCell>
                  <TableCell>{component.carModelName}</TableCell>
                  <TableCell>{component.carModelYear}</TableCell>
                  <TableCell>{component.carBrand}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default SupplierDetailsPage;
