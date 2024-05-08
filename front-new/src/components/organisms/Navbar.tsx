import React from 'react';

interface NavbarProps {
  children?: React.ReactNode;
}

const Navbar: React.FC<NavbarProps> = ({ children }) => {
  return (
    <nav>
      {/* Render children if they exist */}
      {children && <div>{children}</div>}
    </nav>
  );
};

export default Navbar;
