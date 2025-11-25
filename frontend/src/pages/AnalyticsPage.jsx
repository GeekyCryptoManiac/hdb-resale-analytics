// src/pages/AnalyticsPage.jsx
import React, { useEffect, useState } from 'react';
import { Container, Card, Row, Col, Form, Badge, Table, Tabs, Tab, Button, ButtonGroup } from 'react-bootstrap';
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
import HeatmapCard from '../components/HeatmapCard';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function AnalyticsPage() {
  const [towns, setTowns] = useState([]);
  const [avgPriceData, setAvgPriceData] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);
  const [priceDist, setPriceDist] = useState(null);
  const [flatTypeData, setFlatTypeData] = useState([]);
  const [topTowns, setTopTowns] = useState([]);
  const [overallStats, setOverallStats] = useState(null);
  const [heatmapData, setHeatmapData] = useState([]);
  const [heatmapLoading, setHeatmapLoading] = useState(false);
  const [heatmapFilter, setHeatmapFilter] = useState({
    flatType: null,
    months: 12
  });
  
  // 🆕 NEW: Active view state
  const [activeView, setActiveView] = useState('overview');

  // All your existing useEffect hooks here...
  useEffect(() => {
    axios
      .get(`${process.env.REACT_APP_API_URL}/analytics/town-comparison`)
      .then((res) => setTowns(res.data.data || []))
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    axios
      .get(`${process.env.REACT_APP_API_URL}/analytics/statistics`)
      .then((res) => setOverallStats(res.data.data))
      .catch((err) => console.error(err));
  }, []);

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

  useEffect(() => {
    if (selectedYear) {
      axios
        .get(`${process.env.REACT_APP_API_URL}/analytics/top-appreciating-towns?year=${selectedYear}&limit=5`)
        .then((res) => setTopTowns(res.data.data || []))
        .catch((err) => console.error(err));
    }
  }, [selectedYear]);

  useEffect(() => {
    setHeatmapLoading(true);
    
    const params = new URLSearchParams();
    params.append('months', heatmapFilter.months);
    if (heatmapFilter.flatType) {
      params.append('flatType', heatmapFilter.flatType);
    }
    
    axios
      .get(`${process.env.REACT_APP_API_URL}/analytics/heatmap?${params}`)
      .then((res) => {
        setHeatmapData(res.data.data || []);
        setHeatmapLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setHeatmapLoading(false);
      });
  }, [heatmapFilter]);

  useEffect(() => {
    axios
      .get(`${process.env.REACT_APP_API_URL}/analytics/price-distribution`)
      .then((res) => setPriceDist(res.data))
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    axios
      .get(`${process.env.REACT_APP_API_URL}/analytics/flat-type-comparison`)
      .then((res) => setFlatTypeData(res.data.data || []))
      .catch((err) => console.error(err));
  }, []);

  // Helper functions
  const getMedalEmoji = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getComparisonBadge = (pct) => {
    if (!pct) return null;
    const isPositive = pct > 0;
    const color = isPositive ? 'success' : 'danger';
    const arrow = isPositive ? '↑' : '↓';
    return (
      <Badge bg={color} className="ms-2">
        {arrow} {Math.abs(pct).toFixed(1)}% vs avg
      </Badge>
    );
  };

  const chartOptions = (title) => ({
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: true, text: title },
      tooltip: {
        callbacks: {
          label: (context) => `${context.raw.toLocaleString()}`,
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

  const availableYears = [...new Set(avgPriceData.map((d) => d.year))].sort();

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

  const flatTypeChartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Flat Type Comparison' },
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
      },
    },
  };

  const priceHistogramData = (() => {
    if (!priceDist || !priceDist.data) return null;
    const labels = priceDist.data.map(
      (d) =>
        `$${(d.price_bucket / 1000).toLocaleString()}k–$${(
          (d.price_bucket + priceDist.bucketSize) / 1000
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
    <Container className="mt-4" style={{ maxWidth: '1400px' }}>
      {/* Header with Navigation */}
      <Row className="mb-4">
        <Col>
          <h2 className="mb-3">🏘️ HDB Market Analytics Dashboard</h2>
          
          {/* Navigation Buttons */}
          <ButtonGroup className="mb-3">
            <Button 
              variant={activeView === 'overview' ? 'primary' : 'outline-primary'}
              onClick={() => setActiveView('overview')}
            >
              📊 Overview
            </Button>
            <Button 
              variant={activeView === 'heatmap' ? 'primary' : 'outline-primary'}
              onClick={() => setActiveView('heatmap')}
            >
              🗺️ Market Heatmap
            </Button>
            <Button 
              variant={activeView === 'trends' ? 'primary' : 'outline-primary'}
              onClick={() => setActiveView('trends')}
            >
              📈 Price Trends
            </Button>
            <Button 
              variant={activeView === 'compare' ? 'primary' : 'outline-primary'}
              onClick={() => setActiveView('compare')}
            >
              🔍 Compare
            </Button>
          </ButtonGroup>
        </Col>
      </Row>

      {/* Overall Statistics Cards - Always Visible */}
      {overallStats && (
        <Row className="mb-4">
          <Col md={3}>
            <Card className="text-center h-100">
              <Card.Body>
                <Card.Title className="text-muted" style={{ fontSize: '0.9rem' }}>
                  Total Transactions
                </Card.Title>
                <h3>{overallStats.total_transactions?.toLocaleString()}</h3>
                {overallStats.recent_transactions && (
                  <small className="text-muted">
                    {overallStats.recent_transactions.toLocaleString()} in last 12 months
                  </small>
                )}
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center h-100">
              <Card.Body>
                <Card.Title className="text-muted" style={{ fontSize: '0.9rem' }}>
                  Average Price
                </Card.Title>
                <h3>${overallStats.avg_price?.toLocaleString()}</h3>
                {overallStats.recent_vs_overall_pct && (
                  <Badge 
                    bg={overallStats.recent_vs_overall_pct > 0 ? 'success' : 'danger'}
                  >
                    {overallStats.recent_vs_overall_pct > 0 ? '↑' : '↓'} 
                    {Math.abs(overallStats.recent_vs_overall_pct)}% recent trend
                  </Badge>
                )}
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center h-100">
              <Card.Body>
                <Card.Title className="text-muted" style={{ fontSize: '0.9rem' }}>
                  Price Range
                </Card.Title>
                <h3>
                  ${(overallStats.min_price / 1000).toFixed(0)}k - 
                  ${(overallStats.max_price / 1000).toFixed(0)}k
                </h3>
                <small className="text-muted">Min - Max</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center h-100">
              <Card.Body>
                <Card.Title className="text-muted" style={{ fontSize: '0.9rem' }}>
                  Avg Price per sqm
                </Card.Title>
                <h3>${overallStats.avg_price_per_sqm?.toLocaleString()}</h3>
                <small className="text-muted">Overall market</small>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* OVERVIEW TAB */}
      {activeView === 'overview' && (
        <>
          {/* Top Appreciating Towns */}
          {topTowns.length > 0 && (
            <Row className="mb-4">
              <Col md={12}>
                <Card style={{ backgroundColor: '#f8f9fa' }}>
                  <Card.Body>
                    <Card.Title className="d-flex justify-content-between align-items-center">
                      <span>🚀 Top 5 Fastest Appreciating Towns</span>
                      <Form.Select
                        value={selectedYear || ''}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        style={{ width: 'auto' }}
                      >
                        {availableYears.map((year) => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </Form.Select>
                    </Card.Title>
                    <Row className="mt-3">
                      {topTowns.map((town) => (
                        <Col md={2} key={town.town_name} className="mb-2">
                          <Card className="h-100 text-center">
                            <Card.Body>
                              <div style={{ fontSize: '2rem' }}>
                                {getMedalEmoji(town.growth_rank)}
                              </div>
                              <strong>{town.town_name}</strong>
                              <Badge bg="success" className="mt-2 d-block">
                                ↑ {town.yoy_growth_pct}%
                              </Badge>
                              <small className="text-muted d-block mt-1">
                                ${(town.prev_year_price / 1000).toFixed(0)}k → 
                                ${(town.avg_price / 1000).toFixed(0)}k
                              </small>
                            </Card.Body>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}

          {/* Key Charts Side by Side */}
          <Row className="mb-4">
            <Col md={6}>
              <Card>
                <Card.Body>
                  <Card.Title>Flat Type Comparison</Card.Title>
                  {flatTypeChartData && (
                    <Bar data={flatTypeChartData} options={flatTypeChartOptions} />
                  )}
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card>
                <Card.Body>
                  <Card.Title>Price Distribution</Card.Title>
                  {priceHistogramData && (
                    <Bar data={priceHistogramData} options={chartOptions('Transaction Count by Price Range')} />
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Call to Action */}
          <Row>
            <Col md={12}>
              <Card className="bg-light text-center">
                <Card.Body className="py-4">
                  <h5>💡 Want deeper insights?</h5>
                  <p className="mb-3">Explore the Market Heatmap for visual price appreciation analysis, or dive into Price Trends for year-over-year comparisons.</p>
                  <Button variant="primary" className="me-2" onClick={() => setActiveView('heatmap')}>
                    View Market Heatmap
                  </Button>
                  <Button variant="outline-primary" onClick={() => setActiveView('trends')}>
                    Analyze Trends
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}

      {/* HEATMAP TAB */}
      {activeView === 'heatmap' && (
        <Row>
          <Col md={12}>
            <Card>
              <Card.Body>
                {/* Heatmap Filters */}
                <Row className="mb-4">
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label><strong>Filter by Flat Type</strong></Form.Label>
                      <Form.Select
                        value={heatmapFilter.flatType || ''}
                        onChange={(e) => setHeatmapFilter({
                          ...heatmapFilter,
                          flatType: e.target.value || null
                        })}
                      >
                        <option value="">All Flat Types</option>
                        <option value="2 ROOM">2 ROOM</option>
                        <option value="3 ROOM">3 ROOM</option>
                        <option value="4 ROOM">4 ROOM</option>
                        <option value="5 ROOM">5 ROOM</option>
                        <option value="EXECUTIVE">EXECUTIVE</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label><strong>Time Period</strong></Form.Label>
                      <Form.Select
                        value={heatmapFilter.months}
                        onChange={(e) => setHeatmapFilter({
                          ...heatmapFilter,
                          months: parseInt(e.target.value)
                        })}
                      >
                        <option value="3">Last 3 Months</option>
                        <option value="6">Last 6 Months</option>
                        <option value="12">Last 12 Months</option>
                        <option value="24">Last 24 Months</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6} className="d-flex align-items-end">
                    <div className="text-muted">
                      <small>
                        💡 Colors indicate year-over-year price growth. Click tiles for details.
                      </small>
                    </div>
                  </Col>
                </Row>
                
                {/* Heatmap Component */}
                <HeatmapCard heatmapData={heatmapData} loading={heatmapLoading} />
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* TRENDS TAB */}
      {activeView === 'trends' && (
        <>
          <Row className="mb-4">
            <Col md={12}>
              <Card>
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Card.Title>Average Price by Town - {selectedYear}</Card.Title>
                    <Form.Select
                      value={selectedYear || ''}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      style={{ width: '150px' }}
                    >
                      {availableYears.map((year) => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </Form.Select>
                  </div>
                  {filteredChartData && (
                    <Bar data={filteredChartData} options={chartOptions('Average Price by Town')} />
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}

      {/* COMPARE TAB */}
      {activeView === 'compare' && (
        <>
          <Row className="mb-4">
            <Col md={6}>
              <Card>
                <Card.Body>
                  <Card.Title>Price per sqm by Town</Card.Title>
                  {towns.length > 0 && (
                    <>
                      <Bar
                        data={{
                          labels: towns.map((t) => t.town_name),
                          datasets: [{
                            label: 'Price per sqm',
                            data: towns.map((t) => parseFloat(t.avg_price_per_sqm)),
                            backgroundColor: '#198754',
                          }],
                        }}
                        options={chartOptions('Price per sqm by Town')}
                      />
                      <div className="mt-3">
                        <h6>Top 5 Most Expensive (per sqm):</h6>
                        <div className="d-flex flex-wrap gap-2">
                          {towns
                            .sort((a, b) => b.avg_price_per_sqm - a.avg_price_per_sqm)
                            .slice(0, 5)
                            .map((town) => (
                              <Badge key={town.town_name} bg="success">
                                {getMedalEmoji(town.psm_rank)} {town.town_name}: ${town.avg_price_per_sqm}
                              </Badge>
                            ))}
                        </div>
                      </div>
                    </>
                  )}
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card>
                <Card.Body>
                  <Card.Title>Transaction Volume by Town</Card.Title>
                  {towns.length > 0 && (
                    <>
                      <Bar
                        data={{
                          labels: towns.map((t) => t.town_name),
                          datasets: [{
                            label: 'Transactions',
                            data: towns.map((t) => t.transaction_count),
                            backgroundColor: '#dc3545',
                          }],
                        }}
                        options={chartOptions('Transaction Count')}
                      />
                      <div className="mt-3">
                        <h6>Most Active Towns:</h6>
                        <div className="d-flex flex-wrap gap-2">
                          {towns
                            .sort((a, b) => b.transaction_count - a.transaction_count)
                            .slice(0, 5)
                            .map((town) => (
                              <Badge key={town.town_name} bg="danger">
                                {getMedalEmoji(town.volume_rank)} {town.town_name}: {town.transaction_count.toLocaleString()}
                              </Badge>
                            ))}
                        </div>
                      </div>
                    </>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </Container>
  );
}

export default AnalyticsPage;