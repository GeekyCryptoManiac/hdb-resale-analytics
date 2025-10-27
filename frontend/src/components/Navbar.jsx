// src/components/Navbar.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar as BootstrapNavbar, Nav, Container, Button } from 'react-bootstrap';
import { useUser } from '../context/UserContext';

function Navbar() {
  const { user, logout, comparisonProperties } = useUser();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const comparisonCount = comparisonProperties?.length || 0;

  return (
    <BootstrapNavbar bg="primary" variant="dark" expand="lg" className="mb-4">
      <Container>
        <BootstrapNavbar.Brand as={Link} to="/search">
          🏠 HDB Analytics
        </BootstrapNavbar.Brand>
        
        <BootstrapNavbar.Toggle aria-controls="basic-navbar-nav" />
        
        <BootstrapNavbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/search">Search</Nav.Link>
            <Nav.Link as={Link} to="/analytics">Analytics</Nav.Link>
          </Nav>
          
          <Nav className="ms-auto">
            {user ? (
              <>
                <Nav.Link as={Link} to="/comparison">
                  My Comparisons {comparisonCount > 0 && `(${comparisonCount})`}
                </Nav.Link>
                <BootstrapNavbar.Text className="me-3">
                  Welcome, {user.name}
                </BootstrapNavbar.Text>
                <Button variant="outline-light" size="sm" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            ) : (
              <Nav.Link as={Link} to="/login">Login</Nav.Link>
            )}
          </Nav>
        </BootstrapNavbar.Collapse>
      </Container>
    </BootstrapNavbar>
  );
}

export default Navbar;