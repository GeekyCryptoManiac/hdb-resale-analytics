// src/components/HeatmapCard.jsx
import React, { useState } from 'react';
import { Card, Modal, Table, Badge, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

function HeatmapCard({ heatmapData, loading = false }) {
  const navigate = useNavigate();
  
  const [showModal, setShowModal] = useState(false);
  const [selectedTown, setSelectedTown] = useState(null);

  // Color mapping based on growth category
  const getHeatColor = (category) => {
    const colors = {
      very_hot: '#dc3545',
      hot: '#fd7e14',
      warm: '#ffc107',
      neutral: '#28a745',
      cool: '#6c757d'
    };
    return colors[category] || '#6c757d';
  };

  const getGrowthIcon = (pct) => {
    if (pct > 0) return '↑';
    if (pct < 0) return '↓';
    return '→';
  };

  const getTextColor = (category) => {
    return category === 'warm' ? '#000' : '#fff';
  };

  const handleTileClick = (town) => {
    setSelectedTown(town);
    setShowModal(true);
  };

  // ✅ FIXED: Navigate to search with proper state (matching your SearchPage structure)
  const handleSearchProperties = (townName) => {
    setShowModal(false);
    
    // Navigate with state object - EXACTLY matching your SearchPage filter structure
    navigate('/search', {
      state: {
        filters: {
          towns: [townName],  // Array with the selected town
          flatType: '',
          minPrice: '',
          maxPrice: '',
          minFloorArea: '',
          maxFloorArea: '',
          minRemainingLease: '',
          sortBy: '',
          sortOrder: ''
        }
      }
    });
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading heatmap data...</p>
      </div>
    );
  }

  if (!heatmapData || heatmapData.length === 0) {
    return (
      <div className="text-center py-5">
        <p className="text-muted">No heatmap data available for the selected filters.</p>
        <small>Try adjusting the flat type or time period.</small>
      </div>
    );
  }

  return (
    <>
      <Card.Title className="mb-4">
        🗺️ Market Heatmap - Price Appreciation by Town
      </Card.Title>
      
      {/* Heatmap Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '15px',
        marginTop: '20px'
      }}>
        {heatmapData.map((town) => (
          <div
            key={town.town_name}
            style={{
              backgroundColor: getHeatColor(town.heat_category),
              color: getTextColor(town.heat_category),
              padding: '20px',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              position: 'relative'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
            }}
            onClick={() => handleTileClick(town)}
            title={`Click to view detailed statistics for ${town.town_name}`}
          >
            {/* Town Name */}
            <div style={{ 
              fontSize: '1rem', 
              fontWeight: 'bold', 
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              {town.town_name}
            </div>
            
            {/* YoY Growth (Main Metric) */}
            <div style={{ 
              fontSize: '1.8rem', 
              fontWeight: 'bold', 
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}>
              <span style={{ fontSize: '1.5rem' }}>
                {getGrowthIcon(town.yoy_growth_pct)}
              </span>
              {Math.abs(town.yoy_growth_pct)}%
            </div>
            
            {/* Average Price */}
            <div style={{ 
              fontSize: '0.9rem', 
              opacity: 0.95,
              marginBottom: '4px'
            }}>
              Avg: <strong>${(town.avg_price / 1000).toFixed(0)}k</strong>
            </div>
            
            {/* Price per sqm */}
            <div style={{ 
              fontSize: '0.85rem', 
              opacity: 0.9,
              marginBottom: '8px'
            }}>
              ${town.avg_price_per_sqm}/sqm
            </div>
            
            {/* Transaction Count */}
            <div style={{ 
              fontSize: '0.75rem', 
              opacity: 0.85,
              borderTop: '1px solid rgba(255,255,255,0.3)',
              paddingTop: '8px',
              marginTop: '8px'
            }}>
              📊 {town.transaction_count.toLocaleString()} transactions
            </div>
          </div>
        ))}
      </div>

      {/* Town Details Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header 
          closeButton 
          style={{ 
            backgroundColor: selectedTown ? getHeatColor(selectedTown.heat_category) : '#fff',
            color: selectedTown ? getTextColor(selectedTown.heat_category) : '#000'
          }}
        >
          <Modal.Title>
            {selectedTown?.town_name} - Market Details
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedTown && (
            <>
              {/* Summary Section */}
              <div className="mb-4 p-3" style={{ 
                backgroundColor: '#f8f9fa', 
                borderRadius: '8px',
                borderLeft: `4px solid ${getHeatColor(selectedTown.heat_category)}`
              }}>
                <h5>Market Performance</h5>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <div style={{ 
                      fontSize: '2rem', 
                      fontWeight: 'bold', 
                      color: getHeatColor(selectedTown.heat_category) 
                    }}>
                      {getGrowthIcon(selectedTown.yoy_growth_pct)} {Math.abs(selectedTown.yoy_growth_pct)}%
                    </div>
                    <small className="text-muted">Year-over-Year Growth</small>
                  </div>
                  <Badge 
                    bg={selectedTown.heat_category === 'very_hot' || selectedTown.heat_category === 'hot' ? 'danger' : 
                        selectedTown.heat_category === 'warm' ? 'warning' : 
                        selectedTown.heat_category === 'neutral' ? 'success' : 'secondary'}
                    style={{ fontSize: '1rem', padding: '10px 15px' }}
                  >
                    {selectedTown.heat_category.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
              </div>

              {/* Detailed Statistics Table */}
              <Table bordered hover>
                <tbody>
                  <tr>
                    <td><strong>Average Price</strong></td>
                    <td>${selectedTown.avg_price.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td><strong>Price per sqm</strong></td>
                    <td>${selectedTown.avg_price_per_sqm}/sqm</td>
                  </tr>
                  <tr>
                    <td><strong>YoY Price Growth</strong></td>
                    <td>
                      <span style={{ 
                        color: selectedTown.yoy_growth_pct > 0 ? 'green' : 'red', 
                        fontWeight: 'bold' 
                      }}>
                        {getGrowthIcon(selectedTown.yoy_growth_pct)} {Math.abs(selectedTown.yoy_growth_pct)}%
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td><strong>YoY PSM Growth</strong></td>
                    <td>
                      <span style={{ 
                        color: selectedTown.yoy_growth_psm_pct > 0 ? 'green' : 'red', 
                        fontWeight: 'bold' 
                      }}>
                        {getGrowthIcon(selectedTown.yoy_growth_psm_pct)} {Math.abs(selectedTown.yoy_growth_psm_pct)}%
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td><strong>Transaction Volume</strong></td>
                    <td>{selectedTown.transaction_count.toLocaleString()} transactions</td>
                  </tr>
                  <tr>
                    <td><strong>Latest Data Point</strong></td>
                    <td>{selectedTown.latest_month}</td>
                  </tr>
                  {selectedTown.prev_avg_price && (
                    <tr>
                      <td><strong>Previous Year Avg Price</strong></td>
                      <td>${selectedTown.prev_avg_price.toLocaleString()}</td>
                    </tr>
                  )}
                </tbody>
              </Table>

              {/* Quick Actions */}
              <div className="mt-4">
                <h6>Quick Actions</h6>
                <div className="d-flex gap-2">
                  <Button 
                    variant="primary"
                    onClick={() => handleSearchProperties(selectedTown.town_name)}
                  >
                    🔍 Search Properties in {selectedTown.town_name}
                  </Button>
                  <Button 
                    variant="outline-secondary"
                    onClick={() => setShowModal(false)}
                  >
                    Close
                  </Button>
                </div>
              </div>

              {/* Market Insight */}
              <div className="mt-4 p-3" style={{ backgroundColor: '#e7f3ff', borderRadius: '8px' }}>
                <strong>💡 Market Insight:</strong>
                <p className="mb-0 mt-2">
                  {selectedTown.yoy_growth_pct > 5 && (
                    `${selectedTown.town_name} is experiencing strong price appreciation with ${selectedTown.yoy_growth_pct}% year-over-year growth, making it a hot market for potential investment.`
                  )}
                  {selectedTown.yoy_growth_pct > 0 && selectedTown.yoy_growth_pct <= 5 && (
                    `${selectedTown.town_name} shows steady growth at ${selectedTown.yoy_growth_pct}% year-over-year, indicating a stable and healthy market.`
                  )}
                  {selectedTown.yoy_growth_pct <= 0 && (
                    `${selectedTown.town_name} has seen ${Math.abs(selectedTown.yoy_growth_pct)}% decline year-over-year. This could present value opportunities for buyers.`
                  )}
                </p>
              </div>
            </>
          )}
        </Modal.Body>
      </Modal>

      {/* Legend */}
      <div style={{ 
        marginTop: '30px', 
        padding: '20px', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '8px',
        border: '1px solid #dee2e6'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '15px'
        }}>
          <strong style={{ fontSize: '1rem' }}>📊 Heat Legend</strong>
          <small className="text-muted">Click any tile for detailed statistics</small>
        </div>
        
        <div style={{ 
          display: 'flex', 
          gap: '15px', 
          flexWrap: 'wrap',
          justifyContent: 'space-around'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ 
              width: '30px', 
              height: '30px', 
              backgroundColor: '#dc3545', 
              borderRadius: '4px',
              border: '2px solid #dee2e6'
            }}></div>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Very Hot</div>
              <small className="text-muted">{'>'}10% growth</small>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ 
              width: '30px', 
              height: '30px', 
              backgroundColor: '#fd7e14', 
              borderRadius: '4px',
              border: '2px solid #dee2e6'
            }}></div>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Hot</div>
              <small className="text-muted">5-10% growth</small>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ 
              width: '30px', 
              height: '30px', 
              backgroundColor: '#ffc107', 
              borderRadius: '4px',
              border: '2px solid #dee2e6'
            }}></div>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Warm</div>
              <small className="text-muted">2-5% growth</small>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ 
              width: '30px', 
              height: '30px', 
              backgroundColor: '#28a745', 
              borderRadius: '4px',
              border: '2px solid #dee2e6'
            }}></div>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Neutral</div>
              <small className="text-muted">0-2% growth</small>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ 
              width: '30px', 
              height: '30px', 
              backgroundColor: '#6c757d', 
              borderRadius: '4px',
              border: '2px solid #dee2e6'
            }}></div>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Cool</div>
              <small className="text-muted">{'<'}0% decline</small>
            </div>
          </div>
        </div>
      </div>

      {/* Insights Section */}
      {heatmapData.length > 0 && (
        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          backgroundColor: '#e7f3ff', 
          borderRadius: '8px',
          borderLeft: '4px solid #0d6efd'
        }}>
          <strong>💡 Key Insights:</strong>
          <ul style={{ marginTop: '10px', marginBottom: '0', paddingLeft: '20px' }}>
            <li>
              <strong>{heatmapData[0].town_name}</strong> leads with{' '}
              <strong style={{ color: getHeatColor(heatmapData[0].heat_category) }}>
                {heatmapData[0].yoy_growth_pct}%
              </strong> YoY growth
            </li>
            <li>
              <strong>{heatmapData.filter(t => t.yoy_growth_pct > 0).length}</strong> towns 
              showing positive growth
            </li>
            <li>
              Average across all towns:{' '}
              <strong>
                {(heatmapData.reduce((sum, t) => sum + t.yoy_growth_pct, 0) / heatmapData.length).toFixed(1)}%
              </strong>
            </li>
          </ul>
        </div>
      )}
    </>
  );
}

export default HeatmapCard;