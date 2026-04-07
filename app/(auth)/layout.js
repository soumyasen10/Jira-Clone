const AuthLayout = ({ children }) => {
  return (
    <div className="relative flex min-h-screen items-center justify-center pt-20">
      {/* Auth Background */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-white [background:radial-gradient(125%_125%_at_50%_10%,#fff_40%,#63e_100%)]"></div>
      <div>{children}</div>
    </div>
  );
};

export default AuthLayout;
