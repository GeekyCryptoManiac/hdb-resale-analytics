// src/components/PropertyCard.jsx
import React, { useContext } from 'react';
import { Card, Button, Badge, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import ComparisonButton from './ComparisonButton';

function PropertyCard({ property, showComparisonButton = true }) {
  const navigate = useNavigate();

  const handleViewDetails = () => navigate(`/property/${property.transaction_id}`);

  const formatPrice = (price) => new Intl.NumberFormat('en-SG', { 
    style: 'currency', 
    currency: 'SGD', 
    maximumFractionDigits: 0 
  }).format(price);

  return (
    <Card className="mb-3 property-card">
      <Card.Body>
        <Row>
          <Col md={8}>
            <Card.Title className="mb-2">
              <strong>Blk {property.block_number} {property.street_name}</strong>
            </Card.Title>

            <Card.Text className="mb-2">
              <Badge bg="primary" className="me-2">{property.flat_type_name}</Badge>
              <Badge bg="secondary" className="me-2">{property.floor_area_sqm} sqm</Badge>
              {property.storey_range && <Badge bg="info" className="me-2">Floor {property.storey_range}</Badge>}
            </Card.Text>

            <Card.Text className="mb-2">
              <strong className="text-success fs-5">{formatPrice(property.price)}</strong>
              <span className="text-muted ms-2">({formatPrice(property.price_per_sqm)}/sqm)</span>
            </Card.Text>

            <Card.Text className="text-muted small mb-0">
              Transaction: {property.month}
              {property.town && <span className="ms-2">Town: {property.town}</span>}
            </Card.Text>
          </Col>

          <Col md={4} className="d-flex flex-column justify-content-center align-items-end">
            <Button
              variant="primary"
              size="sm"
              onClick={handleViewDetails}
              className="mb-2 w-100"
            >
              View Details
            </Button>

            {showComparisonButton && (
              <ComparisonButton 
                property={property}
                className="w-100"
              />
            )}
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
}

export default PropertyCard;