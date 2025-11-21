// src/pages/AnalyticsPage.jsx
import React, { useEffect, useState } from 'react';
import { Container, Card, Row, Col, Form } from 'react-bootstrap';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function AnalyticsPage() {
  const [towns, setTowns] = useState([]);
  const [avgPriceData, setAvgPriceData] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);
  const [priceDist, setPriceDist] = useState(null);
  const [flatTypeData, setFlatTypeData] = useState([]);

  // Fetch town comparison
  useEffect(() => {
    axios
      .get(`${process.env.REACT_APP_API_URL}/analytics/town-comparison`)
      .then((res) => setTowns(res.data.data || []))
      .catch((err) => console.error(err));
  }, []);

  // Fetch average price by year & town
  useEffect(() => {
    axios
      .get(`${process.env.REACT_APP_API_URL}/analytics/get-price-avg`)
      .then((res) => {
        const data = res.data.data || [];
        setAvgPriceData(data);
        const uniqueYears = [...new Set(data.map((d) => d.year))].sort();
        if (uniqueYears.length > 0) {
          setSelectedYear(uniqueYears[uniqueYears.length - 1]);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  // Fetch price distribution data
  useEffect(() => {
    axios
      .get(`${process.env.REACT_APP_API_URL}/analytics/price-distribution`)
      .then((res) => setPriceDist(res.data))
      .catch((err) => console.error(err));
  }, []);

  const chartOptions = (title) => ({
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: true, text: title },
      tooltip: {
        callbacks: {
          label: (context) =>
            `${context.raw.toLocaleString()} transactions`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (val) => val.toLocaleString(),
        },
      },
      x: {
        ticks: { autoSkip: true, maxRotation: 45, minRotation: 0 },
      },
    },
  });

  // Data for average price by year (filtered)
  const filteredChartData = (() => {
    if (!selectedYear || avgPriceData.length === 0) return null;
    const yearData = avgPriceData.filter((d) => d.year === selectedYear);
    return {
      labels: yearData.map((d) => d.town_name),
      datasets: [
        {
          label: `Average Price ($) - ${selectedYear}`,
          data: yearData.map((d) => d.avg_price),
          backgroundColor: '#0d6efd',
        },
      ],
    };
  })();

  const availableYears = [...new Set(avgPriceData.map((d) => d.year))].sort();
  // Fetch flat type comparison data
useEffect(() => {
  axios
    .get(`${process.env.REACT_APP_API_URL}/analytics/flat-type-comparison`)
    .then((res) => setFlatTypeData(res.data.data || []))
    .catch((err) => console.error(err));
}, []);

// Prepare chart data for flat type comparison
const flatTypeChartData = (() => {
  if (!flatTypeData || flatTypeData.length === 0) return null;

  const labels = flatTypeData.map((f) => f.flat_type_name);
  const avgPrices = flatTypeData.map((f) => parseFloat(f.avg_price));
  const avgAreas = flatTypeData.map((f) => parseFloat(f.avg_floor_area));

  return {
    labels,
    datasets: [
      {
        label: 'Average Price ($)',
        data: avgPrices,
        backgroundColor: '#0d6efd',
        yAxisID: 'y1',
      },
      {
        label: 'Average Floor Area (sqm)',
        data: avgAreas,
        backgroundColor: '#ffc107',
        yAxisID: 'y2',
      },
    ],
  };
})();

// Chart options (dual axis)
const flatTypeChartOptions = {
  responsive: true,
  plugins: {
    legend: { position: 'top' },
    title: { display: true, text: 'Flat Type Comparison' },
    tooltip: {
      mode: 'index',
      intersect: false,
      callbacks: {
        label: (context) => {
          const label = context.dataset.label || '';
          const value = context.raw;
          return label.includes('Price')
            ? `${label}: $${value.toLocaleString()}`
            : `${label}: ${value.toLocaleString()} sqm`;
        },
      },
    },
  },
  scales: {
    y1: {
      type: 'linear',
      position: 'left',
      beginAtZero: true,
      title: { display: true, text: 'Average Price ($)' },
      ticks: { callback: (val) => `$${val.toLocaleString()}` },
    },
    y2: {
      type: 'linear',
      position: 'right',
      beginAtZero: true,
      grid: { drawOnChartArea: false },
      title: { display: true, text: 'Average Floor Area (sqm)' },
      ticks: { callback: (val) => `${val}` },
    },
  },
};
  // histogram chart data
  const priceHistogramData = (() => {
    if (!priceDist || !priceDist.data) return null;

    const labels = priceDist.data.map(
      (d) =>
        `$${(d.price_bucket / 1000).toLocaleString()}k–$${(
          (d.price_bucket + priceDist.bucketSize) /
          1000
        ).toLocaleString()}k`
    );
    const counts = priceDist.data.map((d) => d.count);

    return {
      labels,
      datasets: [
        {
          label: 'Transaction Count',
          data: counts,
          backgroundColor: '#20c997',
        },
      ],
    };
  })();

  return (
    <Container className="mt-4">
      <h2>HDB Market Analytics</h2>

      {/* Year selector */}
      <Row className="mt-3 mb-2">
        <Col md={4}>
          <Form.Group controlId="yearSelect">
            <Form.Label>Select Year</Form.Label>
            <Form.Select
              value={selectedYear || ''}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>

      {/* Average Price by Town (selected year) */}
      <Row className="mt-3">
        <Col md={12}>
          <Card className="mb-3">
            <Card.Body>
              <Card.Title>
                Average Price by Town – {selectedYear ? selectedYear : 'Loading...'}
              </Card.Title>
              {filteredChartData ? (
                <Bar
                  data={filteredChartData}
                  options={chartOptions('Average Price by Town')}
                />
              ) : (
                <p>Loading chart...</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
      <Row className="mt-4">
        <Col md={6}>
          <Card className="mb-3">
            <Card.Body>
              <Card.Title>Flat Type Comparison</Card.Title>
              {flatTypeChartData ? (
                <Bar data={flatTypeChartData} options={flatTypeChartOptions} />
              ) : (
                <p>Loading flat type comparison...</p>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="mb-3">
            <Card.Body>
              <Card.Title>Price Distribution Histogram ($)</Card.Title>
              {priceHistogramData ? (
                <Bar
                  data={priceHistogramData}
                  options={chartOptions('Transaction Count by Price Range')}
                />
              ) : (
                <p>Loading histogram...</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mt-4">
        <Col md={12} lg={6}>
          <Card className="mb-3">
            <Card.Body>
              <Card.Title>Average Price per sqm by Town ($/sqm)</Card.Title>
              {towns.length > 0 ? (
                <Bar
                  data={{
                    labels: towns.map((t) => t.town_name),
                    datasets: [
                      {
                        label: 'Average Price per sqm ($/sqm)',
                        data: towns.map((t) => parseFloat(t.avg_price_per_sqm)),
                        backgroundColor: '#198754',
                      },
                    ],
                  }}
                  options={chartOptions('Average Price per sqm by Town')}
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
              <Card.Title>Transaction Count by Town</Card.Title>
              {towns.length > 0 ? (
                <Bar
                  data={{
                    labels: towns.map((t) => t.town_name),
                    datasets: [
                      {
                        label: 'Transactions',
                        data: towns.map((t) => t.transaction_count),
                        backgroundColor: '#dc3545',
                      },
                    ],
                  }}
                  options={chartOptions('Transaction Count by Town')}
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
