// src/components/PropertyCard.jsx
import React from 'react';
import { Card, Button, Badge, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import ComparisonButton from './ComparisonButton'; // Import the ComparisonButton

function PropertyCard({ property, showComparisonButton = true, onComparisonToggle }) {
  const navigate = useNavigate();
  const { user } = useUser();

  // Transform API data to match your application's expected format
  const transformedProperty = {
    // Map transaction_id to transactionId
    transactionId: property.transaction_id,
    
    // Create a proper name from address components
    name: `${property.block_number} ${property.street_name}, ${property.town_name}`,
    
    // Direct mappings
    price: property.price,
    size: property.floor_area_sqm,
    area: property.floor_area_sqm,
    
    // Map storey_range to floor
    floor: property.storey_range,
    floorNumber: property.storey_range,
    
    // Map flat_type_name to propertyType
    propertyType: property.flat_type_name,
    type: property.flat_type_name,
    
    // Location information
    location: `${property.town_name}, ${property.street_name}`,
    
    // Additional fields that might be useful
    blockNumber: property.block_number,
    streetName: property.street_name,
    townName: property.town_name,
    pricePerSqm: property.price_per_sqm,
    month: property.month,
    
    // You can add transactionType if needed
    transactionType: 'sale' // Assuming all are for sale
  };

  const handleViewDetails = () => {
    navigate(`/property/${property.transaction_id}`);
  };

  const handleComparisonSuccess = (result) => {
    // Call parent's callback function if provided
    if (onComparisonToggle) {
      onComparisonToggle(property.transaction_id, result.action === 'add');
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

            {/* Town and Property Details */}
            <Card.Text className="mb-2">
              <Badge bg="secondary" className="me-2">
                {property.town_name}
              </Badge>
              <Badge bg="primary" className="me-2">
                {property.flat_type_name}
              </Badge>
              <Badge bg="info" className="me-2">
                {property.floor_area_sqm} sqm
              </Badge>
              {property.storey_range && (
                <Badge bg="warning" className="me-2">
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
              <ComparisonButton
                transactionId={property.transaction_id}
                propertyData={transformedProperty} // Pass the transformed data
                onSuccess={handleComparisonSuccess}
                variant="outline-primary"
                size="sm"
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