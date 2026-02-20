interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function PageContainer({ children, className = "" }: PageContainerProps) {
  return (
    <div className={`mx-auto w-full max-w-container px-6 py-12 ${className}`}>
      {children}
    </div>
  );
}
