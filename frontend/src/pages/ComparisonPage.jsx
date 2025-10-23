// src/pages/ComparisonPage.jsx
import React from 'react';
import { Container, Card } from 'react-bootstrap';
import { useUser } from '../context/UserContext';

function ComparisonPage() {
  const { user } = useUser();

  if (!user) {
    return (
      <Container className="mt-5">
        <Card className="text-center">
          <Card.Body>
            <Card.Title>Login Required</Card.Title>
            <Card.Text>Please login to use the comparison feature.</Card.Text>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <h2>My Comparison List</h2>
      <p className="text-muted">Person D will build the comparison table here</p>
      <p>Comparison list: {user.comparisonList?.length || 0} properties</p>
    </Container>
  );
}

export default ComparisonPage;