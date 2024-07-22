type MyFiltersLayoutProps = {
  children: React.ReactNode;
};

export default function MyFiltersLayout({ children }: MyFiltersLayoutProps) {
  return <div className='container'>{children}</div>;
}
