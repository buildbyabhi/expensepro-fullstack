import { getCategoryMeta } from '../utils/categories';
import { useTransactions } from '../context/TransactionContext';

const CategoryBadge = ({ category, size = 'sm' }) => {
  const { globalCategories } = useTransactions();
  
  // Try dynamic global categories first, fallback to hardcoded, then generic
  const dynamicMatch = globalCategories?.find(c => c.name === category);
  const meta = dynamicMatch || getCategoryMeta(category);

  return (
    <span
      className={`category-badge category-badge--${size}`}
      style={{ backgroundColor: `${meta.color}22`, color: meta.color, borderColor: `${meta.color}44` }}
    >
      <span>{meta.icon}</span>
      <span>{category}</span>
    </span>
  );
};

export default CategoryBadge;
