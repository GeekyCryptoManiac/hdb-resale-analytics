import React, { useContext } from "react";
import { Container, Card } from "react-bootstrap";
import { AuthContext } from "../context/AuthContext";

function UserDetailsPage() {
  const { user } = useContext(AuthContext);

  if (!user) {
    return (
      <Container className="mt-5">
        <Card className="text-center">
          <Card.Body>
            <Card.Title>No User Logged In</Card.Title>
            <Card.Text>Please log in to see your details.</Card.Text>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="mt-5">
      <Card className="mx-auto" style={{ maxWidth: "500px" }}>
        <Card.Body>
          <Card.Title>Profile Details</Card.Title>
          <p><strong>Name:</strong> {user.name}</p>
          <p><strong>Email:</strong> {user.email}</p>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default UserDetailsPage;
