/** 404 page. */
import { Link } from 'react-router-dom';
import { useTitle } from '../../hooks/useApi.js';
import { EmptyState } from '../../components/ui/Primitives.jsx';

export default function NotFoundPage() {
  useTitle('Page not found');
  return (
    <main>
      <div className="container section">
        <EmptyState icon="warning" title="404 — Page not found"
          text="The page you are looking for doesn't exist or has been moved.">
          <Link to="/" className="btn btn-primary">Back to Home</Link>
        </EmptyState>
      </div>
    </main>
  );
}
