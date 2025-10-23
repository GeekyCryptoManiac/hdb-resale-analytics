// src/pages/ResultsPage.jsx
import React from 'react';
import { Container, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

function ResultsPage() {
  const navigate = useNavigate();

  return (
    <Container className="mt-4">
      <Button variant="secondary" onClick={() => navigate('/search')} className="mb-3">
        ← Back to Search
      </Button>
      <h2>Search Results</h2>
      <p className="text-muted">Person C will display property results here</p>
    </Container>
  );
}

export default ResultsPage;