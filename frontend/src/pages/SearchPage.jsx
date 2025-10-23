// src/pages/SearchPage.jsx
import React from 'react';
import { Container, Card, Row, Col, Alert } from 'react-bootstrap';
import PropertyCard from '../components/PropertyCard';

function SearchPage() {
  // Sample properties for testing PropertyCard component
  const sampleProperties = [
    {
      transaction_id: 1,
      block_number: '123',
      street_name: 'Bedok North Street 1',
      town_name: 'BEDOK',
      flat_type_name: '4 ROOM',
      floor_area_sqm: 95,
      storey_range: '10 TO 12',
      price: 445000,
      price_per_sqm: 4684.21,
      month: '2024-08'
    },
    {
      transaction_id: 2,
      block_number: '456',
      street_name: 'Tampines Avenue 5',
      town_name: 'TAMPINES',
      flat_type_name: '5 ROOM',
      floor_area_sqm: 110,
      storey_range: '07 TO 09',
      price: 520000,
      price_per_sqm: 4727.27,
      month: '2024-07'
    },
    {
      transaction_id: 3,
      block_number: '789',
      street_name: 'Punggol Drive',
      town_name: 'PUNGGOL',
      flat_type_name: '3 ROOM',
      floor_area_sqm: 68,
      storey_range: '04 TO 06',
      price: 350000,
      price_per_sqm: 5147.06,
      month: '2024-09'
    }
  ];

  const handleComparisonToggle = (transactionId, isCurrentlyInComparison) => {
    console.log('Comparison toggled:', transactionId, isCurrentlyInComparison);
  };

  return (
    <Container className="mt-4">
      <Card className="mb-4">
        <Card.Body>
          <Card.Title>
            <h2>Search HDB Properties</h2>
          </Card.Title>
          <Alert variant="info">
            <strong>Person C will build the search form here.</strong>
            <br />
            Below are sample PropertyCard components for testing.
          </Alert>
        </Card.Body>
      </Card>

      {/* Sample PropertyCards for Demo */}
      <h4 className="mb-3">Sample Property Cards (For Testing):</h4>
      
      <Row>
        <Col md={12}>
          {sampleProperties.map(property => (
            <PropertyCard
              key={property.transaction_id}
              property={property}
              showComparisonButton={true}
              onComparisonToggle={handleComparisonToggle}
            />
          ))}
        </Col>
      </Row>
    </Container>
  );
}

export default SearchPage;