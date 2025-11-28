import React, { useEffect, useState } from 'react';
import { Container, Card, Badge, Spinner, Alert, Carousel } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const RecommendationsSection = ({ user }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [reasoning, setReasoning] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !user._id) {
      return;
    }

    setLoading(true);
    
    const fetchRecommendations = async () => {
      try {
        const url = `http://localhost:3001/api/recommendations/${user._id}?limit=6`;
        const response = await axios.get(url);

        if (response.data.success && response.data.recommendations) {
          setRecommendations(response.data.recommendations);
          setReasoning(response.data.reasoning);
        }
      } catch (err) {
        console.error('❌ Error fetching recommendations:', err);
        setError('Unable to load recommendations');
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [user]);

  const handlePropertyClick = (transactionId) => {
    navigate(`/property/${transactionId}`);
  };

  // Chunk recommendations into groups of 3 for carousel slides
  const chunkRecommendations = (arr, size) => {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  };

  if (!user) return null;

  if (loading) {
    return (
      <div style={{ 
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        padding: '1.5rem',
        borderRadius: '10px',
        marginBottom: '1.5rem'
      }}>
        <Container>
          <div className="text-center py-3">
            <Spinner animation="border" variant="primary" size="sm" />
            <span className="ms-2 text-muted">Loading recommendations...</span>
          </div>
        </Container>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ marginBottom: '1.5rem' }}>
        <Container>
          <Alert variant="warning" className="mb-0">{error}</Alert>
        </Container>
      </div>
    );
  }

  if (recommendations.length === 0) return null;

  const slides = chunkRecommendations(recommendations, 3);

  return (
    <div style={{ 
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      padding: '1.5rem 0',
      borderRadius: '10px',
      marginBottom: '1.5rem'
    }}>
      <Container>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '1rem'
        }}>
          <div>
            <h4 style={{ 
              fontWeight: 700, 
              color: '#2c3e50',
              marginBottom: '0.25rem',
              fontSize: '1.25rem'
            }}>
              <span style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>💡</span>
              Recommended For You
            </h4>
            <p style={{ 
              color: '#6c757d', 
              marginBottom: 0,
              fontSize: '0.875rem'
            }}>
              {reasoning}
            </p>
          </div>
          <div style={{ color: '#6c757d', fontSize: '0.875rem' }}>
            {recommendations.length} properties
          </div>
        </div>

        {/* Carousel */}
        <Carousel 
          indicators={true}
          controls={true}
          interval={null}
          style={{ padding: '0 2rem' }}
        >
          {slides.map((slide, slideIndex) => (
            <Carousel.Item key={slideIndex}>
              <div style={{ 
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '1rem',
                padding: '1rem 0'
              }}>
                {slide.map((property) => (
                  <Card 
                    key={property.transaction_id}
                    onClick={() => handlePropertyClick(property.transaction_id)}
                    style={{ 
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      borderRadius: '12px',
                      border: 'none',
                      height: '280px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-5px)';
                      e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                    }}
                  >
                    <Card.Body style={{ padding: '1rem' }}>
                      {/* Badges */}
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <Badge bg="primary" style={{ 
                          fontSize: '0.7rem', 
                          padding: '0.3rem 0.6rem',
                          borderRadius: '20px'
                        }}>
                          {property.flat_type_name}
                        </Badge>
                        <Badge bg="secondary" style={{ 
                          fontSize: '0.7rem', 
                          padding: '0.3rem 0.6rem',
                          borderRadius: '20px'
                        }}>
                          {property.town_name}
                        </Badge>
                      </div>

                      {/* Address */}
                      <Card.Title style={{ 
                        fontSize: '0.95rem', 
                        fontWeight: 600,
                        color: '#2c3e50',
                        marginBottom: '0.75rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        Blk {property.block_number} {property.street_name}
                      </Card.Title>

                      {/* Price */}
                      <div style={{ marginBottom: '0.75rem' }}>
                        <h5 style={{ 
                          fontSize: '1.25rem', 
                          fontWeight: 700,
                          color: '#0d6efd',
                          marginBottom: '0.1rem'
                        }}>
                          ${(property.price / 1000).toFixed(0)}k
                        </h5>
                        <small style={{ color: '#6c757d', fontSize: '0.75rem' }}>
                          ${property.price_per_sqm}/sqm
                        </small>
                      </div>

                      {/* Details */}
                      <div style={{ 
                        paddingTop: '0.75rem', 
                        borderTop: '1px solid #e9ecef',
                        fontSize: '0.8rem',
                        color: '#6c757d'
                      }}>
                        <div style={{ marginBottom: '0.4rem' }}>
                          <span style={{ marginRight: '0.4rem' }}>📐</span>
                          {property.floor_area_sqm} sqm
                        </div>
                        <div style={{ marginBottom: '0.4rem' }}>
                          <span style={{ marginRight: '0.4rem' }}>🏢</span>
                          {property.storey_range}
                        </div>
                        <div>
                          <span style={{ marginRight: '0.4rem' }}>📅</span>
                          {property.month}
                        </div>
                      </div>

                      {/* View Link */}
                      <div style={{ 
                        marginTop: '0.75rem',
                        textAlign: 'right',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        color: '#0d6efd'
                      }}>
                        View Details →
                      </div>
                    </Card.Body>
                  </Card>
                ))}
              </div>
            </Carousel.Item>
          ))}
        </Carousel>

        {/* Custom Carousel Styles */}
        <style>{`
          .carousel-control-prev-icon,
          .carousel-control-next-icon {
            background-color: rgba(0, 0, 0, 0.5);
            border-radius: 50%;
            padding: 1.5rem;
          }
          .carousel-indicators button {
            background-color: #0d6efd;
            width: 8px;
            height: 8px;
            border-radius: 50%;
          }
          .carousel-indicators {
            margin-bottom: 0.5rem;
          }
        `}</style>
      </Container>
    </div>
  );
};

export default RecommendationsSection;