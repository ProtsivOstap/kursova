import React, { ReactNode } from 'react';
import Navbar from './Navbar';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div>
      <Navbar>{/* Pass children here */}</Navbar>
      <main>{children}</main>
    </div>
  );
};

export default Layout;
