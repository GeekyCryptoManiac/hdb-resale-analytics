// src/components/ErrorMessage.jsx
import React from 'react';
import { Alert, Container } from 'react-bootstrap';

function ErrorMessage({ 
  message = 'An error occurred', 
  variant = 'danger',
  onRetry 
}) {
  return (
    <Container className="mt-4">
      <Alert variant={variant}>
        <Alert.Heading>Oops!</Alert.Heading>
        <p>{message}</p>
        {onRetry && (
          <button className="btn btn-sm btn-outline-danger" onClick={onRetry}>
            Try Again
          </button>
        )}
      </Alert>
    </Container>
  );
}

export default ErrorMessage;