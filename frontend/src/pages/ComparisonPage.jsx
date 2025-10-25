// src/pages/ComparisonPage.jsx
import React, { useContext, useEffect, useState } from "react";
import { Container, Card, Table, Button } from "react-bootstrap";
import { AuthContext } from "../context/AuthContext";

function ComparisonPage() {
  const { token } = useContext(AuthContext);
  const [comparisons, setComparisons] = useState([]);

  useEffect(() => {
    if (token) {
      const fetchComparisons = async () => {
        try {
          const res = await fetch("/api/comparisons", {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          setComparisons(data);
        } catch (err) {
          console.error("Error fetching comparisons:", err);
        }
      };

      fetchComparisons();
    }
  }, [token]);

  const handleRemove = async (id) => {
    try {
      const res = await fetch(`/api/comparisons/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setComparisons(comparisons.filter((c) => c._id !== id));
      } else {
        console.error("Failed to remove comparison");
      }
    } catch (err) {
      console.error("Error removing comparison:", err);
    }
  };

  if (!token) {
    return (
      <Container className="mt-5">
        <Card className="text-center">
          <Card.Body>
            <Card.Title>Guest Mode</Card.Title>
            <Card.Text>
              You can browse resale prices, but please login to save or compare properties.
            </Card.Text>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <h2>My Comparison List</h2>
      {comparisons.length === 0 ? (
        <p className="text-muted">No comparisons yet.</p>
      ) : (
        <Table striped bordered hover>
          <thead>
            <tr>
              <th>#</th>
              <th>Block</th>
              <th>Street</th>
              <th>Flat Type</th>
              <th>Price</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {comparisons.map((c, index) => (
              <tr key={c._id || index}>
                <td>{index + 1}</td>
                <td>{c.block}</td>
                <td>{c.street_name}</td>
                <td>{c.flat_type}</td>
                <td>${c.resale_price}</td>
                <td>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleRemove(c._id)}
                  >
                    Remove
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Container>
  );
}

export default ComparisonPage;
