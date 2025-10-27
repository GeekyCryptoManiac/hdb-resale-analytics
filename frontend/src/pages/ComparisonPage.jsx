// src/pages/ComparisonPage.jsx
import React from 'react';
import { Container, Row, Col, Card, Button, Table, Badge } from 'react-bootstrap';
import { useUser } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';

function ComparisonPage() {
  const { user, comparisonProperties, removeFromComparisonProperties } = useUser();
  const navigate = useNavigate();
  
  // Check if user is not logged in
  if (!user) {
    return (
		<Container className="mt-5">
		        <Card className="text-center">
		          <Card.Body>
		            <Card.Title>Login Required</Card.Title>
		            <Card.Text>Please login to use the comparison feature.</Card.Text>
					<Button variant="primary" onClick={() => navigate('/login')}>
										Log In
									</Button>
		          </Card.Body>
		        </Card>
		</Container>
    );
  }
  
  const comparisonList = comparisonProperties || [];
  const MAX_COMPARISON = 3;

  // Handle remove from comparison
  const handleRemoveFromComparison = (transactionId) => {
    removeFromComparisonProperties(transactionId);
  };

  // Simplified comparison attributes - only essential, non-repeating fields
  const comparisonAttributes = [
    { key: 'price', label: 'Price', format: 'currency' },
    { key: 'name', label: 'Property Name', format: 'text' },
    { key: 'area', label: 'Area', format: 'area' },
    { key: 'floorNumber', label: 'Floor', format: 'text' },
    { key: 'propertyType', label: 'Property Type', format: 'text' },
    { key: 'location', label: 'Location', format: 'text' },
    { key: 'bedrooms', label: 'Bedrooms', format: 'number' },
    { key: 'bathrooms', label: 'Bathrooms', format: 'number' }
  ];

  // Format values based on type
  const formatValue = (value, format) => {
    if (value === undefined || value === null) return 'N/A';
    
    switch (format) {
      case 'currency':
        return typeof value === 'number' ? `$${value.toLocaleString()}` : value;
      case 'area':
        if (typeof value === 'number') {
          return `${value.toLocaleString()} sqm`;
        }
        return value;
      case 'number':
        return typeof value === 'number' ? value.toString() : value;
      case 'badge':
        return (
          <Badge 
            bg={value === 'sale' ? 'success' : value === 'rent' ? 'warning' : 'secondary'}
          >
            {value}
          </Badge>
        );
      default:
        return value;
    }
  };

  // Get the best value for each attribute from the property data
  const getPropertyValue = (property, attributeKey) => {
    const keys = {
      price: ['price', 'cost', 'value'],
      name: ['name', 'title', 'propertyName'],
      area: ['area', 'size', 'floor_area_sqm', 'builtUpArea', 'carpetArea'],
      floorNumber: ['floorNumber', 'floor', 'storey_range', 'floorLevel'],
      bedrooms: ['bedrooms', 'beds', 'bedroomCount'],
      bathrooms: ['bathrooms', 'baths', 'bathroomCount'],
      propertyType: ['propertyType', 'type', 'flat_type_name', 'category'],
      location: ['location', 'address', 'locality', 'city', 'town_name']
    };

    const possibleKeys = keys[attributeKey] || [attributeKey];
    
    for (const key of possibleKeys) {
      if (property[key] !== undefined && property[key] !== null) {
        return property[key];
      }
    }
    
    return undefined;
  };

  if (comparisonList.length === 0) {
    return (
      <Container className="my-5">
        <div className="text-center">
          <h2>Property Comparison</h2>
          <p className="text-muted">No properties added to comparison yet.</p>
          <Button variant="primary" onClick={() => navigate('/search')}>
            Browse Properties
          </Button>
        </div>
      </Container>
    );
  }

  return (
    <Container className="my-5">
      <Row>
        <Col>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="mb-1">Property Comparison</h2>
              <p className="text-muted mb-0">
                Comparing {comparisonList.length} of {MAX_COMPARISON} propert{comparisonList.length === 1 ? 'y' : 'ies'}
                {comparisonList.length >= MAX_COMPARISON && (
                  <Badge bg="warning" className="ms-2">
                    Maximum reached
                  </Badge>
                )}
              </p>
            </div>
            <Button 
              variant="outline-primary" 
              onClick={() => navigate('/search')}
              disabled={comparisonList.length >= MAX_COMPARISON}
              title={comparisonList.length >= MAX_COMPARISON ? `Maximum ${MAX_COMPARISON} properties allowed. Remove one to add more.` : ''}
            >
              Add More Properties
            </Button>
          </div>

          {/* Card View with Delete Buttons */}
          <Row className="mb-5">
            <h4 className="mb-3">Quick Overview</h4>
            {comparisonList.map((property, index) => {
              const price = getPropertyValue(property, 'price');
              const name = getPropertyValue(property, 'name');
              const area = getPropertyValue(property, 'area');
              const floor = getPropertyValue(property, 'floorNumber');
              const bedrooms = getPropertyValue(property, 'bedrooms');
              const bathrooms = getPropertyValue(property, 'bathrooms');
              const propertyType = getPropertyValue(property, 'propertyType');
              const location = getPropertyValue(property, 'location');

              return (
                <Col key={property.transactionId || property.id || index} lg={4} md={6} className="mb-4">
                  <Card className="h-100 shadow-sm position-relative">
                    <Button
                      variant="danger"
                      size="sm"
                      className="position-absolute top-0 end-0 m-2"
                      style={{ zIndex: 10 }}
                      onClick={() => handleRemoveFromComparison(property.transactionId)}
                      title="Remove from comparison"
                    >
                      ×
                    </Button>
                    
                    {property.image && (
                      <Card.Img 
                        variant="top" 
                        src={property.image} 
                        style={{ height: '200px', objectFit: 'cover' }}
                      />
                    )}
                    <Card.Body className="d-flex flex-column">
                      <div className="mb-2">
                        <Badge bg="primary" className="mb-2">
                          {propertyType || 'Property'}
                        </Badge>
                      </div>
                      
                      <Card.Title className="text-primary" style={{ fontSize: '1.1rem' }}>
                        {name || `Property ${property.transactionId || index + 1}`}
                      </Card.Title>
                      
                      <div className="mb-3">
                        {location && (
                          <div className="text-muted small">
                            <i className="bi bi-geo-alt"></i> {location}
                          </div>
                        )}
                      </div>

                      <div className="mt-auto">
                        <div className="comparison-highlights">
                          {price !== undefined && (
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <strong>Price:</strong>
                              <span className="fs-5 fw-bold text-dark">
                                {formatValue(price, 'currency')}
                              </span>
                            </div>
                          )}
                          
                          <div className="row text-center g-2">
                            {area !== undefined && (
                              <div className="col-6">
                                <div className="border rounded p-2">
                                  <div className="small text-muted">Area</div>
                                  <div className="fw-bold">{formatValue(area, 'area')}</div>
                                </div>
                              </div>
                            )}
                            
                            {floor !== undefined && (
                              <div className="col-6">
                                <div className="border rounded p-2">
                                  <div className="small text-muted">Floor</div>
                                  <div className="fw-bold">{formatValue(floor, 'text')}</div>
                                </div>
                              </div>
                            )}
                            
                            {bedrooms !== undefined && (
                              <div className="col-6">
                                <div className="border rounded p-2">
                                  <div className="small text-muted">Bedrooms</div>
                                  <div className="fw-bold">{formatValue(bedrooms, 'number')}</div>
                                </div>
                              </div>
                            )}
                            
                            {bathrooms !== undefined && (
                              <div className="col-6">
                                <div className="border rounded p-2">
                                  <div className="small text-muted">Bathrooms</div>
                                  <div className="fw-bold">{formatValue(bathrooms, 'number')}</div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              );
            })}
          </Row>

          {/* Simplified Comparison Table */}
          <Card className="shadow-sm">
            <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
              <h4 className="mb-0">Detailed Comparison</h4>
              <Badge bg="light" text="dark">
                {comparisonList.length} properties
              </Badge>
            </Card.Header>
            <Card.Body className="p-0">
              <div className="table-responsive">
                <Table className="mb-0">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: '200px' }}>Feature</th>
                      {comparisonList.map(property => (
                        <th key={property.transactionId || property.id} className="text-center position-relative">
                          <div className="fw-bold mb-1">
                            {getPropertyValue(property, 'name') || `Property ${property.transactionId}`}
                          </div>
                          <div className="small text-muted">
                            {getPropertyValue(property, 'propertyType')}
                          </div>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            className="position-absolute top-0 end-0 m-1"
                            style={{ transform: 'translate(50%, -50%)' }}
                            onClick={() => handleRemoveFromComparison(property.transactionId)}
                            title="Remove from comparison"
                          >
                            ×
                          </Button>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonAttributes.map(attribute => {
                      const values = comparisonList.map(property => 
                        getPropertyValue(property, attribute.key)
                      );
                      const hasData = values.some(value => value !== undefined);
                      
                      if (!hasData) return null;

                      return (
                        <tr key={attribute.key}>
                          <td className="fw-bold bg-light">
                            {attribute.label}
                          </td>
                          {comparisonList.map((property, index) => {
                            const value = getPropertyValue(property, attribute.key);
                            
                            return (
                              <td 
                                key={`${property.transactionId || property.id}-${attribute.key}`}
                                className="text-center"
                              >
                                {formatValue(value, attribute.format)}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>

          {/* Summary Section */}
          <Card className="mt-4 bg-light border-0">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="mb-3">Comparison Summary</h5>
                  <Row>
                    <Col md={6}>
                      <strong>Properties Compared:</strong> {comparisonList.length} of {MAX_COMPARISON}
                    </Col>
                    <Col md={6}>
                      <strong>Price Range:</strong>{' '}
                      {(() => {
                        const prices = comparisonList
                          .map(property => getPropertyValue(property, 'price'))
                          .filter(price => typeof price === 'number');
                        
                        if (prices.length === 0) return 'N/A';
                        
                        const minPrice = Math.min(...prices);
                        const maxPrice = Math.max(...prices);
                        return `${formatValue(minPrice, 'currency')} - ${formatValue(maxPrice, 'currency')}`;
                      })()}
                    </Col>
                  </Row>
                </div>
                <Button 
                  variant="outline-danger" 
                  onClick={() => {
                    comparisonList.forEach(property => {
                      removeFromComparisonProperties(property.transactionId);
                    });
                  }}
                  title="Remove all properties from comparison"
                >
                  Clear All Comparisons
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default ComparisonPage;