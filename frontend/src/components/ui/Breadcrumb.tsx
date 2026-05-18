interface BreadcrumbProps {
  items: { label: string; href?: string }[];
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  return (
    <nav className="text-sm text-gray-500 mb-4" aria-label="Breadcrumb">
      <ol className="list-reset flex">
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            {item.href ? (
              <a href={item.href} className="text-blue-600 hover:underline">
                {item.label}
              </a>
            ) : (
              <span>{item.label}</span>
            )}
            {index < items.length - 1 && <span className="mx-2">/</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumb;