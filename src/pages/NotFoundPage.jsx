import { Link } from 'react-router-dom';
import EmptyState from '../components/ui/EmptyState';
import Icon from '../components/ui/Icon';
import { useTitle } from '../hooks/useData';

/** 404 — unknown route. */
export default function NotFoundPage() {
  useTitle('Page not found');
  return (
    <div className="page">
      <EmptyState icon="alert" title="Page not found" message="The page you're looking for doesn't exist or was moved.">
        <Link to="/dashboard" className="btn btn-primary">
          <Icon name="dashboard" size={15} /> Go to dashboard
        </Link>
      </EmptyState>
    </div>
  );
}
