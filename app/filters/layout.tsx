type MyFiltersLayoutProps = {
  children: React.ReactNode;
};

export default function MyFiltersLayout({ children }: MyFiltersLayoutProps) {
  return (
    <div className='container px-4 py-6 sm:px-6 lg:px-8 lg:py-8'>
      {children}
    </div>
  );
}
