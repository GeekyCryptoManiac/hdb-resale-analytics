// src/pages/SearchPage.jsx
import React, { useEffect, useState } from "react";
import { Container, Card, Row, Col, Form, Button, Alert, Spinner } from "react-bootstrap";
import { useNavigate, useLocation } from "react-router-dom";
import { getTowns, getFlatTypes } from "../services/api";

function SearchPage() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [towns, setTowns] = useState([]);
  const [flatTypes, setFlatTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // ✅ FIXED: Initialize filters from location.state if coming from heatmap
  const [filters, setFilters] = useState(
    location.state?.filters || {
      towns: [],
      flatType: "",
      minPrice: "",
      maxPrice: "",
      minFloorArea: "",
      maxFloorArea: "",
      minRemainingLease: "",
      sortBy: "",
      sortOrder: ""
    }
  );

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [townList, flatTypeList] = await Promise.all([getTowns(), getFlatTypes()]);
        setTowns(townList.data);
        setFlatTypes(flatTypeList.data);
      } catch (err) {
        console.error("Error loading data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // ✅ FIXED: Update filters when location.state changes (e.g., from heatmap navigation)
  useEffect(() => {
    if (location.state?.filters) {
      setFilters(location.state.filters);
    }
  }, [location.state]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleTownCheckbox = (townName) => {
    setFilters((prev) => {
      const isSelected = prev.towns.includes(townName);
      if (isSelected) {
        return { ...prev, towns: prev.towns.filter(t => t !== townName) };
      } else {
        return { ...prev, towns: [...prev.towns, townName] };
      }
    });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    navigate("/results", { state: { filters } });
  };

  // ✅ NEW: Check if we came from heatmap (has pre-filled filters)
  const isFromHeatmap = location.state?.filters?.towns?.length > 0 && 
                       location.state?.filters?.flatType === '';

  return (
    <Container className="mt-4">
      <Card className="mb-4">
        <Card.Body>
          <Card.Title>
            <h2>Enter HDB Apartment Details</h2>
          </Card.Title>

          {/* ✅ NEW: Show alert if coming from heatmap */}
          {isFromHeatmap && (
            <Alert variant="info" className="mb-3">
              <strong>🗺️ Search pre-filled from Market Heatmap</strong>
              <p className="mb-0 mt-1">
                Selected town: <strong>{filters.towns.join(', ')}</strong>
                <br />
                <small>You can modify filters below or search directly.</small>
              </p>
            </Alert>
          )}

          {loading ? (
            <Spinner animation="border" />
          ) : (
            <Form onSubmit={handleSearch}>
              <Row className="mb-3">
                <Col md={12}>
                  <Form.Group>
                    <Form.Label>Towns (Select one or more)</Form.Label>
                    <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #dee2e6', borderRadius: '4px', padding: '10px' }}>
                      {Array.isArray(towns) &&
                        towns.map((t) => (
                          <Form.Check
                            key={t.id}
                            type="checkbox"
                            id={`town-${t.id}`}
                            label={t.town_name}
                            checked={filters.towns.includes(t.town_name)}
                            onChange={() => handleTownCheckbox(t.town_name)}
                          />
                        ))}
                    </div>
                    {filters.towns.length > 0 && (
                      <Form.Text className="text-muted">
                        Selected: {filters.towns.join(', ')}
                      </Form.Text>
                    )}
                  </Form.Group>
                </Col>
              </Row>

              <Row className="mb-3">
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Flat Type</Form.Label>
                    <Form.Select
                      name="flatType"
                      value={filters.flatType}
                      onChange={handleChange}
                    >
                      <option value="">Select Flat Type</option>
                      {Array.isArray(flatTypes) &&
                        flatTypes.map((f) => (
                          <option key={f.flat_type_id} value={f.flat_type_name}>
                            {f.flat_type_name}
                          </option>
                        ))}
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Min Price</Form.Label>
                    <Form.Control
                      type="number"
                      name="minPrice"
                      value={filters.minPrice}
                      onChange={handleChange}
                      placeholder="e.g. 300000"
                    />
                  </Form.Group>
                </Col>

                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Max Price</Form.Label>
                    <Form.Control
                      type="number"
                      name="maxPrice"
                      value={filters.maxPrice}
                      onChange={handleChange}
                      placeholder="e.g. 800000"
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row className="mb-3">
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Min Floor Area (sqm)</Form.Label>
                    <Form.Control
                      type="number"
                      name="minFloorArea"
                      value={filters.minFloorArea}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>

                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Max Floor Area (sqm)</Form.Label>
                    <Form.Control
                      type="number"
                      name="maxFloorArea"
                      value={filters.maxFloorArea}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>

                <Col md={2}>
                  <Form.Group>
                    <Form.Label>Min Remaining Lease (years)</Form.Label>
                    <Form.Control
                      type="number"
                      name="minRemainingLease"
                      value={filters.minRemainingLease}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>

                <Col md={2}>
                  <Form.Group>
                    <Form.Label>Sort By</Form.Label>
                    <Form.Select name="sortBy" value={filters.sortBy} onChange={handleChange}>
                      <option value="">Default</option>
                      <option value="price">Price</option>
                      <option value="floor_area_sqm">Floor Area</option>
                      <option value="price_per_sqm">Price per sqm</option>
                      <option value="month">Transaction Month</option>
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col md={2}>
                  <Form.Group>
                    <Form.Label>Sort Order</Form.Label>
                    <Form.Select
                      name="sortOrder"
                      value={filters.sortOrder}
                      onChange={handleChange}
                    >
                      <option value="">Default</option>
                      <option value="ASC">Ascending</option>
                      <option value="DESC">Descending</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              <Button variant="primary" type="submit">
                Search
              </Button>
            </Form>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}

export default SearchPage;