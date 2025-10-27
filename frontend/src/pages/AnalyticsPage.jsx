// src/pages/AnalyticsPage.jsx
import React, { useEffect, useState } from 'react';
import { Container, Card, Row, Col } from 'react-bootstrap';
import axios from 'axios';

function BarChart({ labels, data, color = '#0d6efd', valuePrefix = '' }) {
  const max = Math.max(...data);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: '10px',
        height: '300px',
        borderLeft: '1px solid #333',
        borderBottom: '1px solid #333',
        padding: '6px',
        overflowX: 'auto',
        overflowY: 'hidden',
        whiteSpace: 'nowrap',
      }}
    >
      {data.map((value, idx) => (
        <div
          key={idx}
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            alignItems: 'center',
            minWidth: '50px',
            flex: '0 0 auto',
          }}
        >
          {/* Value above bar (fixed position relative to bottom) */}
          <div
            style={{
              marginBottom: '4px',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              color: '#222',
              textAlign: 'center',
            }}
          >
            {valuePrefix}{Math.round(value).toLocaleString()}
          </div>

          {/* The bar */}
          <div
            style={{
              height: `${(value / max) * 85}%`, // leave 15% space for value labels
              width: '20px',
              backgroundColor: color,
              borderRadius: '4px',
              transition: 'height 0.3s',
            }}
            title={`${labels[idx]}: ${valuePrefix}${Math.round(value).toLocaleString()}`}
          ></div>

          {/* Label below bar */}
          <small
            style={{
              marginTop: '6px',
              writingMode: 'vertical-rl',
              transform: 'rotate(180deg)',
              fontSize: '0.7rem',
              textAlign: 'center',
              maxHeight: '100px',
            }}
          >
            {labels[idx]}
          </small>
        </div>
      ))}
    </div>
  );
}

function AnalyticsPage() {
  const [towns, setTowns] = useState([]);

  useEffect(() => {
    axios
      .get('http://localhost:5000/api/analytics/town-comparison')
      .then((res) => {
        setTowns(res.data.data || []);
      })
      .catch((err) => console.error(err));
  }, []);

  return (
    <Container className="mt-4">
      <h2>HDB Market Analytics</h2>

      <Row className="mt-4">
        <Col md={12} lg={6}>
          <Card className="mb-3">
            <Card.Body>
              <Card.Title>Average Price by Town ($)</Card.Title>
              {towns.length > 0 ? (
                <BarChart
                  labels={towns.map((t) => t.town_name)}
                  data={towns.map((t) => parseFloat(t.avg_price))}
                  color="#0d6efd"
                  valuePrefix="$"
                />
              ) : (
                <p>Loading...</p>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={12} lg={6}>
          <Card className="mb-3">
            <Card.Body>
              <Card.Title>Average Price per sqm by Town ($/sqm)</Card.Title>
              {towns.length > 0 ? (
                <BarChart
                  labels={towns.map((t) => t.town_name)}
                  data={towns.map((t) => parseFloat(t.avg_price_per_sqm))}
                  color="#198754"
                  valuePrefix="$"
                />
              ) : (
                <p>Loading...</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col md={12}>
          <Card className="mb-3">
            <Card.Body>
              <Card.Title>Transaction Count by Town</Card.Title>
              {towns.length > 0 ? (
                <BarChart
                  labels={towns.map((t) => t.town_name)}
                  data={towns.map((t) => t.transaction_count)}
                  color="#dc3545"
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
