type AuthLayoutProps = {
  children: React.ReactNode;
};

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className='grid w-full flex-1 items-center px-4 sm:justify-center'>
      {children}
    </div>
  );
}
