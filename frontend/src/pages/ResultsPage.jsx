import React, { useEffect, useState } from "react";
import { Container, Button, Row, Col, Spinner } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";
import PropertyCard from "../components/PropertyCard";
import StatsBar from "../components/StatsBar";
import { searchProperties } from "../services/api";

function ResultsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const filters = location.state?.filters || {};

  const [allResults, setAllResults] = useState([]); // store all fetched results
  const [displayedResults, setDisplayedResults] = useState([]); // currently visible
  const [loading, setLoading] = useState(false);

  const RESULTS_PER_PAGE = 10;

  const loadAllResults = async () => {
  setLoading(true);
  try {
    const apiFilters = {
      ...filters,
      towns: filters.town ? [filters.town] : [],
      flatTypes: filters.flatType ? [filters.flatType] : [],
    };

    // Pass fetchAll = true
    const response = await searchProperties(apiFilters, true);
    const data = Array.isArray(response?.data) ? response.data : [];

    setAllResults(data);
    setDisplayedResults(data.slice(0, RESULTS_PER_PAGE));
  } catch (err) {
    console.error("Error fetching results:", err);
    setAllResults([]);
    setDisplayedResults([]);
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    loadAllResults();
  }, [filters]);

  const handleLoadMore = () => {
    const currentLength = displayedResults.length;
    const nextResults = allResults.slice(
      currentLength,
      currentLength + RESULTS_PER_PAGE
    );
    setDisplayedResults((prev) => [...prev, ...nextResults]);
  };

  return (
    <Container className="mt-4">
      <Button
        variant="secondary"
        onClick={() => navigate("/search")}
        className="mb-3"
      >
        ← Back to Search
      </Button>

      <h2>Search Results</h2>

      {displayedResults.length > 0 && <StatsBar results={allResults} />}

      {displayedResults.length === 0 && !loading && (
        <p className="text-muted">No results found. Try changing filters.</p>
      )}

      <Row>
        {displayedResults.map((property) => (
          <Col md={12} key={property.transaction_id} className="mb-3">
            <PropertyCard property={property} showComparisonButton />
          </Col>
        ))}
      </Row>

      {loading && (
        <div className="text-center mt-3">
          <Spinner animation="border" />
        </div>
      )}

      {displayedResults.length < allResults.length && !loading && (
        <div className="text-center mt-3">
          <Button variant="primary" onClick={handleLoadMore}>
            Load More
          </Button>
        </div>
      )}
    </Container>
  );
}

export default ResultsPage;
