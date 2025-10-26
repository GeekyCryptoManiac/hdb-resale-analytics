// src/pages/AnalyticsPage.jsx
import React, { useEffect, useState } from 'react';
import { Container, Card, Row, Col } from 'react-bootstrap';
import axios from 'axios';

function BarChart({ labels, data }) {
  const max = Math.max(...data);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '200px', borderLeft: '1px solid #333', borderBottom: '1px solid #333', padding: '4px' }}>
      {data.map((value, idx) => (
        <div key={idx} style={{ flex: 1, textAlign: 'center' }}>
          <div style={{
            height: `${(value / max) * 100}%`,
            backgroundColor: '#0d6efd',
            borderRadius: '4px',
            transition: 'height 0.3s'
          }}></div>
          <small style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', display: 'block', marginTop: '4px' }}>{labels[idx]}</small>
        </div>
      ))}
    </div>
  );
}

function AnalyticsPage() {
  const [towns, setTowns] = useState([]);
  const [flatTypes, setFlatTypes] = useState([]);

  useEffect(() => {
    // Fetch top towns
    axios.get('http://localhost:5000/api/analytics/town-comparison')
      .then(res => {
        setTowns(res.data.data);
      })
      .catch(err => console.error(err));

    // Fetch flat type comparison
    axios.get('http://localhost:5000/api/analytics/flat-type-comparison')
      .then(res => {
        setFlatTypes(res.data.data);
      })
      .catch(err => console.error(err));
  }, []);

  return (
    <Container className="mt-4">
      <h2>Market Analytics</h2>
      <Row className="mt-4">
        <Col md={6}>
          <Card className="mb-3">
            <Card.Body>
              <Card.Title>Top Towns (Avg Price)</Card.Title>
              {towns.length > 0 ? (
                <BarChart
                  labels={towns.map(t => t.town_name)}
                  data={towns.map(t => t.avg_price)}
                />
              ) : (
                <p>Loading...</p>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="mb-3">
            <Card.Body>
              <Card.Title>Flat Types (Avg Price)</Card.Title>
              {flatTypes.length > 0 ? (
                <BarChart
                  labels={flatTypes.map(f => f.flat_type_name)}
                  data={flatTypes.map(f => f.avg_price)}
                />
              ) : (
                <p>Loading...</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default AnalyticsPage;
