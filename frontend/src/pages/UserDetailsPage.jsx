import React, { useContext, useState } from "react";
import { Container, Card, Form, Button, Alert } from "react-bootstrap";
import { AuthContext } from "../context/AuthContext";

function UserDetailsPage() {
  const { user, token, setUser } = useContext(AuthContext);

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [password, setPassword] = useState("");

  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

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

  const handleUpdate = async (e) => {
  e.preventDefault();
  setSuccess("");
  setError("");

  try {
    const res = await fetch("/api/auth/update", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        name,
        email,
        password: password || undefined
      })
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.message || "Update failed");
      return;
    }

    // Update AuthContext user immediately
    const updatedUser = { ...user, name, email };
    localStorage.setItem("user", JSON.stringify(updatedUser));

    // If you expose setUser from AuthContext, call it:
    setUser(updatedUser);

    setSuccess("Profile updated successfully");
  } catch (err) {
    setError("Server error");
  }
};


  return (
    <Container className="mt-5">
      <Card className="mx-auto" style={{ maxWidth: "500px" }}>
        <Card.Body>
          <Card.Title className="mb-3">Update Profile</Card.Title>

          {success && <Alert variant="success">{success}</Alert>}
          {error && <Alert variant="danger">{error}</Alert>}

          <Form onSubmit={handleUpdate}>
            {/* Name */}
            <Form.Group className="mb-3">
              <Form.Label>Full Name</Form.Label>
              <Form.Control
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </Form.Group>

            {/* Email */}
            <Form.Group className="mb-3">
              <Form.Label>Email Address</Form.Label>
              <Form.Control
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Form.Group>

            {/* Optional Password */}
            <Form.Group className="mb-3">
              <Form.Label>New Password (optional)</Form.Label>
              <Form.Control
                type="password"
                placeholder="Enter new password if you want to change it"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Form.Group>

            <Button variant="primary" type="submit" className="w-100">
              Save Changes
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default UserDetailsPage;
