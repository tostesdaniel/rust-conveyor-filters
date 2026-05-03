export default function UsersLayout({
  children,
}: LayoutProps<"/users/[username]">) {
  return <div className='container 2xl:max-w-[1280px]'>{children}</div>;
}
