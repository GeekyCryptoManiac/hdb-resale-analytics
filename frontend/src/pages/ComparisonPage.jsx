// src/pages/ComparisonPage.jsx
import React, { useContext, useState, useEffect } from "react";
import { 
  Container, 
  Card, 
  Table, 
  Button, 
  Row, 
  Col,
  Badge,
  Alert
} from "react-bootstrap";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { removeFromComparison, clearComparison } from "../services/userService";

function ComparisonPage() {
  const { user, updateComparisonList } = useContext(AuthContext);
  const navigate = useNavigate();
  const [comparisons, setComparisons] = useState([]);
  const [loading, setLoading] = useState(true);

  // Helper function to safely parse price as number
  const parsePrice = (price) => {
    if (typeof price === 'number') return price;
    if (typeof price === 'string') {
      const parsed = parseFloat(price.replace(/,/g, ''));
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  // Ensure all prices are numbers
  const normalizedComparisons = comparisons.map(comp => ({
    ...comp,
    price: parsePrice(comp.price),
    floor_area_sqm: parseFloat(comp.floor_area_sqm) || 0,
    price_per_sqm: parseFloat(comp.price_per_sqm) || 0
  }));

  // Find the lowest price property
  const lowestPriceProperty = normalizedComparisons.length > 0 
    ? normalizedComparisons.reduce((lowest, current) => 
        current.price < lowest.price ? current : lowest
      )
    : null;

  // Calculate average price
  const averagePrice = normalizedComparisons.length > 0
    ? normalizedComparisons.reduce((sum, item) => sum + item.price, 0) / normalizedComparisons.length
    : 0;

  const formatPrice = (price) => {
    const numPrice = parsePrice(price);
    if (numPrice === 0) return 'N/A';
    return new Intl.NumberFormat('en-SG', { 
      style: 'currency', 
      currency: 'SGD', 
      maximumFractionDigits: 0 
    }).format(numPrice);
  };

  const formatDate = (month) => {
    return new Date(month).toLocaleDateString('en-SG', {
      year: 'numeric',
      month: 'long'
    });
  };

  // Get user ID helper
  const getUserId = () => {
    return user?._id || user?.id || user?.userId;
  };

  const handleRemove = async (transactionId) => {
    try {
      const userId = getUserId();
      
      if (userId) {
        // Call API to remove from backend
        await removeFromComparison(userId, transactionId);
      }

      // Update local state
      const updatedComparisons = comparisons.filter(
        item => item.transaction_id !== transactionId
      );
      setComparisons(updatedComparisons);
      
      // Update the AuthContext
      if (user?.comparisonList) {
        const updatedComparisonList = user.comparisonList.filter(
          item => item.transaction_id !== transactionId
        );
        updateComparisonList(updatedComparisonList);
      }
    } catch (err) {
      console.error("Error removing comparison:", err);
      alert('Failed to remove property from comparison list');
    }
  };

  const handleViewDetails = (transactionId) => {
    navigate(`/property/${transactionId}`);
  };

  const handleClearAll = async () => {
    try {
      const userId = getUserId();
      
      if (userId) {
        // Call API to clear all
        await clearComparison(userId);
      }

      setComparisons([]);
      
      if (user) {
        updateComparisonList([]);
      }
    } catch (err) {
      console.error("Error clearing comparison list:", err);
      alert('Failed to clear comparison list');
    }
  };

  useEffect(() => {
    if (user?.comparisonList) {
      console.log('📋 Loading comparison list:', user.comparisonList);
      setComparisons(user.comparisonList);
    } else {
      setComparisons([]);
    }
    setLoading(false);
  }, [user]);

  if (loading) {
    return (
      <Container className="mt-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container className="mt-5">
        <Card className="text-center">
          <Card.Body>
            <Card.Title>Guest Mode</Card.Title>
            <Card.Text>
              Please login to save and compare properties.
            </Card.Text>
            <Button variant="primary" onClick={() => navigate('/login')}>
              Login
            </Button>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <Row className="mb-4">
        <Col>
          <h2>Property Comparison</h2>
          <p className="text-muted">
            Compare up to 3 properties. The lowest price is highlighted in green.
          </p>
        </Col>
        {comparisons.length > 0 && (
          <Col xs="auto">
            <Button variant="outline-danger" size="sm" onClick={handleClearAll}>
              Clear All
            </Button>
          </Col>
        )}
      </Row>

      {comparisons.length === 0 ? (
        <Alert variant="info">
          <Alert.Heading>No Properties to Compare</Alert.Heading>
          <p>
            You haven't added any properties to compare yet. Browse properties and click 
            the "Compare" button to add them to your comparison list.
          </p>
          <Button variant="primary" onClick={() => navigate('/search')}>
            Browse Properties
          </Button>
        </Alert>
      ) : (
        <>
          {/* Summary Cards */}
          <Row className="mb-4">
            <Col>
              <Card className="text-center">
                <Card.Body>
                  <Card.Title>{comparisons.length}</Card.Title>
                  <Card.Text>Properties</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col>
              <Card className="text-center">
                <Card.Body>
                  <Card.Title className="text-success">
                    {lowestPriceProperty ? formatPrice(lowestPriceProperty.price) : 'N/A'}
                  </Card.Title>
                  <Card.Text>Lowest Price</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col>
              <Card className="text-center">
                <Card.Body>
                  <Card.Title>
                    {averagePrice > 0 ? formatPrice(averagePrice) : 'N/A'}
                  </Card.Title>
                  <Card.Text>Average Price</Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Comparison Table */}
          <Card>
            <Card.Body>
              <Table responsive striped bordered hover>
                <thead className="table-dark">
                  <tr>
                    <th>Property</th>
                    <th>Type</th>
                    <th>Floor Area</th>
                    <th>Storey</th>
                    <th>Town</th>
                    <th>Transaction Date</th>
                    <th>Price</th>
                    <th>Price per sqm</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {normalizedComparisons.map((property) => (
                    <tr 
                      key={property.transaction_id}
                      className={property.transaction_id === lowestPriceProperty?.transaction_id ? 'table-success' : ''}
                    >
                      <td>
                        <strong>
                          Blk {property.block_number} {property.street_name}
                        </strong>
                        {property.transaction_id === lowestPriceProperty?.transaction_id && (
                          <Badge bg="success" className="ms-2">Best Price</Badge>
                        )}
                      </td>
                      <td>
                        <Badge bg="primary">{property.flat_type_name}</Badge>
                      </td>
                      <td>{property.floor_area_sqm} sqm</td>
                      <td>{property.storey_range || 'N/A'}</td>
                      <td>{property.town_name || property.town || 'N/A'}</td>
                      <td>{formatDate(property.month)}</td>
                      <td>
                        <strong className={
                          property.transaction_id === lowestPriceProperty?.transaction_id 
                            ? 'text-success' 
                            : ''
                        }>
                          {formatPrice(property.price)}
                        </strong>
                      </td>
                      <td>{formatPrice(property.price_per_sqm)}/sqm</td>
                      <td>
                        <div className="d-flex gap-2">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleViewDetails(property.transaction_id)}
                          >
                            View
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleRemove(property.transaction_id)}
                          >
                            Remove
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>

          {/* Price Difference Analysis */}
          {comparisons.length > 1 && lowestPriceProperty && (
            <Card className="mt-4">
              <Card.Header>
                <h5 className="mb-0">Price Analysis</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <h6>Price Range</h6>
                    <p>
                      Lowest: <strong className="text-success">
                        {formatPrice(lowestPriceProperty.price)}
                      </strong>
                      <br />
                      Highest: <strong className="text-danger">
                        {formatPrice(Math.max(...normalizedComparisons.map(p => p.price)))}
                      </strong>
                      <br />
                      Difference: <strong>
                        {formatPrice(Math.max(...normalizedComparisons.map(p => p.price)) - lowestPriceProperty.price)}
                      </strong>
                    </p>
                  </Col>
                  <Col md={6}>
                    <h6>Value per Square Meter</h6>
                    <p>
                      Best Value: <strong>
                        {formatPrice(Math.min(...normalizedComparisons.map(p => p.price_per_sqm)))}/sqm
                      </strong>
                      <br />
                      You could save up to: <strong className="text-success">
                        {formatPrice(Math.max(...normalizedComparisons.map(p => p.price)) - lowestPriceProperty.price)}
                      </strong>
                    </p>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          )}
        </>
      )}
    </Container>
  );
}

export default ComparisonPage;