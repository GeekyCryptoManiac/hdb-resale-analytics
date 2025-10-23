// src/pages/PropertyDetailPage.jsx
import React from 'react';
import { Container, Button, Card } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';

function PropertyDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  return (
    <Container className="mt-4">
      <Button variant="secondary" onClick={() => navigate(-1)} className="mb-3">
        ← Back
      </Button>
      <Card>
        <Card.Body>
          <Card.Title>
            <h2>Property Details</h2>
          </Card.Title>
          <p className="text-muted">Property ID: {id}</p>
          <p className="text-muted">Person E will build property details here</p>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default PropertyDetailPage;  