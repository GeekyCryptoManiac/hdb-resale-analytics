// src/components/LoadingSpinner.jsx
import React from 'react';
import { Spinner, Container } from 'react-bootstrap';

function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <Container className="text-center mt-5">
      <Spinner animation="border" role="status" variant="primary">
        <span className="visually-hidden">Loading...</span>
      </Spinner>
      <p className="mt-3 text-muted">{message}</p>
    </Container>
  );
}

export default LoadingSpinner;