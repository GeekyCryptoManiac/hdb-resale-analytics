// src/components/PropertyCard.jsx
import React, { useContext } from 'react';
import { Card, Button, Badge, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function PropertyCard({ property, showComparisonButton = true, onComparisonToggle }) {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  // Check if property is in comparison list (safe default)
  const isInComparison = user?.comparisonList?.includes(property.transaction_id);

  const handleViewDetails = () => {
    navigate(`/property/${property.transaction_id}`);
  };

  const handleComparisonClick = () => {
    if (!user) {
      // Redirect to login if not authenticated
      navigate('/login');
      return;
    }

    // Call parent's callback function
    if (onComparisonToggle) {
      onComparisonToggle(property.transaction_id, isInComparison);
    }
  };

  // Format price with commas
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-SG', {
      style: 'currency',
      currency: 'SGD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Format price per sqm
  const formatPricePerSqm = (price) => {
    return new Intl.NumberFormat('en-SG', {
      style: 'currency',
      currency: 'SGD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Card className="mb-3 property-card">
      <Card.Body>
        <Row>
          <Col md={8}>
            {/* Address */}
            <Card.Title className="mb-2">
              <strong>
                Blk {property.block_number} {property.street_name}
              </strong>
            </Card.Title>

            {/* Property Details */}
            <Card.Text className="mb-2">
              <Badge bg="primary" className="me-2">
                {property.flat_type_name}
              </Badge>
              <Badge bg="secondary" className="me-2">
                {property.floor_area_sqm} sqm
              </Badge>
              {property.storey_range && (
                <Badge bg="info" className="me-2">
                  Floor {property.storey_range}
                </Badge>
              )}
            </Card.Text>

            {/* Price Information */}
            <Card.Text className="mb-2">
              <strong className="text-success fs-5">
                {formatPrice(property.price)}
              </strong>
              <span className="text-muted ms-2">
                ({formatPricePerSqm(property.price_per_sqm)}/sqm)
              </span>
            </Card.Text>

            {/* Transaction Date */}
            <Card.Text className="text-muted small mb-0">
              Transaction: {property.month}
            </Card.Text>
          </Col>

          {/* Action Buttons */}
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
              <Button
                variant={isInComparison ? 'success' : 'outline-primary'}
                size="sm"
                onClick={handleComparisonClick}
                className="w-100"
              >
                {isInComparison ? '✓ In Comparison' : '+ Add to Compare'}
              </Button>
            )}
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
}

export default PropertyCard;
