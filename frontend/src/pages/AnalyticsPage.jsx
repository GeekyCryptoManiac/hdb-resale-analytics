// src/pages/AnalyticsPage.jsx
import React from 'react';
import { Container, Card, Row, Col } from 'react-bootstrap';

function AnalyticsPage() {
  return (
    <Container className="mt-4">
      <h2>Market Analytics</h2>
      <Row className="mt-4">
        <Col md={4}>
          <Card className="mb-3">
            <Card.Body>
              <Card.Title>Overall Statistics</Card.Title>
              <p className="text-muted">Person E will add statistics here</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="mb-3">
            <Card.Body>
              <Card.Title>Top Towns</Card.Title>
              <p className="text-muted">Person E will add town rankings here</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="mb-3">
            <Card.Body>
              <Card.Title>Popular Types</Card.Title>
              <p className="text-muted">Person E will add flat type stats here</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default AnalyticsPage;