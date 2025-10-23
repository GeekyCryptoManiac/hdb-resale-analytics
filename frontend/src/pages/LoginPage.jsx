// src/pages/LoginPage.jsx
import React from 'react';
import { Container, Card } from 'react-bootstrap';

function LoginPage() {
  return (
    <Container className="mt-5">
      <Card className="mx-auto" style={{ maxWidth: '500px' }}>
        <Card.Body>
          <Card.Title className="text-center mb-4">
            <h2>Login / Register</h2>
          </Card.Title>
          <p className="text-center text-muted">Person B will build the login form here</p>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default LoginPage;