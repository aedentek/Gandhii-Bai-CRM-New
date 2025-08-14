import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SupplierManagement from './SupplierManagement';

// Mock the dependencies
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

jest.mock('@/services/databaseService', () => ({
  DatabaseService: {
    getAllMedicineSuppliers: jest.fn(() => Promise.resolve(
      // Generate 25 mock suppliers to test pagination
      Array.from({ length: 25 }, (_, i) => ({
        id: i + 1,
        name: `Supplier ${i + 1}`,
        contact_person: `Contact ${i + 1}`,
        email: `supplier${i + 1}@example.com`,
        phone: `123-456-78${i.toString().padStart(2, '0')}`,
        address: `Address ${i + 1}`,
        status: i % 2 === 0 ? 'active' : 'inactive',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }))
    )),
  },
}));

describe('SupplierManagement Component Pagination', () => {
  test('should stay on page 1 when clicking page 1 button', async () => {
    render(<SupplierManagement />);

    // Wait for suppliers to load
    await waitFor(() => {
      expect(screen.getByText('Supplier 1')).toBeInTheDocument();
    });

    // Check if pagination buttons are rendered and page 1 is active
    const page1Button = screen.getByRole('button', { name: '1' });
    expect(page1Button).toBeInTheDocument();
    
    // Verify we're on page 1 by checking supplier names
    expect(screen.getByText('Supplier 1')).toBeInTheDocument();
    expect(screen.getByText('Supplier 10')).toBeInTheDocument();
    expect(screen.queryByText('Supplier 11')).not.toBeInTheDocument();

    // Click on page 1 (should stay on page 1)
    fireEvent.click(page1Button);

    // Wait a bit and verify we're still on page 1
    await waitFor(() => {
      expect(screen.getByText('Supplier 1')).toBeInTheDocument();
      expect(screen.getByText('Supplier 10')).toBeInTheDocument();
      expect(screen.queryByText('Supplier 11')).not.toBeInTheDocument();
    });
  });

  test('should navigate to page 2 when clicking page 2 button', async () => {
    render(<SupplierManagement />);

    // Wait for suppliers to load
    await waitFor(() => {
      expect(screen.getByText('Supplier 1')).toBeInTheDocument();
    });

    // Click on page 2
    const page2Button = screen.getByRole('button', { name: '2' });
    fireEvent.click(page2Button);

    // Verify that page 2 content is displayed
    await waitFor(() => {
      expect(screen.getByText('Supplier 11')).toBeInTheDocument();
      expect(screen.getByText('Supplier 20')).toBeInTheDocument();
      expect(screen.queryByText('Supplier 1')).not.toBeInTheDocument();
      expect(screen.queryByText('Supplier 21')).not.toBeInTheDocument();
    });
  });

  test('should not automatically navigate away from the current page', async () => {
    render(<SupplierManagement />);

    // Wait for suppliers to load
    await waitFor(() => {
      expect(screen.getByText('Supplier 1')).toBeInTheDocument();
    });

    // Get the current page button (should be page 1)
    const page1Button = screen.getByRole('button', { name: '1' });
    
    // Verify page 1 is active/selected (has different styling)
    expect(page1Button).toHaveClass('bg-emerald-600');

    // Wait to ensure no automatic navigation occurs
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify we're still on page 1
    expect(screen.getByText('Supplier 1')).toBeInTheDocument();
    expect(screen.getByText('Supplier 10')).toBeInTheDocument();
    expect(screen.queryByText('Supplier 11')).not.toBeInTheDocument();
  });
});
