// src/pages/ResultsPage.jsx
import React, { useEffect, useState } from "react";
import { Container, Button, Row, Col, Spinner, Accordion, Badge } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";
import PropertyCard from "../components/PropertyCard";
import StatsBar from "../components/StatsBar";
import { searchProperties } from "../services/api";

//Might put the recommendations here
import RecommendationsSection from '../components/RecommendationsSection';

function ResultsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const filters = location.state?.filters || {};

  const [allResults, setAllResults] = useState([]);
  const [groupedByTown, setGroupedByTown] = useState({});
  const [displayedCounts, setDisplayedCounts] = useState({});
  const [loading, setLoading] = useState(false);

  const RESULTS_PER_PAGE = 10;

  const loadAllResults = async () => {
    setLoading(true);
    try {
      const apiFilters = {
        ...filters,
        towns: filters.towns || [],
        flatTypes: filters.flatType ? [filters.flatType] : [],
      };

      const response = await searchProperties(apiFilters, true);
      const data = Array.isArray(response?.data) ? response.data : [];

      setAllResults(data);
      
      // Group properties by town
      const grouped = data.reduce((acc, property) => {
        const townName = property.town_name;
        if (!acc[townName]) {
          acc[townName] = [];
        }
        acc[townName].push(property);
        return acc;
      }, {});
      
      setGroupedByTown(grouped);

      // Initialize displayed counts for each town (start with 10)
      const initialCounts = {};
      Object.keys(grouped).forEach(townName => {
        initialCounts[townName] = RESULTS_PER_PAGE;
      });
      setDisplayedCounts(initialCounts);
    } catch (err) {
      console.error("Error fetching results:", err);
      setAllResults([]);
      setGroupedByTown({});
      setDisplayedCounts({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllResults();
  }, []);

  const handleLoadMore = (townName) => {
    setDisplayedCounts(prev => ({
      ...prev,
      [townName]: prev[townName] + RESULTS_PER_PAGE
    }));
  };

  const townNames = Object.keys(groupedByTown).sort();

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

      {allResults.length > 0 && <StatsBar results={allResults} />}

      {allResults.length === 0 && !loading && (
        <p className="text-muted">No results found. Try changing filters.</p>
      )}

      {loading && (
        <div className="text-center mt-3">
          <Spinner animation="border" />
        </div>
      )}

      {!loading && townNames.length > 0 && (
        <Accordion defaultActiveKey="0" className="mt-4">
          {townNames.map((townName, index) => {
            const allProperties = groupedByTown[townName];
            const displayCount = displayedCounts[townName] || RESULTS_PER_PAGE;
            const displayedProperties = allProperties.slice(0, displayCount);
            const hasMore = displayCount < allProperties.length;

            return (
              <Accordion.Item eventKey={index.toString()} key={townName}>
                <Accordion.Header>
                  <strong>{townName}</strong>
                  <Badge bg="primary" className="ms-2">
                    {allProperties.length} {allProperties.length === 1 ? 'property' : 'properties'}
                  </Badge>
                </Accordion.Header>
                <Accordion.Body>
                  <Row>
                    {displayedProperties.map((property) => (
                      <Col md={12} key={property.transaction_id} className="mb-3">
                        <PropertyCard property={property} showComparisonButton />
                      </Col>
                    ))}
                  </Row>
                  
                  {hasMore && (
                    <div className="text-center mt-3">
                      <Button 
                        variant="primary" 
                        onClick={() => handleLoadMore(townName)}
                      >
                        Load More ({displayedProperties.length} of {allProperties.length})
                      </Button>
                    </div>
                  )}

                  {!hasMore && allProperties.length > RESULTS_PER_PAGE && (
                    <div className="text-center mt-3">
                      <p className="text-muted">All properties displayed</p>
                    </div>
                  )}
                </Accordion.Body>
              </Accordion.Item>
            );
          })}
        </Accordion>
      )}
    </Container>
  );
}

export default ResultsPage;