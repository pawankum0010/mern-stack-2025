import { Button, Container } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const UnauthorizedPage = () => {
  const navigate = useNavigate();

  return (
    <Container className="py-5 text-center">
      <h1 className="display-5 fw-bold text-danger">Access Denied</h1>
      <p className="lead">
        Your account doesn’t have permission to view this page. Please contact
        a superadmin if you believe this is a mistake.
      </p>
      <Button variant="primary" onClick={() => navigate('/', { replace: true })}>
        Go back to dashboard
      </Button>
    </Container>
  );
};

export default UnauthorizedPage;

