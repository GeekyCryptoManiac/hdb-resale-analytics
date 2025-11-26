// src/pages/PropertyDetailPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Row, Col, Card, Button, Spinner, Badge, Table } from "react-bootstrap";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { getPropertyDetails, getBlockHistory, getTownTrends, getPricePrediction } from "../services/api";
import { trackPropertyView } from "../services/mongoApi";
import { AuthContext } from "../context/AuthContext";

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function PropertyDetailPage() {
  const { transactionId } = useParams();
  const navigate = useNavigate();
  const { user } = React.useContext(AuthContext);

  const [property, setProperty] = useState(null);
  const [blockHistory, setBlockHistory] = useState([]);
  const [townTrends, setTownTrends] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAllData();
    
    // Track property view (non-blocking)
    if (user?._id && transactionId) {
      trackPropertyView(user._id, {
        transaction_id: transactionId,
        timestamp: new Date().toISOString()
      }).catch(err => console.log("Tracking error:", err));
    }
  }, [transactionId, user]);

  const loadAllData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load property details
      const propertyResponse = await getPropertyDetails(transactionId);
      const propertyData = propertyResponse?.data;

      if (!propertyData) {
        throw new Error("Property not found");
      }

      setProperty(propertyData);

      // Load block transaction history
      const historyResponse = await getBlockHistory(
        propertyData.block_number,
        propertyData.street_name
      );
      setBlockHistory(Array.isArray(historyResponse?.data) ? historyResponse.data : []);

      // Load town-wide trends for this flat type
      const trendsResponse = await getTownTrends(
        propertyData.town_name,
        propertyData.flat_type_name
      );
      setTownTrends(Array.isArray(trendsResponse?.data) ? trendsResponse.data : []);

      // Load price prediction
      const predictionResponse = await getPricePrediction({
        town_name: propertyData.town_name,
        flat_type_name: propertyData.flat_type_name,
        floor_area_sqm: propertyData.floor_area_sqm,
        remaining_lease: propertyData.remaining_lease,
      });
      setPrediction(predictionResponse?.data);

    } catch (err) {
      console.error("Error loading property data:", err);
      setError(err.message || "Failed to load property details");
    } finally {
      setLoading(false);
    }
  };

  // Format currency
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-SG', {
      style: 'currency',
      currency: 'SGD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Format price per sqm
  const formatPricePerSqm = (price, area) => {
    const pricePerSqm = price / area;
    return `${formatPrice(pricePerSqm)}/sqm`;
  };

  // Prepare chart data for town trends
  const getTownTrendsChartData = () => {
    if (!townTrends.length) return null;

    const sortedData = [...townTrends].sort((a, b) => 
      new Date(a.month) - new Date(b.month)
    );

    return {
      labels: sortedData.map(item => {
        const date = new Date(item.month);
        return date.toLocaleDateString('en-SG', { year: 'numeric', month: 'short' });
      }),
      datasets: [
        {
          label: `${property?.flat_type_name} in ${property?.town_name}`,
          data: sortedData.map(item => item.avg_price),
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.1,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Historical Price Trends',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return formatPrice(context.parsed.y);
          }
        }
      }
    },
    scales: {
      y: {
        ticks: {
          callback: function(value) {
            return formatPrice(value);
          }
        }
      }
    }
  };

  if (loading) {
    return (
      <Container className="mt-4 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-3">Loading property details...</p>
      </Container>
    );
  }

  if (error || !property) {
    return (
      <Container className="mt-4">
        <Button variant="secondary" onClick={() => navigate(-1)} className="mb-3">
          ← Back
        </Button>
        <Card className="text-center p-5">
          <Card.Body>
            <h3>Property Not Found</h3>
            <p className="text-muted">{error || "The property you're looking for doesn't exist."}</p>
            <Button variant="primary" onClick={() => navigate("/search")}>
              Back to Search
            </Button>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="mt-4 mb-5">
      {/* Back Button */}
      <Button variant="secondary" onClick={() => navigate(-1)} className="mb-3">
        ← Back
      </Button>

      {/* Property Header */}
      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={8}>
              <h2 className="mb-3">
                📍 Block {property.block_number} {property.street_name}
              </h2>
              <div className="d-flex flex-wrap gap-2 mb-3">
                <Badge bg="primary" className="py-2 px-3">
                  {property.flat_type_name}
                </Badge>
                <Badge bg="info" className="py-2 px-3">
                  {property.floor_area_sqm} sqm
                </Badge>
                <Badge bg="secondary" className="py-2 px-3">
                  Floor {property.storey_range}
                </Badge>
                <Badge bg="success" className="py-2 px-3">
                  {property.remaining_lease} years lease
                </Badge>
              </div>
              <p className="text-muted mb-1">
                <strong>Town:</strong> {property.town_name}
              </p>
              <p className="text-muted mb-1">
                <strong>Flat Model:</strong> {property.flat_model_name}
              </p>
              <p className="text-muted mb-1">
                <strong>Transaction Date:</strong> {new Date(property.month).toLocaleDateString('en-SG', { year: 'numeric', month: 'long' })}
              </p>
            </Col>
            <Col md={4} className="text-md-end">
              <h1 className="text-success mb-2">
                {formatPrice(property.price)}
              </h1>
              <p className="text-muted fs-5">
                {formatPricePerSqm(property.price, property.floor_area_sqm)}
              </p>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Historical Price Trends Chart */}
      {townTrends.length > 0 && (
        <Card className="mb-4">
          <Card.Body>
            <h4 className="mb-3">📊 Historical Price Trends</h4>
            <p className="text-muted mb-4">
              {property.flat_type_name} flats in {property.town_name} over the last {Math.min(5, townTrends.length / 12)} years
            </p>
            <Line data={getTownTrendsChartData()} options={chartOptions} />
          </Card.Body>
        </Card>
      )}

      {/* Block Transaction History */}
      {blockHistory.length > 0 && (
        <Card className="mb-4">
          <Card.Body>
            <h4 className="mb-3">📈 Block {property.block_number} Transaction History</h4>
            <p className="text-muted mb-3">
              All flat types in this block
            </p>
            <div className="table-responsive">
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Flat Type</th>
                    <th>Area (sqm)</th>
                    <th>Price</th>
                    <th>$/sqm</th>
                    <th>Floor</th>
                  </tr>
                </thead>
                <tbody>
                  {blockHistory.slice(0, 10).map((transaction, index) => (
                    <tr key={index}>
                      <td>{new Date(transaction.month).toLocaleDateString('en-SG', { year: 'numeric', month: 'short' })}</td>
                      <td>{transaction.flat_type_name}</td>
                      <td>{transaction.floor_area_sqm}</td>
                      <td className="fw-bold">{formatPrice(transaction.price)}</td>
                      <td>{formatPrice(transaction.price / transaction.floor_area_sqm)}</td>
                      <td>{transaction.storey_range}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
            {blockHistory.length > 10 && (
              <p className="text-muted text-center mt-2">
                Showing 10 of {blockHistory.length} transactions
              </p>
            )}
          </Card.Body>
        </Card>
      )}

{/* Price Prediction */}
{prediction && !prediction.error && (
  <Card className="mb-4 border-primary">
    <Card.Body>
      <h4 className="mb-3">🔮 Price Predictions</h4>
      <p className="text-muted mb-4">
        For similar {property.flat_type_name} flats (~{property.floor_area_sqm} sqm) in {property.town_name}
      </p>
      
      {/* Warning Banner for Limited Data */}
      {prediction.warning === 'limited_data' && (
        <div className="alert alert-warning d-flex align-items-center mb-4" role="alert">
          <svg className="bi flex-shrink-0 me-2" width="24" height="24" role="img" aria-label="Warning:">
            <use xlinkHref="#exclamation-triangle-fill"/>
          </svg>
          <div>
            <strong>⚠️ Limited Data Available</strong>
            <p className="mb-0 mt-1">
              {prediction.warning_message} - Based on only {prediction.sample_size} similar transaction{prediction.sample_size !== 1 ? 's' : ''} in the last 6 months.
            </p>
          </div>
        </div>
      )}

      {/* Methodology Note */}
      {prediction.methodology_note && (
        <div className="alert alert-info mb-4" role="alert">
          <small>
            <strong>ℹ️ Note:</strong> {prediction.methodology_note}
          </small>
        </div>
      )}
      
      {/* Current Market Value */}
      <Row className="mb-3">
        <Col md={4}>
          <Card className="text-center h-100 shadow-sm">
            <Card.Body>
              <p className="text-muted mb-2 fw-bold">Current Market Value</p>
              <h4 className="text-primary mb-1">
                {formatPrice(prediction.current_min)} - {formatPrice(prediction.current_max)}
              </h4>
              <small className="text-muted">
                Avg: {formatPrice(prediction.current_avg)}
              </small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={8}>
          <Card className="h-100 bg-light">
            <Card.Body>
              <h6 className="mb-2">Prediction Methodology</h6>
              <small className="text-muted">
                • Based on <strong>{prediction.sample_size} similar transactions</strong> (last 6 months)
                <br/>
                • Historical growth rate: <strong>{prediction.has_historical_data ? `${prediction.historical_growth_rate}%` : 'Market average'}</strong> per year
                <br/>
                • Confidence level: 
                <Badge 
                  bg={prediction.confidence >= 80 ? 'success' : prediction.confidence >= 70 ? 'warning' : 'secondary'}
                  className="ms-2"
                >
                  {prediction.confidence}%
                </Badge>
              </small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* 2-Year Predictions */}
      <h5 className="mt-4 mb-3">Predicted Price (2 years)</h5>
      <Row className="g-3">
        <Col md={4}>
          <Card className="text-center shadow-sm h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start mb-2">
                <p className="text-muted mb-0 fw-bold">Conservative</p>
                <Badge bg="secondary" className="ms-2">
                  +{prediction.conservative_change}%
                </Badge>
              </div>
              <h4 className="text-secondary mb-2">
                {formatPrice(prediction.conservative)}
              </h4>
              <small className="text-muted">
                70% of historical rate
              </small>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4}>
          <Card className="text-center border-success border-2 shadow h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start mb-2">
                <p className="text-muted mb-0 fw-bold">Most Likely</p>
                <Badge bg="success" className="ms-2">
                  +{prediction.most_likely_change}%
                </Badge>
              </div>
              <h4 className="text-success mb-2">
                {formatPrice(prediction.most_likely)}
              </h4>
              <small className="text-muted">
                Based on historical rate
              </small>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4}>
          <Card className="text-center shadow-sm h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start mb-2">
                <p className="text-muted mb-0 fw-bold">Optimistic</p>
                <Badge bg="info" className="ms-2">
                  +{prediction.optimistic_change}%
                </Badge>
              </div>
              <h4 className="text-info mb-2">
                {formatPrice(prediction.optimistic)}
              </h4>
              <small className="text-muted">
                130% of historical rate
              </small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Additional Context for Low Confidence */}
      {prediction.confidence < 70 && (
        <div className="alert alert-light border mt-4 mb-0" role="alert">
          <small className="text-muted">
            <strong>💡 Tip:</strong> For more accurate predictions, consider looking at nearby towns or different flat types with more transaction data.
          </small>
        </div>
      )}
    </Card.Body>
  </Card>
)}

{/* No Prediction Data Available */}
{prediction?.error && (
  <Card className="mb-4 border-warning">
    <Card.Body className="text-center py-5">
      <h5 className="text-warning mb-3">⚠️ Price Prediction Unavailable</h5>
      <p className="text-muted mb-0">
        {prediction.error}
        <br/>
        <small>Try searching for similar properties in nearby towns.</small>
      </p>
    </Card.Body>
  </Card>
)}

{/* SVG Icon Definition (add this before the closing Container tag) */}
<svg xmlns="http://www.w3.org/2000/svg" style={{ display: 'none' }}>
  <symbol id="exclamation-triangle-fill" fill="currentColor" viewBox="0 0 16 16">
    <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
  </symbol>
</svg>
      {/* Action Buttons */}
      <Card>
        <Card.Body className="text-center">
          <h5 className="mb-3">Interested in this property?</h5>
          <div className="d-flex gap-3 justify-content-center flex-wrap">
            <Button variant="primary" size="lg">
              ⭐ Save to Favorites
            </Button>
            <Button variant="outline-primary" size="lg">
              🔄 Compare with Others
            </Button>
            <Button variant="outline-secondary" size="lg">
              📤 Share
            </Button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default PropertyDetailPage;